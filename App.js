import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/store';
import { BRAND, C } from './src/theme';
import { Icon } from './src/ui';
import { LoginScreen, OtpScreen } from './src/screens/Auth';
import { CatalogScreen } from './src/screens/Catalog';
import { CartScreen } from './src/screens/Cart';
import { OrdersScreen } from './src/screens/Orders';
import { RefillsScreen } from './src/screens/Refills';
import { LabsScreen } from './src/screens/Labs';
import { ScannerScreen } from './src/screens/Misc';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function Tabs() {
  const { count } = useApp();
  const icons = { Medicines: 'pill', Cart: 'cart-outline', Refills: 'autorenew', Labs: 'flask-outline', Orders: 'clipboard-list-outline' };
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerShown: false, tabBarActiveTintColor: C.primaryDark, tabBarInactiveTintColor: C.muted,
      tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      tabBarIcon: ({ color }) => <Icon name={icons[route.name]} color={color} size={24} />,
      tabBarStyle: { height: 62, paddingBottom: 6, paddingTop: 4 },
    })}>
      <Tab.Screen name="Medicines" component={CatalogScreen} />
      <Tab.Screen name="Cart" component={CartScreen} options={{ tabBarBadge: count || undefined }} />
      <Tab.Screen name="Refills" component={RefillsScreen} />
      <Tab.Screen name="Labs" component={LabsScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
    </Tab.Navigator>
  );
}

const hdr = { headerTintColor: C.text, headerStyle: { backgroundColor: C.white }, headerTitleStyle: { fontWeight: '700' }, headerShadowVisible: false };

// Guests land on the catalog; Login/Otp open on top only when an action needs an account.
function Root() {
  return (
    <Stack.Navigator screenOptions={hdr} initialRouteName="Main">
      <Stack.Screen name="Main" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen name="Scanner" component={ScannerScreen} options={{ title: 'Upload Prescription', presentation: 'modal' }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Log in' }} />
      <Stack.Screen name="Otp" component={OtpScreen} options={{ title: 'Verify phone' }} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer>
          <StatusBar style={BRAND.brand.theme.statusBarStyle} />
          <Root />
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
}
