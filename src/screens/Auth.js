import React, { useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { BrandMark, Btn, Card, Icon, T } from '../ui';
import { useApp } from '../store';
import { BRAND, C } from '../theme';
import { ANDROID_APP_DOWNLOAD_PATH, isWebOutsideAndroidApp } from '../appShell';

const Trust = ({ icon, text }) => (
  <View style={s.trust}>
    <View style={s.trustIc}><Icon name={icon} size={20} color={C.deep} /></View>
    <Text style={{ textAlign: 'center', fontSize: 12, color: C.text2 }}>{text}</Text>
  </View>
);

export function LoginScreen({ navigation }) {
  const { setPendingPhone } = useApp();
  const [mode, setMode] = useState('phone');
  const [val, setVal] = useState('');
  const valid = mode === 'phone' ? /^[6-9]\d{9}$/.test(val) : /^\S+@\S+\.\S+$/.test(val);
  const go = () => { setPendingPhone(mode === 'phone' ? '+91 ' + val : val); navigation.navigate('Otp'); };
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingTop: 48 }} keyboardShouldPersistTaps="handled">
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <BrandMark />
        <Text style={{ fontSize: 28, fontWeight: '800', color: C.text, marginTop: 12 }}>{BRAND.brand.name}</Text>
        <T style={{ color: C.muted }}>Medicines, refills & lab bookings</T>
      </View>
      <Card style={{ padding: 20 }}>
        <View style={s.seg}>
          {[['phone', 'Phone Number'], ['email', 'Email ID']].map(([k, l]) => (
            <Pressable key={k} onPress={() => { setMode(k); setVal(''); }} style={[s.segI, mode === k && s.segOn]}>
              <Text style={{ fontWeight: '600', color: mode === k ? C.text : C.muted }}>{l}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={s.lbl}>{mode === 'phone' ? 'MOBILE NUMBER' : 'EMAIL ADDRESS'}</Text>
        <View style={s.input}>
          {mode === 'phone' && <Text style={{ fontWeight: '700', marginRight: 10, color: C.text }}>+91  |</Text>}
          <TextInput value={val} onChangeText={(t) => setVal(mode === 'phone' ? t.replace(/\D/g, '').slice(0, 10) : t)}
            placeholder={mode === 'phone' ? 'Enter 10-digit mobile number' : 'you@example.com'} keyboardType={mode === 'phone' ? 'number-pad' : 'email-address'}
            autoCapitalize="none" style={{ flex: 1, fontSize: 16, color: C.text, outlineStyle: 'none' }} placeholderTextColor={C.muted} />
        </View>
        <Btn title={BRAND.brand.disclaimers.demoSignInAction} icon="arrow-right" disabled={!valid} onPress={go} />
      </Card>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
        <Trust icon="pill" text="Medicine catalog" />
        <Trust icon="autorenew" text="In-app refills" />
        <Trust icon="flask-outline" text="Lab bookings" />
      </View>
      <T style={{ textAlign: 'center', marginTop: 24, color: C.muted, fontSize: 12 }}>
        {BRAND.brand.disclaimers.demoSignIn}
      </T>
      {isWebOutsideAndroidApp() && (
        <Pressable accessibilityRole="link" onPress={() => { window.location.href = ANDROID_APP_DOWNLOAD_PATH; }}
          style={s.getApp}>
          <Icon name="android" size={18} color={C.primaryDark} />
          <Text style={{ marginLeft: 6, fontWeight: '700', color: C.primaryDark }}>Get the Android app</Text>
        </Pressable>
      )}
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
  };
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, padding: 16, paddingTop: 40 }}>
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <BrandMark size={72} iconSize={32} />
        <Text style={{ fontSize: 24, fontWeight: '800', color: C.text, marginTop: 12 }}>{BRAND.brand.disclaimers.demoOtpTitle}</Text>
        <T style={{ textAlign: 'center', marginTop: 4 }}>{BRAND.brand.disclaimers.demoOtpNotice}</T>
        <T style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>Account: {pendingPhone}</T>
      </View>
      <Card style={{ padding: 20, backgroundColor: C.highlight }}>
        <Pressable onPress={() => ref.current?.focus()} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={[s.cell, i === code.length && { borderColor: C.primary, borderWidth: 2 }]}>
              <Text style={{ fontSize: 22, fontWeight: '700', color: C.text }}>{code[i] || ''}</Text>
            </View>
          ))}
        </Pressable>
        <TextInput ref={ref} value={code} onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" autoFocus
          style={{ position: 'absolute', opacity: 0, height: 1, width: 1 }} />
        <Btn title={BRAND.brand.disclaimers.demoOtpAction} icon="arrow-right" disabled={code.length < 6} onPress={verify} />
      </Card>
      <Pressable onPress={() => navigation.goBack()} style={{ alignItems: 'center', marginTop: 20 }}>
        <Text style={{ color: C.primaryDark, fontWeight: '600' }}>✎ Change Phone Number / Email</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  getApp: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 16, paddingVertical: 10, paddingHorizontal: 16 },
  seg: { flexDirection: 'row', backgroundColor: C.input, borderRadius: 12, padding: 4, marginBottom: 18 },
  segI: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 }, segOn: { backgroundColor: C.white },
  lbl: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, color: C.text2, marginBottom: 6 },
  input: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.input, borderRadius: 12, paddingHorizontal: 16, height: 52, marginBottom: 16 },
  trust: { flex: 1, backgroundColor: C.trust, borderRadius: 16, padding: 12, alignItems: 'center', gap: 8 },
  trustIc: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' },
  cell: { width: 44, height: 54, borderRadius: 10, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
});
