import assert from 'node:assert/strict';
import test from 'node:test';
import { createInventoryApi } from './inventoryApi.mjs';
import { createPosInventoryAdapter, createRestInventoryAdapter } from './inventoryAdapters.mjs';
import { normalizeInventoryChanges } from './inventoryChanges.mjs';
import { createInventoryService } from './inventoryService.mjs';

const empty = { catalog: [], stock: [] };
const changes = (revision, quantity) => ({ catalog: [], stock: [{
  skuId: 'sku', revision, batches: [{ batch: 'B1', quantity, inboundQuantity: 10, expiryDate: '2020-01-01' }],
}] });
const master = {
  id: 'master', tier: 'master', mode: 'poll', intervalMs: 100, safetyBuffer: 2,
  adapter: { pullDelta: async () => ({ changes: empty, nextCursor: 'next', hasMore: false }), recordSale: async () => empty },
};
const retail = {
  id: 'retail', tier: 'retail', mode: 'webhook', safetyBuffer: 2,
  adapter: { readWebhook: (request) => request.json(), recordSale: async () => empty },
};

test('polls on schedule and submits cursor and validated changes together', async () => {
  let state = { nextPollAt: '110', generation: '3', cursor: 'old' };
  const pulls = [];
  const source = { ...master, adapter: { ...master.adapter, async pullDelta(cursor) {
    pulls.push(cursor);
    return { changes: { catalog: [], stock: [...changes('10', 2).stock, ...changes('9', 99).stock] }, nextCursor: 'new', hasMore: false };
  } } };
  const repository = {
    readPollState: async () => state,
    async apply(id, delta, poll) {
      assert.equal(id, 'master');
      assert.deepEqual(delta, normalizeInventoryChanges(changes('10', 2)));
      assert.deepEqual(poll, { cursor: 'new', generation: '3', nextPollAt: 200 });
      return true;
    },
  };
  const service = createInventoryService({ sources: [source, retail], repository, now: () => 100 });
  assert.deepEqual(await service.poll('master'), { applied: false, hasMore: false });
  assert.deepEqual(await service.poll('retail'), { applied: false, hasMore: false });
  state = { ...state, nextPollAt: '100' };
  assert.deepEqual(await service.poll('master'), { applied: true, hasMore: false });
  assert.deepEqual(pulls, ['old']);
});

test('checkout checks aggregated units at the nearest node before the master and suggests exact alternatives', async () => {
  const details = { form: 'tablet', composition: [{ salt: 'sample', strength: '5', unit: 'mg' }] };
  const row = (id, stock, sku = details) => ({ id, stock, catalog: [{ details: sku, sourceId: 'master' }] });
  const original = row('sku', { retail: 2, master: 4 });
  const candidates = [row('match', { retail: 2 }), row('low', { retail: 1 }), row('form', { master: 4 }, { ...details, form: 'syrup' })];
  const repository = { async readCatalog(nodes, { skuIds }) {
    assert.deepEqual(nodes, ['retail', 'master']);
    return skuIds ? [original] : candidates;
  } };
  const service = createInventoryService({ sources: [master, retail], repository, policies: { findNearestStore: () => 'retail' } });
  const item = { medicineId: 'sku', quantity: 2 };
  assert.equal((await service.checkOrderAvailability({}, [item])).sourceId, 'retail');
  assert.deepEqual(await service.checkOrderAvailability({}, [item, item]), {
    sourceId: 'master', items: [{ medicineId: 'sku', quantity: 4 }],
  });
  assert.deepEqual(await service.compositionAlternatives({}, 'sku'), []);
  original.stock = { retail: 1, master: 0 };
  assert.equal(await service.checkOrderAvailability({}, [item]), null);
  assert.deepEqual((await service.compositionAlternatives({}, 'sku')).map(({ id }) => id), ['match']);
  original.catalog.push({ details: { ...details, name: 'Conflicting' }, sourceId: 'retail' });
  assert.deepEqual(await service.compositionAlternatives({}, 'sku'), []);
});

test('webhooks require a verified role and source before ingesting offline changes', async () => {
  const applied = [];
  let actor;
  const service = createInventoryService({ sources: [master, retail], repository: { apply: (...args) => applied.push(args) } });
  const api = createInventoryApi(service, { getInventorySource: async () => actor, getCustomer: async () => actor, maxWebhookRequestBytes: 1024 });
  const webhook = () => new Request('http://localhost/v1/internal/inventory/retail/webhook', { method: 'POST', body: JSON.stringify(changes('2', 0)) });
  assert.equal((await api(webhook())).status, 401);
  actor = { id: 'source', role: 'inventory_source', sourceId: 'master' };
  assert.equal((await api(webhook())).status, 403);
  assert.equal((await api(new Request('http://localhost/v1/medicines'))).status, 403);
  actor.sourceId = 'retail';
  assert.equal((await api(webhook())).status, 204);
  assert.deepEqual(applied, [['retail', normalizeInventoryChanges(changes('2', 0))]]);
});

test('writes confirmed online sales to the assigned partner with a stable reference', async () => {
  const items = [{ medicineId: 'sku', quantity: 2 }];
  const order = { orderId: 'order-1', items };
  const rest = createRestInventoryAdapter({
    saleUrl: 'https://partner.invalid/sale', getHeaders: async () => ({}),
    fetcher: async (url, { headers, body, method }) => {
      assert.equal(url.pathname, '/sale');
      assert.equal(method, 'POST');
      assert.equal(headers.get('idempotency-key'), order.orderId);
      assert.deepEqual(JSON.parse(body), { items });
      return Response.json(changes('3', 0));
    },
  });
  const pos = createPosInventoryAdapter({
    pos: { submitSale: async (reference) => { assert.equal(reference, order.orderId); return changes('4', 0); } },
    encodeSale: ({ orderId }) => orderId, decodeSale: (result) => result,
  });
  const applied = [];
  const service = createInventoryService({
    sources: [{ ...master, adapter: { ...master.adapter, recordSale: rest.recordSale } },
      { ...retail, adapter: { ...retail.adapter, recordSale: pos.recordSale } }],
    repository: { apply: (...args) => applied.push(args) },
  });
  await service.recordOnlineSale({ ...order, sourceId: 'master' });
  await service.recordOnlineSale({ ...order, sourceId: 'retail' });
  assert.deepEqual(applied, [['master', normalizeInventoryChanges(changes('3', 0))],
    ['retail', normalizeInventoryChanges(changes('4', 0))]]);
});
