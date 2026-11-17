import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRAND, C, shadow2 } from '../theme';
import { Badge, Card, confirmAction, Icon, Stepper, T, Text, TextInput } from '../ui';
import { useApp } from '../store';
import { FILTERS, LOCALITIES } from '../data';
import { inrPaise } from '../apiClient';
import { ANDROID_APP_DOWNLOAD_PATH, isWebOutsideAndroidApp } from '../appShell';

const initials = (name = '') => name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'ME';

/** App header: brand + 24x7 pill, active GPS or manual locality, account button. */
export function Header() {
  const { user, locality, coords } = useApp();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const areaLabel = coords
    ? `GPS (${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)})`
    : `${locality}, Lucknow`;

  return (
    <View style={[h.row, { paddingTop: Math.max(insets.top, 12) + 4 }]}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: C.primaryDark }}>{BRAND.brand.name}</Text>
          <View style={h.pill}><Text style={{ fontSize: 10, fontWeight: '800', color: C.deep }}>24x7</Text></View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <Icon name={coords ? 'crosshairs-gps' : 'map-marker-outline'} size={14} color={C.primaryDark} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: C.text2 }} numberOfLines={1}>{areaLabel}</Text>
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

const typeBadge = (m) => (m.prescriptionRequired ? ['err', 'Rx Required', 'prescription'] : ['ok', 'OTC Safe', null]);

