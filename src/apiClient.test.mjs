import assert from 'node:assert/strict';
import test from 'node:test';
import { apiRequest, inrPaise, mapOfferToMedicine } from './apiClient.js';

test('inrPaise formats exact rupees and paise cleanly', () => {
  assert.equal(inrPaise(2900), '₹29');
  assert.equal(inrPaise(3350), '₹33.50');
  assert.equal(inrPaise(0), '₹0');
});

test('mapOfferToMedicine maps backend inventory offer to catalog model', () => {
  const mapped = mapOfferToMedicine({
    inventoryId: 'inv-1',
    retailerId: 'ret-1',
    retailerName: 'Shree Ram Medical Store',
    distanceKm: 0.4,
    medicineId: 'med-dolo-650',
    name: 'Dolo 650mg Tablet',
    brand: 'Micro Labs Ltd',
    saltComposition: 'Paracetamol',
    strength: '650mg',
    dosageForm: 'Tablet',
    packSize: '15 Tablets',
    category: 'Fever & Pain',
    schedule: 'OTC',
    prescriptionRequired: false,
    stockQuantity: 14,
    inStock: true,
    mrpPaise: 3350,
    sellingPricePaise: 2900,
    discountPaise: 150,
    gstRatePercent: 12,
    finalUnitPricePaise: 3080,
    equivalents: [],
  });

  assert.equal(mapped.id, 'med-dolo-650');
  assert.equal(mapped.type, 'OTC');
  assert.equal(mapped.stockQuantity, 14);
  assert.equal(mapped.finalUnitPricePaise, 3080);
  assert.equal(mapped.isOutOfStock, false);
});

test('apiRequest attaches Authorization and throws structured ApiError on non-OK', async () => {
  let seenAuth = '';
  const okData = await apiRequest('/v1/health', { token: 'tok-123' }, async (_url, opts) => {
    seenAuth = opts.headers.Authorization;
    return { ok: true, status: 200, json: async () => ({ ok: true }) };
  });
  assert.equal(seenAuth, 'Bearer tok-123');
  assert.equal(okData.ok, true);

  await assert.rejects(
    () => apiRequest('/v1/orders', { method: 'POST', body: {}, token: null }, async () => ({
      ok: false,
      status: 403,
      json: async () => ({ error: 'Role mismatch', code: 'ROLE_MISMATCH' }),
    })),
    (err) => err.status === 403 && err.code === 'ROLE_MISMATCH',
  );
});
