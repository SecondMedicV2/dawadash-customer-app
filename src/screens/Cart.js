import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { BRAND, C } from '../theme';
import { Badge, Btn, Card, Footer, FulfillmentChoice, Icon, notify, SectionTitle, Stepper, T, Text, TextInput } from '../ui';
import { useApp } from '../store';
import { useRequireLogin } from '../useRequireLogin';
import { LOCALITIES } from '../data';
import { inrPaise } from '../apiClient';
import { Header } from './Catalog';

async function loadRazorpayScript() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('Online Razorpay checkout requires a browser environment.');
  }
  if (window.Razorpay) return window.Razorpay;
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Could not load Razorpay checkout SDK.'));
    document.head.appendChild(script);
  });
  return window.Razorpay;
}

async function openRazorpayWebCheckout(meta, user) {
  const RazorpayCtor = await loadRazorpayScript();
  return new Promise((resolve, reject) => {
    const rzp = new RazorpayCtor({
      key: meta.keyId,
      amount: meta.amountPaise,
      currency: meta.currency || 'INR',
      name: BRAND.brand.name,
      description: `Order ${meta.orderId}`,
      order_id: meta.razorpayOrderId,
      prefill: {
        name: user?.fullName || '',
        contact: user?.rawPhone || '',
        email: user?.email || '',
      },
      theme: { color: C.primary },
      handler: (response) => resolve(response),
      modal: { ondismiss: () => reject(new Error('Payment checkout was dismissed. Retry from My Orders.')) },
    });
    rzp.on('payment.failed', (resp) => {
      reject(new Error(resp?.error?.description || 'Payment failed at gateway. Retry from My Orders.'));
    });
    rzp.open();
  });
}

function Steps({ step }) {
  return (
    <Card style={{ paddingVertical: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={s.stepDot}><Text style={{ color: C.primaryDark, fontWeight: '800', fontSize: 12 }}>{step}</Text></View>
          <Text style={{ fontSize: 11, fontWeight: '700', color: C.text2, letterSpacing: 0.6 }}>STEP {step} OF 3</Text>
        </View>
        <Text style={{ fontSize: 11, color: C.muted }}>Server-validated quote</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
        <Text style={{ fontSize: 20, fontWeight: '700' }}>Prescription & Checkout</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Icon name="shield-check-outline" size={16} color={C.primaryDark} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: C.primaryDark }}>Verified pharmacy</Text>
        </View>
      </View>
      <View style={s.track}><View style={[s.trackFill, { width: `${(step / 3) * 100}%` }]} /></View>
    </Card>
  );
}

function Tile({ icon, title, sub, onPress }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [s.tile, pressed && { opacity: 0.85 }]}>
      <View style={s.tileIc}><Icon name={icon} size={20} color={C.primaryDark} /></View>
      <Text style={{ fontSize: 13, fontWeight: '700', textAlign: 'center' }}>{title}</Text>
      <Text style={{ fontSize: 11, color: C.muted, textAlign: 'center' }}>{sub}</Text>
    </Pressable>
  );
}

