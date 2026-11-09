import React, { useState } from 'react';
import { View, Pressable, FlatList, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRAND, C, shadow2 } from '../theme';
import { Badge, Card, confirmAction, Icon, Stepper, T, Text, TextInput } from '../ui';
import { useApp } from '../store';
import { MEDICINES, FILTERS, LOCALITIES, getSubstitutes, inr } from '../data';
import { ANDROID_APP_DOWNLOAD_PATH, isWebOutsideAndroidApp } from '../appShell';

const initials = (name = '') => name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'ME';

/** App header from the design: brand + 24x7 pill, delivery area, account button. */
export function Header() {
  const { user, locality } = useApp();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  return (
    <View style={[h.row, { paddingTop: Math.max(insets.top, 12) + 4 }]}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: C.primaryDark }}>{BRAND.brand.name}</Text>
          <View style={h.pill}><Text style={{ fontSize: 10, fontWeight: '800', color: C.deep }}>24x7</Text></View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <Icon name="map-marker-outline" size={14} color={C.text2} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: C.text2 }} numberOfLines={1}>{locality}, Lucknow</Text>
        </View>
      </View>
      {user ? (
        <Pressable accessibilityRole="button" accessibilityLabel="My profile"
          onPress={() => navigation.navigate('Profile')} style={h.avatar}>
          <Text style={{ color: C.white, fontWeight: '800', fontSize: 15 }}>{initials(user.name)}</Text>
        </Pressable>
      ) : (
        <Pressable accessibilityRole="button" accessibilityLabel="Log in" onPress={() => navigation.navigate('Login')} style={h.login}>
          <Icon name="account-circle-outline" size={18} color={C.primaryDark} />
          <Text style={{ fontWeight: '700', color: C.primaryDark, fontSize: 13 }}>Log in</Text>
        </Pressable>
      )}
    </View>
  );
}

const typeBadge = (m) => (m.type === 'Rx' ? ['err', 'Rx', 'prescription'] : m.type === 'OTC' ? ['ok', 'OTC Safe', null] : ['mint', m.type, null]);

function MedCard({ m }) {
  const { cart, setQty } = useApp();
  const [showAlternatives, setShowAlternatives] = useState(false);
  const q = cart[m.id] || 0;
  const substitutes = getSubstitutes(m);
  const [tone, label, badgeIcon] = typeBadge(m);
  const off = Math.round((1 - m.price / m.mrp) * 100);
  const pickAlternative = (candidate) => confirmAction(
    q ? 'Switch medicine?' : 'Add alternative?',
    q ? `Replace ${q} × ${m.name} with ${candidate.name}?` : `Add ${candidate.name} instead?`,
    q ? 'Switch' : 'Add',
    () => { setQty(candidate.id, (cart[candidate.id] || 0) + (q || 1)); if (q) setQty(m.id, 0); },
  );
  return (
    <Card style={{ marginBottom: 14, padding: 14 }}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={c.thumb}><Icon name={m.icon} size={30} color={C.primary} /></View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
            <Text style={{ flex: 1, fontSize: 10, fontWeight: '700', color: C.primary, letterSpacing: 0.4 }} numberOfLines={2}>
              {m.brand.toUpperCase()}<Text style={{ fontSize: 10, color: C.muted, fontWeight: '600' }}>  •  {m.pack}</Text>
            </Text>
            <Badge text={label} tone={tone} icon={badgeIcon} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 2 }}>{m.name}</Text>
          <Text style={{ fontSize: 12, color: C.text2, marginTop: 2 }}>Salt: {m.salt}</Text>
        </View>
      </View>
      <View style={c.note}>
        <Icon name="shield-check-outline" size={14} color={C.primaryDark} />
        <Text style={{ fontSize: 11, fontWeight: '600', color: C.text2, flex: 1 }}>
          {m.type === 'Rx' ? BRAND.brand.disclaimers.prescriptionCatalog : BRAND.brand.disclaimers.catalog}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 20, fontWeight: '800' }}>{inr(m.price)}</Text>
            <Text style={{ textDecorationLine: 'line-through', color: C.muted, fontSize: 12 }}>{inr(m.mrp)}</Text>
            <View style={c.off}><Text style={{ fontSize: 10, fontWeight: '800', color: C.deep }}>{off}% OFF</Text></View>
          </View>
          <Text style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{m.unit}</Text>
        </View>
        {q === 0 ? (
          <Pressable accessibilityRole="button" style={({ pressed }) => [c.add, pressed && { transform: [{ scale: 0.98 }] }]} onPress={() => setQty(m.id, 1)}>
            <Icon name="plus" color={C.white} size={18} />
            <Text style={{ color: C.white, fontWeight: '700' }}>Add to Order</Text>
          </Pressable>
        ) : (
          <Stepper qty={q} onChange={(n) => setQty(m.id, n)} />
        )}
      </View>
      {substitutes.length > 0 && (
        <View style={c.substitutes}>
          <Pressable accessibilityRole="button" onPress={() => setShowAlternatives((v) => !v)} style={c.altToggle}>
            <Icon name="swap-horizontal" size={16} color={C.primaryDark} />
            <Text style={{ flex: 1, fontSize: 12, fontWeight: '700', color: C.primaryDark }}>
              {substitutes.length} same-composition alternative{substitutes.length > 1 ? 's' : ''}
            </Text>
            <Icon name={showAlternatives ? 'chevron-up' : 'chevron-down'} size={18} color={C.primaryDark} />
          </Pressable>
          {showAlternatives && (
            <View style={{ gap: 6, marginTop: 6 }}>
              {substitutes.map((candidate) => (
                <Pressable key={candidate.id} accessibilityRole="button" onPress={() => pickAlternative(candidate)} style={c.substitute}>
                  <Text style={{ flex: 1, color: C.text, fontWeight: '600', fontSize: 13 }}>{q ? 'Switch to' : 'Use'} {candidate.name}</Text>
                  <Text style={{ fontWeight: '700', fontSize: 13 }}>{inr(candidate.price)}</Text>
                </Pressable>
              ))}
              <Text style={{ fontSize: 11, color: C.muted }}>{BRAND.brand.disclaimers.medicineAlternative}</Text>
            </View>
          )}
        </View>
      )}
    </Card>
  );
}

