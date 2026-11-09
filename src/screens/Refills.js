import React, { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { Badge, Btn, Card, FulfillmentChoice, H, Icon, T } from '../ui';
import { useApp } from '../store';
import { useRequireLogin } from '../useRequireLogin';
import { MEDICINES, REFILL_PRESCRIPTIONS } from '../data';
import { BRAND, C } from '../theme';
import { Header } from './Catalog';

export function RefillsScreen({ navigation }) {
  const { placeOrder } = useApp();
  const [busy, setBusy] = useState(false);
  const [fulfillmentMode, setFulfillmentMode] = useState(null);

  const requireLogin = useRequireLogin();

  const requestRefill = async (prescription) => {
    if (!requireLogin('Log in to request a refill.')) return;
    setBusy(true);
    try {
      await placeOrder({
        kind: 'refill',
        fulfillmentMode,
        prescriptionId: prescription.id,
        items: prescription.medicineIds.map((medicineId) => ({ medicineId, quantity: 1 })),
      });
      navigation.navigate('Orders');
    } catch (error) {
      Alert.alert('Refill request failed', error.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <View>
          <H>Prescription refills</H>
          <T style={{ fontSize: 12, marginTop: 4 }}>Choose a saved prescription to create a refill order request.</T>
        </View>
        <Card style={{ backgroundColor: C.teal50 }}>
          <Text style={{ fontWeight: '700' }}>{BRAND.brand.disclaimers.refillRecordsTitle}</Text>
          <T style={{ fontSize: 12, marginTop: 4 }}>{BRAND.brand.disclaimers.refillRecords}</T>
        </Card>
        <FulfillmentChoice value={fulfillmentMode} onChange={setFulfillmentMode} />
        {REFILL_PRESCRIPTIONS.map((prescription) => {
          const medicines = prescription.medicineIds.map((id) => MEDICINES.find((medicine) => medicine.id === id)).filter(Boolean);
          return (
            <Card key={prescription.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Icon name="file-document-outline" size={26} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700' }}>
                    {prescription.repeat ? BRAND.brand.disclaimers.refillRepeatPrescription : BRAND.brand.disclaimers.refillSamplePrescription}
                  </Text>
                  <T style={{ fontSize: 12 }}>{BRAND.brand.disclaimers.refillRecordDate}</T>
                </View>
                <Badge text={BRAND.brand.disclaimers.refillSampleLabel} tone="warn" />
              </View>
              {medicines.map((medicine) => (
                <View key={medicine.id} style={{ marginTop: 12, padding: 10, borderRadius: 10, backgroundColor: C.well }}>
                  <Text style={{ fontWeight: '700' }}>{medicine.name}</Text>
                  <T style={{ fontSize: 12 }}>{medicine.salt} · quantity 1</T>
                </View>
              ))}
              <Btn title={busy ? 'Saving request…' : 'Request refill'} icon="autorenew" disabled={busy || !fulfillmentMode || medicines.length === 0} onPress={() => requestRefill(prescription)} style={{ marginTop: 12 }} />
            </Card>
          );
        })}
      </ScrollView>
    </View>
  );
}
