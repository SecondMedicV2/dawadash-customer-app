import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { LOCALITIES } from './data';
import { customerServices } from './services';
import {
  clearStoredSession,
  customerApi,
  loadStoredSession,
  saveStoredSession,
} from './apiClient';

const Ctx = createContext(null);

function normalizeUser(user) {
  if (!user) return null;
  const rawPhone = String(user.phone || '').replace(/\D/g, '').slice(-10);
  const formattedPhone = rawPhone.length === 10 ? `+91 ${rawPhone}` : (user.phone || '');
  return {
    ...user,
    name: user.fullName || user.name || 'DawaDash Customer',
    fullName: user.fullName || user.name || 'DawaDash Customer',
    phone: formattedPhone,
    rawPhone: rawPhone || user.phone,
  };
}

async function detectDeviceGps() {
  if (Platform.OS === 'web' || typeof navigator !== 'undefined') {
    const geo = typeof navigator !== 'undefined' ? navigator.geolocation : null;
    if (!geo || typeof geo.getCurrentPosition !== 'function') {
      throw new Error('Location services are unavailable in this browser. Choose your Lucknow locality manually.');
    }
    return new Promise((resolve, reject) => {
      geo.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => {
          const msg = err?.code === 1
            ? 'Location permission was denied. Select your locality manually below.'
            : 'Unable to determine GPS position right now. Select your locality manually below.';
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      );
    });
  }

  const Location = await import('expo-location');
  const perm = await Location.requestForegroundPermissionsAsync();
  if (perm.status !== 'granted') {
    throw new Error('Location permission was denied. Select your locality manually below.');
  }
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return { lat: pos.coords.latitude, lng: pos.coords.longitude };
}

