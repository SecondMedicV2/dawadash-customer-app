import React from 'react';
import { Alert, Modal, Platform, Pressable, StyleSheet, Text as RNText, TextInput as RNTextInput, View } from 'react-native';
import { MaterialCommunityIcons as MCI } from '@expo/vector-icons';
import { BRAND, C, F, fontFor, shadow, shadow2 } from './theme';

export const Icon = ({ name, size = 20, color = C.primary, style }) => <MCI name={name} size={size} color={color} style={style} />;

/** Text that follows the design type scale automatically (see fontFor). */
export function Text({ style, ...rest }) {
  const flat = StyleSheet.flatten(style) || {};
  return <RNText {...rest} style={[{ color: C.text }, style, { fontFamily: flat.fontFamily || fontFor(flat), fontWeight: 'normal' }]} />;
}

export const TextInput = React.forwardRef(function TextInput({ style, ...rest }, ref) {
  return <RNTextInput ref={ref} {...rest} style={[{ fontFamily: F.b5, color: C.text }, style]} />;
});

import {
  isModalOpen,
  closeActiveModal,
  showModal,
  notify,
  confirmAction,
  showExitConfirmation,
  registerModalSubscriber,
} from './modalController.mjs';

export {
  isModalOpen,
  closeActiveModal,
  showModal,
  notify,
  confirmAction,
  showExitConfirmation,
};

// Ensure Alert.alert on web triggers the in-app modal instead of being dropped
if (Platform.OS === 'web') {
  Alert.alert = (title, message, buttons) => {
    if (!buttons || buttons.length <= 1) {
      const btn = buttons && buttons[0];
      showModal({
        title,
        message,
        confirmLabel: btn?.text || 'OK',
        onConfirm: btn?.onPress,
        icon: 'information-outline',
      });
    } else {
      const cancelBtn = buttons.find((b) => b.style === 'cancel') || buttons[0];
      const confirmBtn = buttons.find((b) => b.style !== 'cancel') || buttons[1];
      showModal({
        title,
        message,
        cancelLabel: cancelBtn?.text || 'Cancel',
        onCancel: cancelBtn?.onPress,
        confirmLabel: confirmBtn?.text || 'OK',
        onConfirm: confirmBtn?.onPress,
        icon: 'help-circle-outline',
      });
    }
  };
}

export function ModalHost() {
  const [modal, setModal] = React.useState(null);

  React.useEffect(() => {
    return registerModalSubscriber(setModal);
  }, []);

  if (!modal) return null;

  const handleCancel = () => {
    const fn = modal.onCancel;
    closeActiveModal();
    if (typeof fn === 'function') fn();
  };

  const handleConfirm = () => {
    const fn = modal.onConfirm;
    closeActiveModal();
    if (typeof fn === 'function') fn();
  };

  return (
    <Modal
      transparent
      visible={true}
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={s.modalOverlay}>
        <Pressable style={s.modalBackdrop} onPress={handleCancel} />
        <View style={s.modalBox}>
          {modal.icon ? (
            <View style={[s.modalIconWrap, { backgroundColor: modal.iconBg || C.teal50 }]}>
              <Icon name={modal.icon} size={28} color={modal.iconColor || C.primaryDark} />
            </View>
          ) : null}
          <Text style={s.modalTitle}>{modal.title}</Text>
          {modal.message ? <Text style={s.modalMsg}>{modal.message}</Text> : null}
          <View style={s.modalBtns}>
            {modal.cancelLabel ? (
              <Pressable
                accessibilityRole="button"
                onPress={handleCancel}
                style={({ pressed }) => [s.modalBtn, s.modalBtnCancel, pressed && { opacity: 0.85 }]}
              >
                <Text style={s.modalBtnCancelText}>{modal.cancelLabel}</Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              onPress={handleConfirm}
              style={({ pressed }) => [
                s.modalBtn,
                s.modalBtnConfirm,
                modal.isDanger && { backgroundColor: C.errText },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={s.modalBtnConfirmText}>{modal.confirmLabel || 'OK'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function BrandMark({ size = 72, iconSize = 34 }) {
  const { logo } = BRAND.brand;
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.28, backgroundColor: logo.markBackground, alignItems: 'center', justifyContent: 'center', ...shadow }}>
      <Icon name={logo.markIcon} size={iconSize} color={logo.markForeground} />
    </View>
  );
}

export function Btn({ title, onPress, icon, variant = 'primary', disabled, style, small }) {
  const tone = {
    primary: [s.btnP, C.white],
    secondary: [s.btnS, C.primaryDark],
    soft: [s.btnSoft, C.primaryDark],
    danger: [s.btnDanger, C.errText],
  }[variant];
  return (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled}
      style={({ pressed }) => [s.btn, small && s.btnSm, tone[0], pressed && { transform: [{ scale: 0.98 }] }, disabled && { opacity: 0.5 }, style]}>
      <Text style={[s.btnT, small && { fontSize: 13 }, { color: tone[1] }]}>{title}</Text>
      {icon ? <Icon name={icon} color={tone[1]} size={small ? 16 : 20} /> : null}
    </Pressable>
  );
}

export const Card = ({ children, style }) => <View style={[s.card, style]}>{children}</View>;

export function SectionTitle({ icon, title, right, style }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }, style]}>
      {icon ? <Icon name={icon} size={20} color={C.primaryDark} /> : null}
      <Text style={{ flex: 1, fontSize: 18, fontWeight: '700' }}>{title}</Text>
      {right}
    </View>
  );
}

