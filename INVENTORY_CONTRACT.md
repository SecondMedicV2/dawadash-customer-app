# Inventory and catalog sync

The central API reads the synchronized catalog and stock from Postgres. The source registry has one master distributor and the configured retail nodes. Register each source with an opaque `id`, a `tier` (`master` or `retail`), an adapter, a `mode` (`poll` or `webhook`), and a `safetyBuffer` in sellable units. Polling sources also require `intervalMs`. Supply source labels from brand configuration where displayed. The service has no default interval or buffer.

| Table | Data |
| --- | --- |
| `inventory_sku` | Partner observations keyed by source and canonical SKU ID. Stores name, brand, manufacturer, packaging, MRP, discounted rate, dosage form, and salt, strength, and unit for each ingredient. A null observation is a delisting tombstone. |
| `inventory_stock` | One snapshot per source and SKU with on-hand quantity and per-batch quantities, inbound quantities, and expiry dates. Zero quantity represents depletion. An empty batch array clears that node's stock for the SKU. |
| `inventory_sync_state` | Opaque delta cursor, next poll time in epoch milliseconds, and poll generation per source. |

The migration enables RLS and denies direct public, anonymous, and authenticated access. Bind `createPostgresInventoryRepository(transaction)` to a private server-side Postgres transaction provider. It must return `rows` and `rowCount` from `query(sql, params)` and roll back the transaction on error. Catalog and stock are written in bulk. Cursor advancement and the page commit together. Source revisions prevent older events from restoring depleted or delisted inventory. No source can overwrite another source's records.

## Partner adapters

- `pullDelta(cursor)` returns `{ changes, nextCursor, hasMore }`. A null initial cursor requests the initial catalog and stock feed. A page with `hasMore` must return a different, non-null cursor.
- `readWebhook(request)` decodes a verified partner event into `changes`. A webhook-only source must deliver its initial catalog and stock as well as incremental events.
- `recordSale({ orderId, items })` posts a confirmed online sale to the assigned node. The adapter maps SKU IDs to partner IDs and uses `orderId` as the stable idempotency reference. It returns authoritative `changes`. If the partner publishes counts asynchronously, the sale response may carry empty arrays and the source must publish the new counts through its configured sync mode.

Each `changes` payload contains `catalog: [{ skuId, revision, details }]` and `stock: [{ skuId, revision, batches }]`. Either array can be empty. The adapter supplies the same canonical `skuId` across sources. A `revision` is an unsigned integer string that increases per source, SKU, and stream. A repeated revision must represent the same state, including across sale responses and inbound feeds. Each stock observation contains the complete current batch snapshot for that SKU and source. Map relative movements to authoritative quantities at the adapter boundary.

Catalog `details` contain `name`, `brand`, `manufacturer`, `packaging`, `mrpPaise`, `discountedRatePaise`, `form`, and `composition: [{ salt, strength, unit }]`. Money is an unsigned integer string in paise and strength is a decimal string. Use an empty composition and null form where no matching data is available. Each batch has `batch`, `quantity`, `inboundQuantity`, and `expiryDate` (ISO date or null). Quantities are nonnegative safe integers in sellable units. Catalog delisting suppresses stock from that source even if an older stock row remains. A stock-only retail feed can refer to a SKU described by the master catalog.

`createRestInventoryAdapter` is the sample master adapter. It calls a configured delta URL with the cursor query parameter and posts `{ items }` to a configured sale URL with the order ID in `Idempotency-Key`. Inject credential headers and partner response decoders. `createPosInventoryAdapter` binds a POS/ERP client with `readChanges` and `submitSale` to the same contract through mapping callbacks. These examples describe the adapter boundary and sample transport, without selecting any vendor protocol.

## Host wiring

1. The scheduler calls `service.poll(sourceId)` for each polling source. Have one scheduler owner per source to avoid duplicate upstream fetches. The generation check rejects a competing commit. When `hasMore` is true, schedule the next page immediately. Each call pulls at most one page and respects the persisted due time. Failures surface to the caller.
2. Mount `createInventoryApi` on `GET /v1/medicines?q=…&after=…`, `GET /v1/medicines/:skuId/alternatives`, and `POST /v1/internal/inventory/:sourceId/webhook`. Bind verified customer and partner identities with server-side roles `customer` and `inventory_source`. The webhook identity must be scoped to the route source. Supply `maxWebhookRequestBytes` to enable webhook ingestion. The authenticator verifies the original signed bytes and the host also enforces ingress limits. The search response is `{ items, nextAfter }`.
3. In the authorized server order-create flow, pass trusted customer context and `{ medicineId, quantity }` lines to `service.checkOrderAvailability`. It aggregates repeated lines, checks whether the nearest node can fill the whole order, then checks the master. Use the returned assignment or report unavailable if it returns null. The check uses the latest committed partner observations. When the sale is confirmed, call `service.recordOnlineSale` with its persisted ID, items, and assigned source. Counter sales come back through the source's poll or webhook feed. Only inventory identifiers and quantities travel on the inventory integration.

On-hand stock must meet both the node's safety buffer and the requested quantity. Inbound stock stays separate. For an unavailable SKU, the alternatives query returns in-stock SKUs with exactly the same normalized ingredients, strengths, units, and dosage form at the nearest node or master. It never replaces a line on the order. Conflicting SKU details remain unpublished while the conflict policy is unconfigured. Stock quantities at separate nodes are expected to differ and are used independently.

## Open Questions

- What endpoints, formats, and authentication does Agarwal Store expose? Does it support webhooks? Bind the actual integration through the partner adapter and webhook authenticator.
- How will the 3,000+ retail nodes connect? The POS/ERP transport is injectable. The policy for nodes without a system remains open under the automated-sync requirement.
- What are the final sync modes, polling intervals, and safety buffers? Set them per source in the registry.
- Which SKU details win when Tier 1 and Tier 2 disagree? Implement `resolveCatalogConflict`.
- How is nearest defined by distance, ETA, capacity, or another measure? Implement `findNearestStore`.
- Should orders reserve or lock stock? Define `reserveStock` before enabling it.
- What retry, backoff, and stale-data behavior applies during a partner outage? Define `retryPartnerRequest` and `readStaleDataStatus`.
- Should expiry restrict sellable stock? Define `filterExpiredBatches`.
- Is the master distributor the same party as the stakeholder Agarwal Ji? Identity is open under `resolveDistributorIdentity`.
- Does the SKU master carry Schedule H/H1 flags for the prescription workflow? Define `readPrescriptionClassification`.
- Do pathology tests have inventory or use booking slots? Define `readPathologyInventory`.
- Who owns catalog corrections when source data is wrong or incomplete? Define `correctCatalog`.
