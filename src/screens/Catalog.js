import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList, ScrollView, StyleSheet, Alert } from 'react-native';
import { BRAND, C } from '../theme';
import { Badge, Card, Icon, T } from '../ui';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../store';
import { MEDICINES, FILTERS, getSubstitutes, inr } from '../data';
import { ANDROID_APP_DOWNLOAD_PATH, isWebOutsideAndroidApp } from '../appShell';

export function Header() {
  const { user, logout } = useApp();
  const navigation = useNavigation();
  return (
    <View style={h.row}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: C.primaryDark }}>{BRAND.brand.name}</Text>
        </View>
        <Text style={{ fontSize: 12, color: C.text2 }}>
          {user ? `Signed in · ${user.phone}` : 'Medicines, refills & lab tests'}
        </Text>
      </View>
      {user ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Log out" onPress={logout} style={h.account}>
          <Icon name="logout" size={18} color={C.primaryDark} />
          <Text style={h.accountText}>Log out</Text>
        </Pressable>
      ) : (
        <Pressable accessibilityRole="button" accessibilityLabel="Log in" onPress={() => navigation.navigate('Login')} style={h.account}>
          <Icon name="account-circle-outline" size={18} color={C.primaryDark} />
          <Text style={h.accountText}>Log in</Text>
        </Pressable>
      )}
    </View>
  );
}

function MedCard({ m }) {
  const { cart, setQty } = useApp();
  const q = cart[m.id] || 0;
  const substitutes = getSubstitutes(m);
  const tone = m.type === 'Rx' ? ['err', 'Rx'] : m.type === 'OTC' ? ['ok', 'OTC Safe'] : ['ok', m.type];
  return (
    <Card style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={c.thumb}><Icon name={m.icon} size={30} color={C.primary} /></View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: C.primary, flex: 1 }}>{m.brand.toUpperCase()} • {m.pack}</Text>
            <Badge text={tone[1]} tone={tone[0]} />
          </View>
          <Text style={{ fontSize: 17, fontWeight: '700', color: C.text, marginTop: 2 }}>{m.name}</Text>
          <T style={{ fontSize: 12 }}>Salt: {m.salt}</T>
        </View>
      </View>
      <View style={c.note}>
        <Icon name="shield-check-outline" size={14} />
        <Text style={{ fontSize: 12, color: C.text2, flex: 1 }}>{m.type === 'Rx' ? BRAND.brand.disclaimers.prescriptionCatalog : BRAND.brand.disclaimers.catalog}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: C.text }}>{inr(m.price)}</Text>
            <Text style={{ textDecorationLine: 'line-through', color: C.muted, fontSize: 12 }}>{inr(m.mrp)}</Text>
            <Badge text={Math.round((1 - m.price / m.mrp) * 100) + '% OFF'} tone="ok" />
          </View>
          <T style={{ fontSize: 11, color: C.muted }}>{m.unit}</T>
        </View>
        {q === 0 ? (
          <Pressable style={c.add} onPress={() => setQty(m.id, 1)}><Icon name="plus" color={C.white} size={18} /><Text style={{ color: C.white, fontWeight: '700' }}>Add to Order</Text></Pressable>
        ) : (
          <View style={c.step}>
            <Pressable style={c.stepB} onPress={() => setQty(m.id, q - 1)}><Icon name="minus" size={18} /></Pressable>
            <Text style={{ fontWeight: '700', width: 28, textAlign: 'center', fontSize: 16 }}>{q}</Text>
            <Pressable style={[c.stepB, { backgroundColor: C.primaryDark }]} onPress={() => setQty(m.id, q + 1)}><Icon name="plus" size={18} color={C.white} /></Pressable>
          </View>
        )}
      </View>
      {substitutes.length > 0 && (
        <View style={c.substitutes}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: C.text }}>Same-composition alternatives</Text>
          {substitutes.map((candidate) => (
            <Pressable key={candidate.id} onPress={() => Alert.alert(
              q ? 'Switch medicine?' : 'Add alternative?',
              q ? `Replace ${q} ${m.name} with ${candidate.name}?` : `Add ${candidate.name} instead?`,
              [
                { text: 'Keep current', style: 'cancel' },
                { text: q ? 'Switch' : 'Add', onPress: () => { setQty(candidate.id, (cart[candidate.id] || 0) + (q || 1)); if (q) setQty(m.id, 0); } },
              ],
            )} style={c.substitute}>
              <Text style={{ flex: 1, color: C.primaryDark, fontWeight: '600' }}>{q ? 'Switch to' : 'Use'} {candidate.name}</Text>
              <Text style={{ color: C.text, fontWeight: '700' }}>{inr(candidate.price)}</Text>
            </Pressable>
          ))}
          <T style={{ fontSize: 11 }}>{BRAND.brand.disclaimers.medicineAlternative}</T>
        </View>
      )}
    </Card>
  );
}