function MedCard({ m }) {
  const { cart, setQty, selectedRetailer, selectRetailer, count } = useApp();
  const [showAlternatives, setShowAlternatives] = useState(false);
  const q = cart[m.id] || 0;
  const substitutes = m.equivalents || [];
  const [tone, label, badgeIcon] = typeBadge(m);
  const off = m.mrpPaise > 0 ? Math.max(0, Math.round((1 - m.finalUnitPricePaise / m.mrpPaise) * 100)) : 0;

  const pickAlternative = (candidate) => {
    const switchingStore = selectedRetailer && candidate.retailerId !== selectedRetailer.id && count > 0;
    const title = switchingStore ? 'Switch pharmacy & item?' : q ? 'Switch medicine?' : 'Add alternative?';
    const message = switchingStore
      ? `${candidate.name} is stocked at ${candidate.retailerName}. Switching stores will replace your current cart.`
      : q
        ? `Replace ${q} × ${m.name} with ${candidate.name} (${candidate.retailerName})?`
        : `Add ${candidate.name} from ${candidate.retailerName}?`;
    confirmAction(title, message, switchingStore ? 'Switch store' : q ? 'Switch' : 'Add', () => {
      if (candidate.retailerId !== selectedRetailer?.id) {
        selectRetailer(candidate.retailerId, { resetCart: true });
        setQty(candidate.id, q || 1, candidate.retailerId);
      } else {
        setQty(candidate.id, (cart[candidate.id] || 0) + (q || 1), candidate.retailerId);
        if (q) setQty(m.id, 0);
      }
    });
  };

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
          <Text style={{ fontSize: 12, color: C.text2, marginTop: 2 }}>
            {m.salt} {m.strength ? `· ${m.strength}` : ''} {m.dosageForm ? `· ${m.dosageForm}` : ''}
          </Text>
        </View>
      </View>

      <View style={c.note}>
        <Icon name={m.inStock ? 'check-circle-outline' : 'alert-circle-outline'} size={14} color={m.inStock ? C.deep : C.errText} />
        <Text style={{ fontSize: 11, fontWeight: '600', color: m.inStock ? C.text2 : C.errText, flex: 1 }}>
          {!m.inStock
            ? `Out of stock at ${m.retailerName}`
            : m.stockQuantity <= 10
              ? `Low stock: ${m.stockQuantity} left at ${m.retailerName}`
              : `In stock (${m.stockQuantity} units) · ${m.retailerName}`}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 20, fontWeight: '800' }}>{inrPaise(m.finalUnitPricePaise)}</Text>
            {m.mrpPaise > m.finalUnitPricePaise && (
              <Text style={{ textDecorationLine: 'line-through', color: C.muted, fontSize: 12 }}>{inrPaise(m.mrpPaise)}</Text>
            )}
            {off > 0 && <View style={c.off}><Text style={{ fontSize: 10, fontWeight: '800', color: C.deep }}>{off}% OFF</Text></View>}
          </View>
          <Text style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{m.unit}</Text>
        </View>
        {m.isOutOfStock ? (
          <View style={{ backgroundColor: C.well, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 }}>
            <Text style={{ color: C.muted, fontWeight: '700', fontSize: 13 }}>Out of Stock</Text>
          </View>
        ) : q === 0 ? (
          <Pressable accessibilityRole="button" style={({ pressed }) => [c.add, pressed && { transform: [{ scale: 0.98 }] }]}
            onPress={() => setQty(m.id, 1, m.retailerId)}>
            <Icon name="plus" color={C.white} size={18} />
            <Text style={{ color: C.white, fontWeight: '700' }}>Add to Order</Text>
          </Pressable>
        ) : (
          <Stepper qty={q} onChange={(n) => setQty(m.id, Math.min(n, m.stockQuantity), m.retailerId)} />
        )}
      </View>

      {substitutes.length > 0 && (
        <View style={c.substitutes}>
          <Pressable accessibilityRole="button" onPress={() => setShowAlternatives((v) => !v)} style={c.altToggle}>
            <Icon name="swap-horizontal" size={16} color={C.primaryDark} />
            <Text style={{ flex: 1, fontSize: 12, fontWeight: '700', color: C.primaryDark }}>
              {substitutes.length} same-composition equivalent{substitutes.length > 1 ? 's' : ''} nearby
            </Text>
            <Icon name={showAlternatives ? 'chevron-up' : 'chevron-down'} size={18} color={C.primaryDark} />
          </Pressable>
          {showAlternatives && (
            <View style={{ gap: 6, marginTop: 6 }}>
              {substitutes.map((candidate) => (
                <Pressable key={`${candidate.retailerId}-${candidate.id}`} accessibilityRole="button"
                  onPress={() => pickAlternative(candidate)} style={c.substitute}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: C.text, fontWeight: '600', fontSize: 13 }}>{candidate.name}</Text>
                    <Text style={{ color: C.text2, fontSize: 11 }}>
                      {candidate.retailerName}{candidate.distanceKm != null ? ` · ${candidate.distanceKm} km` : ''} · {candidate.inStock ? `${candidate.stockQuantity} in stock` : 'Out of stock'}
                    </Text>
                  </View>
                  <Text style={{ fontWeight: '700', fontSize: 13 }}>{inrPaise(candidate.finalUnitPricePaise)}</Text>
                </Pressable>
              ))}
              <Text style={{ fontSize: 11, color: C.muted }}>Same active salt, strength, dosage form, and pack size at verified pharmacies.</Text>
            </View>
          )}
        </View>
      )}
    </Card>
  );
}

const filterIcons = ['view-grid', 'prescription', 'heart-pulse', 'pill'];

