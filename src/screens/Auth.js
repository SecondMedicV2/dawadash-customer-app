import React, { useRef, useState } from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Badge, BrandMark, Btn, Icon, notify, Text, TextInput } from '../ui';
import { useApp } from '../store';
import { BRAND, C, shadow2 } from '../theme';

const Trust = ({ icon, text, tint }) => (
  <View style={s.trust}>
    <View style={[s.trustIc, { backgroundColor: tint }]}><Icon name={icon} size={20} color={C.primaryDark} /></View>
    <Text style={{ textAlign: 'center', fontSize: 12, fontWeight: '600', color: C.text2 }}>{text}</Text>
  </View>
);

export function LoginScreen({ navigation, route }) {
  const { setPendingPhone, loginWithPassword, registerAccount, requestOtp } = useApp();
  const [flow, setFlow] = useState('login'); // 'login' | 'otp' | 'register' | 'recovery'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const reason = route?.params?.reason;

  const cleanPhone = identifier.replace(/\D/g, '').slice(-10);
  const validPhone = /^[6-9]\d{9}$/.test(cleanPhone);
  const validIdentifier = validPhone || /^\S+@\S+\.\S+$/.test(identifier.trim());

  const submitPasswordLogin = async () => {
    setErrorMsg('');
    setBusy(true);
    try {
      await loginWithPassword({ identifier: identifier.trim(), password });
      navigation.popTo('Main');
    } catch (err) {
      setErrorMsg(err?.message || 'Sign-in failed.');
    } finally {
      setBusy(false);
    }
  };

  const submitRegister = async () => {
    setErrorMsg('');
    setBusy(true);
    try {
      await registerAccount({
        phone: cleanPhone,
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        password,
      });
      navigation.popTo('Main');
    } catch (err) {
      setErrorMsg(err?.message || 'Registration failed.');
    } finally {
      setBusy(false);
    }
  };

  const submitOtpRequest = async (purpose) => {
    setErrorMsg('');
    setBusy(true);
    try {
      const res = await requestOtp({ phone: cleanPhone, purpose });
      if (purpose === 'recovery' && res?.isRegistered === false) {
        setErrorMsg('No registered account was found for that mobile number.');
        return;
      }
      setPendingPhone(`+91 ${cleanPhone}`);
      navigation.navigate('Otp', {
        phone: cleanPhone,
        purpose,
        stagingOtp: res.stagingOtp || null,
        providerConfigured: Boolean(res.providerConfigured),
      });
    } catch (err) {
      setErrorMsg(err?.message || 'Could not request verification code.');
    } finally {
      setBusy(false);
    }
  };

  const canSubmit = (() => {
    if (busy) return false;
    if (flow === 'login') return validIdentifier && password.length >= 6;
    if (flow === 'register') return fullName.trim().length >= 2 && validPhone && password.length >= 6;
    return validPhone;
  })();

  const handlePrimaryAction = () => {
    if (flow === 'login') return void submitPasswordLogin();
    if (flow === 'register') return void submitRegister();
    if (flow === 'otp') return void submitOtpRequest('login');
    return void submitOtpRequest('recovery');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.highlight }} contentContainerStyle={{ padding: 16, paddingTop: 20, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
      <View style={{ alignItems: 'center', marginBottom: 18 }}>
        <BrandMark size={72} iconSize={34} />
        <Text style={{ fontSize: 28, fontWeight: '800', marginTop: 12 }}>{BRAND.brand.name}</Text>
        <Text style={{ fontSize: 14, color: C.text2, marginTop: 2 }}>Verified pharmacies · Lucknow</Text>
      </View>

      {reason ? (
        <View style={s.reason}>
          <Icon name="lock-outline" size={18} color={C.primaryDark} />
          <Text style={{ flex: 1, marginLeft: 8, fontWeight: '600', fontSize: 13 }}>{reason}</Text>
        </View>
      ) : null}

      <View style={s.card}>
        <View style={s.seg}>
          {[
            ['login', 'Password'],
            ['otp', 'OTP'],
            ['register', 'Register'],
          ].map(([k, l]) => (
            <Pressable key={k} accessibilityRole="tab" accessibilityState={{ selected: flow === k }}
              onPress={() => { setFlow(k); setErrorMsg(''); }} style={[s.segI, flow === k && s.segOn]}>
              <Text style={{ fontWeight: '700', fontSize: 13, color: flow === k ? C.text : C.muted }}>{l}</Text>
            </Pressable>
          ))}
        </View>

        {flow === 'register' && (
          <>
            <Text style={s.lbl}>FULL NAME</Text>
            <View style={s.input}>
              <TextInput value={fullName} onChangeText={setFullName} placeholder="Enter your full name"
                style={{ flex: 1, fontSize: 15, outlineStyle: 'none' }} placeholderTextColor={C.muted} />
            </View>
          </>
        )}

        <Text style={s.lbl}>{flow === 'login' ? 'PHONE OR EMAIL' : '10-DIGIT MOBILE NUMBER'}</Text>
        <View style={s.input}>
          {flow !== 'login' && (
            <>
              <Text style={{ fontWeight: '600', fontSize: 15 }}>+91</Text>
              <View style={s.divider} />
            </>
          )}
          <TextInput
            value={identifier}
            onChangeText={(t) => setIdentifier(flow === 'login' ? t : t.replace(/\D/g, '').slice(0, 10))}
            placeholder={flow === 'login' ? 'Phone number or email@example.com' : '10-digit mobile number'}
            keyboardType={flow === 'login' ? 'default' : 'number-pad'}
            autoCapitalize="none"
            style={{ flex: 1, fontSize: 15, outlineStyle: 'none' }}
            placeholderTextColor={C.muted}
          />
        </View>

        {flow === 'register' && (
          <>
            <Text style={s.lbl}>EMAIL (OPTIONAL)</Text>
            <View style={s.input}>
              <TextInput value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address"
                autoCapitalize="none" style={{ flex: 1, fontSize: 15, outlineStyle: 'none' }} placeholderTextColor={C.muted} />
            </View>
          </>
        )}

        {(flow === 'login' || flow === 'register') && (
          <>
            <Text style={s.lbl}>PASSWORD (MIN 6 CHARS)</Text>
            <View style={s.input}>
              <TextInput value={password} onChangeText={setPassword} placeholder="Enter password" secureTextEntry
                autoCapitalize="none" style={{ flex: 1, fontSize: 15, outlineStyle: 'none' }} placeholderTextColor={C.muted} />
            </View>
          </>
        )}

        {errorMsg ? (
          <View style={s.errBox}>
            <Icon name="alert-circle-outline" size={16} color={C.errText} />
            <Text style={{ flex: 1, fontSize: 12, color: C.errText, fontWeight: '600' }}>{errorMsg}</Text>
          </View>
        ) : null}

        <Btn
          title={
            busy ? 'Please wait…'
              : flow === 'login' ? 'Sign in'
                : flow === 'register' ? 'Create customer account'
                  : flow === 'recovery' ? 'Send reset OTP'
                    : BRAND.brand.disclaimers.demoSignInAction
          }
          icon="arrow-right"
          disabled={!canSubmit}
          onPress={handlePrimaryAction}
          style={{ height: 52 }}
        />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}>
          <Pressable onPress={() => { setFlow(flow === 'recovery' ? 'login' : 'recovery'); setErrorMsg(''); }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: C.primaryDark }}>
              {flow === 'recovery' ? 'Back to password login' : 'Forgot password?'}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
        <Trust icon="store-check-outline" text="Verified pharmacies" tint={C.mint} />
        <Trust icon="autorenew" text="Prescription refills" tint={C.softMint} />
        <Trust icon="cash" text="Cash on delivery & online" tint={C.teal50} />
      </View>

      <Pressable accessibilityRole="button" onPress={() => navigation.popTo('Main')} style={s.browse}>
        <Text style={{ fontWeight: '700', color: C.primaryDark }}>Continue browsing without logging in</Text>
      </Pressable>
    </ScrollView>
  );
}

