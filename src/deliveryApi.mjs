import brandConfig from './branding/brandConfig.cjs';
import { readJsonObject, RequestBodyError } from './requestBody.mjs';

const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export function createDeliveryApi(service, getStaff) {
  return async (request) => {
    const url = new URL(request.url);
    const route = /^\/v1\/operations\/(session|orders|transactions|catalog|overrides)(?:\/([^/]+))?(?:\/([^/]+))?$/.exec(url.pathname);
    const post = request.method === 'POST';
    if (!route || (!post && request.method !== 'GET')) return json({}, 404);
    if (post && request.headers.get('Origin') !== url.origin) return json({}, 403);
    try {
      const actor = await getStaff(request);
      if (!actor?.id) return json({}, 401);
      if (actor.role !== 'admin' && !(actor.role === 'retail_store' && actor.storeId)) return json({}, 403);
      const [, resource, encodedId, action] = route;
      const id = encodedId && decodeURIComponent(encodedId);
      const after = url.searchParams.get('after') || null;
      if (resource === 'session' && !post && !id) {
        return json({ role: actor.role, brandName: brandConfig.ACTIVE_BRAND_CONFIG.brand.name });
      }
      if (resource === 'orders' && !post && !id) return json(await service.listOrders(actor, after));
      if (resource === 'transactions' && !post && !id) {
        return actor.role === 'admin' ? json(await service.listTransactions(actor, after)) : json({}, 403);
      }
      let result;
      if (resource === 'orders' && post && id && action) {
        if (actor.role !== 'retail_store') return json({}, 403);
        result = await service.updateOrder(actor, id, action, await readJsonObject(request));
      } else if (resource === 'overrides' && id && !action) {
        if (actor.role !== 'retail_store') return json({}, 403);
        result = post ? await service.saveOverride(actor, id, await readJsonObject(request)) : await service.readOverride(actor, id);
      } else if (resource === 'catalog' && id && !action) {
        if (actor.role !== 'admin') return json({}, 403);
        result = post ? await service.saveCatalogEdit(actor, id, await readJsonObject(request)) : await service.readCatalogRecord(actor, id);
      }
      return result ? json(result) : json({}, 404);
    } catch (error) {
      if (error instanceof RequestBodyError) return json({}, error.status);
      return json({ message: 'Operations action unavailable.' }, 409);
    }
  };
}