export function CartScreen({ navigation }) {
  const a = useApp();
  const [busy, setBusy] = useState(false);
  const [fulfillmentMode, setFulfillmentMode] = useState('store_delivery');
  const [paymentMode, setPaymentMode] = useState('cash_on_delivery');
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState('');
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newLabel, setNewLabel] = useState('Home');
  const [newLine, setNewLine] = useState('');
  const [newLocality, setNewLocality] = useState(a.locality || LOCALITIES[0]);
  const [newPincode, setNewPincode] = useState('226001');
  const [savingAddr, setSavingAddr] = useState(false);
  const requireLogin = useRequireLogin();

  const hasRx = a.lines.some((l) => l.prescriptionRequired);
  const itemsSignature = useMemo(
    () => JSON.stringify(a.lines.map((l) => `${l.id}:${l.qty}`)),
    [a.lines],
  );
  const idempotencyKey = useMemo(
    () => `ord-${a.selectedRetailer?.id || 'store'}-${fulfillmentMode}-${a.selectedAddressId || 'addr'}-${itemsSignature.length}-${Date.now()}`,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [a.selectedRetailer?.id, fulfillmentMode, a.selectedAddressId, itemsSignature],
  );

  // Re-validate quote with centralized backend whenever signed-in checkout details change
  useEffect(() => {
    let active = true;
    const readyForQuote = a.user && a.lines.length > 0 && a.selectedRetailer && (fulfillmentMode === 'counter_pickup' || a.selectedAddressId);
    if (!readyForQuote) {
      setQuote(null);
      setQuoteError('');
      return undefined;
    }
    setQuoteLoading(true);
    setQuoteError('');
    a.fetchQuote({
      fulfillmentMode,
      addressId: fulfillmentMode === 'store_delivery' ? a.selectedAddressId : undefined,
      items: a.lines.map(({ id, qty }) => ({ medicineId: id, quantity: qty })),
    })
      .then((res) => { if (active) setQuote(res); })
      .catch((err) => { if (active) { setQuote(null); setQuoteError(err?.message || 'Unable to compute server quote.'); } })
      .finally(() => { if (active) setQuoteLoading(false); });
    return () => { active = false; };
  }, [a.user, a.selectedRetailer, a.selectedAddressId, fulfillmentMode, itemsSignature, a.fetchQuote, a.lines]);

  const handleSaveNewAddress = async () => {
    if (newLine.trim().length < 4 || !/^\d{6}$/.test(newPincode.trim())) {
      notify('Incomplete address', 'Enter full address (min 4 chars) and a valid 6-digit pincode.');
      return;
    }
    setSavingAddr(true);
    try {
      await a.saveAddress({
        label: newLabel.trim() || 'Home',
        addressLine: newLine.trim(),
        locality: newLocality,
        city: 'Lucknow',
        pincode: newPincode.trim(),
        isDefault: a.addresses.length === 0,
      });
      setNewLine('');
      setShowAddAddress(false);
    } catch (err) {
      notify('Address error', err?.message || 'Could not save address.');
    } finally {
      setSavingAddr(false);
    }
  };

  const placeOrder = async () => {
    if (busy) return;
    if (!fulfillmentMode) {
      notify('Choose delivery or pickup', 'Select how you would like to receive your order.');
      return;
    }
    if (!requireLogin('Log in to place your order. Your cart is saved.')) return;
    if (fulfillmentMode === 'store_delivery' && !a.selectedAddressId) {
      notify('Delivery address required', 'Select or add a Lucknow delivery address first.');
      setShowAddAddress(true);
      return;
    }
    setBusy(true);
    try {
      const order = await a.placeOrder({
        fulfillmentMode,
        paymentMode,
        addressId: fulfillmentMode === 'store_delivery' ? a.selectedAddressId : undefined,
        items: a.lines.map(({ id, qty }) => ({ medicineId: id, quantity: qty })),
        prescriptionId: a.prescription?.id || null,
        idempotencyKey,
      });
      if (paymentMode === 'online_prepaid') {
        const rzpMeta = await a.initiateRazorpayOrder(order.id);
        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
          const rzpResult = await openRazorpayWebCheckout(rzpMeta, a.user);
          await a.verifyRazorpayPayment({
            orderId: order.id,
            razorpayOrderId: rzpResult.razorpay_order_id,
            razorpayPaymentId: rzpResult.razorpay_payment_id,
            razorpaySignature: rzpResult.razorpay_signature,
          });
        } else {
          // Native Android APK / iOS: Open secure Razorpay hosted checkout URL
          const checkoutUrl = `https://api.razorpay.com/v1/checkout/public?order_id=${encodeURIComponent(rzpMeta.razorpayOrderId)}&key_id=${encodeURIComponent(rzpMeta.keyId)}`;
          const canOpen = await Linking.canOpenURL(checkoutUrl).catch(() => false);
          if (canOpen) {
            await Linking.openURL(checkoutUrl);
          }
          notify('Payment Initiated', 'Complete payment in the opened browser or UPI app. Your order status will update upon gateway confirmation.');
        }
      }
      navigation.navigate('Orders');
    } catch (error) {
      notify('Order creation failed', error.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (!a.lines.length) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <Header />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 }}>
          <View style={s.emptyIc}><Icon name="cart-outline" size={40} color={C.primaryDark} /></View>
          <Text style={{ fontSize: 20, fontWeight: '700', marginTop: 14 }}>Your cart is empty</Text>
          <T style={{ textAlign: 'center', marginVertical: 8 }}>Add medicines from a verified pharmacy, or reorder from a past prescription.</T>
          <Btn title="Browse medicines" icon="magnify" onPress={() => navigation.navigate('Medicines')} style={{ alignSelf: 'stretch', marginTop: 8 }} />
          <Btn title="Past prescriptions" icon="history" variant="soft" onPress={() => navigation.navigate('Refills')} style={{ alignSelf: 'stretch', marginTop: 10 }} />
        </View>
      </View>
    );
  }

  const displayMrp = quote?.mrpTotalPaise ?? a.mrpTotalPaise;
  const displayDiscount = quote?.discountPaise ?? Math.max(0, a.mrpTotalPaise - a.subtotalPaise);
  const displayGst = quote?.gstPaise ?? null;
  const displayDelivery = quote?.deliveryFeePaise ?? 0;
  const displayTotal = quote?.totalPaise ?? a.subtotalPaise;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 24 }}>
        <Steps step={2} />

        {a.selectedRetailer && (
          <Card style={{ backgroundColor: C.teal50, borderColor: C.mint }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Icon name="check-decagram" size={22} color={C.primaryDark} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: C.primaryDark }}>{a.selectedRetailer.pharmacyName}</Text>
                <Text style={{ fontSize: 12, color: C.text2 }}>{a.selectedRetailer.address} · {a.selectedRetailer.locality}</Text>
              </View>
            </View>
          </Card>
        )}

        <Card>
          <SectionTitle icon="file-document-outline" title="Valid prescription"
            right={hasRx ? <Badge text="Needed for Rx items" tone="err" /> : <Badge text="Optional for OTC" tone="soft" />} />
          {a.prescription ? (
            <View style={s.rxBox}>
              <View style={s.rxThumb}><Icon name={a.prescription.source === 'pdf' ? 'file-pdf-box' : 'image-outline'} size={26} color={C.primaryDark} /></View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700' }} numberOfLines={1}>{a.prescription.source === 'pdf' ? 'Prescription PDF' : 'Prescription photo'}</Text>
                <Text style={{ color: C.primaryDark, fontSize: 12 }}>Attached for pharmacy review</Text>
              </View>
              <Pressable accessibilityLabel="Remove prescription" onPress={() => a.setPrescription(null)}><Icon name="close-circle" color={C.muted} /></Pressable>
            </View>
          ) : <Text style={{ marginBottom: 12, fontSize: 12, color: C.text2 }}>{BRAND.brand.disclaimers.cartPrescriptionHint}</Text>}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Tile icon="camera-outline" title="Take photo / scan" sub="Use your phone camera" onPress={() => navigation.navigate('Scanner')} />
            <Tile icon="file-upload-outline" title="Upload PDF" sub="PDF prescription" onPress={() => navigation.navigate('Scanner', { start: 'pdf' })} />
          </View>
        </Card>

        <Card>
          <SectionTitle icon="basket-outline" title={`Cart items (${a.count})`} right={<Badge text="Live store pricing" tone="ok" />} />
          <View style={{ gap: 10 }}>
            {a.lines.map((line) => (
              <View key={line.id} style={s.line}>
                <View style={s.lineIc}><Icon name={line.icon} size={20} color={C.primaryDark} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, color: C.muted, fontWeight: '700', letterSpacing: 0.3 }} numberOfLines={1}>{line.salt.toUpperCase()}</Text>
                  <Text style={{ fontWeight: '700', fontSize: 15 }}>{line.name}</Text>
                  <Text style={{ fontSize: 11, color: C.text2 }}>{line.pack} · GST {line.gstRatePercent}%</Text>
                  <View style={{ marginTop: 8, alignSelf: 'flex-start' }}><Stepper qty={line.qty} onChange={(n) => a.setQty(line.id, Math.min(n, line.stockQuantity || n))} /></View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontWeight: '800', fontSize: 16 }}>{inrPaise(line.finalUnitPricePaise * line.qty)}</Text>
                  <Text style={{ fontSize: 11, color: C.muted }}>{inrPaise(line.finalUnitPricePaise)} each</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={s.sum}>
            <Row label="Items MRP total" value={inrPaise(displayMrp)} />
            {displayDiscount > 0 && <Row label="Store discount" value={`−${inrPaise(displayDiscount)}`} tone={C.deep} />}
            {displayGst !== null && <Row label="Included GST" value={inrPaise(displayGst)} />}
            <Row label="Delivery fee" value={displayDelivery === 0 ? 'FREE' : inrPaise(displayDelivery)} tone={displayDelivery === 0 ? C.deep : undefined} />
            <View style={{ height: 1, backgroundColor: C.border, marginVertical: 8 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ fontSize: 17, fontWeight: '700' }}>{quote ? 'Verified payable total' : 'Estimated total'}</Text>
                {quoteLoading ? <ActivityIndicator size="small" color={C.primary} /> : null}
              </View>
              <Text style={{ fontSize: 22, fontWeight: '800', color: C.primaryDark }}>{inrPaise(displayTotal)}</Text>
            </View>
            {quoteError ? <Text style={{ fontSize: 12, color: C.errText, marginTop: 6 }}>{quoteError}</Text> : null}
          </View>
        </Card>

        <FulfillmentChoice value={fulfillmentMode} onChange={setFulfillmentMode} />

        {fulfillmentMode === 'store_delivery' && (
          <Card>
            <SectionTitle icon="map-marker-outline" title="Delivery address"
              right={a.user ? (
                <Pressable onPress={() => setShowAddAddress((v) => !v)}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: C.primaryDark }}>{showAddAddress ? 'Cancel' : '+ Add new'}</Text>
                </Pressable>
              ) : null}
            />
            {!a.user ? (
              <Text style={{ fontSize: 12, color: C.text2 }}>Log in to select or save a delivery address and lock a server-verified quote.</Text>
            ) : (
              <>
                {a.addresses.map((addr) => {
                  const selected = a.selectedAddressId === addr.id;
                  return (
                    <Pressable key={addr.id} onPress={() => a.setSelectedAddressId(addr.id)}
                      style={[s.addrCard, selected && s.addrCardOn]}>
                      <Icon name={selected ? 'radiobox-marked' : 'radiobox-blank'} size={18} color={selected ? C.primaryDark : C.muted} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700' }}>{addr.label} · {addr.locality}</Text>
                        <Text style={{ fontSize: 12, color: C.text2 }}>{addr.addressLine}, {addr.city} - {addr.pincode}</Text>
                      </View>
                    </Pressable>
                  );
                })}
                {!a.addresses.length && !showAddAddress && (
                  <Text style={{ fontSize: 12, color: C.warnText }}>No saved address yet. Tap "+ Add new" above.</Text>
                )}
                {showAddAddress && (
                  <View style={{ gap: 8, marginTop: 10, padding: 12, borderRadius: 14, backgroundColor: C.highlight }}>
                    <TextInput value={newLabel} onChangeText={setNewLabel} placeholder="Label (e.g. Home, Office)" style={s.addrInput} placeholderTextColor={C.muted} />
                    <TextInput value={newLine} onChangeText={setNewLine} placeholder="Flat / House No., Street / Landmark" style={s.addrInput} placeholderTextColor={C.muted} />
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                      {LOCALITIES.map((loc) => (
                        <Pressable key={loc} onPress={() => setNewLocality(loc)}
                          style={[s.locChip, newLocality === loc && { backgroundColor: C.primaryDark, borderColor: C.primaryDark }]}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: newLocality === loc ? C.white : C.text2 }}>{loc}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                    <TextInput value={newPincode} onChangeText={(t) => setNewPincode(t.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit pincode" keyboardType="number-pad" style={s.addrInput} placeholderTextColor={C.muted} />
                    <Btn small title={savingAddr ? 'Saving…' : 'Save address'} disabled={savingAddr} onPress={handleSaveNewAddress} />
                  </View>
                )}
              </>
            )}
          </Card>
        )}

        <Card>
          <SectionTitle icon="cash-multiple" title="Payment mode" />
          <Pressable onPress={() => setPaymentMode('cash_on_delivery')} style={[s.addrCard, paymentMode === 'cash_on_delivery' && s.addrCardOn]}>
            <Icon name={paymentMode === 'cash_on_delivery' ? 'radiobox-marked' : 'radiobox-blank'} size={18} color={paymentMode === 'cash_on_delivery' ? C.primaryDark : C.muted} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700' }}>Cash / UPI on Delivery</Text>
              <Text style={{ fontSize: 12, color: C.text2 }}>Creates a live verified order sent directly to the pharmacy panel.</Text>
            </View>
            <Badge text="ACTIVE" tone="ok" />
          </Pressable>
          <Pressable
            onPress={() => {
              if (!a.paymentProviderConfigured) {
                notify('Payment gateway unconfigured', 'Razorpay credentials are pending backend setup. Use Cash on Delivery for now.');
                return;
              }
              setPaymentMode('online_prepaid');
            }}
            style={[s.addrCard, paymentMode === 'online_prepaid' && s.addrCardOn, !a.paymentProviderConfigured && { opacity: 0.65 }, { marginTop: 8 }]}
          >
            <Icon name={!a.paymentProviderConfigured ? 'lock-outline' : paymentMode === 'online_prepaid' ? 'radiobox-marked' : 'radiobox-blank'} size={18} color={paymentMode === 'online_prepaid' ? C.primaryDark : C.muted} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: a.paymentProviderConfigured ? C.text : C.muted }}>Online Payment (Razorpay)</Text>
              <Text style={{ fontSize: 12, color: C.muted }}>
                {a.paymentProviderConfigured ? 'Direct payment: Settles straight into retailer account.' : 'Requires backend Razorpay key configuration.'}
              </Text>
            </View>
            <Badge text={a.paymentProviderConfigured ? 'READY' : 'SETUP REQ'} tone={a.paymentProviderConfigured ? 'mint' : 'soft'} />
          </Pressable>
        </Card>
      </ScrollView>

      <Footer>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <View>
            <Text style={{ fontSize: 10, color: C.muted, fontWeight: '700', letterSpacing: 0.6 }}>ORDER TOTAL</Text>
            <Text style={{ fontSize: 22, fontWeight: '800' }}>{inrPaise(displayTotal)}</Text>
          </View>
          <Badge text={`${paymentMode === 'online_prepaid' ? 'Prepaid' : 'COD'} · ${fulfillmentMode === 'store_delivery' ? 'Delivery' : 'Counter pickup'}`} tone="mint" />
        </View>
        <Btn
          title={busy ? 'Placing order…' : a.user ? 'Place order' : 'Log in to place order'}
          icon="arrow-right"
          disabled={busy || Boolean(quoteError)}
          onPress={placeOrder}
        />
      </Footer>
    </View>
  );
}

