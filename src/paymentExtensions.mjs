const unavailable = () => { throw new Error('Payment integration is not configured.'); };

export const unconfiguredGatewayProvider = Object.freeze({
  createMasterCheckout: unavailable,
  readReconciledMasterDeposit: unavailable,
});

export const unconfiguredPaymentPolicy = Object.freeze({
  allowPathologyPayment: unavailable,
  allowCod: unavailable,
  resolveCommercialTerms: unavailable,
  verifyCodCollection: unavailable,
  verifyMasterPayout: unavailable,
});

export const unconfiguredPaymentExtensions = Object.freeze({
  readOrderPaymentState: unavailable,
  handleGatewayWebhook: unavailable,
  refundOrCancel: unavailable,
  createInvoice: unavailable,
  schedulePartnerPayout: unavailable,
  buildSettlementReport: unavailable,
  calculateTaxAndWithholding: unavailable,
});
