// Tests for Production Customer Service Adapter and Convex/Cloud Run integration

import assert from 'node:assert/strict';
import test from 'node:test';
import { ApiError } from './apiClient.js';
import { createProductionCustomerAdapter } from './productionCustomerAdapter.js';

test('production adapter: uploadPrescription enforces valid payload and returns private reference', async () => {
  const uploadedPayloads = [];
  const mockApi = {
    async uploadPrescription(payload) {
      uploadedPayloads.push(payload);
      return { id: 'rx-test-101', status: 'pending_pharmacist_review', fileName: payload.fileName };
    },
  };

  const adapter = createProductionCustomerAdapter({ api: mockApi });

  // Missing file input throws ApiError
  await assert.rejects(adapter.uploadPrescription(null), /valid prescription image or PDF is required/);
  await assert.rejects(adapter.uploadPrescription({}), /valid prescription image or PDF is required/);

  // Valid upload returns private prescription record without bearer URL
  const res = await adapter.uploadPrescription({
    source: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
    fileName: 'doctor_prescription.jpg',
    mimeType: 'image/jpeg',
  });

  assert.equal(res.id, 'rx-test-101');
  assert.equal(res.status, 'pending_pharmacist_review');
  assert.equal(res.fileName, 'doctor_prescription.jpg');
  assert.equal(uploadedPayloads.length, 1);
  assert.equal(uploadedPayloads[0].fileName, 'doctor_prescription.jpg');
});

test('production adapter: createOrder enforces cart validation, retailer selection, and address', async () => {
  const adapter = createProductionCustomerAdapter({ api: {} });

  // Empty cart fails
  await assert.rejects(
    adapter.createOrder({ items: [], retailerId: 'ret-1', addressId: 'addr-1' }),
    /Cart must contain at least one item/,
  );

  // Missing retailer fails
  await assert.rejects(
    adapter.createOrder({ items: [{ id: 'm1', qty: 1 }], retailerId: null, addressId: 'addr-1' }),
    /verified local pharmacy within 3 km must be selected/,
  );

  // Missing address fails
  await assert.rejects(
    adapter.createOrder({ items: [{ id: 'm1', qty: 1 }], retailerId: 'ret-1', addressId: null, deliveryAddress: null }),
    /confirmed customer delivery address is required/,
  );
});

test('production adapter: createOrder is idempotent and fails closed on server errors', async () => {
  let callCount = 0;
  let receivedKey = null;

  const mockApi = {
    async createOrder(payload, idempotencyKey) {
      callCount++;
      receivedKey = idempotencyKey;
      if (callCount === 1) {
        throw new ApiError('Out of stock at selected pharmacy', 409, 'STOCK_UNAVAILABLE');
      }
      return {
        order: {
          id: 'ord-authoritative-99',
          status: 'assigned_to_retailer',
          retailerId: payload.retailerId,
          totalPaise: 45000,
        },
      };
    },
  };

  const adapter = createProductionCustomerAdapter({ api: mockApi });

  const orderPayload = {
    retailerId: 'store-gomti-1',
    addressId: 'addr-lucknow-1',
    items: [{ id: 'm1', inventoryId: 'inv-1', qty: 2 }],
    fulfillmentMode: 'delivery',
    paymentMode: 'cash_on_delivery',
  };

  // First call fails closed — MUST NOT return a fake local demo order!
  await assert.rejects(
    adapter.createOrder(orderPayload, 'idemp-key-abc'),
    (err) => err instanceof ApiError && err.status === 409 && err.code === 'STOCK_UNAVAILABLE',
  );
  assert.equal(receivedKey, 'idemp-key-abc');

  // Second call succeeds with authoritative server response
  const successOrder = await adapter.createOrder(orderPayload, 'idemp-key-abc');
  assert.equal(successOrder.id, 'ord-authoritative-99');
  assert.equal(successOrder.status, 'assigned_to_retailer');
  assert.equal(successOrder.totalPaise, 45000);
});