const Row = ({ label, value, tone }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
    <Text style={{ fontSize: 13, color: C.text2 }}>{label}</Text>
    <Text style={{ fontSize: 13, fontWeight: '700', color: tone || C.text }}>{value}</Text>
  </View>
);

const s = StyleSheet.create({
  stepDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' },
  track: { height: 6, borderRadius: 3, backgroundColor: C.input, marginTop: 12, overflow: 'hidden' },
  trackFill: { height: 6, borderRadius: 3, backgroundColor: C.primaryDark },
  rxBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.highlight, padding: 12, borderRadius: 14, marginBottom: 12 },
  rxThumb: { width: 44, height: 44, borderRadius: 10, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  tile: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 14, paddingHorizontal: 8, borderRadius: 14, backgroundColor: C.white, borderWidth: 1, borderColor: C.border },
  tileIc: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  line: { flexDirection: 'row', gap: 10, backgroundColor: C.highlight, padding: 12, borderRadius: 14 },
  lineIc: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  sum: { marginTop: 12, backgroundColor: C.well, borderRadius: 14, padding: 12 },
  emptyIc: { width: 88, height: 88, borderRadius: 44, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' },
  addrCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: C.border, marginBottom: 8 },
  addrCardOn: { backgroundColor: C.teal50, borderColor: C.primaryDark },
  addrInput: { backgroundColor: C.white, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, height: 42, fontSize: 13 },
  locChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: C.white, borderWidth: 1, borderColor: C.border },
});
