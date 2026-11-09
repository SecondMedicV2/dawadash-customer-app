import assert from 'node:assert/strict';
import test from 'node:test';
import { createCustomerPrescriptionApi } from './customerPrescriptionApi.mjs';
import { createInventoryApi } from './inventoryApi.mjs';
import { createPaymentApi } from './paymentApi.mjs';
import { createRestInventoryAdapter } from './inventoryAdapters.mjs';
import { createPrescriptionHttpAdapter } from './prescriptionHttpAdapter.js';

const customer = { id: 'dummy-customer', role: 'customer' };

test('control endpoints reject invalid and oversized JSON before calling a service', async () => {
  const api = createPaymentApi({ checkout() { assert.fail('unexpected checkout'); } }, async () => customer);
  const post = (body, type = 'application/json') => new Request('https://api.example/v1/payments/checkout', {
    method: 'POST', body, headers: { 'Content-Type': type },
  });
  assert.equal((await api(post('[]'))).status, 400);
  assert.equal((await api(post('{}', 'text/plain'))).status, 415);
  const oversized = post(JSON.stringify({ note: 'x'.repeat(64 * 1024) }));
  assert.equal(oversized.headers.has('Content-Length'), false);
  assert.equal((await api(oversized)).status, 413);
});

test('prescription endpoints require customer role and an explicit multipart cap', async () => {
  let actor = { ...customer, role: 'retail_store' };
  const auth = { getCustomer: async () => actor };
  const workflow = { upload() { assert.fail('unexpected prescription upload'); } };
  const api = createCustomerPrescriptionApi(workflow, auth, {}, null, { maxUploadRequestBytes: 64 });
  const post = () => {
    const data = new FormData();
    data.append('source', 'pdf');
    data.append('file', new Blob(['%PDF-1.7'], { type: 'application/pdf' }), 'fixture.pdf');
    return new Request('https://api.example/v1/prescriptions', { method: 'POST', body: data });
  };
  assert.equal((await api(post())).status, 403);
  actor = customer;
  assert.equal((await api(post())).status, 413);
  assert.equal((await createCustomerPrescriptionApi(workflow, auth, {})(post())).status, 503);
});

test('webhook verification and ingestion see the same bounded bytes', async () => {
  const original = '{ "stock": [] }\n';
  const api = createInventoryApi({
    async ingestWebhook(sourceId, request) {
      assert.equal(sourceId, 'dummy-source');
      assert.equal(await request.text(), original);
      return true;
    },
  }, {
    maxWebhookRequestBytes: 64,
    getCustomer: async () => null,
    async getInventorySource(request) {
      assert.equal(await request.text(), original);
      return { id: 'dummy-partner', role: 'inventory_source', sourceId: 'dummy-source' };
    },
  });
  const post = (body) => new Request('https://api.example/v1/internal/inventory/dummy-source/webhook', { method: 'POST', body });
  assert.equal((await api(post(original))).status, 204);
  assert.equal((await api(post('x'.repeat(65)))).status, 413);
});

test('remote service URLs require HTTPS and partner fetch refuses redirects', async () => {
  assert.throws(() => createPrescriptionHttpAdapter('http://api.example', () => null), /secure service URL/);
  assert.throws(() => createPrescriptionHttpAdapter('https://user@api.example', () => null), /secure service URL/);
  const config = { getHeaders() { assert.fail('unexpected credential lookup'); } };
  await assert.rejects(createRestInventoryAdapter({ ...config, deltaUrl: 'http://partner.example/delta' }).pullDelta(null), /secure service URL/);
  const adapter = createRestInventoryAdapter({
    deltaUrl: 'https://partner.example/delta',
    getHeaders: () => ({}),
    fetcher: async (_, { redirect }) => {
      assert.equal(redirect, 'manual');
      return Response.redirect('https://other.example/delta');
    },
  });
  await assert.rejects(adapter.pullDelta(null), /inventory request failed/);
});
