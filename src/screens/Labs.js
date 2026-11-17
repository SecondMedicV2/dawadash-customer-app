import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Badge, Btn, Card, Icon, T, Text } from '../ui';
import { C } from '../theme';
import { Header } from './Catalog';

export function LabsScreen({ navigation }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <View>
          <Text style={{ fontSize: 24, fontWeight: '800' }}>Diagnostics & Lab Tests</Text>
          <Text style={{ fontSize: 13, color: C.text2 }}>Verified NABL-certified home sample collection across Lucknow.</Text>
        </View>

        <Card style={{ alignItems: 'center', padding: 24, gap: 12 }}>
          <View style={s.ic}><Icon name="flask-outline" size={34} color={C.primaryDark} /></View>
          <Badge text="Diagnostic partners onboarding" tone="mint" />
          <Text style={{ fontSize: 18, fontWeight: '700', textAlign: 'center' }}>
            Diagnostic Lab Bookings Launching Soon
          </Text>
          <T style={{ textAlign: 'center' }}>
            We are onboarding certified diagnostic centers in Lucknow for live home sample collection. Verified pharmacy orders and delivery are active now.
          </T>
          <Btn
            title="Browse verified medicines"
            icon="medical-bag"
            onPress={() => navigation.navigate('Medicines')}
            style={{ alignSelf: 'stretch', marginTop: 6 }}
          />
        </Card>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  ic: { width: 68, height: 68, borderRadius: 20, backgroundColor: C.teal50, borderWidth: 1, borderColor: C.mint, alignItems: 'center', justifyContent: 'center' },
});