export function CatalogScreen({ navigation }) {
  const {
    count, subtotalPaise, mrpTotalPaise, locality, setLocality, coords, locationStatus, locationError,
    requestGpsLocation, retailers, selectedRetailer, selectRetailer, retailersLoading, retailersError,
    medicines, catalogLoading, catalogError, lines, prescription,
  } = useApp();
  const [q, setQ] = useState('');
  const [f, setF] = useState(0);

  const handleSelectStore = (store) => {
    if (selectedRetailer?.id === store.id) return;
    if (count > 0) {
      confirmAction(
        'Switch pharmacy?',
        `Switching to ${store.pharmacyName} will clear your ${count} item cart from ${selectedRetailer?.pharmacyName || 'the previous pharmacy'}.`,
        'Switch pharmacy',
        () => selectRetailer(store.id, { resetCart: true }),
      );
      return;
    }
    selectRetailer(store.id);
  };

  const list = medicines.filter((m) => {
    const t = `${m.name} ${m.salt} ${m.brand}`.toLowerCase().includes(q.toLowerCase());
    const ff = f === 0
      || (f === 1 && m.prescriptionRequired)
      || (f === 2 && String(m.category || '').toLowerCase().includes('chronic'))
      || (f === 3 && !m.prescriptionRequired);
    return t && ff;
  });

  const needsRx = lines.some((l) => l.prescriptionRequired) && !prescription;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header />
      <FlatList
        data={list}
        keyExtractor={(m) => `${m.retailerId}-${m.id}`}
        renderItem={({ item }) => <MedCard m={item} />}
        contentContainerStyle={{ padding: 16, paddingBottom: count > 0 ? 120 : 32 }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Icon name="map-marker-radius-outline" size={16} color={C.text2} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: C.text2 }}>Delivery location</Text>
              </View>
              <Pressable accessibilityRole="button" onPress={requestGpsLocation} style={c.gpsBtn}>
                <Icon name={locationStatus === 'requesting' ? 'timer-sand' : 'crosshairs-gps'} size={14} color={C.primaryDark} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: C.primaryDark }}>
                  {locationStatus === 'requesting' ? 'Locating…' : coords ? 'Refresh GPS' : 'Use device GPS'}
                </Text>
              </Pressable>
            </View>

            {locationError ? (
              <Text style={{ fontSize: 11, color: C.warnText, marginBottom: 8 }}>{locationError}</Text>
            ) : null}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8 }} style={{ marginBottom: 14 }}>
              {LOCALITIES.map((place) => {
                const on = !coords && place === locality;
                return (
                  <Pressable key={place} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => setLocality(place)}
                    style={[c.locality, on && { backgroundColor: C.primaryDark, borderColor: C.primaryDark }]}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: on ? C.white : C.text2 }}>{place}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Nearby verified pharmacies */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '700' }}>Verified pharmacies near you</Text>
              {retailersLoading ? <ActivityIndicator size="small" color={C.primary} /> : (
                <Text style={{ fontSize: 12, color: C.muted }}>{retailers.length} active store{retailers.length === 1 ? '' : 's'}</Text>
              )}
            </View>

            {retailersError ? (
              <Card style={{ marginBottom: 14, backgroundColor: C.errBg, borderColor: C.err }}>
                <Text style={{ fontSize: 12, color: C.errText }}>{retailersError}</Text>
              </Card>
            ) : !retailersLoading && retailers.length === 0 ? (
              <Card style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 14, fontWeight: '700' }}>No verified pharmacy within 3 km</Text>
                <Text style={{ fontSize: 12, color: C.text2, marginTop: 4 }}>
                  No verified pharmacy with active uploaded stock is within 3 km of this location. Select another locality or check back shortly.
                </Text>
              </Card>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 8 }} style={{ marginBottom: 14 }}>
                {retailers.map((store) => {
                  const active = selectedRetailer?.id === store.id;
                  return (
                    <Pressable key={store.id} accessibilityRole="radio" accessibilityState={{ checked: active }}
                      onPress={() => handleSelectStore(store)}
                      style={[c.storeCard, active && c.storeCardOn]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Icon name="check-decagram" size={16} color={active ? C.white : C.primaryDark} />
                        <Text style={{ fontSize: 14, fontWeight: '700', color: active ? C.white : C.text }} numberOfLines={1}>
                          {store.pharmacyName}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 11, color: active ? C.mint : C.text2, marginTop: 3 }} numberOfLines={1}>
                        {store.locality} · {store.distanceKm} km · {store.opensAt}–{store.closesAt}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            <View style={c.search}>
              <Icon name="magnify" color={C.primary} />
              <TextInput value={q} onChangeText={setQ} placeholder="Search medicines, salts or brands" placeholderTextColor={C.muted}
                style={{ flex: 1, fontSize: 14, outlineStyle: 'none', paddingVertical: 0 }} />
              {q ? <Pressable accessibilityLabel="Clear search" onPress={() => setQ('')}><Icon name="close-circle" color={C.muted} /></Pressable> : null}
              <Pressable accessibilityRole="button" accessibilityLabel="Upload prescription" onPress={() => navigation.navigate('Scanner')} style={c.scanBtn}>
                <Icon name="line-scan" size={20} color={C.primaryDark} />
              </Pressable>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8 }} style={{ marginTop: 14, marginBottom: 16 }}>
              {FILTERS.map((x, i) => (
                <Pressable key={x} onPress={() => setF(i)} style={[c.chip, f === i && { backgroundColor: C.primaryDark, borderColor: C.primaryDark }]}>
                  <Icon name={filterIcons[i]} size={16} color={f === i ? C.white : C.text2} />
                  <Text style={{ fontWeight: '700', fontSize: 13, color: f === i ? C.white : C.text2 }}>{x}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '700' }}>
                {selectedRetailer ? `${selectedRetailer.pharmacyName} Inventory` : 'Store Inventory'}
              </Text>
              {catalogLoading ? <ActivityIndicator size="small" color={C.primary} /> : <Badge text="Verified stock" tone="ok" />}
            </View>
            {catalogError ? <Text style={{ color: C.errText, fontSize: 12, marginBottom: 10 }}>{catalogError}</Text> : null}
          </View>
        }
        ListEmptyComponent={
          catalogLoading
            ? <View style={{ padding: 24, alignItems: 'center' }}><ActivityIndicator color={C.primary} /></View>
            : <T style={{ textAlign: 'center', marginTop: 24 }}>No medicines match your search in this pharmacy.</T>
        }
        ListFooterComponent={
          <View style={{ alignItems: 'center', marginTop: 4, marginBottom: 16 }}>
            <Text style={{ textAlign: 'center', fontSize: 12, color: C.muted }}>
              Dispensed only by licensed & verified pharmacies. Prices include store GST.
            </Text>
            {isWebOutsideAndroidApp() && (
              <Pressable accessibilityRole="link" onPress={() => { window.location.href = ANDROID_APP_DOWNLOAD_PATH; }} style={c.getApp}>
                <Icon name="android" size={18} color={C.primaryDark} />
                <Text style={{ fontWeight: '700', color: C.primaryDark, fontSize: 13 }}>Get the Android app</Text>
              </Pressable>
            )}
          </View>
        }
      />

      {count > 0 && (
        <Pressable accessibilityRole="button" style={c.bar} onPress={() => navigation.navigate('Cart')}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 }}>
            <View style={c.cartIc}>
              <Icon name="shopping-outline" color={C.white} />
              <View style={c.cartCount}><Text style={{ color: C.white, fontSize: 10, fontWeight: '800' }}>{count}</Text></View>
            </View>
            <View style={{ flexShrink: 1 }}>
              <Text style={{ color: C.white, fontWeight: '700', fontSize: 12 }}>{count} Item{count > 1 ? 's' : ''} · {selectedRetailer?.pharmacyName || 'Pharmacy'}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                <Text style={{ color: C.white, fontWeight: '800', fontSize: 18 }}>{inrPaise(subtotalPaise)}</Text>
                {mrpTotalPaise > subtotalPaise && <Text style={{ color: C.softMint, fontSize: 11, textDecorationLine: 'line-through' }}>{inrPaise(mrpTotalPaise)}</Text>}
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
  gpsBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.teal50, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: C.mint },
  locality: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: C.input, borderWidth: 1, borderColor: C.input },
  storeCard: { minWidth: 210, maxWidth: 260, backgroundColor: C.white, borderRadius: 16, borderWidth: 1.5, borderColor: C.border, padding: 12 },
  storeCardOn: { backgroundColor: C.primaryDark, borderColor: C.primaryDark },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingLeft: 14, paddingRight: 6, height: 54 },
  scanBtn: { width: 42, height: 42, borderRadius: 10, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: C.white, borderWidth: 1, borderColor: C.border },
  bar: { position: 'absolute', left: 12, right: 12, bottom: 12, backgroundColor: C.text, borderRadius: 18, padding: 10, paddingLeft: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, ...shadow2 },
  cartIc: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.primaryDark, alignItems: 'center', justifyContent: 'center' },
  cartCount: { position: 'absolute', top: -6, left: -6, minWidth: 20, height: 20, borderRadius: 10, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.text, paddingHorizontal: 3 },
  go: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.primaryDark, paddingHorizontal: 14, height: 46, borderRadius: 12 },
  getApp: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingVertical: 8, paddingHorizontal: 12 },
});
