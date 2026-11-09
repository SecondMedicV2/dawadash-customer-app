import { assertMasterSettlement, DIGITAL_METHODS, PAYMENT_CONFIG } from './paymentGateway.mjs';

const payable = 'partner_payable';
const cashDue = 'retailer_cash_due';
const payoutReserved = 'partner_payout_reserved';

function paise(value) {
  if (typeof value !== 'string' || !/^(0|[1-9]\d*)$/.test(value)) throw new Error('Expected whole paise.');
  return BigInt(value);
}

function reference(value) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('A reference is required.');
  return value;
}

function transfer(debit, credit, amount) {
  return { debit, credit, amountPaise: amount.toString() };
}

export function createPaymentService({ gateway, orders, ledger, policy, canSettle, config = PAYMENT_CONFIG }) {
  assertMasterSettlement(config);

  async function paymentOrder(actor, orderId, action) {
    if (!actor?.id) throw new Error('Authentication required.');
    const order = await orders.readAuthorized(actor, reference(orderId), action);
    if (order?.id !== orderId || !['medicine', 'pathology'].includes(order.kind)) {
      throw new Error('Order unavailable.');
    }
    if (paise(order.grossPaise) <= 0n) throw new Error('Positive order total required.');
    return order;
  }

  async function recordCollection(order, rail, externalReference, deposit) {
    const partnerId = reference(order.partnerId);
    const key = 'collection:' + order.id;
    return ledger.withPartner(partnerId, async (tx) => {
      const existing = await tx.find(key);
      if (existing) {
        if (existing.referenceScope === rail && existing.externalReference === externalReference &&
            existing.partnerId === partnerId) return existing;
        throw new Error('Order collection already posted.');
      }
      const gross = paise(order.grossPaise);
      const terms = await policy.resolveCommercialTerms(order);
      const commission = paise(terms.commissionPaise);
      const margin = paise(terms.retailMarginPaise);
      const otherPayable = paise(terms.otherPartnerPayablePaise);
      const clearing = gross - commission - margin - otherPayable;
      if (clearing < 0n) throw new Error('Allocations exceed the order total.');
      const source = rail === 'cod' ? cashDue : 'master_collections_clearing';
      const entries = [
        transfer(source, 'platform_commission', commission),
        { ...transfer(source, payable, margin), component: 'retail_margin' },
        transfer(source, payable, otherPayable),
        transfer(source, 'order_proceeds_clearing', clearing),
      ];
      if (deposit) {
        const received = paise(deposit.depositedPaise);
        if (!received || received > gross) throw new Error('Invalid reconciled deposit amount.');
        entries.push(
          transfer('master_bank', source, received),
          transfer('master_deposit_difference_clearing', source, gross - received),
        );
      }
      return tx.post({
        key, kind: 'collection', partnerId, orderId: order.id, referenceScope: rail, externalReference,
        transfers: entries.filter((entry) => entry.amountPaise !== '0'),
      });
    });
  }

  async function authorizeSettlement(actor, partnerId) {
    reference(partnerId);
    if (!actor?.id || !await canSettle(actor, partnerId)) throw new Error('Settlement access denied.');
  }

  return {
    async checkout(actor, { orderId, rail, method }) {
      const order = await paymentOrder(actor, orderId, 'checkout');
      if (rail !== 'cod' && (rail !== 'digital' || !DIGITAL_METHODS.includes(method))) {
        throw new Error('Unsupported payment option.');
      }
      if (order.kind === 'pathology' && await policy.allowPathologyPayment(order, { rail, method }) !== true) {
        throw new Error('Pathology payment policy unavailable.');
      }
      if (rail === 'cod') {
        if (!['home_delivery', 'counter_pickup'].includes(order.fulfillment)) throw new Error('COD fulfillment unavailable.');
        if (await policy.allowCod(order) !== true) throw new Error('COD unavailable.');
        await orders.selectRail(order, { rail });
        return { rail, fulfillment: order.fulfillment };
      }
      await orders.selectRail(order, { rail, method });
      return { rail, checkout: await gateway.createCheckout({ orderId, amountPaise: order.grossPaise, method }) };
    },

    async recordDigital(actor, { orderId, paymentReference }) {
      const order = await paymentOrder(actor, orderId, 'record_digital');
      if (order.rail !== 'digital') throw new Error('Order did not select digital payment.');
      reference(paymentReference);
      const deposit = await gateway.verifyDeposit({ orderId, amountPaise: order.grossPaise, paymentReference });
      return recordCollection(order, 'digital', paymentReference, deposit);
    },

    async recordCod(actor, { orderId, collectionReference }) {
      const order = await paymentOrder(actor, orderId, 'record_cod');
      if (order.rail !== 'cod' || !['home_delivery', 'counter_pickup'].includes(order.fulfillment)) {
        throw new Error('Order did not select COD.');
      }
      reference(collectionReference);
      const collection = await policy.verifyCodCollection(actor, order, collectionReference);
      const eligibleCollector = collection?.collectorKind === 'retail_chemist' ||
        (order.fulfillment === 'home_delivery' && collection?.collectorKind === 'delivery_partner');
      if (collection?.orderId !== order.id || collection.collectionReference !== collectionReference ||
          collection.accountableRetailerId !== order.partnerId || collection.amountPaise !== order.grossPaise ||
          collection.fulfillment !== order.fulfillment || !eligibleCollector) {
        throw new Error('COD collection does not reconcile to this retailer and order.');
      }
      return recordCollection(order, 'cod', collectionReference);
    },

    async prepareSettlement(actor, { partnerId, settlementId }) {
      await authorizeSettlement(actor, partnerId);
      const key = 'settlement:' + reference(settlementId);
      return ledger.withPartner(partnerId, async (tx) => {
        const existing = await tx.find(key);
        if (existing) {
          if (existing.partnerId !== partnerId) throw new Error('Settlement reference unavailable.');
          return existing;
        }
        const balances = await tx.partnerBalances();
        const receivable = paise(balances.cashDuePaise);
        const amount = paise(balances.payablePaise);
        const offset = amount < receivable ? amount : receivable;
        const reserve = amount - offset;
        const entries = [];
        if (offset) entries.push(transfer(payable, cashDue, offset));
        if (reserve) entries.push(transfer(payable, payoutReserved, reserve));
        if (!entries.length) return null;
        return tx.post({ key, kind: 'settlement', partnerId, transfers: entries });
      });
    },

    async recordPayout(actor, { partnerId, settlementId, payoutReference }) {
      await authorizeSettlement(actor, partnerId);
      reference(payoutReference);
      reference(settlementId);
      const receipt = await policy.verifyMasterPayout(payoutReference);
      return ledger.withPartner(partnerId, async (tx) => {
        const reservation = await tx.find('settlement:' + settlementId);
        if (!reservation || reservation.partnerId !== partnerId) throw new Error('Settlement unavailable.');
        const key = 'payout:' + settlementId;
        const existing = await tx.find(key);
        if (existing) {
          if (existing.externalReference !== payoutReference) throw new Error('Settlement payout already posted.');
          return existing;
        }
        const amount = reservation.transfers
          .filter((entry) => entry.credit === payoutReserved)
          .reduce((total, entry) => total + paise(entry.amountPaise), 0n);
        if (!amount || receipt?.partnerId !== partnerId || receipt.settlementId !== settlementId ||
            receipt.payoutReference !== payoutReference || receipt.amountPaise !== amount.toString()) {
          throw new Error('Payout does not reconcile to this settlement.');
        }
        return tx.post({
          key, kind: 'payout', partnerId, referenceScope: 'master_payout', externalReference: payoutReference,
          transfers: [transfer(payoutReserved, 'master_bank', amount)],
        });
      });
    },
  };
}
