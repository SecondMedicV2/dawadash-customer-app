import { compositionKey } from './medicineComposition.mjs';

const integerString = (value) => typeof value === 'string' && /^\d+$/.test(value);
export const isInventoryId = (value) => typeof value === 'string' && !!value.trim();
export const isQuantity = (value) => Number.isSafeInteger(value) && value >= 0;
export const inventoryCompositionKey = (sku) => compositionKey(sku, String);

function requireChange(valid) {
  if (!valid) throw new Error('Invalid partner inventory change.');
}

export function normalizeSku({ name, brand, manufacturer, packaging, mrpPaise, discountedRatePaise, form, composition }) {
  requireChange([name, brand, manufacturer, packaging].every(isInventoryId));
  requireChange(integerString(mrpPaise) && integerString(discountedRatePaise));
  requireChange((form === null || isInventoryId(form)) && Array.isArray(composition));
  const ingredients = composition.map(({ salt, strength, unit }) => {
    requireChange(isInventoryId(salt) && isInventoryId(unit)
      && typeof strength === 'string' && /^\d+(\.\d+)?$/.test(strength));
    const [whole, fraction = ''] = strength.split('.');
    const normalizedFraction = fraction.replace(/0+$/, '');
    return {
      salt: salt.trim().toLowerCase(), unit: unit.trim().toLowerCase(),
      strength: BigInt(whole).toString() + (normalizedFraction ? '.' + normalizedFraction : ''),
    };
  }).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b), 'en'));
  return {
    name, brand, manufacturer, packaging, form: form?.trim().toLowerCase() ?? null,
    mrpPaise: BigInt(mrpPaise).toString(), discountedRatePaise: BigInt(discountedRatePaise).toString(),
    composition: ingredients, salt: ingredients.map(({ salt }) => salt).join(' + '),
  };
}

function normalizeBatches(batches) {
  requireChange(Array.isArray(batches));
  const seen = new Set();
  return batches.map(({ batch, quantity, inboundQuantity, expiryDate }) => {
    requireChange(isInventoryId(batch) && !seen.has(batch) && isQuantity(quantity) && isQuantity(inboundQuantity));
    requireChange(expiryDate === null || (typeof expiryDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(expiryDate)
      && !Number.isNaN(Date.parse(expiryDate)) && new Date(expiryDate).toISOString().slice(0, 10) === expiryDate));
    seen.add(batch);
    return { batch, quantity, inboundQuantity, expiryDate };
  });
}

function latest(changes, normalize) {
  requireChange(Array.isArray(changes));
  const rows = new Map();
  for (const change of changes) {
    const { skuId, revision } = change;
    requireChange(isInventoryId(skuId) && integerString(revision));
    const row = { skuId, revision, ...normalize(change) };
    const previous = rows.get(skuId);
    if (!previous || BigInt(revision) > BigInt(previous.revision)) rows.set(skuId, row);
  }
  return [...rows.values()];
}

export function normalizeInventoryChanges({ catalog, stock }) {
  return {
    catalog: latest(catalog, ({ details }) => {
      const sku = details === null ? null : normalizeSku(details);
      return { details: sku, compositionKey: sku && inventoryCompositionKey(sku) };
    }),
    stock: latest(stock, ({ batches }) => {
      const normalized = normalizeBatches(batches);
      const quantity = normalized.reduce((sum, batch) => sum + batch.quantity, 0);
      requireChange(isQuantity(quantity));
      return { quantity, batches: normalized };
    }),
  };
}
