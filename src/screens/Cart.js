import React, { useState } from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { BRAND, C } from '../theme';
import { Badge, Btn, Card, Footer, FulfillmentChoice, Icon, notify, SectionTitle, Stepper, T, Text } from '../ui';
import { useApp } from '../store';
import { useRequireLogin } from '../useRequireLogin';
import { inr } from '../data';
import { Header } from './Catalog';

function Steps({ step }) {
  return (
    <Card style={{ paddingVertical: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={s.stepDot}><Text style={{ color: C.primaryDark, fontWeight: '800', fontSize: 12 }}>{step}</Text></View>
          <Text style={{ fontSize: 11, fontWeight: '700', color: C.text2, letterSpacing: 0.6 }}>STEP {step} OF 3</Text>
        </View>
        <Text style={{ fontSize: 11, color: C.muted }}>Next: Pharmacist verification</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
        <Text style={{ fontSize: 20, fontWeight: '700' }}>Prescription & Order</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Icon name="shield-check-outline" size={16} color={C.primaryDark} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: C.primaryDark }}>Safe checkout</Text>
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
  const [fulfillmentMode, setFulfillmentMode] = useState(null);
  const requireLogin = useRequireLogin();
  const hasRx = a.lines.some((l) => l.type === 'Rx');
  const savings = a.mrpTotal - a.subtotal;

  const placeOrder = async () => {
    if (!fulfillmentMode) {
      notify('Choose delivery or pickup', 'Select how you would like to receive your order.');
      return;
    }
    if (!requireLogin('Log in to place your order. Your cart is saved.')) return;
    setBusy(true);
    try {
      await a.placeOrder({
        kind: 'medicine',
        fulfillmentMode,
        items: a.lines.map(({ id, qty }) => ({ medicineId: id, quantity: qty })),
        prescriptionId: a.prescription?.id || null,
      });
      navigation.navigate('Orders');
    } catch (error) {
      notify('Order request failed', error.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (!a.lines.length) return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 }}>
        <View style={s.emptyIc}><Icon name="cart-outline" size={40} color={C.primaryDark} /></View>
        <Text style={{ fontSize: 20, fontWeight: '700', marginTop: 14 }}>Your cart is empty</Text>
        <T style={{ textAlign: 'center', marginVertical: 8 }}>Add medicines from the catalog, or reorder from a past prescription.</T>
        <Btn title="Browse medicines" icon="magnify" onPress={() => navigation.navigate('Medicines')} style={{ alignSelf: 'stretch', marginTop: 8 }} />
        <Btn title="Past prescriptions" icon="history" variant="soft" onPress={() => navigation.navigate('Refills')} style={{ alignSelf: 'stretch', marginTop: 10 }} />
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 24 }}>
        <Steps step={2} />

        <View style={s.verify}>
          <View style={s.verifyIc}><Icon name="medical-bag" size={22} color={C.white} /></View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: C.primaryDark }}>Pharmacist verification</Text>
            <Text style={{ fontSize: 12, color: C.text2, marginTop: 2 }}>{BRAND.brand.disclaimers.prescriptionUpload}</Text>
          </View>
        </View>

        <Card>
          <SectionTitle icon="file-document-outline" title="Valid prescription"
            right={hasRx ? <Badge text="Needed for Rx items" tone="err" /> : <Badge text={BRAND.brand.disclaimers.cartPrescriptionOptional} tone="soft" />} />
          {a.prescription ? (
            <View style={s.rxBox}>
              <View style={s.rxThumb}><Icon name={a.prescription.source === 'pdf' ? 'file-pdf-box' : 'image-outline'} size={26} color={C.primaryDark} /></View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700' }} numberOfLines={1}>{a.prescription.source === 'pdf' ? 'Prescription PDF' : 'Prescription photo'}</Text>
                <Text style={{ color: C.primaryDark, fontSize: 12 }}>{BRAND.brand.disclaimers.prescriptionSelected}</Text>
              </View>
              <Pressable accessibilityLabel="Remove prescription" onPress={() => a.setPrescription(null)}><Icon name="close-circle" color={C.muted} /></Pressable>
            </View>
          ) : <Text style={{ marginBottom: 12, fontSize: 12, color: C.text2 }}>{BRAND.brand.disclaimers.cartPrescriptionHint}</Text>}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Tile icon="camera-outline" title="Take photo / scan" sub="Use your phone camera" onPress={() => navigation.navigate('Scanner')} />
            <Tile icon="file-upload-outline" title="Upload PDF" sub="PDF prescription" onPress={() => navigation.navigate('Scanner', { start: 'pdf' })} />
          </View>
          <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Refills')} style={s.pastRow}>
            <Icon name="history" size={20} color={C.primaryDark} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700' }}>Select past prescription</Text>
              <Text style={{ fontSize: 11, color: C.muted }}>Reorder from a saved prescription</Text>
            </View>
            <Icon name="chevron-right" size={20} color={C.muted} />
          </Pressable>
        </Card>

        <Card>
          <SectionTitle icon="basket-outline" title={`Cart items (${a.count})`} right={<Badge text={BRAND.brand.disclaimers.catalogBadge} tone="ok" />} />
          <View style={{ gap: 10 }}>
            {a.lines.map((line) => (
              <View key={line.id} style={s.line}>
                <View style={s.lineIc}><Icon name={line.icon} size={20} color={C.primaryDark} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, color: C.muted, fontWeight: '700', letterSpacing: 0.3 }} numberOfLines={1}>{line.salt.toUpperCase()}</Text>
                  <Text style={{ fontWeight: '700', fontSize: 15 }}>{line.name}</Text>
                  <Text style={{ fontSize: 11, color: C.text2 }}>{line.pack} · {line.brand}</Text>
                  <View style={{ marginTop: 8, alignSelf: 'flex-start' }}><Stepper qty={line.qty} onChange={(n) => a.setQty(line.id, n)} /></View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontWeight: '800', fontSize: 16 }}>{inr(line.price * line.qty)}</Text>
                  <Text style={{ fontSize: 11, color: C.muted }}>{inr(line.price)} each</Text>
                </View>
              </View>
            ))}
          </View>
          <View style={s.sum}>
            <Row label="Items MRP total" value={inr(a.mrpTotal)} />
            {savings > 0 && <Row label="Discount" value={`−${inr(savings)}`} tone={C.deep} />}
            <View style={{ height: 1, backgroundColor: C.border, marginVertical: 8 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '700' }}>{BRAND.brand.disclaimers.cartSubtotalLabel}</Text>
                {savings > 0 && <Text style={{ fontSize: 11, color: C.deep, fontWeight: '600' }}>You save {inr(savings)} on this order</Text>}
              </View>
              <Text style={{ fontSize: 22, fontWeight: '800', color: C.primaryDark }}>{inr(a.subtotal)}</Text>
            </View>
          </View>
        </Card>

        <FulfillmentChoice value={fulfillmentMode} onChange={setFulfillmentMode} />

        <Card style={{ backgroundColor: C.highlight }}>
          <Text style={{ fontSize: 14, fontWeight: '700' }}>{BRAND.brand.disclaimers.demoMode}</Text>
          <Text style={{ fontSize: 12, color: C.text2, marginTop: 4 }}>{BRAND.brand.disclaimers.orderRequest}</Text>
        </Card>
      </ScrollView>
      <Footer>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <View>
            <Text style={{ fontSize: 10, color: C.muted, fontWeight: '700', letterSpacing: 0.6 }}>ORDER TOTAL</Text>
            <Text style={{ fontSize: 22, fontWeight: '800' }}>{inr(a.subtotal)}</Text>
          </View>
          {fulfillmentMode ? <Badge text={fulfillmentMode === 'store_delivery' ? `Delivery · ${a.locality}` : 'Counter pickup'} tone="mint" /> : null}
        </View>
        <Btn title={busy ? 'Saving request…' : a.user ? 'Place order & submit for approval' : 'Log in to place order'}
          icon="arrow-right" disabled={busy} onPress={placeOrder} />
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
  verify: { flexDirection: 'row', gap: 12, backgroundColor: C.teal50, borderRadius: 18, borderWidth: 1, borderColor: C.mint, padding: 16 },
  verifyIc: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.primaryDark, alignItems: 'center', justifyContent: 'center' },
  rxBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.highlight, padding: 12, borderRadius: 14, marginBottom: 12 },
  rxThumb: { width: 44, height: 44, borderRadius: 10, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  tile: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 14, paddingHorizontal: 8, borderRadius: 14, backgroundColor: C.white, borderWidth: 1, borderColor: C.border },
  tileIc: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  pastRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, padding: 12, borderRadius: 14, backgroundColor: C.highlight },
  line: { flexDirection: 'row', gap: 10, backgroundColor: C.highlight, padding: 12, borderRadius: 14 },
  lineIc: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  sum: { marginTop: 12, backgroundColor: C.well, borderRadius: 14, padding: 12 },
  emptyIc: { width: 88, height: 88, borderRadius: 44, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' },
});
