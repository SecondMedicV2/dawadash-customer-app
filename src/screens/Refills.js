import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Badge, Btn, Card, Footer, FulfillmentChoice, Icon, notify, T, Text } from '../ui';
import { useApp } from '../store';
import { useRequireLogin } from '../useRequireLogin';
import { BRAND, C } from '../theme';

export function RefillsScreen({ navigation }) {
  const { user, orders, listOrders, selectedAddressId, placeOrder } = useApp();
  const [busy, setBusy] = useState(false);
  const [fulfillmentMode, setFulfillmentMode] = useState('store_delivery');
  const [selectedId, setSelectedId] = useState(null);
  const requireLogin = useRequireLogin();

  useEffect(() => {
    if (user) {
      void listOrders().catch(() => undefined);
    }
  }, [user, listOrders]);

  const refillableOrders = (orders || []).filter((o) => Array.isArray(o.items) && o.items.length > 0);
  const selected = refillableOrders.find((o) => o.id === selectedId);

  const requestRefill = async () => {
    if (!selected) return;
    if (!fulfillmentMode) {
      notify('Choose delivery or pickup', 'Select how you would like to receive your refill.');
      return;
    }
    if (!requireLogin('Log in to request a refill.')) return;
    if (fulfillmentMode === 'store_delivery' && !selectedAddressId) {
      notify('Delivery address required', 'Add or select a saved Lucknow address in Cart & Rx first.');
      navigation.navigate('Main', { screen: 'Cart' });
      return;
    }
    setBusy(true);
    try {
      await placeOrder({
        retailerId: selected.retailer?.id,
        fulfillmentMode,
        addressId: fulfillmentMode === 'store_delivery' ? selectedAddressId : undefined,
        prescriptionId: selected.prescriptionId || null,
        items: selected.items.map((item) => ({ medicineId: item.medicineId, quantity: item.quantity || 1 })),
      });
      navigation.navigate('Main', { screen: 'Orders' });
    } catch (error) {
      notify('Refill request failed', error.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 24 }}>
        <Card style={{ backgroundColor: C.teal50, borderColor: C.mint }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="history" size={20} color={C.primaryDark} />
            <Text style={{ fontSize: 16, fontWeight: '700', color: C.primaryDark }}>{BRAND.brand.disclaimers.refillRecordsTitle}</Text>
          </View>
          <Text style={{ fontSize: 12, color: C.text2, marginTop: 4 }}>{BRAND.brand.disclaimers.refillRecords}</Text>
        </Card>

        {!user ? (
          <Card style={{ alignItems: 'center', padding: 24, gap: 10 }}>
            <Icon name="account-lock-outline" size={36} color={C.primaryDark} />
            <Text style={{ fontSize: 16, fontWeight: '700' }}>Sign in to view past prescriptions</Text>
            <T style={{ textAlign: 'center' }}>Your past pharmacy orders and approved prescriptions appear here for one-tap refills.</T>
            <Btn title="Log in" icon="login" onPress={() => navigation.navigate('Login')} />
          </Card>
        ) : refillableOrders.length === 0 ? (
          <Card style={{ alignItems: 'center', padding: 24, gap: 10 }}>
            <Icon name="clipboard-text-clock-outline" size={36} color={C.primaryDark} />
            <Text style={{ fontSize: 16, fontWeight: '700' }}>No past orders to refill yet</Text>
            <T style={{ textAlign: 'center' }}>Once you place an order with a verified pharmacy, it will be saved here for easy repeat ordering.</T>
            <Btn title="Browse medicines" icon="magnify" onPress={() => navigation.navigate('Main', { screen: 'Medicines' })} />
          </Card>
        ) : (
          <>
            {refillableOrders.map((order) => {
              const on = order.id === selectedId;
              const dateLabel = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : BRAND.brand.disclaimers.refillRecordDate;
              return (
                <Pressable key={order.id} accessibilityRole="radio" accessibilityState={{ checked: on }}
                  onPress={() => setSelectedId(on ? null : order.id)} style={[s.card, on && s.cardOn]}>
                  <View style={{ flexDirection: 'row', gap: 14 }}>
                    <View style={s.thumb}><Icon name="file-document-outline" size={34} color={C.primary} /></View>
                    <View style={{ flex: 1 }}>
                      <Badge text={`${BRAND.brand.disclaimers.refillSampleLabel} • ${order.items.length} item${order.items.length > 1 ? 's' : ''}`} tone="ok" />
                      <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 6 }}>
                        {order.prescriptionRequired ? BRAND.brand.disclaimers.refillRepeatPrescription : BRAND.brand.disclaimers.refillSamplePrescription}
                      </Text>
                      <Text style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                        {order.orderNumber} · {order.retailer?.pharmacyName || 'Verified pharmacy'} · {dateLabel}
                      </Text>
                    </View>
                    <View style={[s.check, on && { backgroundColor: C.primaryDark, borderColor: C.primaryDark }]}>
                      {on ? <Icon name="check" size={18} color={C.white} /> : null}
                    </View>
                  </View>
                  <View style={s.meds}>
                    {order.items.map((item) => (
                      <View key={item.id || item.medicineId} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Icon name="medical-bag" size={16} color={C.primaryDark} />
                        <Text style={{ flex: 1, fontSize: 13, fontWeight: '600' }}>{item.medicineName}</Text>
                        <Text style={{ fontSize: 12, color: C.text2 }}>Qty {item.quantity}</Text>
                      </View>
                    ))}
                  </View>
                </Pressable>
              );
            })}

            <FulfillmentChoice value={fulfillmentMode} onChange={setFulfillmentMode} title="How would you like the refill?" />
          </>
        )}
      </ScrollView>
      {refillableOrders.length > 0 && (
        <Footer>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: C.muted }}>Selected order</Text>
              <Text style={{ fontSize: 18, fontWeight: '700' }}>{selected ? selected.orderNumber : 'None selected'}</Text>
            </View>
            <Btn title={busy ? 'Saving…' : 'Request refill'} icon="arrow-right" disabled={busy || !selected} onPress={requestRefill} />
          </View>
        </Footer>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: C.white, borderRadius: 20, padding: 16, borderWidth: 1.5, borderColor: C.border },
  cardOn: { borderColor: C.primary, backgroundColor: C.teal50 },
  thumb: { width: 72, height: 88, borderRadius: 10, backgroundColor: C.well, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  check: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  meds: { gap: 8, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderColor: C.border },
});
