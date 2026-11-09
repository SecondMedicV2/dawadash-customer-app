import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons as MCI } from '@expo/vector-icons';
import { BRAND, C, shadow } from './theme';

export const Icon = ({ name, size = 20, color = C.primary, style }) => <MCI name={name} size={size} color={color} style={style} />;

export function BrandMark({ size = 72, iconSize = 34 }) {
  const { logo } = BRAND.brand;
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.28, backgroundColor: logo.markBackground, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={logo.markIcon} size={iconSize} color={logo.markForeground} />
    </View>
  );
}

export function Btn({ title, onPress, icon, variant = 'primary', disabled, style }) {
  const p = variant === 'primary';
  return (
    <Pressable onPress={onPress} disabled={disabled}
      style={({ pressed }) => [s.btn, p ? s.btnP : s.btnS, pressed && { transform: [{ scale: 0.98 }] }, disabled && { opacity: 0.5 }, style]}>
      <Text style={[s.btnT, { color: p ? C.white : C.primary }]}>{title}</Text>
      {icon ? <Icon name={icon} color={p ? C.white : C.primary} size={20} /> : null}
    </Pressable>
  );
}

export const Card = ({ children, style }) => <View style={[s.card, style]}>{children}</View>;

export const fulfillmentLabels = { store_delivery: 'Store delivery', counter_pickup: 'Counter pickup' };

export function FulfillmentChoice({ value, onChange }) {
  return (
    <Card>
      <H>How would you like to receive your order?</H>
      {Object.entries(fulfillmentLabels).map(([mode, label]) => (
        <Pressable key={mode} accessibilityRole="radio" accessibilityState={{ checked: mode === value }}
          onPress={() => onChange(mode)} style={{ paddingVertical: 12, flexDirection: 'row', gap: 8 }}>
          <Icon name={mode === value ? 'radiobox-marked' : 'radiobox-blank'} />
          <T>{label}</T>
        </Pressable>
      ))}
    </Card>
  );
}

export function Badge({ text, tone = 'ok', icon }) {
  const t = { ok: [C.okBg, C.deep], warn: [C.warnBg, C.warnText], err: [C.errBg, C.errText], teal: [C.teal50, C.primary], mint: [C.mint, C.primaryDark] }[tone];
  return (
    <View style={[s.badge, { backgroundColor: t[0] }]}>
      {icon ? <Icon name={icon} size={12} color={t[1]} style={{ marginRight: 3 }} /> : null}
      <Text style={{ color: t[1], fontSize: 11, fontWeight: '700' }}>{text}</Text>
    </View>
  );
}

export const H = ({ children, style }) => <Text style={[{ fontSize: 18, fontWeight: '700', color: C.text }, style]}>{children}</Text>;
export const T = ({ children, style, ...r }) => <Text style={[{ fontSize: 14, color: C.text2 }, style]} {...r}>{children}</Text>;

export function Footer({ children }) {
  return <View style={s.footer}>{children}</View>;
}

const s = StyleSheet.create({
  btn: { height: 50, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16 },
  btnP: { backgroundColor: C.primaryDark }, btnS: { borderWidth: 1.5, borderColor: C.primary, backgroundColor: 'transparent' },
  btnT: { fontSize: 15, fontWeight: '700' },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, ...shadow },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, alignSelf: 'flex-start' },
  footer: { padding: 16, backgroundColor: C.white, borderTopWidth: 1, borderColor: C.border },
});