export function AppProvider({ children, services = customerServices, api = customerApi }) {
  const [user, setUserState] = useState(() => normalizeUser(loadStoredSession().user));
  const [authReady, setAuthReady] = useState(false);
  const [pendingPhone, setPendingPhone] = useState('');
  const [cart, setCart] = useState({});
  const [cartRetailerId, setCartRetailerId] = useState(null);
  const [prescription, setPrescription] = useState(null);
  const [orders, setOrders] = useState([]);
  const [labBookings, setLabBookings] = useState([]);

  // Location & verified nearby store state
  const [locality, setLocalityState] = useState(LOCALITIES[0]);
  const [coords, setCoords] = useState(null); // null unless user grants real GPS
  const [locationStatus, setLocationStatus] = useState('manual'); // 'manual' | 'requesting' | 'gps' | 'denied'
  const [locationError, setLocationError] = useState(null);

  const [retailers, setRetailers] = useState([]);
  const [selectedRetailerId, setSelectedRetailerId] = useState(null);
  const [retailersLoading, setRetailersLoading] = useState(true);
  const [retailersError, setRetailersError] = useState(null);

  const [medicines, setMedicines] = useState([]);
  const [knownMedicines, setKnownMedicines] = useState({});
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState(null);

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [paymentProviderConfigured, setPaymentProviderConfigured] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const setUser = useCallback((nextUser) => {
    setUserState(normalizeUser(nextUser));
  }, []);

  useEffect(() => {
    api.health?.().then((h) => setPaymentProviderConfigured(Boolean(h?.paymentProviderConfigured))).catch(() => undefined);
  }, [api]);

  const refreshCustomerData = useCallback(async () => {
    try {
      const [addrRes, ordRes, notifRes] = await Promise.all([
        api.listAddresses().catch(() => ({ addresses: [] })),
        api.listOrders().catch(() => ({ orders: [] })),
        api.listNotifications ? api.listNotifications().catch(() => ({ notifications: [] })) : Promise.resolve({ notifications: [] }),
      ]);
      const list = addrRes.addresses || [];
      setAddresses(list);
      setSelectedAddressId((prev) => {
        if (prev && list.some((a) => a.id === prev)) return prev;
        return (list.find((a) => a.isDefault) || list[0] || null)?.id || null;
      });
      setOrders(ordRes.orders || []);
      setNotifications(notifRes.notifications || []);
    } catch {
      // Keep previous list if transient failure occurs.
    }
  }, [api]);

  // Verify stored token on startup
  useEffect(() => {
    let active = true;
    const stored = loadStoredSession();
    if (!stored?.token) {
      setAuthReady(true);
      return undefined;
    }
    api.me()
      .then((res) => {
        if (!active) return;
        const normalized = normalizeUser(res.user);
        setUserState(normalized);
        saveStoredSession({ ...stored, user: res.user });
        return refreshCustomerData();
      })
      .catch(() => {
        if (!active) return;
        clearStoredSession();
        setUserState(null);
      })
      .finally(() => {
        if (active) setAuthReady(true);
      });
    return () => { active = false; };
  }, [api, refreshCustomerData]);

  // Fetch nearby verified active pharmacies whenever location changes
  const refreshNearbyRetailers = useCallback(async (locationQuery) => {
    setRetailersLoading(true);
    setRetailersError(null);
    try {
      const res = await api.getNearbyRetailers(locationQuery);
      const list = res.retailers || [];
      setRetailers(list);
      setSelectedRetailerId((prev) => {
        if (prev && list.some((r) => r.id === prev)) return prev;
        return list[0]?.id || null;
      });
    } catch (err) {
      setRetailersError(err?.message || 'Unable to load nearby verified pharmacies.');
      setRetailers([]);
      setSelectedRetailerId(null);
    } finally {
      setRetailersLoading(false);
    }
  }, [api]);

  const selectedAddress = useMemo(
    () => addresses.find((a) => a.id === selectedAddressId) || null,
    [addresses, selectedAddressId],
  );

  const effectiveLocationQuery = useMemo(() => {
    if (selectedAddress?.latitude != null && selectedAddress?.longitude != null) {
      return { lat: selectedAddress.latitude, lng: selectedAddress.longitude };
    }
    if (coords?.lat != null && coords?.lng != null) {
      return { lat: coords.lat, lng: coords.lng };
    }
    return { locality };
  }, [selectedAddress, coords, locality]);

  useEffect(() => {
    void refreshNearbyRetailers(effectiveLocationQuery);
  }, [effectiveLocationQuery, refreshNearbyRetailers]);

  // Fetch store-scoped medicine catalogue when active store changes
  const refreshCatalog = useCallback(async () => {
    if (!selectedRetailerId) {
      setMedicines([]);
      return;
    }
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      const items = await api.getCatalogMedicines({ retailerId: selectedRetailerId, ...effectiveLocationQuery });
      setMedicines(items);
      setKnownMedicines((prev) => {
        const next = { ...prev };
        for (const item of items) {
          next[item.id] = item;
          for (const eq of item.equivalents || []) {
            if (!next[eq.id]) next[eq.id] = eq;
          }
        }
        return next;
      });
    } catch (err) {
      setCatalogError(err?.message || 'Unable to load store inventory.');
      setMedicines([]);
    } finally {
      setCatalogLoading(false);
    }
  }, [api, selectedRetailerId, effectiveLocationQuery]);

  useEffect(() => {
    void refreshCatalog();
  }, [refreshCatalog]);

  const setLocality = useCallback((place) => {
    setCoords(null);
    setLocationStatus('manual');
    setLocationError(null);
    setLocalityState(place);
  }, []);

  const requestGpsLocation = useCallback(async () => {
    setLocationStatus('requesting');
    setLocationError(null);
    try {
      const gps = await detectDeviceGps();
      setCoords(gps);
      setLocationStatus('gps');
      return gps;
    } catch (err) {
      setLocationStatus('denied');
      setLocationError(err?.message || 'Unable to read device GPS.');
      return null;
    }
  }, []);

  const selectRetailer = useCallback((retailerId, { resetCart = false } = {}) => {
    if (resetCart) {
      setCart({});
      setCartRetailerId(retailerId);
    }
    setSelectedRetailerId(retailerId);
  }, []);

  const setQty = useCallback((id, q, overrideRetailerId = null) => {
    const targetStore = overrideRetailerId || selectedRetailerId;
    setCart((prev) => {
      const n = { ...prev };
      if (q <= 0) delete n[id];
      else n[id] = q;
      if (Object.keys(n).length === 0) setCartRetailerId(null);
      else if (targetStore) setCartRetailerId(targetStore);
      return n;
    });
  }, [selectedRetailerId]);

  const clearCart = useCallback(() => {
    setCart({});
    setCartRetailerId(null);
  }, []);

  const lines = useMemo(() => {
    const byId = new Map(medicines.map((m) => [m.id, m]));
    return Object.entries(cart)
      .map(([id, qty]) => {
        const med = byId.get(id) || knownMedicines[id];
        return med ? { ...med, qty } : null;
      })
      .filter(Boolean);
  }, [cart, medicines, knownMedicines]);

  const count = useMemo(() => lines.reduce((s, l) => s + l.qty, 0), [lines]);
  const mrpTotalPaise = useMemo(() => lines.reduce((s, l) => s + (l.mrpPaise || 0) * l.qty, 0), [lines]);
  const subtotalPaise = useMemo(() => lines.reduce((s, l) => s + (l.finalUnitPricePaise || 0) * l.qty, 0), [lines]);
  const mrpTotal = Math.round(mrpTotalPaise / 100 * 100) / 100;
  const subtotal = Math.round(subtotalPaise / 100 * 100) / 100;

  const selectedRetailer = useMemo(
    () => retailers.find((r) => r.id === (cartRetailerId || selectedRetailerId)) || retailers[0] || null,
    [retailers, cartRetailerId, selectedRetailerId],
  );

  // Auth methods
  const loginWithFirebase = useCallback(async (idToken) => {
    const res = await api.loginWithFirebase(idToken);
    setUserState(normalizeUser(res.user));
    await refreshCustomerData();
    return res.user;
  }, [api, refreshCustomerData]);

  const loginWithPassword = useCallback(async ({ identifier, password }) => {
    const res = await api.login({ identifier, password });
    setUserState(normalizeUser(res.user));
    await refreshCustomerData();
    return res.user;
  }, [api, refreshCustomerData]);

  const registerAccount = useCallback(async ({ phone, fullName, email, password }) => {
    const res = await api.register({ phone, fullName, email, password });
    setUserState(normalizeUser(res.user));
    await refreshCustomerData();
    return res.user;
  }, [api, refreshCustomerData]);

  const requestOtp = useCallback(async ({ phone, purpose = 'login' }) => {
    return api.requestOtp({ phone, purpose });
  }, [api]);

  const verifyOtpCode = useCallback(async ({ phone, otp, purpose = 'login', fullName }) => {
    const res = await api.verifyOtp({ phone, otp, purpose, fullName });
    setUserState(normalizeUser(res.user));
    await refreshCustomerData();
    return res.user;
  }, [api, refreshCustomerData]);

  const recoverPassword = useCallback(async ({ phone, otp, newPassword }) => {
    return api.recoverPassword({ phone, otp, newPassword });
  }, [api]);

  const updateProfile = useCallback(async ({ fullName, email }) => {
    const res = await api.updateMe({ fullName, email });
    const normalized = normalizeUser(res.user);
    setUserState(normalized);
    const stored = loadStoredSession();
    if (stored?.token) saveStoredSession({ ...stored, user: res.user });
    return normalized;
  }, [api]);

  const logout = useCallback(async () => {
    await api.logout();
    setUserState(null);
    setAddresses([]);
    setSelectedAddressId(null);
    setOrders([]);
  }, [api]);

  // Addresses CRUD
  const saveAddress = useCallback(async (payload, existingId = null) => {
    const res = existingId
      ? await api.updateAddress(existingId, payload)
      : await api.createAddress({
        ...payload,
        latitude: payload.latitude ?? coords?.lat ?? null,
        longitude: payload.longitude ?? coords?.lng ?? null,
      });
    await refreshCustomerData();
    if (res?.id) setSelectedAddressId(res.id);
    return res;
  }, [api, coords, refreshCustomerData]);

  const removeAddress = useCallback(async (id) => {
    await api.deleteAddress(id);
    await refreshCustomerData();
  }, [api, refreshCustomerData]);

  // Prescriptions & Orders
  const attachPrescription = useCallback(async (input) => {
    if (loadStoredSession().token) {
      const saved = await api.uploadPrescription({
        source: input.source,
        mimeType: input.mimeType,
        fileName: input.file?.name || input.fileName || undefined,
      });
      setPrescription({ ...input, id: saved.id, status: saved.status });
      return saved;
    }
    const localDraft = await (services.uploadPrescription || services.attachPrescription)(input);
    setPrescription({ ...localDraft, draftOnly: true });
    return localDraft;
  }, [api, services]);

  const replaceOrderPrescription = useCallback(async (orderId, input) => {
    const updated = await attachPrescription(input);
    if (!orderId) return updated;
    return updated;
  }, [attachPrescription]);

  const fetchQuote = useCallback(async ({ fulfillmentMode, addressId, deliveryAddress, items }) => {
    const retailerId = cartRetailerId || selectedRetailerId;
    if (!retailerId || !items?.length || !loadStoredSession().token) return null;
    return api.quoteOrder({ retailerId, fulfillmentMode, addressId, deliveryAddress, items });
  }, [api, cartRetailerId, selectedRetailerId]);

  const placeOrder = useCallback(async ({
    retailerId: explicitRetailerId,
    fulfillmentMode,
    paymentMode = 'cash_on_delivery',
    addressId,
    deliveryAddress,
    prescriptionId,
    items,
    idempotencyKey,
  }) => {
    const retailerId = explicitRetailerId || cartRetailerId || selectedRetailerId;
    if (!retailerId) throw new Error('Select a nearby verified pharmacy before placing an order.');

    let resolvedRxId = prescriptionId || prescription?.id || null;
    if (prescription && (!resolvedRxId || !String(resolvedRxId).startsWith('rx-'))) {
      const savedRx = await api.uploadPrescription({
        source: prescription.source,
        mimeType: prescription.mimeType,
        fileName: prescription.file?.name || undefined,
      });
      resolvedRxId = savedRx.id;
    }

    const key = idempotencyKey || `ord-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const res = await api.createOrder(
      {
        retailerId,
        fulfillmentMode,
        paymentMode,
        addressId,
        deliveryAddress,
        prescriptionId: resolvedRxId,
        items,
      },
      key,
    );
    clearCart();
    setPrescription(null);
    const ordList = await api.listOrders().catch(() => ({ orders: [res.order] }));
    setOrders(ordList.orders || [res.order]);
    return res.order;
  }, [api, cartRetailerId, selectedRetailerId, prescription, clearCart]);

  const initiateRazorpayOrder = useCallback((orderId) => api.createRazorpayOrder(orderId), [api]);

  const verifyRazorpayPayment = useCallback(async (payload) => {
    const res = await api.verifyRazorpayPayment(payload);
    await refreshCustomerData();
    return res.order;
  }, [api, refreshCustomerData]);

  const retryOrderPayment = useCallback(async (orderId) => {
    const res = await api.retryPayment(orderId);
    await refreshCustomerData();
    return res.order;
  }, [api, refreshCustomerData]);

  const cancelCustomerOrder = useCallback(async (orderId, reason) => {
    const res = await api.cancelOrder(orderId, reason);
    await refreshCustomerData();
    return res.order;
  }, [api, refreshCustomerData]);

  const fetchOrderTracking = useCallback((orderId) => api.getOrderTracking(orderId), [api]);

  const markNotificationRead = useCallback(async (notifId) => {
    await api.markNotificationRead(notifId);
    setNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, readAt: new Date().toISOString() } : n)));
  }, [api]);

  const submitOrderReview = useCallback(async (orderId, payload) => {
    const res = await api.submitOrderReview(orderId, payload);
    if (res?.order) {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? res.order : o)));
    }
    return res;
  }, [api]);

  const submitOrderComplaint = useCallback(async (orderId, payload) => {
    const res = await api.submitOrderComplaint(orderId, payload);
    if (res?.order) {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? res.order : o)));
    }
    return res;
  }, [api]);

  const listOrders = useCallback(async () => {
    if (!loadStoredSession().token) return [];
    const [res, notifRes] = await Promise.all([
      api.listOrders(),
      api.listNotifications ? api.listNotifications().catch(() => ({ notifications: [] })) : Promise.resolve({ notifications: [] }),
    ]);
    setNotifications(notifRes.notifications || []);
    return res.orders || [];
  }, [api]);

  const placeLabBooking = useCallback(async (testId) => {
    const booking = await services.createLabBooking(testId);
    setLabBookings((prev) => [booking, ...prev]);
    return booking;
  }, [services]);

  const subscribeOrderStatus = useCallback((orderId, onStatusChange) => {
    if (typeof services?.subscribeOrderStatus === 'function') {
      return services.subscribeOrderStatus(orderId, (update) => {
        if (update?.status) {
          setOrders((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, status: update.status, updatedAt: update.updatedAt } : o))
          );
        }
        if (typeof onStatusChange === 'function') onStatusChange(update);
      });
    }
    return () => {};
  }, [services]);

  const value = {
    authReady,
    user,
    setUser,
    pendingPhone,
    setPendingPhone,
    loginWithFirebase,
    loginWithPassword,
    registerAccount,
    requestOtp,
    verifyOtpCode,
    recoverPassword,
    updateProfile,
    logout,
    cart,
    cartRetailerId,
    setQty,
    clearCart,
    prescription,
    setPrescription,
    orders,
    setOrders,
    labBookings,
    locality,
    setLocality,
    coords,
    locationStatus,
    locationError,
    requestGpsLocation,
    retailers,
    selectedRetailer,
    selectRetailer,
    retailersLoading,
    retailersError,
    refreshNearbyRetailers,
    medicines,
    catalogLoading,
    catalogError,
    refreshCatalog,
    addresses,
    selectedAddressId,
    setSelectedAddressId,
    saveAddress,
    removeAddress,
    lines,
    count,
    mrpTotal,
    subtotal,
    mrpTotalPaise,
    subtotalPaise,
    fetchQuote,
    placeOrder,
    initiateRazorpayOrder,
    verifyRazorpayPayment,
    retryOrderPayment,
    cancelCustomerOrder,
    fetchOrderTracking,
    markNotificationRead,
    submitOrderReview,
    submitOrderComplaint,
    paymentProviderConfigured,
    notifications,
    listOrders,
    attachPrescription,
    replaceOrderPrescription,
    placeLabBooking,
    subscribeOrderStatus,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useApp = () => useContext(Ctx);
