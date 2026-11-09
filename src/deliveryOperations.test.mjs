import assert from 'node:assert/strict';
import test from 'node:test';
import { createCustomerPrescriptionApi } from './customerPrescriptionApi.mjs';
import { createDeliveryApi } from './deliveryApi.mjs';
import { createDeliveryOperations } from './deliveryOperations.mjs';
import { createPrescriptionHttpAdapter } from './prescriptionHttpAdapter.js';
import { createCustomerServices } from './services.js';

const order = {
  id: 'order-1', kind: 'medicine', customerId: 'customer-1', storeId: 'store-1',
  fulfillmentMode: 'counter_pickup', packed: true, items: [{ id: 'line-1', medicineId: 'sku-1' }],
};
const store = { id: 'operator-1', role: 'retail_store', storeId: 'store-1' };
const origin = 'http://localhost';

function fixture({ authorizeRelease = () => true, failSignal = false } = {}) {
  let committed;
  let blocked = false;
  const signals = [];
  const orders = {
    async withOrder(id, run) {
      const db = { draft: committed };
      const result = await run(id === order.id ? order : null, db);
      committed = db.draft;
      return result;
    },
    listForOperations: () => [order, { ...order, id: 'order-2', storeId: 'store-2' }],
    listWithPrescriptionActions: (id) => id === order.customerId ? [order] : [],
  };
  const repository = {
    hasBlockedItems: () => blocked,
    saveUpdate(db, orderId, storeId, status, rejectedItemId) {
      const rejectedItemIds = [...new Set([...(db.draft?.rejectedItemIds ?? []), ...(rejectedItemId ? [rejectedItemId] : [])])];
      const update = { status: status ?? db.draft?.status ?? null, rejectedItemIds };
      db.draft = { orderId, storeId, ...update };
      return update;
    },
    readUpdates: () => committed ? [committed] : [],
    saveOverride: (storeId, skuId, patch) => ({ storeId, skuId, ...patch }),
  };
  const statusTransport = { publish(customerId, signal) {
    assert.ok(committed);
    signals.push({ customerId, ...signal });
    if (failSignal) throw new Error('transport unavailable');
  } };
  const service = createDeliveryOperations({ orders, repository, statusTransport, authorizeRelease });
  return { orders, service, signals, setBlocked: () => { blocked = true; } };
}

test('store actions are tenant-scoped and customer reads are owner-scoped', async () => {
  const { orders, service, signals } = fixture();
  let actor = { ...store, storeId: 'store-2' };
  const api = createDeliveryApi(service, async () => actor);
  const post = (path, body, source = origin) => api(new Request(origin + '/v1/operations/' + path, {
    method: 'POST', headers: { Origin: source, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }));
  assert.equal((await post('orders/order-1/approve', {})).status, 404);
  assert.equal((await post('orders/order-1/approve', {}, 'https://different.invalid')).status, 403);
  assert.equal((await post('catalog/sku-1', {})).status, 403);
  assert.equal((await post('overrides/sku-1', { storeId: 'store-1', hidden: true })).status, 409);
  assert.equal((await (await post('overrides/sku-1', { hidden: true })).json()).storeId, 'store-2');
  const list = await api(new Request(origin + '/v1/operations/orders'));
  assert.deepEqual((await list.json()).items.map(({ id }) => id), ['order-2']);
  actor = store;
  assert.equal((await (await post('orders/order-1/dispatch', {})).json()).status, 'ready_for_pickup');
  assert.deepEqual(signals, [{ customerId: 'customer-1', orderId: 'order-1' }]);
  let customerId = 'customer-2';
  const customerApi = createCustomerPrescriptionApi(null, { getCustomer: async () => ({ id: customerId, role: 'customer' }) }, orders, service);
  const customerOrders = () => customerApi(new Request(origin + '/v1/orders'));
  assert.deepEqual(await (await customerOrders()).json(), []);
  customerId = 'customer-1';
  assert.equal((await (await customerOrders()).json())[0].deliveryStatus, 'ready_for_pickup');
  assert.equal((await service.attachDeliveryUpdates([{ ...order, storeId: 'store-2' }]))[0].deliveryStatus, null);
});

test('release is gated and a rejected line records no partial fulfillment', async () => {
  const unverified = fixture({ authorizeRelease: () => false });
  await assert.rejects(unverified.service.updateOrder(store, order.id, 'dispatch', {}), /release is unavailable/);
  const { service, setBlocked, signals } = fixture({ failSignal: true });
  assert.deepEqual(await service.updateOrder(store, order.id, 'reject-item', { itemId: 'line-1' }), {
    status: null, rejectedItemIds: ['line-1'], liveUpdateSent: false,
  });
  await assert.rejects(service.updateOrder(store, order.id, 'dispatch', {}), /rejected item/);
  assert.equal((await service.attachDeliveryUpdates([order]))[0].deliveryStatus, null);
  setBlocked();
  await assert.rejects(service.updateOrder(store, order.id, 'approve', {}), /blocked store item/);
  assert.equal(signals.length, 1);
});

test('customer adapter forwards the status subscription and demo mode stays local', async () => {
  let listening;
  let refreshes = 0;
  const adapter = createPrescriptionHttpAdapter(origin, async () => 'synthetic-token', {
    subscribe({ accessToken, onChange }) {
      assert.equal(accessToken, 'synthetic-token');
      listening = onChange;
      return () => { listening = undefined; };
    },
  });
  const disconnect = await createCustomerServices(adapter).subscribeOrderStatus(() => { refreshes++; });
  listening();
  disconnect();
  assert.equal(refreshes, 1);
  assert.equal(listening, undefined);
  assert.equal(await createCustomerServices({}).subscribeOrderStatus(() => {}), undefined);
});
