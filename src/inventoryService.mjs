import { unconfiguredInventoryPolicies } from './inventoryAdapters.mjs';
import { inventoryCompositionKey, isInventoryId, isQuantity, normalizeInventoryChanges } from './inventoryChanges.mjs';

function orderItems(items) {
  if (!Array.isArray(items) || !items.length) throw new Error('Invalid inventory order items.');
  const quantities = new Map();
  for (const { medicineId, quantity } of items) {
    const total = (quantities.get(medicineId) ?? 0) + quantity;
    if (!isInventoryId(medicineId) || !isQuantity(quantity) || !quantity || !isQuantity(total)) {
      throw new Error('Invalid inventory order items.');
    }
    quantities.set(medicineId, total);
  }
  return [...quantities].map(([medicineId, quantity]) => ({ medicineId, quantity }));
}

export function createInventoryService({ sources, repository, policies = {}, now = Date.now }) {
  const { findNearestStore, resolveCatalogConflict } = { ...unconfiguredInventoryPolicies, ...policies };
  const byId = new Map(sources.map((source) => [source.id, source]));
  const masters = sources.filter(({ tier }) => tier === 'master');
  const retailIds = sources.filter(({ tier }) => tier === 'retail').map(({ id }) => id);
  if (masters.length !== 1 || byId.size !== sources.length || sources.some((source) =>
    !isInventoryId(source.id) || !['master', 'retail'].includes(source.tier) || !isQuantity(source.safetyBuffer)
    || !['poll', 'webhook'].includes(source.mode) || typeof source.adapter?.recordSale !== 'function'
    || (source.mode === 'poll' && (!isQuantity(source.intervalMs) || !source.intervalMs
      || typeof source.adapter.pullDelta !== 'function'))
    || (source.mode === 'webhook' && typeof source.adapter.readWebhook !== 'function')
  )) throw new Error('Invalid inventory source configuration.');

  async function nodes(context) {
    const nearest = retailIds.length ? await findNearestStore(context, [...retailIds]) : null;
    if (nearest !== null && !retailIds.includes(nearest)) throw new Error('Invalid nearest inventory node.');
    return nearest === null ? [masters[0].id] : [nearest, masters[0].id];
  }

  function hasStock(row, nodeId, requested = 1) {
    const quantity = row?.stock[nodeId] ?? 0;
    return quantity >= requested && quantity >= byId.get(nodeId).safetyBuffer;
  }

  async function skuDetails(row) {
    const first = JSON.stringify(row.catalog[0].details);
    if (row.catalog.every(({ details }) => JSON.stringify(details) === first)) return row.catalog[0].details;
    return resolveCatalogConflict(row.id, row.catalog);
  }

  async function alternatives(nodeIds, skuId) {
    const [requested] = await repository.readCatalog(nodeIds, { skuIds: [skuId] });
    if (!requested || nodeIds.some((nodeId) => hasStock(requested, nodeId))) return [];
    const details = await skuDetails(requested);
    const composition = details && inventoryCompositionKey(details);
    if (!composition) return [];
    const candidates = await repository.readCatalog(nodeIds, { composition });
    const matches = [];
    for (const row of candidates) {
      if (row.id === skuId || !nodeIds.some((nodeId) => hasStock(row, nodeId))) continue;
      const candidate = await skuDetails(row);
      if (candidate && inventoryCompositionKey(candidate) === composition) matches.push({ ...candidate, id: row.id });
    }
    return matches;
  }

  return {
    async poll(sourceId) {
      const source = byId.get(sourceId);
      if (source?.mode !== 'poll') return { applied: false, hasMore: false };
      const state = await repository.readPollState(sourceId);
      const startedAt = now();
      if (Number(state.nextPollAt) > startedAt) return { applied: false, hasMore: false };
      const { changes, nextCursor, hasMore } = await source.adapter.pullDelta(state.cursor);
      if ((nextCursor !== null && !isInventoryId(nextCursor)) || typeof hasMore !== 'boolean'
        || (hasMore && (nextCursor === null || nextCursor === state.cursor))
        || (state.cursor !== null && nextCursor === null)) throw new Error('Invalid inventory delta cursor.');
      const applied = await repository.apply(sourceId, normalizeInventoryChanges(changes), {
        cursor: nextCursor, generation: state.generation,
        nextPollAt: hasMore ? startedAt : now() + source.intervalMs,
      });
      return { applied, hasMore: applied && hasMore };
    },

    async ingestWebhook(sourceId, request) {
      const source = byId.get(sourceId);
      if (source?.mode !== 'webhook') return false;
      const changes = await source.adapter.readWebhook(request);
      await repository.apply(sourceId, normalizeInventoryChanges(changes));
      return true;
    },

    async search(context, query, after) {
      const nodeIds = await nodes(context);
      const pageSize = 50;
      const rows = await repository.readCatalog(nodeIds, { query, after, limit: pageSize + 1 });
      const page = rows.slice(0, pageSize);
      const items = [];
      for (const row of page) {
        const details = await skuDetails(row);
        if (details) items.push({ ...details, id: row.id, inStock: nodeIds.some((id) => hasStock(row, id)) });
      }
      return { items, nextAfter: rows.length > pageSize ? page.at(-1).id : null };
    },

    async compositionAlternatives(context, skuId) {
      return alternatives(await nodes(context), skuId);
    },

    async checkOrderAvailability(context, items) {
      const requested = orderItems(items);
      const nodeIds = await nodes(context);
      const rows = await repository.readCatalog(nodeIds, { skuIds: requested.map(({ medicineId }) => medicineId) });
      const catalog = new Map(rows.map((row) => [row.id, row]));
      const sourceId = nodeIds.find((id) => requested.every(({ medicineId, quantity }) =>
        hasStock(catalog.get(medicineId), id, quantity),
      ));
      return sourceId ? { sourceId, items: requested } : null;
    },

    // Only call from the host with the persisted, confirmed online sale and assigned node.
    async recordOnlineSale({ sourceId, orderId, items }) {
      const source = byId.get(sourceId);
      if (!source || !isInventoryId(orderId)) throw new Error('Invalid confirmed inventory sale.');
      const changes = await source.adapter.recordSale({ orderId, items: orderItems(items) });
      await repository.apply(sourceId, normalizeInventoryChanges(changes));
    },
  };
}
