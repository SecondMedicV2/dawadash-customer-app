import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Badge, Btn, Card, confirmAction, Icon, notify, SectionTitle, Text, TextInput } from '../ui';
import { useApp } from '../store';
import { LOCALITIES } from '../data';
import { inrPaise } from '../apiClient';
import { BRAND, C, shadow2 } from '../theme';

const initials = (name = '') => name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'ME';

function Stat({ icon, value, label }) {
  return (
    <View style={s.stat}>
      <View style={s.statIc}><Icon name={icon} size={20} color={C.primaryDark} /></View>
      <Text style={{ fontSize: 18, fontWeight: '800', marginTop: 8 }}>{value}</Text>
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
  const { user, orders, labBookings, locality, coords, requestGpsLocation, addresses, updateProfile, saveAddress, removeAddress, logout } = useApp();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [addingAddr, setAddingAddr] = useState(false);
  const [addrLabel, setAddrLabel] = useState('Home');
  const [addrLine, setAddrLine] = useState('');
  const [addrLocality, setAddrLocality] = useState(locality || LOCALITIES[0]);
  const [addrPincode, setAddrPincode] = useState('226001');
  const [pinnedCoords, setPinnedCoords] = useState(null);
  const [savingAddr, setSavingAddr] = useState(false);

  if (!user) return null;

  const savedPaise = orders.reduce((sum, order) => sum + Number(order.discountPaise || 0), 0);
  const goTab = (screen) => navigation.navigate('Main', { screen });

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await updateProfile({ fullName: fullName.trim(), email: email.trim() || null });
      setEditing(false);
    } catch (err) {
      notify('Update failed', err?.message || 'Could not update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePinLocation = async () => {
    try {
      const gps = await requestGpsLocation();
      if (gps) {
        setPinnedCoords(gps);
        notify('Map Pin Set', `Pinned to GPS: ${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}`);
      }
    } catch (err) {
      notify('Location Error', err?.message || 'Could not fetch device location.');
    }
  };

  const handleCreateAddress = async () => {
    setSavingAddr(true);
    try {
      await saveAddress({
        label: addrLabel.trim() || 'Home',
        addressLine: addrLine.trim(),
        locality: addrLocality,
        city: 'Lucknow',
        pincode: addrPincode.trim(),
        latitude: pinnedCoords?.lat || coords?.lat || null,
        longitude: pinnedCoords?.lng || coords?.lng || null,
        isDefault: addresses.length === 0,
      });
      setAddrLine('');
      setPinnedCoords(null);
      setAddingAddr(false);
    } catch (err) {
      notify('Address failed', err?.message || 'Check address fields and 6-digit pincode.');
    } finally {
      setSavingAddr(false);
    }
  };

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
          <Pressable onPress={() => { setFullName(user.fullName || user.name); setEmail(user.email || ''); setEditing((v) => !v); }}>
            <Icon name={editing ? 'close' : 'pencil-outline'} size={20} color={C.primaryDark} />
          </Pressable>
        </View>

        {editing && (
          <View style={{ gap: 8, marginTop: 14, backgroundColor: C.white, padding: 12, borderRadius: 14 }}>
            <TextInput value={fullName} onChangeText={setFullName} placeholder="Full name" style={s.inp} placeholderTextColor={C.muted} />
            <TextInput value={email} onChangeText={setEmail} placeholder="Email (optional)" keyboardType="email-address" autoCapitalize="none" style={s.inp} placeholderTextColor={C.muted} />
            <Btn small title={savingProfile ? 'Saving…' : 'Save profile'} disabled={savingProfile} onPress={handleSaveProfile} />
          </View>
        )}

        <Pressable accessibilityRole="button" onPress={() => goTab('Medicines')} style={s.area}>
          <Icon name="map-marker-outline" size={18} color={C.primaryDark} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 0.6 }}>DISCOVERY AREA</Text>
            <Text style={{ fontSize: 14, fontWeight: '600' }}>{locality}, Lucknow</Text>
          </View>
          <Text style={{ fontSize: 12, fontWeight: '700', color: C.primaryDark }}>Change</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Stat icon="package-variant-closed" value={orders.length} label="Orders" />
        <Stat icon="flask-outline" value={labBookings.length} label="Lab bookings" />
        <Stat icon="piggy-bank-outline" value={inrPaise(savedPaise)} label="Discounts" />
      </View>

      <View>
        <SectionTitle icon="map-marker-multiple-outline" title={`Saved delivery addresses (${addresses.length})`}
          right={
            <Pressable onPress={() => setAddingAddr((v) => !v)}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.primaryDark }}>{addingAddr ? 'Cancel' : '+ Add address'}</Text>
            </Pressable>
          }
        />
        <Card style={{ gap: 10 }}>
          {addingAddr && (
            <View style={{ gap: 8, paddingBottom: 10, borderBottomWidth: 1, borderColor: C.border }}>
              <TextInput value={addrLabel} onChangeText={setAddrLabel} placeholder="Label (Home / Office)" style={s.inp} placeholderTextColor={C.muted} />
              <TextInput value={addrLine} onChangeText={setAddrLine} placeholder="Full street address" style={s.inp} placeholderTextColor={C.muted} />
              <Pressable
                onPress={handlePinLocation}
                style={[s.locChip, { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginVertical: 2, backgroundColor: pinnedCoords ? C.primaryBg : C.card }]}
              >
                <Icon name={pinnedCoords ? 'crosshairs-gps' : 'map-marker-radius-outline'} size={14} color={C.primaryDark} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: C.primaryDark }}>
                  {pinnedCoords ? `📍 Pinned (${pinnedCoords.lat.toFixed(4)}, ${pinnedCoords.lng.toFixed(4)})` : '📍 Pin delivery location (GPS)'}
                </Text>
              </Pressable>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {LOCALITIES.map((loc) => (
                  <Pressable key={loc} onPress={() => setAddrLocality(loc)}
                    style={[s.locChip, addrLocality === loc && { backgroundColor: C.primaryDark, borderColor: C.primaryDark }]}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: addrLocality === loc ? C.white : C.text2 }}>{loc}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <TextInput value={addrPincode} onChangeText={(t) => setAddrPincode(t.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit pincode" keyboardType="number-pad" style={s.inp} placeholderTextColor={C.muted} />
              <Btn small title={savingAddr ? 'Saving…' : 'Save address'} disabled={savingAddr} onPress={handleCreateAddress} />
            </View>
          )}
          {addresses.map((addr) => (
            <View key={addr.id} style={s.addrItem}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700' }}>{addr.label}</Text>
                  {addr.isDefault ? <Badge text="Default" tone="ok" /> : null}
                </View>
                <Text style={{ fontSize: 12, color: C.text2, marginTop: 2 }}>{addr.addressLine}, {addr.locality} - {addr.pincode}</Text>
              </View>
              {!addr.isDefault && (
                <Pressable onPress={() => saveAddress({ isDefault: true }, addr.id)} style={{ padding: 6 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: C.primaryDark }}>Make default</Text>
                </Pressable>
              )}
              <Pressable accessibilityLabel={`Delete ${addr.label}`} onPress={() => removeAddress(addr.id)} style={{ padding: 6 }}>
                <Icon name="delete-outline" size={18} color={C.errText} />
              </Pressable>
            </View>
          ))}
          {!addresses.length && !addingAddr && (
            <Text style={{ fontSize: 12, color: C.muted }}>No delivery addresses saved yet.</Text>
          )}
        </Card>
      </View>

      <View>
        <SectionTitle icon="clipboard-list-outline" title="Orders & prescriptions" />
        <Card style={{ padding: 6 }}>
          <Row icon="clipboard-check-outline" title="My orders & status" sub={orders.length ? `${orders.length} order${orders.length > 1 ? 's' : ''} placed` : 'No orders yet'} onPress={() => goTab('Orders')} />
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
  inp: { backgroundColor: C.highlight, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, height: 42, fontSize: 13 },
  locChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: C.white, borderWidth: 1, borderColor: C.border },
  addrItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderBottomWidth: 1, borderColor: C.well },
});
