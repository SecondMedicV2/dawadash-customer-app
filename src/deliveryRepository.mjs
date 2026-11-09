import { inventoryCompositionKey, normalizeSku } from './inventoryChanges.mjs';

const updateFields = 'status, rejected_item_ids as "rejectedItemIds"';
const overrideFields = `hidden, not_for_sale as "notForSale", out_of_stock as "outOfStock",
  proposed_rate_paise::text as "proposedRatePaise", suggested_sku_id as "suggestedSkuId"`;

export function createDeliveryRepository(transaction) {
  return {
    async readUpdates(orderIds) {
      if (!orderIds.length) return [];
      return transaction(async (db) => (await db.query(
        `select order_id as "orderId", store_id as "storeId", ${updateFields}
           from public.delivery_order_update where order_id = any($1::text[])`, [orderIds],
      )).rows);
    },

    async hasBlockedItems(db, storeId, skuIds) {
      const { rows } = await db.query(
        `select 1 from public.inventory_store_override
          where store_id = $1 and sku_id = any($2::text[]) and (hidden or not_for_sale or out_of_stock) limit 1`,
        [storeId, skuIds],
      );
      return rows.length > 0;
    },

    async saveUpdate(db, orderId, storeId, status, rejectedItemId) {
      const { rows: [updated] } = await db.query(
        `insert into public.delivery_order_update as d (order_id, store_id, status, rejected_item_ids)
         values ($1, $2, $3, case when $4::text is null then '{}'::text[] else array[$4] end)
         on conflict (order_id, store_id) do update set status = coalesce(excluded.status, d.status),
           rejected_item_ids = case when $4 is null or $4 = any(d.rejected_item_ids) then d.rejected_item_ids
             else array_append(d.rejected_item_ids, $4) end
         returning ${updateFields}`, [orderId, storeId, status, rejectedItemId],
      );
      return updated;
    },

    readOverride(storeId, skuId) {
      return transaction(async (db) => {
        const { rows: [row] } = await db.query(
          `select ${overrideFields} from public.inventory_store_override where store_id = $1 and sku_id = $2`,
          [storeId, skuId],
        );
        return row ?? { hidden: false, notForSale: false, outOfStock: false, proposedRatePaise: null, suggestedSkuId: null };
      });
    },

    saveOverride(storeId, skuId, { hidden, notForSale, outOfStock, proposedRatePaise, suggestedSkuId }) {
      return transaction(async (db) => {
        const { rows: [row] } = await db.query(
          `insert into public.inventory_store_override as o
             (store_id, sku_id, hidden, not_for_sale, out_of_stock, proposed_rate_paise, suggested_sku_id)
           select $1, $2, coalesce($3, false), coalesce($4, false), coalesce($5, false), $6::numeric, $7
           where (exists (select 1 from public.inventory_sku where sku_id = $2 and details is not null)
             or exists (select 1 from public.inventory_store_override where store_id = $1 and sku_id = $2))
             and ($7::text is null or exists (
               select 1 from public.inventory_sku where sku_id = $7 and details is not null
             ))
           on conflict (store_id, sku_id) do update
             set hidden = coalesce($3, o.hidden), not_for_sale = coalesce($4, o.not_for_sale),
                 out_of_stock = coalesce($5, o.out_of_stock), proposed_rate_paise = coalesce($6::numeric, o.proposed_rate_paise),
                 suggested_sku_id = coalesce($7, o.suggested_sku_id)
           returning ${overrideFields}`,
          [storeId, skuId, hidden ?? null, notForSale ?? null, outOfStock ?? null, proposedRatePaise ?? null, suggestedSkuId ?? null],
        );
        return row ?? null;
      });
    },

    readCatalogRecord(skuId) {
      return transaction(async (db) => {
        const { rows } = await db.query(
          `select p.source_id as "sourceId", p.details, e.details as edit from public.inventory_sku p
             left join public.inventory_catalog_edit e using (sku_id)
            where p.sku_id = $1 and p.details is not null order by p.source_id`, [skuId],
        );
        return rows.length ? { edit: rows[0].edit, observations: rows.map(({ sourceId, details }) => ({ sourceId, details })) } : null;
      });
    },

    saveCatalogEdit(skuId, input) {
      const details = normalizeSku(input);
      return transaction(async (db) => {
        const { rows: [row] } = await db.query(
          `insert into public.inventory_catalog_edit (sku_id, details, composition_key)
           select $1, $2::jsonb, $3 where exists (
             select 1 from public.inventory_sku where sku_id = $1 and details is not null
           ) on conflict (sku_id) do update set details = excluded.details, composition_key = excluded.composition_key
           returning details`, [skuId, JSON.stringify(details), inventoryCompositionKey(details)],
        );
        return row?.details ?? null;
      });
    },

    listTransactions(after, limit) {
      return transaction(async (db) => (await db.query(
        `select journal_key as id, kind, partner_id as "partnerId", order_id as "orderId", created_at as "createdAt"
           from public.payment_journal where ($1::text is null or journal_key > $1) order by journal_key limit $2`,
        [after, limit],
      )).rows);
    },
  };
}
