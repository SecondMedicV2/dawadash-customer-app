import assert from 'node:assert/strict';
import test from 'node:test';
import { prescriptionIssueStart, requiresScheduledPrescription } from './prescriptionPolicy.mjs';
import { createPrescriptionWorkflow } from './prescriptionWorkflow.mjs';
import { createStaffPrescriptionApi } from './staffPrescriptionApi.mjs';

// Header fixtures exercise the format gate without storing any prescription content.
const jpegBytes = (size) => new Blob([new Uint8Array([0xff, 0xd8, 0xff]), new Uint8Array(size - 3)], { type: 'image/jpeg' });
const pdfBytes = (size) => new Blob(['%PDF-', new Uint8Array(size - 5)], { type: 'application/pdf' });

test('authoritative schedules require review, and unclassified items or tests fail closed', () => {
  for (const prescriptionSchedule of ['H', 'H1', 'X']) {
    assert.equal(requiresScheduledPrescription({ items: [{ prescriptionSchedule }] }), true);
  }
  assert.equal(requiresScheduledPrescription({ items: [{ prescriptionSchedule: 'unrestricted' }] }), false);
  assert.equal(requiresScheduledPrescription({ items: [{}] }), undefined);
  assert.equal(requiresScheduledPrescription({ items: [{ prescriptionSchedule: 'H1' }, {}] }), undefined);
  assert.equal(requiresScheduledPrescription({ kind: 'diagnostic', referralRequired: false }), false);
  assert.equal(requiresScheduledPrescription({ kind: 'diagnostic' }), undefined);
});

test('re-upload is owner-scoped and the replacement needs fresh review before dispatch', async () => {
  const calls = [];
  const order = { customerId: 'customer', prescriptionId: 'rx', items: [{ prescriptionSchedule: 'H1' }] };
  let prescription = { id: 'rx', status: 'pending_review' };
  const validFrom = prescriptionIssueStart('2026-11-01');
  assert.equal(validFrom, '2026-10-31T18:30:00.000Z');
  assert.equal(prescriptionIssueStart('2026-02-30'), null);
  let clock = Date.parse(validFrom);
  const workflow = createPrescriptionWorkflow({
    withOrder: (_, run) => run(order),
    requiresPrescription: requiresScheduledPrescription,
    findOwnedPrescription: async (customer, id) => customer === order.customerId && id === prescription.id ? prescription : null,
    canReview: async ({ id }) => id === 'reviewer',
    recordPendingReview: async (decision) => {
      assert.equal(prescription.status, 'pending_review');
      prescription = { ...prescription, ...decision };
    },
    replaceForReview: async ({ previousId }) => {
      assert.equal(previousId, 'rx');
      prescription = { id: 'replacement', status: 'pending_review' };
      order.prescriptionId = prescription.id;
      return prescription;
    },
    reserveDispense: async () => { calls.push('reserve'); },
    compile: async () => { calls.push('compile'); return 'compiled'; },
    findAssignedDestination: async () => ({ kind: 'retail_partner', id: 'partner' }),
    dispatch: async (handoff) => { calls.push(handoff); },
  }, () => clock);

  await assert.rejects(workflow.handoff('order'), /verified prescription/);
  await assert.rejects(workflow.review({ id: 'customer' }, 'rx', { decision: 'verify' }), /access denied/);
  await workflow.review({ id: 'reviewer' }, 'rx', { decision: 'request_reupload' });
  assert.deepEqual(await workflow.verification('customer', 'rx'), { verified: false, action: 'reupload_required' });
  const replacement = { source: 'pdf', file: pdfBytes(10) };
  await assert.rejects(workflow.replace('other', 'order', replacement), /unavailable/);
  await workflow.replace('customer', 'order', replacement);
  await assert.rejects(workflow.handoff('order'), /verified prescription/);
  assert.deepEqual(calls, []);
  await workflow.review({ id: 'reviewer' }, 'replacement', { decision: 'verify', issuedOn: '2026-11-01' });
  order.items.push({});
  await assert.rejects(workflow.handoff('order'), /policy unavailable/);
  assert.deepEqual(calls, []);
  order.items.pop();
  await workflow.handoff('order');
  assert.deepEqual(calls, ['compile', 'reserve', {
    compiled: 'compiled',
    destination: { kind: 'retail_partner', id: 'partner' },
    idempotencyKey: 'order',
  }]);
  clock += 7 * 24 * 60 * 60 * 1000;
  assert.deepEqual(await workflow.verification('customer', 'replacement'), { verified: false, action: 'expired' });
  await assert.rejects(workflow.handoff('order'), /verified prescription/);
});

test('the server rejects oversized camera files before storage and leaves PDFs outside the photo cap', async () => {
  const workflow = createPrescriptionWorkflow({ storeForReview: async () => ({ id: 'rx' }) });
  await assert.rejects(workflow.upload('customer', { source: 'camera', file: jpegBytes(500_001) }), /500 KB/);
  assert.equal((await workflow.upload('customer', { source: 'camera', file: jpegBytes(500_000) })).id, 'rx');
  assert.equal((await workflow.upload('customer', { source: 'pdf', file: pdfBytes(500_001) })).id, 'rx');
  await assert.rejects(workflow.upload('customer', {
    source: 'pdf', file: new Blob(['not a PDF'], { type: 'application/pdf' }),
  }), /PDF is required/);
});

test('storage receives only the bounded JPEG produced by the compressor', async () => {
  const original = jpegBytes(900_000);
  const jpeg = jpegBytes(499_999);
  const workflow = createPrescriptionWorkflow({
    compressCameraPhoto: async (file, limit) => {
      assert.equal(file, original);
      assert.equal(limit, 500_000);
      return jpeg;
    },
    storeForReview: async ({ file }) => {
      assert.equal(file, jpeg);
      return { id: 'rx' };
    },
  });
  await workflow.upload('customer', { source: 'camera', file: original });
});

test('staff API denies anonymous access and cross-origin writes', async () => {
  const handler = createStaffPrescriptionApi({}, { getStaff: async () => null }, {});
  assert.equal((await handler(new Request('https://staff.example/v1/staff/work'))).status, 401);
  assert.equal((await handler(new Request('https://staff.example/v1/staff/session', { method: 'POST', headers: { Origin: 'https://other.example' } }))).status, 403);
});
