import { secureServiceUrl } from './serviceUrl.mjs';

/** @type {(...args: unknown[]) => never} */
const unconfigured = () => { throw new Error('Inventory integration is not configured.'); };
/** @type {(skuId: string, observations: unknown[]) => null} */
const unresolvedCatalog = () => null;

export const unconfiguredInventoryAdapter = Object.freeze({
  pullDelta: unconfigured,
  readWebhook: unconfigured,
  recordSale: unconfigured,
});

export const unconfiguredInventoryPolicies = Object.freeze({
  findNearestStore: unconfigured,
  resolveCatalogConflict: unresolvedCatalog,
  reserveStock: unconfigured,
  retryPartnerRequest: unconfigured,
  readStaleDataStatus: unconfigured,
  filterExpiredBatches: unconfigured,
  resolveDistributorIdentity: unconfigured,
  readPrescriptionClassification: unconfigured,
  readPathologyInventory: unconfigured,
  correctCatalog: unconfigured,
});

// Sample normalized REST transport. The host supplies real endpoint URLs and credentials.
export function createRestInventoryAdapter({
  deltaUrl, saleUrl, getHeaders, readWebhook = unconfigured, fetcher = fetch,
  decodeDelta = (response) => response.json(), decodeSale = (response) => response.json(),
}) {
  async function request(url, init, decode) {
    const response = await fetcher(url, { ...init, redirect: 'manual' });
    if (!response.ok) throw new Error('Partner inventory request failed.');
    return decode(response);
  }

  return {
    async pullDelta(cursor) {
      const url = secureServiceUrl(deltaUrl);
      if (cursor !== null) url.searchParams.set('cursor', cursor);
      return request(url, { headers: await getHeaders('delta') }, decodeDelta);
    },
    readWebhook,
    async recordSale({ orderId, items }) {
      const url = secureServiceUrl(saleUrl);
      const headers = new Headers(await getHeaders('sale'));
      headers.set('Content-Type', 'application/json');
      headers.set('Idempotency-Key', orderId);
      return request(url, {
        method: 'POST', headers, body: JSON.stringify({ items }),
      }, decodeSale);
    },
  };
}

// Bind a store's POS/ERP transport and its mapping to the same normalized adapter contract.
export function createPosInventoryAdapter({ pos, decodeDelta, encodeSale, decodeSale, readWebhook = unconfigured }) {
  return {
    async pullDelta(cursor) {
      return decodeDelta(await pos.readChanges({ cursor }));
    },
    readWebhook,
    async recordSale({ orderId, items }) {
      return decodeSale(await pos.submitSale(encodeSale({ orderId, items })));
    },
  };
}

