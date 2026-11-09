import assert from 'node:assert/strict';
import test from 'node:test';
import { createPaymentApi } from './paymentApi.mjs';
import { createMasterAccountGateway, DIGITAL_METHODS } from './paymentGateway.mjs';
import { createPaymentService } from './paymentService.mjs';

function fixture() {
  const journal = new Map();
  const ordersById = new Map();
  const checkoutRequests = [];
  const actor = { id: 'fixture-actor' };
  const gateway = createMasterAccountGateway({
    masterAccountId: 'master',
    provider: {
      async createMasterCheckout(input) { checkoutRequests.push(input); return { reference: input.orderId }; },
      async readReconciledMasterDeposit({ paymentReference }) {
        return { masterAccountId: 'master', orderId: paymentReference, paymentReference,
          grossPaise: '10000', depositedPaise: '9800', currency: 'INR', reconciled: true };
      },
    },
  });

  const ports = {
    gateway,
    orders: {
      readAuthorized: async (caller, id) => caller === actor ? ordersById.get(id) : null,
      selectRail: async (order, selection) => {
        if (order.rail) assert.equal(order.rail, selection.rail);
        Object.assign(order, selection);
      },
    },
    policy: {
      allowCod: async () => true,
      allowPathologyPayment: async () => false,
      resolveCommercialTerms: async () => ({ commissionPaise: '2000', retailMarginPaise: '1000', otherPartnerPayablePaise: '5000' }),
      verifyCodCollection: async (_actor, order, collectionReference) => ({
        orderId: order.id, collectionReference, accountableRetailerId: order.partnerId,
        amountPaise: order.grossPaise, fulfillment: order.fulfillment, collectorKind: order.collectorKind,
      }),
      verifyMasterPayout: async (payoutReference) => ({
        partnerId: 'retail', settlementId: 'batch-2', payoutReference, amountPaise: '2000',
      }),
    },
    canSettle: async (caller) => caller === actor,
    ledger: {
      withPartner: async (partnerId, run) => run({
        find: async (key) => journal.get(key),
        partnerBalances: async () => {
          let payable = 0n;
          let cash = 0n;
          for (const posting of journal.values()) {
            if (posting.partnerId !== partnerId) continue;
            for (const { debit, credit, amountPaise } of posting.transfers) {
              const amount = BigInt(amountPaise);
              if (credit === 'partner_payable') payable += amount;
              if (debit === 'partner_payable') payable -= amount;
              if (debit === 'retailer_cash_due') cash += amount;
              if (credit === 'retailer_cash_due') cash -= amount;
            }
          }
          return { payablePaise: payable.toString(), cashDuePaise: cash.toString() };
        },
        post: async (posting) => {
          assert(!journal.has(posting.key));
          journal.set(posting.key, posting);
          return posting;
        },
      }),
    },
  };
  const addOrder = (id, properties = {}) => ordersById.set(id, {
    id, kind: 'medicine', partnerId: 'retail', grossPaise: '10000', ...properties,
  });
  return { actor, addOrder, checkoutRequests, journal, ports, service: createPaymentService(ports) };
}

test('digital methods route to the configured master account and Model B is disabled', async () => {
  const { actor, addOrder, checkoutRequests, ports, service } = fixture();
  for (const method of DIGITAL_METHODS) {
    addOrder(method);
    await service.checkout(actor, { orderId: method, rail: 'digital', method });
  }
  assert.deepEqual(checkoutRequests.map((input) => input.method), DIGITAL_METHODS);
  assert(checkoutRequests.every((input) => input.masterAccountId === 'master' && input.currency === 'INR'));
  assert.throws(() => createPaymentService({ ...ports, config: { settlementMode: 'partner_direct', splitPayments: false } }), /disabled/);
  assert.throws(() => createPaymentService({ ...ports, config: { settlementMode: 'master', splitPayments: true } }), /disabled/);
  addOrder('pathology', { kind: 'pathology' });
  await assert.rejects(service.checkout(actor, { orderId: 'pathology', rail: 'digital', method: 'upi' }), /policy unavailable/);
});

test('COD offsets retailer payables, carries excess cash, and reserves and posts only the net payout', async () => {
  const { actor, addOrder, journal, service } = fixture();
  addOrder('cod', { fulfillment: 'counter_pickup', collectorKind: 'retail_chemist' });
  await service.checkout(actor, { orderId: 'cod', rail: 'cod' });
  const cod = { orderId: 'cod', collectionReference: 'counter-receipt' };
  const collected = await service.recordCod(actor, cod);
  assert.equal(await service.recordCod(actor, cod), collected);
  await assert.rejects(service.recordCod(actor, { ...cod, collectionReference: 'another-receipt' }), /already posted/);
  assert.deepEqual((await service.prepareSettlement(actor, { partnerId: 'retail', settlementId: 'batch-1' })).transfers,
    [{ debit: 'partner_payable', credit: 'retailer_cash_due', amountPaise: '6000' }]);

  addOrder('digital');
  await service.checkout(actor, { orderId: 'digital', rail: 'digital', method: 'qr' });
  await assert.rejects(service.recordDigital(actor, { orderId: 'digital', paymentReference: 'wrong' }), /not reconciled/);
  const digital = await service.recordDigital(actor, { orderId: 'digital', paymentReference: 'digital' });
  assert(digital.transfers.some((entry) => entry.credit === 'partner_payable' && entry.component === 'retail_margin'));
  assert(digital.transfers.some((entry) => entry.debit === 'master_deposit_difference_clearing' && entry.amountPaise === '200'));
  const settlement = { partnerId: 'retail', settlementId: 'batch-2' };
  const prepared = await service.prepareSettlement(actor, settlement);
  assert.deepEqual(prepared.transfers, [
    { debit: 'partner_payable', credit: 'retailer_cash_due', amountPaise: '4000' },
    { debit: 'partner_payable', credit: 'partner_payout_reserved', amountPaise: '2000' },
  ]);
  assert.equal(await service.prepareSettlement(actor, settlement), prepared);
  const paid = await service.recordPayout(actor, { ...settlement, payoutReference: 'bank-receipt' });
  assert.deepEqual(paid.transfers, [{ debit: 'partner_payout_reserved', credit: 'master_bank', amountPaise: '2000' }]);
  assert.equal(await service.recordPayout(actor, { ...settlement, payoutReference: 'bank-receipt' }), paid);
  assert.equal(journal.size, 5);
});

test('COD collector depends on fulfillment, and protected actions require authorization', async () => {
  const { actor, addOrder, service } = fixture();
  addOrder('home', { fulfillment: 'home_delivery', collectorKind: 'delivery_partner' });
  addOrder('counter', { fulfillment: 'counter_pickup', collectorKind: 'delivery_partner' });
  for (const orderId of ['home', 'counter']) await service.checkout(actor, { orderId, rail: 'cod' });
  await service.recordCod(actor, { orderId: 'home', collectionReference: 'home-receipt' });
  await assert.rejects(service.recordCod(actor, { orderId: 'counter', collectionReference: 'counter-receipt' }), /does not reconcile/);
  await assert.rejects(service.prepareSettlement({ id: 'other' }, { partnerId: 'retail', settlementId: 'batch' }), /access denied/);
  const api = createPaymentApi(service, async () => null);
  const response = await api(new Request('https://example.test/v1/internal/payments/cod', { method: 'POST' }));
  assert.equal(response.status, 401);
});
