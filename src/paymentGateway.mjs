export const PAYMENT_CONFIG = Object.freeze({ settlementMode: 'master', splitPayments: false });
export const DIGITAL_METHODS = Object.freeze(['upi', 'qr', 'debit_card', 'credit_card', 'net_banking']);

export function assertMasterSettlement(config) {
  if (config.settlementMode !== 'master' || config.splitPayments !== false) {
    throw new Error('Partner-direct routing and split payments are disabled.');
  }
}

export function createMasterAccountGateway({ provider, masterAccountId }) {
  if (!masterAccountId) throw new Error('Master merchant account is required.');
  return {
    createCheckout({ orderId, amountPaise, method }) {
      if (!DIGITAL_METHODS.includes(method)) throw new Error('Unsupported digital payment method.');
      return provider.createMasterCheckout({
        masterAccountId, orderId, amountPaise, method, currency: 'INR', idempotencyKey: orderId,
      });
    },

    async verifyDeposit({ orderId, amountPaise, paymentReference }) {
      const deposit = await provider.readReconciledMasterDeposit({ masterAccountId, paymentReference });
      if (deposit?.masterAccountId !== masterAccountId || deposit.orderId !== orderId ||
          deposit.paymentReference !== paymentReference || deposit.grossPaise !== amountPaise ||
          deposit.currency !== 'INR' || deposit.reconciled !== true) {
        throw new Error('Payment is not reconciled to the master account.');
      }
      return deposit;
    },
  };
}

// Model B extension points. The active checkout path never calls these.
export const partnerRouting = Object.freeze({
  resolveSubMerchant() { throw new Error('Sub-merchant routing is disabled.'); },
  createSplitSettlement() { throw new Error('Split settlement is disabled.'); },
});