export function OtpScreen({ navigation, route }) {
  const { pendingPhone, verifyOtpCode, recoverPassword } = useApp();
  const { phone = '', purpose = 'login', stagingOtp = null, providerConfigured = false } = route?.params || {};
  const [code, setCode] = useState(stagingOtp || '');
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const ref = useRef();

  const isRecovery = purpose === 'recovery';

  const verify = async () => {
    setBusy(true);
    try {
      const targetPhone = phone || pendingPhone;
      if (isRecovery) {
        if (newPassword.length < 6) {
          notify('Invalid password', 'New password must be at least 6 characters.');
          return;
        }
        await recoverPassword({ phone: targetPhone, otp: code, newPassword });
        notify('Password updated', 'Sign in using your new password.');
        navigation.goBack();
        return;
      }
      await verifyOtpCode({ phone: targetPhone, otp: code, purpose });
      navigation.popTo('Main');
    } catch (err) {
      notify('Verification failed', err?.message || 'Invalid or expired OTP.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.highlight }} contentContainerStyle={{ padding: 16, paddingTop: 20 }} keyboardShouldPersistTaps="handled">
      <View style={{ alignItems: 'center', marginBottom: 18 }}>
        <View style={s.otpIc}><Icon name="message-lock-outline" size={30} color={C.primaryDark} /></View>
        <Text style={{ fontSize: 22, fontWeight: '800', marginTop: 12, textAlign: 'center' }}>
          {isRecovery ? 'Reset your password' : BRAND.brand.disclaimers.demoOtpTitle}
        </Text>
        <Text style={{ fontSize: 13, color: C.text2, textAlign: 'center', marginTop: 6 }}>
          {BRAND.brand.disclaimers.demoOtpNotice} · {pendingPhone || `+91 ${phone}`}
        </Text>
      </View>

      {!providerConfigured && stagingOtp ? (
        <View style={s.stagingBanner}>
          <Badge text="VERIFICATION CODE" tone="warn" />
          <Text style={{ fontSize: 12, color: C.text2, marginTop: 6 }}>
            SMS gateway pending activation. Enter code: <Text style={{ fontWeight: '800', color: C.text }}>{stagingOtp}</Text>
          </Text>
        </View>
      ) : null}

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

        {isRecovery && (
          <View style={{ marginTop: 16 }}>
            <Text style={s.lbl}>NEW PASSWORD (MIN 6 CHARS)</Text>
            <View style={[s.input, { backgroundColor: C.white, marginBottom: 0 }]}>
              <TextInput value={newPassword} onChangeText={setNewPassword} placeholder="Enter new password" secureTextEntry
                style={{ flex: 1, fontSize: 15, outlineStyle: 'none' }} placeholderTextColor={C.muted} />
            </View>
          </View>
        )}

        <Btn
          title={busy ? 'Verifying…' : isRecovery ? 'Reset password' : BRAND.brand.disclaimers.demoOtpAction}
          icon="arrow-right"
          disabled={busy || code.length < 6 || (isRecovery && newPassword.length < 6)}
          onPress={verify}
          style={{ marginTop: 18, height: 52 }}
        />
      </View>

      <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={s.change}>
        <Icon name="pencil-outline" size={16} color={C.primaryDark} />
        <Text style={{ color: C.primaryDark, fontWeight: '600' }}>Change phone number / mode</Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  reason: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.mint, borderRadius: 14, padding: 12, marginBottom: 14 },
  card: { backgroundColor: C.white, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: C.border, ...shadow2 },
  browse: { alignItems: 'center', alignSelf: 'center', marginTop: 10, paddingVertical: 10, paddingHorizontal: 16 },
  seg: { flexDirection: 'row', backgroundColor: C.input, borderRadius: 14, padding: 4, marginBottom: 18 },
  segI: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 11 },
  segOn: { backgroundColor: C.white, shadowColor: C.black, shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  lbl: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: C.text2, marginBottom: 6 },
  input: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.input, borderRadius: 14, paddingHorizontal: 14, height: 50, marginBottom: 14 },
  errBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.errBg, borderRadius: 12, padding: 10, marginBottom: 14 },
  stagingBanner: { backgroundColor: C.warnBg, borderRadius: 16, borderWidth: 1, borderColor: C.warn, padding: 12, marginBottom: 14 },
  divider: { width: 1, height: 22, backgroundColor: C.border },
  trust: { flex: 1, backgroundColor: C.trust, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center', gap: 8 },
  trustIc: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  otpIc: { width: 60, height: 60, borderRadius: 18, backgroundColor: C.softMint, alignItems: 'center', justifyContent: 'center' },
  cell: { flex: 1, maxWidth: 52, height: 56, borderRadius: 12, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  change: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20, paddingVertical: 10 },
});
