import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Badge, Btn, Card, Icon, notify, SectionTitle, Text } from '../ui';
import { useApp } from '../store';
import { useRequireLogin } from '../useRequireLogin';
import { LAB_TESTS } from '../data';
import { BRAND, C } from '../theme';
import { Header } from './Catalog';

const testIcons = { 'lab-cbc': 'water-outline', 'lab-glucose': 'diabetes', 'lab-lipid': 'heart-pulse', 'lab-thyroid': 'needle' };

export function LabsScreen() {
  const { labBookings, placeLabBooking } = useApp();
  const [busyTestId, setBusyTestId] = useState(null);
  const requireLogin = useRequireLogin();

  const bookTest = async (testId) => {
    if (!requireLogin('Log in to book a lab test.')) return;
    setBusyTestId(testId);
    try {
      await placeLabBooking(testId);
    } catch (error) {
      notify('Booking request failed', error.message || 'Please try again.');
    } finally {
      setBusyTestId(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <View>
          <Text style={{ fontSize: 24, fontWeight: '800' }}>Book a lab test</Text>
          <Text style={{ fontSize: 13, color: C.text2 }}>Select a test to create a booking request in the app.</Text>
        </View>
        <View style={s.notice}>
          <View style={s.noticeIc}><Icon name="flask-outline" size={22} color={C.white} /></View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: C.primaryDark }}>{BRAND.brand.disclaimers.demoMode}</Text>
            <Text style={{ fontSize: 12, color: C.text2, marginTop: 2 }}>{BRAND.brand.disclaimers.labBooking}</Text>
          </View>
        </View>

        <Card>
          <SectionTitle icon="test-tube" title={BRAND.brand.disclaimers.labCatalog} />
          <View style={{ gap: 10 }}>
            {LAB_TESTS.map((test) => (
              <View key={test.id} style={s.test}>
                <View style={s.testIc}><Icon name={testIcons[test.id] || 'flask-outline'} size={22} color={C.primaryDark} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700' }}>{test.name}</Text>
                  <Text style={{ fontSize: 12, color: C.text2 }}>{test.category}</Text>
                </View>
                <Btn small title={busyTestId === test.id ? 'Saving…' : 'Book'} icon="arrow-right" disabled={Boolean(busyTestId)} onPress={() => bookTest(test.id)} />
              </View>
            ))}
          </View>
        </Card>

        {labBookings.length > 0 && (
          <Card>
            <SectionTitle icon="calendar-check-outline" title={BRAND.brand.disclaimers.labRequestsTitle} right={<Badge text={String(labBookings.length)} tone="mint" />} />
            <View style={{ gap: 10 }}>
              {labBookings.map((booking) => {
                const test = LAB_TESTS.find((item) => item.id === booking.testId);
                return (
                  <View key={booking.id} style={s.booking}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <Text style={{ flex: 1, fontSize: 14, fontWeight: '700' }}>{test?.name || 'Lab test'}</Text>
                      <Badge text={BRAND.brand.disclaimers.labBookingStatus} tone="warn" icon="clock-outline" />
                    </View>
                    <Text style={{ fontSize: 12, color: C.text2, marginTop: 4 }}>{BRAND.brand.disclaimers.labRequestStatus}</Text>
                  </View>
                );
              })}
            </View>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  notice: { flexDirection: 'row', gap: 12, backgroundColor: C.teal50, borderRadius: 18, borderWidth: 1, borderColor: C.mint, padding: 16 },
  noticeIc: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.primaryDark, alignItems: 'center', justifyContent: 'center' },
  test: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.highlight, borderRadius: 14, padding: 12 },
  testIc: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  booking: { backgroundColor: C.highlight, borderRadius: 14, padding: 12 },
});
