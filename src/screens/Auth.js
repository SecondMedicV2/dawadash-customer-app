import React, { useRef, useState } from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { BrandMark, Btn, Icon, Text, TextInput } from '../ui';
import { useApp } from '../store';
import { BRAND, C, shadow2 } from '../theme';

const Trust = ({ icon, text, tint }) => (
  <View style={s.trust}>
    <View style={[s.trustIc, { backgroundColor: tint }]}><Icon name={icon} size={20} color={C.primaryDark} /></View>
    <Text style={{ textAlign: 'center', fontSize: 12, fontWeight: '600', color: C.text2 }}>{text}</Text>
  </View>
);

export function LoginScreen({ navigation, route }) {
  const { setPendingPhone } = useApp();
  const [mode, setMode] = useState('phone');
  const [val, setVal] = useState('');
  const reason = route?.params?.reason;
  const valid = mode === 'phone' ? /^[6-9]\d{9}$/.test(val) : /^\S+@\S+\.\S+$/.test(val);
  const go = () => { setPendingPhone(mode === 'phone' ? '+91 ' + val : val); navigation.navigate('Otp'); };
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.highlight }} contentContainerStyle={{ padding: 16, paddingTop: 20, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
      <View style={{ alignItems: 'center', marginBottom: 22 }}>
        <BrandMark size={80} iconSize={38} />
        <Text style={{ fontSize: 30, fontWeight: '800', marginTop: 14 }}>{BRAND.brand.name}</Text>
        <Text style={{ fontSize: 15, color: C.text2, marginTop: 2 }}>Lucknow’s trusted express pharmacy</Text>
      </View>
      {reason ? (
        <View style={s.reason}>
          <Icon name="lock-outline" size={18} color={C.primaryDark} />
          <Text style={{ flex: 1, marginLeft: 8, fontWeight: '600', fontSize: 13 }}>{reason}</Text>
        </View>
      ) : null}
      <View style={s.card}>
        <View style={s.seg}>
          {[['phone', 'Phone Number'], ['email', 'Email ID']].map(([k, l]) => (
            <Pressable key={k} accessibilityRole="tab" accessibilityState={{ selected: mode === k }}
              onPress={() => { setMode(k); setVal(''); }} style={[s.segI, mode === k && s.segOn]}>
              <Text style={{ fontWeight: '600', fontSize: 14, color: mode === k ? C.text : C.muted }}>{l}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={s.lbl}>{mode === 'phone' ? 'MOBILE NUMBER' : 'EMAIL ADDRESS'}</Text>
        <View style={s.input}>
          {mode === 'phone' && (
            <>
              <Text style={{ fontWeight: '600', fontSize: 16 }}>+91</Text>
              <View style={s.divider} />
            </>
          )}
          <TextInput value={val} onChangeText={(t) => setVal(mode === 'phone' ? t.replace(/\D/g, '').slice(0, 10) : t)}
            placeholder={mode === 'phone' ? 'Enter 10-digit mobile number' : 'you@example.com'} keyboardType={mode === 'phone' ? 'number-pad' : 'email-address'}
            autoCapitalize="none" style={{ flex: 1, fontSize: 16, outlineStyle: 'none' }} placeholderTextColor={C.muted} />
        </View>
        <Btn title={BRAND.brand.disclaimers.demoSignInAction} icon="arrow-right" disabled={!valid} onPress={go} style={{ height: 54 }} />
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 22 }}>
        <Trust icon="pill" text="Medicine catalog" tint={C.mint} />
        <Trust icon="autorenew" text="In-app refills" tint={C.softMint} />
        <Trust icon="flask-outline" text="Lab bookings" tint={C.teal50} />
      </View>
      <Text style={{ textAlign: 'center', marginTop: 22, color: C.text2, fontSize: 12, lineHeight: 18 }}>
        {BRAND.brand.disclaimers.demoSignIn}
      </Text>
      <Pressable accessibilityRole="button" onPress={() => navigation.popTo('Main')} style={s.browse}>
        <Text style={{ fontWeight: '700', color: C.primaryDark }}>Continue browsing without logging in</Text>
      </Pressable>
    </ScrollView>
  );
}

export function OtpScreen({ navigation }) {
  const { pendingPhone, setUser } = useApp();
  const [code, setCode] = useState('');
  const ref = useRef();
  const verify = () => {
    // Demo: any 6-digit code works.
    setUser({ name: 'Amit Sharma', phone: pendingPhone.startsWith('+') ? pendingPhone : '+91 98765 43210', email: 'amit.sharma@lucknowcare.in' });
    // Back to wherever login was requested (cart, refills, labs); the cart is kept.
    navigation.popTo('Main');
  };
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.highlight }} contentContainerStyle={{ padding: 16, paddingTop: 20 }} keyboardShouldPersistTaps="handled">
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <View style={s.otpIc}><Icon name="message-lock-outline" size={30} color={C.primaryDark} /></View>
        <Text style={{ fontSize: 24, fontWeight: '800', marginTop: 14, textAlign: 'center' }}>{BRAND.brand.disclaimers.demoOtpTitle}</Text>
        <Text style={{ fontSize: 14, color: C.text2, textAlign: 'center', marginTop: 6 }}>{BRAND.brand.disclaimers.demoOtpNotice}</Text>
        <Text style={{ fontSize: 14, fontWeight: '700', marginTop: 2 }}>{pendingPhone}</Text>
      </View>
      <View style={[s.card, { backgroundColor: C.input, borderColor: C.input }]}>
        <Pressable onPress={() => ref.current?.focus()} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 6 }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={[s.cell, i === code.length && { borderColor: C.primary, borderWidth: 2 }]}>
              <Text style={{ fontSize: 22, fontWeight: '700' }}>{code[i] || ''}</Text>
            </View>
          ))}
        </Pressable>
        <TextInput ref={ref} value={code} onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" autoFocus
          style={{ position: 'absolute', opacity: 0, height: 1, width: 1 }} />
        <Btn title={BRAND.brand.disclaimers.demoOtpAction} icon="arrow-right" disabled={code.length < 6} onPress={verify} style={{ marginTop: 20, height: 54 }} />
      </View>
      <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={s.change}>
        <Icon name="pencil-outline" size={16} color={C.primaryDark} />
        <Text style={{ color: C.primaryDark, fontWeight: '600' }}>Change phone number / email</Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  reason: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.mint, borderRadius: 14, padding: 12, marginBottom: 14 },
  card: { backgroundColor: C.white, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: C.border, ...shadow2 },
  browse: { alignItems: 'center', alignSelf: 'center', marginTop: 10, paddingVertical: 10, paddingHorizontal: 16 },
  seg: { flexDirection: 'row', backgroundColor: C.input, borderRadius: 14, padding: 4, marginBottom: 20 },
  segI: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 11 },
  segOn: { backgroundColor: C.white, shadowColor: C.black, shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  lbl: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: C.text2, marginBottom: 8 },
  input: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.input, borderRadius: 14, paddingHorizontal: 16, height: 56, marginBottom: 18 },
  divider: { width: 1, height: 24, backgroundColor: C.border },
  trust: { flex: 1, backgroundColor: C.trust, borderRadius: 18, paddingVertical: 16, paddingHorizontal: 8, alignItems: 'center', gap: 10 },
  trustIc: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  otpIc: { width: 64, height: 64, borderRadius: 18, backgroundColor: C.softMint, alignItems: 'center', justifyContent: 'center' },
  cell: { flex: 1, maxWidth: 52, height: 58, borderRadius: 12, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  change: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 22, paddingVertical: 10 },
});