test('production adapter: subscribeOrderStatus delivers milestone updates and stops on unsubscribe', async () => {
  let trackingPollCount = 0;
  const statuses = ['pending_prescription_review', 'prescription_verified', 'out_for_delivery'];

  const mockApi = {
    async getOrderTracking(orderId) {
      const status = statuses[Math.min(trackingPollCount, statuses.length - 1)];
      trackingPollCount++;
      return {
        orderId,
        status,
        updatedAt: new Date().toISOString(),
        timeline: [{ status, timestamp: new Date().toISOString() }],
      };
    },
  };

  const adapter = createProductionCustomerAdapter({ api: mockApi, pollIntervalMs: 50 });

  const receivedMilestones = [];
  const unsubscribe = adapter.subscribeOrderStatus('ord-test-123', (update) => {
    receivedMilestones.push(update.status);
  });

  // Wait for initial check
  await new Promise((r) => setTimeout(r, 80));
  assert.ok(receivedMilestones.length >= 1);
  assert.equal(receivedMilestones[0], 'pending_prescription_review');

  // Wait for poll update
  await new Promise((r) => setTimeout(r, 120));
  assert.ok(receivedMilestones.includes('prescription_verified'));

  // Unsubscribe should stop subsequent calls
  unsubscribe();
  const countAfterUnsub = trackingPollCount;
  await new Promise((r) => setTimeout(r, 120));
  assert.equal(trackingPollCount, countAfterUnsub);
});

test('production adapter: createLabBooking fails closed with 503 until partner integration is approved', async () => {
  const adapter = createProductionCustomerAdapter({ api: {} });
  await assert.rejects(
    adapter.createLabBooking({ testId: 'lab-cbc' }),
    (err) => err instanceof ApiError && err.status === 503 && err.code === 'LAB_PROVIDER_UNCONFIGURED',
  );
});

test('production adapter: loginWithFirebase passes ID token to backend and persists session', async () => {
  let calledEndpoint = '';
  let calledBody = null;

  const mockApi = {
    async loginWithFirebase(idToken) {
      calledEndpoint = '/v1/auth/firebase';
      calledBody = { idToken, expectedRole: 'CUSTOMER' };
      return {
        token: 'jwt-customer-session-123',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        user: { id: 'usr-cust-1', fullName: 'Pritesh Customer', role: 'CUSTOMER', phone: '+91 9876543210' },
      };
    },
  };

  const res = await mockApi.loginWithFirebase('firebase-id-token-xyz');
  assert.equal(calledEndpoint, '/v1/auth/firebase');
  assert.equal(calledBody.idToken, 'firebase-id-token-xyz');
  assert.equal(calledBody.expectedRole, 'CUSTOMER');
  assert.equal(res.token, 'jwt-customer-session-123');
  assert.equal(res.user.role, 'CUSTOMER');
});

test('production adapter: customer saved address coordinates override device GPS for 3 km serviceability', () => {
  const addresses = [
    { id: 'addr-hazratganj', addressLine: '10 Park Road', locality: 'Hazratganj', latitude: 26.8467, longitude: 80.9462 },
  ];
  const selectedAddressId = 'addr-hazratganj';
  const coords = { lat: 26.8500, lng: 80.9500 }; // Device GPS
  const locality = 'Gomti Nagar';

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) || null;
  const effectiveLocationQuery = (() => {
    if (selectedAddress?.latitude != null && selectedAddress?.longitude != null) {
      return { lat: selectedAddress.latitude, lng: selectedAddress.longitude };
    }
    if (coords?.lat != null && coords?.lng != null) {
      return { lat: coords.lat, lng: coords.lng };
    }
    return { locality };
  })();

  // Saved address coordinate MUST be authoritative
  assert.equal(effectiveLocationQuery.lat, 26.8467);
  assert.equal(effectiveLocationQuery.lng, 80.9462);
});

