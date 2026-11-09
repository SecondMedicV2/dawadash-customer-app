// The host provides a private Postgres transaction with db.query(sql, parameters).
export function createPostgresInventoryRepository(transaction) {
  return {
    readPollState(sourceId) {
      return transaction(async (db) => {
        const { rows: [state] } = await db.query(
          `select cursor, next_poll_at::text as "nextPollAt", generation::text
             from public.inventory_sync_state where source_id = $1`, [sourceId],
        );
        return state ?? { cursor: null, nextPollAt: '0', generation: '0' };
      });
    },

    apply(sourceId, { catalog, stock }, poll) {
      return transaction(async (db) => {
        if (poll) {
          const { rowCount } = await db.query(
            `insert into public.inventory_sync_state (source_id, cursor, next_poll_at, generation)
             select $1, $2, $3, $4::bigint + 1
             where $4::bigint = 0 or exists (
               select 1 from public.inventory_sync_state where source_id = $1
             )
             on conflict (source_id) do update
               set cursor = excluded.cursor, next_poll_at = excluded.next_poll_at,
                   generation = excluded.generation
             where inventory_sync_state.generation = $4::bigint`,
            [sourceId, poll.cursor, poll.nextPollAt, poll.generation],
          );
          if (!rowCount) return false;
        }
        if (catalog.length) await db.query(
          `insert into public.inventory_sku (source_id, sku_id, revision, details, composition_key)
           select $1, "skuId", revision, details, "compositionKey"
             from jsonb_to_recordset($2::jsonb)
               as x("skuId" text, revision numeric, details jsonb, "compositionKey" text)
             order by "skuId"
           on conflict (source_id, sku_id) do update
             set revision = excluded.revision, details = excluded.details,
                 composition_key = excluded.composition_key
           where inventory_sku.revision < excluded.revision`,
          [sourceId, JSON.stringify(catalog)],
        );
        if (stock.length) await db.query(
          `insert into public.inventory_stock (source_id, sku_id, revision, quantity, batches)
           select $1, "skuId", revision, quantity, batches
             from jsonb_to_recordset($2::jsonb)
               as x("skuId" text, revision numeric, quantity bigint, batches jsonb)
             order by "skuId"
           on conflict (source_id, sku_id) do update
             set revision = excluded.revision, quantity = excluded.quantity, batches = excluded.batches
           where inventory_stock.revision < excluded.revision`,
          [sourceId, JSON.stringify(stock)],
        );
        return true;
      });
    },

    readCatalog(sourceIds, { skuIds = null, composition = null, query = null, after = null, limit = null }) {
      return transaction(async (db) => {
        const { rows } = await db.query(
          `with visible as not materialized (
             select p.source_id, p.sku_id, coalesce(e.details, p.details) as details,
                    case when e.sku_id is null then p.composition_key else e.composition_key end as composition_key
               from public.inventory_sku p
               left join public.inventory_catalog_edit e using (sku_id)
               left join public.inventory_store_override o on o.store_id = p.source_id and o.sku_id = p.sku_id
              where p.source_id = any($1::text[]) and p.details is not null and o.hidden is not true
           ), matches as (
             select distinct sku_id from visible
              where ($2::text[] is null or sku_id = any($2::text[]))
                and ($3::text is null or composition_key = $3)
                and ($4::text is null or strpos(lower(concat_ws(' ', details->>'name',
                  details->>'brand', details->>'manufacturer', details->>'salt')), lower($4)) > 0)
                and ($5::text is null or sku_id > $5)
              order by sku_id limit $6
           )
           select m.sku_id as id,
             (select jsonb_agg(jsonb_build_object('sourceId', source_id, 'details', details))
                from visible where sku_id = m.sku_id) as catalog,
             coalesce((select jsonb_object_agg(s.source_id, s.quantity)
                from public.inventory_stock s
                left join public.inventory_store_override o on o.store_id = s.source_id and o.sku_id = s.sku_id
               where s.sku_id = m.sku_id and s.source_id = any($1::text[])
                 and o.hidden is not true and o.not_for_sale is not true and o.out_of_stock is not true
                 and not exists (select 1 from public.inventory_sku deleted
                   where deleted.source_id = s.source_id and deleted.sku_id = s.sku_id and deleted.details is null)
             ), '{}'::jsonb) as stock
           from matches m order by m.sku_id`,
          [sourceIds, skuIds, composition, query, after, limit],
        );
        return rows;
      });
    },
  };
}
