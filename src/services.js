// Central customer services layer supporting both production Cloud Run/Convex adapter
// and local demo adapter for tests/offline previews.

import { createProductionCustomerAdapter } from './productionCustomerAdapter.js';
import { customerApi } from './apiClient.js';

const id = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

export const createCustomerServices = (adapter) => ({
  uploadPrescription: (input) => adapter.uploadPrescription(input),
  listOrders: () => adapter.listOrders(),
  subscribeOrderStatus: (orderId, onChange) => adapter.subscribeOrderStatus?.(orderId, onChange),
  replaceOrderPrescription: (orderId, input) => adapter.replaceOrderPrescription(orderId, input),
  createOrder: (input, idempotencyKey) => adapter.createOrder(input, idempotencyKey),
  createLabBooking: (input) => adapter.createLabBooking(input),
  adapter,
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
  subscribeOrderStatus() { return () => {}; },
};

export const isProductionServicesEnabled = () =>
  typeof process !== 'undefined' &&
  process.env?.EXPO_PUBLIC_USE_PRODUCTION_SERVICES === 'true';

export const productionAdapter = createProductionCustomerAdapter({ api: customerApi });

// Local-only records let the mobile flows be exercised without claiming a backend request succeeded.
// When EXPO_PUBLIC_USE_PRODUCTION_SERVICES=true, routes through authoritative Cloud Run + Convex adapters.
export const customerServices = createCustomerServices(
  isProductionServicesEnabled() ? productionAdapter : demoAdapter
);

export { createProductionCustomerAdapter };

export const retailerAcquisition = {
  async attributeInstall() { throw new Error('Retailer attribution is not configured.'); },
  async recordWalkInInvite() { throw new Error('Retailer invite tracking is not configured.'); },
};

export const retentionAnalytics = {
  async track() { throw new Error('Retention analytics is not configured.'); },
};
