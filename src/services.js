const id = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

export const createCustomerServices = (adapter) => ({
  uploadPrescription: (input) => adapter.uploadPrescription(input),
  listOrders: () => adapter.listOrders(),
  async subscribeOrderStatus(onChange) { return adapter.subscribeOrderStatus?.(onChange); },
  replaceOrderPrescription: (orderId, input) => adapter.replaceOrderPrescription(orderId, input),
  createOrder: (input) => adapter.createOrder(input),
  createLabBooking: (input) => adapter.createLabBooking(input),
});

export const demoAdapter = {
  async uploadPrescription() {
    return { id: id('rx'), status: 'pending_secure_upload_setup' };
  },
  async listOrders() { return null; }, // The demo keeps local order state.
  async replaceOrderPrescription() { throw new Error('Replacement requires a connected service.'); },
  async createOrder(input) {
    return { id: id('order'), ...input, status: 'pending_provider_confirmation', createdAt: new Date().toISOString() };
  },
  async createLabBooking(input) {
    return { id: id('lab'), ...input, status: 'pending_lab_partner_confirmation', createdAt: new Date().toISOString() };
  },
};

// Local-only records let the mobile flows be exercised without claiming a backend request succeeded.
export const customerServices = createCustomerServices(demoAdapter);

export const retailerAcquisition = {
  async attributeInstall() { throw new Error('Retailer attribution is not configured.'); },
  async recordWalkInInvite() { throw new Error('Retailer invite tracking is not configured.'); },
};

export const retentionAnalytics = {
  async track() { throw new Error('Retention analytics is not configured.'); },
};
