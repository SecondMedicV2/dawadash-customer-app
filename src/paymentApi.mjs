import { readJsonObject, RequestBodyError } from './requestBody.mjs';

export function createPaymentApi(service, getAuthenticatedActor) {
  const headers = { 'Cache-Control': 'no-store' };
  const routes = new Map([
    ['/v1/payments/checkout', service.checkout],
    ['/v1/internal/payments/digital', service.recordDigital],
    ['/v1/internal/payments/cod', service.recordCod],
    ['/v1/internal/settlements/prepare', service.prepareSettlement],
    ['/v1/internal/settlements/payout', service.recordPayout],
  ]);
  return async (request) => {
    const action = routes.get(new URL(request.url).pathname);
    if (request.method !== 'POST' || !action) return new Response(null, { status: 404, headers });
    try {
      const actor = await getAuthenticatedActor(request);
      if (!actor?.id) return new Response(null, { status: 401, headers });
      const result = await action(actor, await readJsonObject(request));
      return Response.json(result, { headers });
    } catch (error) {
      if (error instanceof RequestBodyError) return new Response(null, { status: error.status, headers });
      return Response.json({ message: 'Payment action unavailable.' }, { status: 409, headers });
    }
  };
}