const filterIcons = ['view-grid', 'prescription', 'heart-pulse', 'pill'];

export function CatalogScreen({ navigation }) {
  const { count, subtotal, mrpTotal, locality, setLocality, lines, prescription } = useApp();
  const [q, setQ] = useState('');
  const [f, setF] = useState(0);
  const list = MEDICINES.filter((m) => {
    const t = (m.name + m.salt + m.brand).toLowerCase().includes(q.toLowerCase());
    const ff = f === 0 || (f === 1 && m.type === 'Rx') || (f === 2 && m.category === 'chronic') || (f === 3 && m.type !== 'Rx');
    return t && ff;
  });
  const needsRx = lines.some((l) => l.type === 'Rx') && !prescription;
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header />
      <FlatList data={list} keyExtractor={(m) => m.id} renderItem={({ item }) => <MedCard m={item} />}
        contentContainerStyle={{ padding: 16, paddingBottom: count > 0 ? 120 : 32 }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Icon name="map-marker-radius-outline" size={16} color={C.text2} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: C.text2 }}>Select Lucknow locality</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8 }} style={{ marginBottom: 14 }}>
              {LOCALITIES.map((place) => {
                const on = place === locality;
                return (
                  <Pressable key={place} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => setLocality(place)}
                    style={[c.locality, on && { backgroundColor: C.primaryDark, borderColor: C.primaryDark }]}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: on ? C.white : C.text2 }}>{place}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={c.delivery}>
              <View style={c.deliveryIc}><Icon name="lightning-bolt" size={22} color={C.primaryDark} /></View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: C.primaryDark }}>30–45 Mins Delivery</Text>
                  <Icon name="check-decagram-outline" size={16} color={C.primaryDark} />
                </View>
                <Text style={{ fontSize: 12, color: C.text2 }}>Dispensing from partner pharmacies near {locality}</Text>
              </View>
              <Icon name="moped-outline" size={24} color={C.text2} />
            </View>

            <View style={c.search}>
              <Icon name="magnify" color={C.primary} />
              <TextInput value={q} onChangeText={setQ} placeholder="Search medicines, salts or brands" placeholderTextColor={C.muted}
                style={{ flex: 1, fontSize: 14, outlineStyle: 'none', paddingVertical: 0 }} />
              {q ? <Pressable accessibilityLabel="Clear search" onPress={() => setQ('')}><Icon name="close-circle" color={C.muted} /></Pressable> : null}
              <Pressable accessibilityRole="button" accessibilityLabel="Upload prescription" onPress={() => navigation.navigate('Scanner')} style={c.scanBtn}>
                <Icon name="line-scan" size={20} color={C.primaryDark} />
              </Pressable>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8 }} style={{ marginTop: 14, marginBottom: 18 }}>
              {FILTERS.map((x, i) => (
                <Pressable key={x} onPress={() => setF(i)} style={[c.chip, f === i && { backgroundColor: C.primaryDark, borderColor: C.primaryDark }]}>
                  <Icon name={filterIcons[i]} size={16} color={f === i ? C.white : C.text2} />
                  <Text style={{ fontWeight: '700', fontSize: 13, color: f === i ? C.white : C.text2 }}>{x}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '700' }}>Available in Lucknow</Text>
              <Badge text={BRAND.brand.disclaimers.catalogBadge} tone="soft" />
            </View>
          </View>}
        ListEmptyComponent={<T style={{ textAlign: 'center', marginTop: 30 }}>No medicines match your search.</T>}
        ListFooterComponent={
          <View style={{ alignItems: 'center', marginTop: 4, marginBottom: 16 }}>
            <Text style={{ textAlign: 'center', fontSize: 12, color: C.muted }}>{BRAND.brand.disclaimers.catalog}</Text>
            {isWebOutsideAndroidApp() && (
              <Pressable accessibilityRole="link" onPress={() => { window.location.href = ANDROID_APP_DOWNLOAD_PATH; }} style={c.getApp}>
                <Icon name="android" size={18} color={C.primaryDark} />
                <Text style={{ fontWeight: '700', color: C.primaryDark, fontSize: 13 }}>Get the Android app</Text>
              </Pressable>
            )}
          </View>} />
      {count > 0 && (
        <Pressable accessibilityRole="button" style={c.bar} onPress={() => navigation.navigate('Cart')}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 }}>
            <View style={c.cartIc}>
              <Icon name="shopping-outline" color={C.white} />
              <View style={c.cartCount}><Text style={{ color: C.white, fontSize: 10, fontWeight: '800' }}>{count}</Text></View>
            </View>
            <View style={{ flexShrink: 1 }}>
              <Text style={{ color: C.white, fontWeight: '700', fontSize: 12 }}>{count} Item{count > 1 ? 's' : ''} in cart</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                <Text style={{ color: C.white, fontWeight: '800', fontSize: 18 }}>{inr(subtotal)}</Text>
                {mrpTotal > subtotal && <Text style={{ color: C.softMint, fontSize: 11, textDecorationLine: 'line-through' }}>{inr(mrpTotal)}</Text>}
              </View>
            </View>
          </View>
          <View style={c.go}>
            <Text style={{ color: C.white, fontWeight: '700', fontSize: 13 }}>{needsRx ? 'Upload Rx & Checkout' : 'Checkout'}</Text>
            <Icon name="arrow-right" size={18} color={C.white} />
          </View>
        </Pressable>
      )}
    </View>
  );
}