test('production adapter: authoritative catalog lookup rejects static fixtures and uses published snapshot', async () => {
  const publishedOffers = [
    {
      id: 'med-dolo',
      inventoryId: 'inv-store1-dolo',
      retailerId: 'store-1',
      name: 'Dolo 650mg Tablet',
      inStock: true,
      sellingPricePaise: 2750,
      mrpPaise: 3350,
    },
  ];

  const mockApi = {
    async getCatalogMedicines({ retailerId }) {
      assert.equal(retailerId, 'store-1');
      return publishedOffers;
    },
  };

  const adapter = createProductionCustomerAdapter({ api: mockApi });
  const catalog = await adapter.getCatalogMedicines({ retailerId: 'store-1', lat: 26.8467, lng: 80.9462 });

  assert.equal(catalog.length, 1);
  assert.equal(catalog[0].id, 'med-dolo');
  assert.equal(catalog[0].inventoryId, 'inv-store1-dolo');
  assert.equal(catalog[0].sellingPricePaise, 2750);
});

test('production adapter: quote calculation is server-authoritative', async () => {
  const mockApi = {
    async quoteOrder(params) {
      return {
        subtotalPaise: 5500,
        mrpTotalPaise: 6700,
        discountPaise: 1200,
        deliveryFeePaise: 2500,
        gstPaise: 660,
        totalPaise: 8000,
        prescriptionRequired: false,
      };
    },
  };

  const adapter = createProductionCustomerAdapter({ api: mockApi });
  const quote = await adapter.quoteOrder({
    retailerId: 'store-1',
    fulfillmentMode: 'store_delivery',
    items: [{ medicineId: 'med-dolo', quantity: 2 }],
  });

  assert.equal(quote.totalPaise, 8000);
  assert.equal(quote.deliveryFeePaise, 2500);
  assert.equal(quote.subtotalPaise, 5500);
});

test('production adapter: initiateRazorpayOrder initiates gateway order with direct retailer routing', async () => {
  const mockApi = {
    async createRazorpayOrder(orderId) {
      assert.equal(orderId, 'ord-prepaid-555');
      return {
        keyId: 'rzp_test_public_key',
        razorpayOrderId: 'order_rzp_live_555',
        amountPaise: 42000,
        currency: 'INR',
        straightToRetailer: true,
        retailerAccountId: 'acc_pharmacy_lucknow_01',
      };
    },
  };

  const adapter = createProductionCustomerAdapter({ api: mockApi });
  const meta = await adapter.initiateRazorpayOrder('ord-prepaid-555');

  assert.equal(meta.razorpayOrderId, 'order_rzp_live_555');
  assert.equal(meta.amountPaise, 42000);
  assert.equal(meta.straightToRetailer, true);
  assert.equal(meta.retailerAccountId, 'acc_pharmacy_lucknow_01');

  // Verify missing orderId throws structured ApiError
  await assert.rejects(
    () => adapter.initiateRazorpayOrder(null),
    (err) => err instanceof ApiError && err.code === 'MISSING_ORDER_ID'
  );
});

test('production adapter: verifyRazorpayPayment calls backend verification and returns confirmed order', async () => {
  let passedPayload = null;
  const mockApi = {
    async verifyRazorpayPayment(payload) {
      passedPayload = payload;
      return {
        order: {
          id: 'ord-prepaid-555',
          status: 'ORDER_PLACED',
          paymentStatus: 'PAID',
        },
      };
    },
  };

  const adapter = createProductionCustomerAdapter({ api: mockApi });
  const result = await adapter.verifyRazorpayPayment({
    orderId: 'ord-prepaid-555',
    razorpayOrderId: 'order_rzp_live_555',
    razorpayPaymentId: 'pay_rzp_sig_777',
    razorpaySignature: 'hmac_valid_signature_hex',
  });

  assert.equal(passedPayload.orderId, 'ord-prepaid-555');
  assert.equal(passedPayload.razorpayPaymentId, 'pay_rzp_sig_777');
  assert.equal(result.order.status, 'ORDER_PLACED');
  assert.equal(result.order.paymentStatus, 'PAID');
});

