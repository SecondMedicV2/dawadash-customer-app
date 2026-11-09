import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Btn, Card, confirmAction, Icon, SectionTitle, Text } from '../ui';
import { useApp } from '../store';
import { MEDICINES, inr } from '../data';
import { BRAND, C, shadow2 } from '../theme';

const initials = (name = '') => name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'ME';

function Stat({ icon, value, label }) {
  return (
    <View style={s.stat}>
      <View style={s.statIc}><Icon name={icon} size={20} color={C.primaryDark} /></View>
      <Text style={{ fontSize: 20, fontWeight: '800', marginTop: 8 }}>{value}</Text>
      <Text style={{ fontSize: 11, color: C.text2, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

function Row({ icon, title, sub, onPress, right }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [s.row, pressed && { backgroundColor: C.highlight }]}>
      <View style={s.rowIc}><Icon name={icon} size={22} color={C.primaryDark} /></View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '600' }}>{title}</Text>
        {sub ? <Text style={{ fontSize: 12, color: C.text2 }} numberOfLines={1}>{sub}</Text> : null}
      </View>
      {right}
      <Icon name="chevron-right" size={22} color={C.muted} />
    </Pressable>
  );
}

export function ProfileScreen({ navigation }) {
  const { user, orders, labBookings, locality, logout } = useApp();
  if (!user) return null;
  const saved = orders.reduce((sum, order) => sum + (order.items || []).reduce((acc, line) => {
    const m = MEDICINES.find((item) => item.id === line.medicineId);
    return acc + (m ? (m.mrp - m.price) * (line.quantity || 1) : 0);
  }, 0), 0);
  const goTab = (screen) => navigation.navigate('Main', { screen });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}>
      <View style={s.hero}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={s.avatar}><Text style={{ color: C.white, fontSize: 26, fontWeight: '800' }}>{initials(user.name)}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 22, fontWeight: '800' }}>{user.name}</Text>
            <View style={s.line}><Icon name="phone-outline" size={14} color={C.text2} /><Text style={{ fontSize: 13, color: C.text2 }}>{user.phone}</Text></View>
            {user.email ? <View style={s.line}><Icon name="email-outline" size={14} color={C.text2} /><Text style={{ fontSize: 13, color: C.text2 }} numberOfLines={1}>{user.email}</Text></View> : null}
          </View>
        </View>
        <Pressable accessibilityRole="button" onPress={() => goTab('Medicines')} style={s.area}>
          <Icon name="map-marker-outline" size={18} color={C.primaryDark} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 0.6 }}>DELIVERY AREA</Text>
            <Text style={{ fontSize: 14, fontWeight: '600' }}>{locality}, Lucknow</Text>
          </View>
          <Text style={{ fontSize: 12, fontWeight: '700', color: C.primaryDark }}>Change</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Stat icon="package-variant-closed" value={orders.length} label="Orders" />
        <Stat icon="flask-outline" value={labBookings.length} label="Lab bookings" />
        <Stat icon="piggy-bank-outline" value={inr(saved)} label="Saved vs MRP" />
      </View>

      <View>
        <SectionTitle icon="clipboard-list-outline" title="Orders & prescriptions" />
        <Card style={{ padding: 6 }}>
          <Row icon="clipboard-check-outline" title="Approvals & order status" sub={orders.length ? `${orders.length} order${orders.length > 1 ? 's' : ''} placed` : 'No orders yet'} onPress={() => goTab('Orders')} />
          <Row icon="history" title="Past prescriptions" sub="Request a refill from a saved prescription" onPress={() => navigation.navigate('Refills')} />
          <Row icon="line-scan" title="Upload a prescription" sub="Camera photo or PDF" onPress={() => navigation.navigate('Scanner')} />
          <Row icon="flask-outline" title="Lab bookings" sub={labBookings.length ? `${labBookings.length} booking request${labBookings.length > 1 ? 's' : ''}` : 'Book a diagnostic test'} onPress={() => goTab('Labs')} />
        </Card>
      </View>

      <Btn title={`Log out of ${BRAND.brand.name}`} icon="logout" variant="danger"
        onPress={() => confirmAction('Log out?', `Signed in as ${user.phone}.`, 'Log out', () => { logout(); navigation.popTo('Main'); })} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  hero: { backgroundColor: C.teal50, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: C.mint, ...shadow2 },
  avatar: { width: 72, height: 72, borderRadius: 20, backgroundColor: C.primaryDark, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: C.white },
  line: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  area: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.white, borderRadius: 14, padding: 12, marginTop: 16 },
  stat: { flex: 1, backgroundColor: C.white, borderRadius: 18, borderWidth: 1, borderColor: C.border, paddingVertical: 14, alignItems: 'center' },
  statIc: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14 },
  rowIc: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.highlight, alignItems: 'center', justifyContent: 'center' },
});
