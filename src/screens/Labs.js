import React, { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { Badge, Btn, Card, H, T } from '../ui';
import { useApp } from '../store';
import { LAB_TESTS } from '../data';
import { BRAND, C } from '../theme';
import { Header } from './Catalog';

export function LabsScreen() {
  const { labBookings, placeLabBooking } = useApp();
  const [busyTestId, setBusyTestId] = useState(null);

  const bookTest = async (testId) => {
    setBusyTestId(testId);
    try {
      await placeLabBooking(testId);
    } catch (error) {
      Alert.alert('Booking request failed', error.message || 'Please try again.');
    } finally {
      setBusyTestId(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <View>
          <H>Book a lab test</H>
          <T style={{ fontSize: 12, marginTop: 4 }}>Select a test to create a booking request in the app.</T>
        </View>
        <Card style={{ backgroundColor: C.teal50 }}>
          <Text style={{ fontWeight: '700' }}>{BRAND.brand.disclaimers.demoMode}</Text>
          <T style={{ fontSize: 12, marginTop: 4 }}>{BRAND.brand.disclaimers.labBooking}</T>
        </Card>
        {LAB_TESTS.map((test) => (
          <Card key={test.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700' }}>{test.name}</Text>
              <T style={{ fontSize: 12 }}>{test.category} · {BRAND.brand.disclaimers.labCatalog}</T>
            </View>
            <Btn title={busyTestId === test.id ? 'Saving…' : 'Book'} icon="arrow-right" disabled={Boolean(busyTestId)} onPress={() => bookTest(test.id)} style={{ paddingHorizontal: 12 }} />
          </Card>
        ))}
        {labBookings.length > 0 && (
          <View style={{ gap: 10, marginTop: 8 }}>
            <H style={{ fontSize: 17 }}>{BRAND.brand.disclaimers.labRequestsTitle}</H>
            {labBookings.map((booking) => {
              const test = LAB_TESTS.find((item) => item.id === booking.testId);
              return (
                <Card key={booking.id}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ flex: 1, fontWeight: '700' }}>{test?.name || 'Lab test'}</Text>
                    <Badge text={BRAND.brand.disclaimers.labBookingStatus} tone="warn" />
                  </View>
                  <T style={{ fontSize: 12, marginTop: 4 }}>{BRAND.brand.disclaimers.labRequestStatus}</T>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