const h = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: C.white, borderBottomWidth: 1, borderColor: C.border },
  pill: { backgroundColor: C.mint, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.primaryDark, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.mint },
  login: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 999, backgroundColor: C.teal50, borderWidth: 1, borderColor: C.mint },
});
const c = StyleSheet.create({
  thumb: { width: 64, height: 64, borderRadius: 14, backgroundColor: C.teal50, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  note: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.highlight, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, marginTop: 12 },
  off: { backgroundColor: C.okBg, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  add: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.primaryDark, height: 44, paddingHorizontal: 16, borderRadius: 12 },
  substitutes: { borderTopWidth: 1, borderColor: C.border, marginTop: 12, paddingTop: 8 },
  altToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  substitute: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.teal50, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  locality: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: C.input, borderWidth: 1, borderColor: C.input },
  delivery: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.white, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 14, ...shadow2 },
  deliveryIc: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingLeft: 14, paddingRight: 6, height: 54 },
  scanBtn: { width: 42, height: 42, borderRadius: 10, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: C.white, borderWidth: 1, borderColor: C.border },
  bar: { position: 'absolute', left: 12, right: 12, bottom: 12, backgroundColor: C.text, borderRadius: 18, padding: 10, paddingLeft: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, ...shadow2 },
  cartIc: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.primaryDark, alignItems: 'center', justifyContent: 'center' },
  cartCount: { position: 'absolute', top: -6, left: -6, minWidth: 20, height: 20, borderRadius: 10, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.text, paddingHorizontal: 3 },
  go: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.primaryDark, paddingHorizontal: 14, height: 46, borderRadius: 12 },
  getApp: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingVertical: 8, paddingHorizontal: 12 },
});
