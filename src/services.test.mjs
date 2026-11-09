import assert from 'node:assert/strict';
import test from 'node:test';
import { createCustomerServices, customerServices, retailerAcquisition, retentionAnalytics } from './services.js';

test('medicine order request stays local and pending provider integration', async () => {
  const order = await customerServices.createOrder({ kind: 'medicine', items: [{ medicineId: 'm1', quantity: 1 }] });
  assert.match(order.id, /^order-/);
  assert.equal(order.status, 'pending_provider_confirmation');
});

test('refill order preserves its prescription reference', async () => {
  const input = { kind: 'refill', prescriptionId: 'rx-demo-1', items: [{ medicineId: 'm2', quantity: 1 }] };
  const order = await customerServices.createOrder(input);
  assert.equal(order.kind, 'refill');
  assert.equal(order.prescriptionId, 'rx-demo-1');
});

test('demo lab booking stays pending partner integration', async () => {
  const booking = await customerServices.createLabBooking({ testId: 'lab-cbc' });
  assert.match(booking.id, /^lab-/);
  assert.equal(booking.status, 'pending_lab_partner_confirmation');
});

test('prescription selection does not claim secure upload', async () => {
  const prescription = await customerServices.uploadPrescription({ name: 'rx.jpg', uri: 'local://rx.jpg' });
  assert.equal(prescription.status, 'pending_secure_upload_setup');
});

test('service adapter surfaces failures instead of returning success-shaped fallbacks', async () => {
  const services = createCustomerServices({
    async uploadPrescription() { throw new Error('upload unavailable'); },
    async createOrder() { throw new Error('orders unavailable'); },
    async createLabBooking() { throw new Error('labs unavailable'); },
  });
  await assert.rejects(services.createOrder({ kind: 'medicine', items: [] }), /orders unavailable/);
  await assert.rejects(services.createLabBooking({ testId: 'lab-cbc' }), /labs unavailable/);
});

test('retailer attribution and retention analytics remain explicit unconfigured stubs', async () => {
  await assert.rejects(retailerAcquisition.attributeInstall(), /not configured/);
  await assert.rejects(retailerAcquisition.recordWalkInInvite(), /not configured/);
  await assert.rejects(retentionAnalytics.track(), /not configured/);
});