export function CatalogScreen({ navigation }) {
  const { count, subtotal } = useApp();
  const [q, setQ] = useState('');
  const [f, setF] = useState(0);
  const list = MEDICINES.filter((m) => {
    const t = (m.name + m.salt + m.brand).toLowerCase().includes(q.toLowerCase());
    const ff = f === 0 || (f === 1 && m.type === 'Rx') || (f === 2 && m.category === 'chronic') || (f === 3 && m.type !== 'Rx');
    return t && ff;
  });
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header navigation={navigation} />
      <FlatList data={list} keyExtractor={(m) => m.id} renderItem={({ item }) => <MedCard m={item} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListHeaderComponent={
          <View>
            <View style={c.search}>
              <Icon name="magnify" color={C.muted} />
              <TextInput value={q} onChangeText={setQ} placeholder="Search medicines, salts or brands" placeholderTextColor={C.muted} style={{ flex: 1, fontSize: 14, outlineStyle: 'none' }} />
              {q ? <Pressable onPress={() => setQ('')}><Icon name="close-circle" color={C.muted} /></Pressable> : null}
              <Pressable accessibilityRole="button" accessibilityLabel="Upload prescription" onPress={() => navigation.navigate('Scanner')}><Icon name="line-scan" /></Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 12 }}>
              {FILTERS.map((x, i) => (
                <Pressable key={x} onPress={() => setF(i)} style={[c.chip, f === i && { backgroundColor: C.primaryDark }]}>
                  <Text style={{ fontWeight: '600', color: f === i ? C.white : C.text2 }}>{x}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text style={{ fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 10 }}>Browse medicines <Text style={{ fontSize: 11, color: C.muted }}>{BRAND.brand.disclaimers.catalogBadge}</Text></Text>
          </View>}
        ListEmptyComponent={<T style={{ textAlign: 'center', marginTop: 30 }}>No medicines match your search.</T>}
        ListFooterComponent={
          <View style={{ alignItems: 'center', marginVertical: 16 }}>
            <T style={{ textAlign: 'center', fontSize: 12 }}>{BRAND.brand.disclaimers.catalog}</T>
            {isWebOutsideAndroidApp() && (
              <Pressable accessibilityRole="link" onPress={() => { window.location.href = ANDROID_APP_DOWNLOAD_PATH; }} style={h.getApp}>
                <Icon name="android" size={18} color={C.primaryDark} />
                <Text style={h.accountText}>Get the Android app</Text>
              </Pressable>
            )}
          </View>} />
      {count > 0 && (
        <Pressable style={c.bar} onPress={() => navigation.navigate('Cart')}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={c.cartIc}><Icon name="shopping" color={C.white} /></View>
            <View>
              <Text style={{ color: C.white, fontWeight: '700' }}>{count} Item{count > 1 ? 's' : ''} in cart</Text>
              <Text style={{ color: C.white, fontWeight: '800', fontSize: 16 }}>{inr(subtotal)}</Text>
            </View>
          </View>
          <View style={c.go}><Text style={{ color: C.white, fontWeight: '700' }}>Review cart →</Text></View>
        </Pressable>
      )}
    </View>
  );
}

const h = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, paddingTop: 36, backgroundColor: C.white, borderBottomWidth: 1, borderColor: C.border },
  account: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: C.border, backgroundColor: C.white },
  accountText: { fontWeight: '700', color: C.primaryDark, fontSize: 13 },
  getApp: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingVertical: 8, paddingHorizontal: 12 },
});
const c = StyleSheet.create({
  thumb: { width: 56, height: 56, borderRadius: 12, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' },
  note: { flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: C.input, borderRadius: 8, padding: 8, marginTop: 10 },
  substitutes: { gap: 8, borderTopWidth: 1, borderColor: C.border, marginTop: 12, paddingTop: 12 },
  substitute: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  add: { flexDirection: 'row', gap: 4, alignItems: 'center', backgroundColor: C.primaryDark, paddingHorizontal: 14, height: 46, borderRadius: 12 },
  step: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.input, borderRadius: 12, padding: 4 },
  stepB: { width: 38, height: 38, borderRadius: 10, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  chip: { paddingHorizontal: 14, height: 38, borderRadius: 999, backgroundColor: C.input, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.white, borderRadius: 12, paddingHorizontal: 12, height: 50, borderWidth: 1, borderColor: C.border },
  bar: { position: 'absolute', left: 12, right: 12, bottom: 12, backgroundColor: C.black, borderRadius: 16, padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cartIc: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  go: { backgroundColor: C.primaryDark, paddingHorizontal: 12, height: 44, borderRadius: 12, justifyContent: 'center' },
});
