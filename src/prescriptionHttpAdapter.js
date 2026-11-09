import { secureServiceUrl } from './serviceUrl.mjs';

export function createPrescriptionHttpAdapter(origin, getAccessToken, statusTransport = null) {
  const serviceUrl = secureServiceUrl(origin);
  async function request(path, body, contentType) {
    const token = await getAccessToken();
    if (!token) throw new Error('Sign-in required.');
    const response = await fetch(new URL(path, serviceUrl), {
      method: body ? 'POST' : 'GET',
      headers: { Authorization: 'Bearer ' + token, ...(contentType && { 'Content-Type': contentType }) },
      body,
    });
    if (!response.ok) throw new Error('Prescription service unavailable.');
    return response.json();
  }

  async function upload(path, { source, uri, file, mimeType }) {
    const name = source === 'camera' ? 'prescription.jpg' : 'prescription.pdf';
    const body = new FormData();
    body.append('source', source);
    const blob = file ?? (uri.startsWith('blob:') ? await (await fetch(uri)).blob() : null);
    if (blob) body.append('file', blob, name);
    else {
      // React Native accepts native multipart file descriptors.
      const nativeForm = /** @type {{ append: (field: string, file: { uri: string, name: string, type: string }) => void }} */ (/** @type {unknown} */ (body));
      nativeForm.append('file', { uri, name, type: mimeType ?? 'application/pdf' });
    }
    return request(path, body);
  }

  return {
    listOrders: () => request('/v1/orders'),
    createOrder: (input) => request('/v1/orders', JSON.stringify(input), 'application/json'),
    async subscribeOrderStatus(onChange) {
      if (!statusTransport) return;
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error('Sign-in required.');
      return statusTransport.subscribe({ accessToken, onChange });
    },
    uploadPrescription: (input) => upload('/v1/prescriptions', input),
    replaceOrderPrescription: (orderId, input) => upload('/v1/orders/' + encodeURIComponent(orderId) + '/prescription', input),
  };
}