export const fulfillmentLabels = { store_delivery: 'Store delivery', counter_pickup: 'Counter pickup' };
const fulfillmentDetails = {
  store_delivery: ['truck-fast-outline', 'Delivered to your address by the partner pharmacy'],
  counter_pickup: ['storefront-outline', 'Collect from the partner pharmacy counter'],
};

export function FulfillmentChoice({ value, onChange, title = 'How would you like to receive it?' }) {
  return (
    <Card>
      <SectionTitle icon="moped-outline" title={title} />
      <View style={{ gap: 10 }}>
        {Object.entries(fulfillmentLabels).map(([mode, label]) => {
          const on = mode === value;
          return (
            <Pressable key={mode} accessibilityRole="radio" accessibilityState={{ checked: on }}
              onPress={() => onChange(mode)} style={[s.option, on && s.optionOn]}>
              <View style={s.optionIc}><Icon name={fulfillmentDetails[mode][0]} size={20} color={C.primaryDark} /></View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700' }}>{label}</Text>
                <Text style={{ fontSize: 12, color: C.text2 }}>{fulfillmentDetails[mode][1]}</Text>
              </View>
              <Icon name={on ? 'radiobox-marked' : 'radiobox-blank'} size={22} color={on ? C.primaryDark : C.muted} />
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

export function Badge({ text, tone = 'ok', icon }) {
  const t = {
    ok: [C.okBg, C.deep], warn: [C.warnBg, C.warnText], err: [C.errBg, C.errText],
    teal: [C.teal50, C.primary], mint: [C.mint, C.primaryDark], soft: [C.input, C.text2],
  }[tone];
  return (
    <View style={[s.badge, { backgroundColor: t[0] }]}>
      {icon ? <Icon name={icon} size={12} color={t[1]} style={{ marginRight: 3 }} /> : null}
      <Text style={{ color: t[1], fontSize: 11, fontWeight: '700' }}>{text}</Text>
    </View>
  );
}

export const H = ({ children, style }) => <Text style={[{ fontSize: 18, fontWeight: '700', color: C.text }, style]}>{children}</Text>;
export const T = ({ children, style, ...r }) => <Text style={[{ fontSize: 14, color: C.text2, lineHeight: 20 }, style]} {...r}>{children}</Text>;

export function Footer({ children }) {
  return <View style={s.footer}>{children}</View>;
}

export function Stepper({ qty, onChange }) {
  return (
    <View style={s.step}>
      <Pressable accessibilityLabel="Decrease quantity" style={s.stepB} onPress={() => onChange(qty - 1)}><Icon name="minus" size={18} color={C.text} /></Pressable>
      <Text style={{ fontWeight: '700', width: 28, textAlign: 'center', fontSize: 16 }}>{qty}</Text>
      <Pressable accessibilityLabel="Increase quantity" style={[s.stepB, { backgroundColor: C.primaryDark }]} onPress={() => onChange(qty + 1)}><Icon name="plus" size={18} color={C.white} /></Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  btn: { height: 50, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 18 },
  btnSm: { height: 40, borderRadius: 10, paddingHorizontal: 14 },
  btnP: { backgroundColor: C.primaryDark },
  btnS: { borderWidth: 1.5, borderColor: C.primary, backgroundColor: C.white },
  btnSoft: { backgroundColor: C.input },
  btnDanger: { backgroundColor: C.errBg },
  btnT: { fontSize: 15, fontWeight: '700' },
  card: { backgroundColor: C.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: C.border, ...shadow },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, alignSelf: 'flex-start' },
  footer: { padding: 16, backgroundColor: C.white, borderTopWidth: 1, borderColor: C.border },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, backgroundColor: C.highlight, borderWidth: 1.5, borderColor: 'transparent' },
  optionOn: { borderColor: C.primary, backgroundColor: C.teal50 },
  optionIc: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  step: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.input, borderRadius: 12, padding: 4 },
  stepB: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: C.white },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalBox: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: C.white,
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    ...shadow2,
    elevation: 24,
  },
  modalIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalMsg: {
    fontSize: 14,
    color: C.text2,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'stretch',
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: {
    backgroundColor: C.input,
  },
  modalBtnCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text2,
  },
  modalBtnConfirm: {
    backgroundColor: C.primaryDark,
  },
  modalBtnConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.white,
  },
});
