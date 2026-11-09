import { readJsonObject, RequestBodyError } from './requestBody.mjs';

const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const json = (body, status = 200) => Response.json(body, { status, headers });

export function createStaffPrescriptionApi(workflow, auth, staff) {
  return async (request) => {
    const url = new URL(request.url);
    const path = url.pathname.split('/').slice(3);
    const post = request.method === 'POST';
    if (!url.pathname.startsWith('/v1/staff/') || (!post && request.method !== 'GET')) return json({}, 404);
    if (post && request.headers.get('Origin') !== url.origin) return json({}, 403);

    try {
      if (post && path.join('/') === 'session') {
        const { email, password } = await readJsonObject(request);
        if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) return json({}, 400);
        const cookie = await auth.signInStaff({ email, password });
        if (!cookie) return json({}, 401);
        return new Response(null, { status: 204, headers: { ...headers, 'Set-Cookie': cookie } });
      }
      const actor = await auth.getStaff(request);
      if (!actor?.id) return json({}, 401);
      const [resource, encodedId, action] = path;
      const id = encodedId && decodeURIComponent(encodedId);

      if (!post && path.join('/') === 'work') return json(await staff.listWork(actor));
      if (post && path.join('/') === 'logout') {
        const cookie = await auth.signOutStaff(request);
        return new Response(null, { status: 204, headers: { ...headers, 'Set-Cookie': cookie } });
      }
      if (path.length !== 3) return json({}, 404);
      if (resource === 'prescriptions' && id && action === 'file' && !post) {
        const file = await staff.readReviewFile(actor, id);
        if (!file || !['image/jpeg', 'application/pdf'].includes(file.type)) return json({}, 404);
        return new Response(file, { headers: { ...headers, 'Content-Type': file.type, 'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'" } });
      }
      if (resource === 'prescriptions' && id && action === 'review' && post) {
        return json(await workflow.review(actor, id, await readJsonObject(request)));
      }
      if (resource === 'orders' && id && action === 'assignment' && post) {
        await workflow.assign(actor, id, await readJsonObject(request));
        return new Response(null, { status: 204, headers });
      }
      return json({}, 404);
    } catch (error) {
      if (error instanceof RequestBodyError) return json({}, error.status);
      return json({ message: 'Staff action unavailable.' }, 409);
    }
  };
}
