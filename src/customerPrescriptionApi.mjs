import { readMultipart, RequestBodyError } from './requestBody.mjs';

const headers = { 'Cache-Control': 'no-store' };
const json = (body, status = 200) => Response.json(body, { status, headers });

export function createCustomerPrescriptionApi(workflow, auth, orders, delivery = null, { maxUploadRequestBytes } = {}) {
  return async (request) => {
    const pathname = new URL(request.url).pathname;
    try {
      const customer = await auth.getCustomer(request);
      if (!customer?.id) return json({}, 401);
      if (customer.role !== 'customer') return json({}, 403);
      if (request.method === 'POST') {
        const replacement = /^\/v1\/orders\/([^/]+)\/prescription$/.exec(pathname);
        if (replacement || pathname === '/v1/prescriptions') {
          const form = await readMultipart(request, maxUploadRequestBytes);
          if (form.getAll('source').length !== 1 || form.getAll('file').length !== 1) return json({}, 400);
          const input = { source: form.get('source'), file: form.get('file') };
          const result = replacement
            ? await workflow.replace(customer.id, decodeURIComponent(replacement[1]), input)
            : await workflow.upload(customer.id, input);
          return json(result, 201);
        }
      }
      if (request.method === 'GET') {
        const verification = /^\/v1\/prescriptions\/([^/]+)\/verification$/.exec(pathname);
        if (verification) return json(await workflow.verification(customer.id, decodeURIComponent(verification[1])));
        if (pathname === '/v1/orders') {
          // The repository joins current prescription metadata in the same owner-scoped query.
          const rows = await orders.listWithPrescriptionActions(customer.id);
          return json(delivery ? await delivery.attachDeliveryUpdates(rows) : rows);
        }
      }
      return json({}, 404);
    } catch (error) {
      if (error instanceof RequestBodyError) return json({}, error.status);
      return json({ message: 'Prescription action unavailable.' }, 409);
    }
  };
}
