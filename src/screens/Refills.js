import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Badge, Btn, Card, Footer, FulfillmentChoice, Icon, notify, Text } from '../ui';
import { useApp } from '../store';
import { useRequireLogin } from '../useRequireLogin';
import { MEDICINES, REFILL_PRESCRIPTIONS } from '../data';
import { BRAND, C } from '../theme';

export function RefillsScreen({ navigation }) {
  const { placeOrder } = useApp();
  const [busy, setBusy] = useState(false);
  const [fulfillmentMode, setFulfillmentMode] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const requireLogin = useRequireLogin();
  const selected = REFILL_PRESCRIPTIONS.find((p) => p.id === selectedId);

  const requestRefill = async () => {
    if (!selected) return;
    if (!fulfillmentMode) {
      notify('Choose delivery or pickup', 'Select how you would like to receive your refill.');
      return;
    }
    if (!requireLogin('Log in to request a refill.')) return;
    setBusy(true);
    try {
      await placeOrder({
        kind: 'refill',
        fulfillmentMode,
        prescriptionId: selected.id,
        items: selected.medicineIds.map((medicineId) => ({ medicineId, quantity: 1 })),
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

        {REFILL_PRESCRIPTIONS.map((prescription) => {
          const medicines = prescription.medicineIds.map((id) => MEDICINES.find((medicine) => medicine.id === id)).filter(Boolean);
          const on = prescription.id === selectedId;
          return (
            <Pressable key={prescription.id} accessibilityRole="radio" accessibilityState={{ checked: on }}
              onPress={() => setSelectedId(on ? null : prescription.id)} style={[s.card, on && s.cardOn]}>
              <View style={{ flexDirection: 'row', gap: 14 }}>
                <View style={s.thumb}><Icon name="file-document-outline" size={34} color={C.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Badge text={`${BRAND.brand.disclaimers.refillSampleLabel} • ${medicines.length} item${medicines.length > 1 ? 's' : ''}`} tone="ok" />
                  <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 6 }}>
                    {prescription.repeat ? BRAND.brand.disclaimers.refillRepeatPrescription : BRAND.brand.disclaimers.refillSamplePrescription}
                  </Text>
                  <Text style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{BRAND.brand.disclaimers.refillRecordDate}</Text>
                </View>
                <View style={[s.check, on && { backgroundColor: C.primaryDark, borderColor: C.primaryDark }]}>
                  {on ? <Icon name="check" size={18} color={C.white} /> : null}
                </View>
              </View>
              <View style={s.meds}>
                {medicines.map((medicine) => (
                  <View key={medicine.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Icon name="medical-bag" size={16} color={C.primaryDark} />
                    <Text style={{ flex: 1, fontSize: 13, fontWeight: '600' }}>{medicine.name}</Text>
                    <Text style={{ fontSize: 12, color: C.text2 }}>Qty 1</Text>
                  </View>
                ))}
              </View>
            </Pressable>
          );
        })}

        <FulfillmentChoice value={fulfillmentMode} onChange={setFulfillmentMode} title="How would you like the refill?" />
      </ScrollView>
      <Footer>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: C.muted }}>Selected prescription</Text>
            <Text style={{ fontSize: 18, fontWeight: '700' }}>{selected ? '1 prescription selected' : 'None selected'}</Text>
          </View>
          <Btn title={busy ? 'Saving…' : 'Request refill'} icon="arrow-right" disabled={busy || !selected} onPress={requestRefill} />
        </View>
      </Footer>
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
