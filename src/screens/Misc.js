import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { BRAND, C, shadow2 } from '../theme';
import { Icon, notify, Text } from '../ui';
import { useApp } from '../store';
import { compressPrescriptionPhoto, removeTemporaryPhoto } from '../prescriptionPhoto';

const Corner = ({ style }) => <View style={[s.corner, style]} />;

export function ScannerScreen({ navigation, route }) {
  const { attachPrescription, replaceOrderPrescription } = useApp();
  const [busy, setBusy] = useState(false);

  const select = async (source, pick) => {
    setBusy(true);
    let originalPhoto;
    let compressedPhoto;
    try {
      const result = await pick();
      if (result.canceled) return;
      let asset = result.assets[0];
      if (source === 'camera') {
        originalPhoto = asset.uri;
        asset = await compressPrescriptionPhoto(asset);
        compressedPhoto = asset?.uri;
      }
      if (!asset) {
        notify('Photo exceeds 500 KB', 'Retake the photo or choose a PDF.');
        return;
      }
      const { uri, mimeType, file } = asset;
      const input = { uri, mimeType, file, source };
      const orderId = route.params?.orderId;
      if (orderId) await replaceOrderPrescription(orderId, input);
      else await attachPrescription(input);
      if (navigation.isFocused()) navigation.goBack();
    } catch {
      notify('Prescription not attached', 'Please try again.');
    } finally {
      removeTemporaryPhoto(originalPhoto);
      removeTemporaryPhoto(compressedPhoto);
      setBusy(false);
    }
  };

  const takePhoto = () => select('camera', async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      notify('Camera permission needed', 'Allow camera access or choose a PDF.');
      return { canceled: true };
    }
    return ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: false });
  });

  const choosePdf = () => select('pdf', () =>
    DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: false })
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16 }}>
      <View style={s.panel}>
        <View style={s.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.white, fontSize: 18, fontWeight: '700' }}>Scan prescription</Text>
            <Text style={{ color: C.softMint, fontSize: 11, fontWeight: '600' }}>{BRAND.brand.name} Express</Text>
          </View>
          <View style={s.hint}>
            <Icon name="information-outline" size={14} color={C.softMint} />
            <Text style={{ color: C.white, fontSize: 11, flexShrink: 1 }}>Doctor signature & patient name visible</Text>
          </View>
        </View>

        <View style={s.frame}>
          <Corner style={{ top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 14 }} />
          <Corner style={{ top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 14 }} />
          <Corner style={{ bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 14 }} />
          <Corner style={{ bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 14 }} />
          <Icon name="file-document-outline" size={64} color={C.softMint} />
          <View style={s.align}><Text style={{ color: C.white, fontSize: 13, fontWeight: '700', letterSpacing: 0.4 }}>ALIGN PRESCRIPTION WITHIN FRAME</Text></View>
          <Text style={{ color: C.softMint, fontSize: 12, textAlign: 'center', marginTop: 10, paddingHorizontal: 12 }}>{BRAND.brand.disclaimers.prescriptionImage}</Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16 }}>
          <View style={s.modeOn}><Text style={{ color: C.white, fontSize: 13, fontWeight: '700' }}>Prescription</Text></View>
        </View>

        <View style={s.controls}>
          <Pressable accessibilityRole="button" accessibilityLabel="Choose a PDF" disabled={busy} onPress={choosePdf} style={s.side}>
            <Icon name="file-pdf-box" size={24} color={C.white} />
            <Text style={{ color: C.white, fontSize: 11, fontWeight: '600' }}>PDF</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Take a photo" disabled={busy} onPress={takePhoto}
            style={({ pressed }) => [s.shutterRing, (pressed || busy) && { opacity: 0.8 }]}>
            <View style={s.shutter}><Icon name={busy ? 'timer-sand' : 'camera'} size={30} color={C.white} /></View>
          </Pressable>
          <View style={[s.side, { opacity: 0 }]} />
        </View>
      </View>

      <Text style={{ fontSize: 12, color: C.text2, textAlign: 'center', marginTop: 14 }}>
        Tap the camera to photograph your prescription, or choose a PDF. Photos are compressed to under 500 KB.
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  panel: { backgroundColor: C.text, borderRadius: 24, padding: 16, ...shadow2 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hint: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8 },
  frame: { marginTop: 16, height: 320, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  corner: { position: 'absolute', width: 36, height: 36, borderColor: C.softMint },
  align: { marginTop: 14, backgroundColor: C.primaryDark, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  modeOn: { backgroundColor: C.primaryDark, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, paddingHorizontal: 12 },
  side: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', gap: 2 },
  shutterRing: { width: 86, height: 86, borderRadius: 43, borderWidth: 4, borderColor: C.softMint, alignItems: 'center', justifyContent: 'center' },
  shutter: { width: 68, height: 68, borderRadius: 34, backgroundColor: C.primaryDark, alignItems: 'center', justifyContent: 'center' },
});
