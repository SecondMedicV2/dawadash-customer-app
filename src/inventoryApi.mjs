import { readBodyBytes, RequestBodyError } from './requestBody.mjs';

const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export function createInventoryApi(service, { getCustomer, getInventorySource, maxWebhookRequestBytes }) {
  return async (request) => {
    const { pathname, searchParams } = new URL(request.url);
    const webhook = request.method === 'POST' && /^\/v1\/internal\/inventory\/([^/]+)\/webhook$/.exec(pathname);
    const search = request.method === 'GET' && pathname === '/v1/medicines';
    const alternatives = request.method === 'GET' && /^\/v1\/medicines\/([^/]+)\/alternatives$/.exec(pathname);
    if (!webhook && !search && !alternatives) return json({}, 404);

    const match = webhook || alternatives;
    let id;
    if (match) {
      try { id = decodeURIComponent(match[1]); } catch { return json({}, 400); }
    }

    try {
      if (webhook) {
        const bytes = await readBodyBytes(request, maxWebhookRequestBytes);
        const bounded = new Request(request, { body: bytes });
        const actor = await getInventorySource(bounded.clone(), id);
        if (!actor?.id) return json({}, 401);
        if (actor.role !== 'inventory_source' || actor.sourceId !== id) return json({}, 403);
        const applied = await service.ingestWebhook(id, bounded);
        return applied ? new Response(null, { status: 204 }) : json({}, 404);
      }
      const customer = await getCustomer(request);
      if (!customer?.id) return json({}, 401);
      if (customer.role !== 'customer') return json({}, 403);
      if (search) return json(await service.search(customer, searchParams.get('q'), searchParams.get('after')));
      return json(await service.compositionAlternatives(customer, id));
    } catch (error) {
      if (error instanceof RequestBodyError) return json({}, error.status);
      return json({ message: 'Inventory service unavailable.' }, 503);
    }
  };
}
