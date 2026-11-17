// Centralized HTTP API client for DawaDash Customer App (Cloudflare Workers + D1 backend).

export const DEFAULT_API_URL = 'https://dawadash-api.smv1.workers.dev';
const SESSION_STORAGE_KEY = 'dawadash_customer_session_v1';

let memorySession = { token: null, expiresAt: null, user: null };

export function getApiBaseUrl() {
  const configured = typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL;
  return String(configured || DEFAULT_API_URL).replace(/\/+$/, '');
}

export function loadStoredSession() {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      const raw = globalThis.localStorage.getItem(SESSION_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.token) {
          memorySession = parsed;
          return parsed;
        }
      }
    }
  } catch {
    // Ignore storage read errors in restricted contexts.
  }
  return memorySession;
}

export function saveStoredSession(session) {
  memorySession = session && session.token ? session : { token: null, expiresAt: null, user: null };
  try {
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      if (memorySession.token) {
        globalThis.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(memorySession));
      } else {
        globalThis.localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }
  } catch {
    // Ignore storage write errors in restricted contexts.
  }
}

export function clearStoredSession() {
  saveStoredSession(null);
}

export function inrPaise(paise = 0) {
  const value = Number(paise || 0) / 100;
  return '₹' + value.toLocaleString('en-IN', {
    minimumFractionDigits: Number(paise || 0) % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export class ApiError extends Error {
  constructor(message, status, code, data) {
    super(message);
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

export async function apiRequest(path, { method = 'GET', body, token, headers = {} } = {}, fetchImpl = globalThis.fetch) {
  const sessionToken = token !== undefined ? token : loadStoredSession().token;
  const reqHeaders = { ...headers };
  if (body !== undefined) reqHeaders['Content-Type'] = 'application/json';
  if (sessionToken) reqHeaders.Authorization = `Bearer ${sessionToken}`;

  const res = await fetchImpl(`${getApiBaseUrl()}${path}`, {
    method,
    headers: reqHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.error || `Request failed (${res.status})`, res.status, data.code, data);
  }
  return data;
}

export function mapOfferToMedicine(offer) {
  const mrpPaise = Number(offer.mrpPaise || 0);
  const finalUnitPricePaise = Number(offer.finalUnitPricePaise || offer.sellingPricePaise || 0);
  const price = Math.round(finalUnitPricePaise / 100 * 100) / 100;
  const mrp = Math.round(mrpPaise / 100 * 100) / 100;
  const form = String(offer.dosageForm || '').toLowerCase();
  const icon = form.includes('sachet') ? 'medical-bag' : 'pill';

  return {
    id: offer.medicineId,
    inventoryId: offer.inventoryId,
    retailerId: offer.retailerId,
    retailerName: offer.retailerName,
    distanceKm: offer.distanceKm,
    name: offer.name,
    brand: offer.brand,
    salt: offer.saltComposition,
    saltComposition: offer.saltComposition,
    strength: offer.strength,
    dosageForm: offer.dosageForm,
    pack: offer.packSize,
    packSize: offer.packSize,
    category: offer.category,
    schedule: offer.schedule,
    type: offer.prescriptionRequired ? 'Rx' : 'OTC',
    prescriptionRequired: Boolean(offer.prescriptionRequired),
    stockQuantity: Number(offer.stockQuantity || 0),
    inStock: Boolean(offer.inStock),
    isOutOfStock: !offer.inStock,
    mrpPaise,
    sellingPricePaise: Number(offer.sellingPricePaise || 0),
    discountPaise: Number(offer.discountPaise || 0),
    gstRatePercent: Number(offer.gstRatePercent || 0),
    finalUnitPricePaise,
    mrp,
    price,
    unit: `${offer.packSize || '1 pack'} · Incl. ${Number(offer.gstRatePercent || 0)}% GST`,
    icon,
    equivalents: Array.isArray(offer.equivalents) ? offer.equivalents.map(mapOfferToMedicine) : [],
  };
}

export const customerApi = {
  health: () => apiRequest('/v1/health'),
  register: async (payload) => {
    const data = await apiRequest('/v1/auth/register', { method: 'POST', body: { ...payload, role: 'CUSTOMER' }, token: null });
    saveStoredSession({ token: data.token, expiresAt: data.expiresAt, user: data.user });
    return data;
  },
  login: async ({ identifier, password }) => {
    const data = await apiRequest('/v1/auth/login', {
      method: 'POST',
      body: { identifier, password, expectedRole: 'CUSTOMER' },
      token: null,
    });
    saveStoredSession({ token: data.token, expiresAt: data.expiresAt, user: data.user });
    return data;
  },
  loginWithFirebase: async (idToken) => {
    const data = await apiRequest('/v1/auth/firebase', {
      method: 'POST',
      body: { idToken, expectedRole: 'CUSTOMER' },
      token: null,
    });
    saveStoredSession({ token: data.token, expiresAt: data.expiresAt, user: data.user });
    return data;
  },
  requestOtp: ({ phone, purpose = 'login' }) =>
    apiRequest('/v1/auth/otp/request', { method: 'POST', body: { phone, purpose }, token: null }),
  verifyOtp: async ({ phone, otp, purpose = 'login', fullName }) => {
    const data = await apiRequest('/v1/auth/otp/verify', {
      method: 'POST',
      body: { phone, otp, purpose, fullName, expectedRole: 'CUSTOMER' },
      token: null,
    });
    saveStoredSession({ token: data.token, expiresAt: data.expiresAt, user: data.user });
    return data;
  },
  recoverPassword: ({ phone, otp, newPassword }) =>
    apiRequest('/v1/auth/recover', { method: 'POST', body: { phone, otp, newPassword }, token: null }),
  me: () => apiRequest('/v1/auth/me'),
  updateMe: (payload) => apiRequest('/v1/auth/me', { method: 'PATCH', body: payload }),
  logout: async () => {
    try {
      await apiRequest('/v1/auth/logout', { method: 'POST' });
    } catch {
      // Clear local session regardless of server expiry.
    }
    clearStoredSession();
  },
  listAddresses: () => apiRequest('/v1/customer/addresses'),
  createAddress: (payload) => apiRequest('/v1/customer/addresses', { method: 'POST', body: payload }),
  updateAddress: (id, payload) => apiRequest(`/v1/customer/addresses/${encodeURIComponent(id)}`, { method: 'PATCH', body: payload }),
  deleteAddress: (id) => apiRequest(`/v1/customer/addresses/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  getNearbyRetailers: ({ lat, lng, locality }) => {
    const params = new URLSearchParams();
    if (lat !== undefined && lat !== null && lng !== undefined && lng !== null) {
      params.set('lat', String(lat));
      params.set('lng', String(lng));
    } else if (locality) {
      params.set('locality', locality);
    }
    return apiRequest(`/v1/retailers/nearby?${params.toString()}`, { token: null });
  },
  getCatalogMedicines: async ({ retailerId, lat, lng, locality, q, category, rxOnly }) => {
    const params = new URLSearchParams();
    if (retailerId) params.set('retailerId', retailerId);
    if (lat !== undefined && lat !== null && lng !== undefined && lng !== null) {
      params.set('lat', String(lat));
      params.set('lng', String(lng));
    } else if (locality) {
      params.set('locality', locality);
    }
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    if (rxOnly !== undefined && rxOnly !== null) params.set('rxOnly', rxOnly);
    const data = await apiRequest(`/v1/catalog/medicines?${params.toString()}`, { token: null });
    return (data.items || []).map(mapOfferToMedicine);
  },
  uploadPrescription: (payload) => apiRequest('/v1/customer/prescriptions', { method: 'POST', body: payload }),
  quoteOrder: (payload) => apiRequest('/v1/orders/quote', { method: 'POST', body: payload }),
  createOrder: (payload, idempotencyKey) =>
    apiRequest('/v1/orders', {
      method: 'POST',
      body: payload,
      headers: { 'Idempotency-Key': idempotencyKey },
    }),
  listOrders: () => apiRequest('/v1/customer/orders'),
  health: () => apiRequest('/v1/health', { token: null }),
  createRazorpayOrder: (orderId) => apiRequest('/v1/payments/razorpay/order', { method: 'POST', body: { orderId } }),
  verifyRazorpayPayment: (payload) => apiRequest('/v1/payments/razorpay/verify', { method: 'POST', body: payload }),
  retryPayment: (orderId) => apiRequest(`/v1/orders/${encodeURIComponent(orderId)}/retry-payment`, { method: 'POST', body: {} }),
  cancelOrder: (orderId, reason) => apiRequest(`/v1/orders/${encodeURIComponent(orderId)}/cancel`, { method: 'POST', body: { reason } }),
  getOrderTracking: (orderId) => apiRequest(`/v1/orders/${encodeURIComponent(orderId)}/tracking`),
  listNotifications: () => apiRequest('/v1/notifications'),
  markNotificationRead: (id) => apiRequest(`/v1/notifications/${encodeURIComponent(id)}/read`, { method: 'POST', body: {} }),
  submitOrderReview: (orderId, { rating, comment }) =>
    apiRequest(`/v1/orders/${encodeURIComponent(orderId)}/review`, { method: 'POST', body: { rating, comment } }),
  submitOrderComplaint: (orderId, { category, description }) =>
    apiRequest(`/v1/orders/${encodeURIComponent(orderId)}/complaints`, { method: 'POST', body: { category, description } }),
};
