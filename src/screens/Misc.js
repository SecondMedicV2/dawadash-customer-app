import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { BRAND, C } from '../theme';
import { BrandMark, Btn, Card, H, T } from '../ui';
import { useApp } from '../store';
import { compressPrescriptionPhoto, removeTemporaryPhoto } from '../prescriptionPhoto';

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
        Alert.alert('Photo exceeds 500 KB', 'Retake the photo or choose a PDF.');
        return;
      }
      const { uri, mimeType, file } = asset;
      const input = { uri, mimeType, file, source };
      const orderId = route.params?.orderId;
      if (orderId) await replaceOrderPrescription(orderId, input);
      else await attachPrescription(input);
      if (navigation.isFocused()) navigation.goBack();
    } catch {
      Alert.alert('Prescription not attached', 'Please try again.');
    } finally {
      removeTemporaryPhoto(originalPhoto);
      removeTemporaryPhoto(compressedPhoto);
      setBusy(false);
    }
  };

  const takePhoto = () => select('camera', async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera permission needed', 'Allow camera access or choose a PDF.');
      return { canceled: true };
    }
    return ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: false });
  });

  const choosePdf = () => select('pdf', () =>
    DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: false })
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, padding: 16, gap: 12 }}>
      <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
        <BrandMark size={64} iconSize={30} />
        <H style={{ marginTop: 10 }}>Upload a prescription</H>
        <T style={{ textAlign: 'center', marginTop: 6 }}>{BRAND.brand.disclaimers.prescriptionImage}</T>
      </Card>
      <Btn title="Take a photo" icon="camera" disabled={busy} onPress={takePhoto} />
      <Btn title="Choose a PDF" icon="file-pdf-box" variant="secondary" disabled={busy} onPress={choosePdf} />
    </View>
  );
}
