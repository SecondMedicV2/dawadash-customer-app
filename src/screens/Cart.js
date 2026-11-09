import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { BRAND, C } from '../theme';
import { Badge, Btn, Card, Footer, FulfillmentChoice, H, Icon, T } from '../ui';
import { useApp } from '../store';
import { useRequireLogin } from '../useRequireLogin';
import { inr } from '../data';
import { Header } from './Catalog';

export function CartScreen({ navigation }) {
  const a = useApp();
  const [busy, setBusy] = useState(false);
  const [fulfillmentMode, setFulfillmentMode] = useState(null);

  const requireLogin = useRequireLogin();

  const placeOrder = async () => {
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
      Alert.alert('Order request failed', error.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (!a.lines.length) return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 }}>
        <Icon name="cart-outline" size={64} color={C.muted} />
        <H style={{ marginTop: 10 }}>Your cart is empty</H>
        <T style={{ textAlign: 'center', marginVertical: 8 }}>Add medicines from the catalog to place an order request.</T>
        <Btn title="Browse Medicines" onPress={() => navigation.navigate('Medicines')} style={{ alignSelf: 'stretch' }} />
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 24 }}>
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <H style={{ fontSize: 20 }}>Your cart</H>
            <Badge text={BRAND.brand.disclaimers.cartDemoCatalog} tone="teal" />
          </View>
          {a.lines.map((line) => (
            <View key={line.id} style={s.line}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, color: C.muted, fontWeight: '700' }}>{line.salt.toUpperCase()}</Text>
                <Text style={{ fontWeight: '700', fontSize: 15 }}>{line.name}</Text>
                <T style={{ fontSize: 12 }}>{line.pack} · {line.brand}</T>
                <Text style={{ fontWeight: '700', marginTop: 4 }}>{inr(line.price)} each</Text>
              </View>
              <View style={{ alignItems: 'center', gap: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Pressable onPress={() => a.setQty(line.id, line.qty - 1)} style={s.q}><Icon name="minus" size={16} /></Pressable>
                  <Text style={{ fontWeight: '700' }}>{line.qty}</Text>
                  <Pressable onPress={() => a.setQty(line.id, line.qty + 1)} style={s.q}><Icon name="plus" size={16} /></Pressable>
                </View>
                <Text style={{ fontWeight: '700' }}>{inr(line.price * line.qty)}</Text>
              </View>
            </View>
          ))}
          <View style={s.sum}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <T>{BRAND.brand.disclaimers.cartSubtotal}</T>
              <Text style={{ fontWeight: '700' }}>{inr(a.subtotal)}</Text>
            </View>
          </View>
        </Card>

        <FulfillmentChoice value={fulfillmentMode} onChange={setFulfillmentMode} />
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <H style={{ fontSize: 16 }}>Prescription</H>
            <Badge text={BRAND.brand.disclaimers.cartPrescriptionOptional} tone="warn" />
          </View>
          {a.prescription ? (
            <View style={s.rxBox}>
              <Icon name="file-document-outline" size={28} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700' }} numberOfLines={1}>{a.prescription.source === 'pdf' ? 'PDF' : 'Camera photo'}</Text>
                <Text style={{ color: C.warnText, fontSize: 12 }}>{BRAND.brand.disclaimers.prescriptionSelected}</Text>
              </View>
              <Pressable accessibilityLabel="Remove prescription" onPress={() => a.setPrescription(null)}><Icon name="close-circle" color={C.muted} /></Pressable>
            </View>
          ) : <T style={{ marginVertical: 10, fontSize: 12 }}>{BRAND.brand.disclaimers.cartPrescriptionHint}</T>}
          <Btn title="Upload prescription" icon="file-upload-outline" variant="secondary"
            disabled={busy} onPress={() => navigation.navigate('Scanner')} />
          <T style={{ fontSize: 11, marginTop: 10 }}>{BRAND.brand.disclaimers.prescriptionUpload}</T>
        </Card>

        <Card style={{ backgroundColor: C.teal50 }}>
          <H style={{ fontSize: 15 }}>{BRAND.brand.disclaimers.demoMode}</H>
          <T style={{ fontSize: 12, marginTop: 4 }}>{BRAND.brand.disclaimers.orderRequest}</T>
        </Card>
      </ScrollView>
      <Footer>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontSize: 12, color: C.muted }}>{BRAND.brand.disclaimers.cartSubtotalLabel}</Text>
          <Text style={{ fontSize: 20, fontWeight: '800' }}>{inr(a.subtotal)}</Text>
        </View>
        <Btn title={busy ? 'Saving request…' : a.user ? 'Place medicine order request' : 'Log in to place order'} icon="arrow-right" disabled={busy || !fulfillmentMode} onPress={placeOrder} />
      </Footer>
    </View>
  );
}

const s = StyleSheet.create({
  rxBox: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: C.well, borderRadius: 12, padding: 10, marginVertical: 10 },
  line: { flexDirection: 'row', gap: 10, backgroundColor: C.well, borderRadius: 12, padding: 12, marginTop: 10 },
  q: { width: 30, height: 30, borderRadius: 8, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  sum: { backgroundColor: C.well, borderRadius: 12, padding: 12, marginTop: 10 },
});
