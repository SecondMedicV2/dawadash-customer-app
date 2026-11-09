import React, { useEffect } from 'react';
import { BackHandler, Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/store';
import { useFonts } from 'expo-font';
import { Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import {
  PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { BRAND, C, F } from './src/theme';
import { closeActiveModal, Icon, isModalOpen, ModalHost, showExitConfirmation } from './src/ui';
import { LoginScreen, OtpScreen } from './src/screens/Auth';
import { CatalogScreen } from './src/screens/Catalog';
import { CartScreen } from './src/screens/Cart';
import { OrdersScreen } from './src/screens/Orders';
import { RefillsScreen } from './src/screens/Refills';
import { LabsScreen } from './src/screens/Labs';
import { ScannerScreen } from './src/screens/Misc';
import { ProfileScreen } from './src/screens/Profile';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

import { linking } from './src/navigationConfig.mjs';

// Design tabs: Medicines, Cart & Rx, Approvals, plus Labs. Refills open from Cart & Rx.
function Tabs() {
  const { count } = useApp();
  const icons = { Medicines: 'medical-bag', Cart: 'shopping-outline', Orders: 'clipboard-check-outline', Labs: 'flask-outline' };
  return (
    <Tab.Navigator
      backBehavior="history"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: C.primaryDark,
        tabBarInactiveTintColor: C.muted,
        tabBarLabelStyle: { fontSize: 11, fontFamily: F.b7, marginTop: -2 },
        tabBarIcon: ({ color, focused }) => (
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={icons[route.name]} color={color} size={focused ? 24 : 22} />
          </View>
        ),
        tabBarStyle: {
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
          borderTopColor: C.border,
          borderTopWidth: 1,
          backgroundColor: C.white,
          elevation: 8,
          shadowColor: C.black,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        tabBarBadgeStyle: { backgroundColor: C.primaryDark, fontFamily: F.b7, fontSize: 10 },
      })}
    >
      <Tab.Screen name="Medicines" component={CatalogScreen} />
      <Tab.Screen name="Cart" component={CartScreen} options={{ tabBarLabel: 'Cart & Rx', tabBarBadge: count || undefined }} />
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ tabBarLabel: 'Approvals' }} />
      <Tab.Screen name="Labs" component={LabsScreen} />
    </Tab.Navigator>
  );
}

const hdr = {
  headerTintColor: C.text,
  headerStyle: { backgroundColor: C.white },
  headerTitleStyle: { fontFamily: F.h7, fontSize: 17 },
  headerShadowVisible: false,
  headerBackTitleVisible: false,
};

// Guests land on the catalog; Login/Otp open on top only when an action needs an account.
function Root() {
  return (
    <Stack.Navigator
      screenOptions={{
        ...hdr,
        animation: 'slide_from_right',
      }}
      initialRouteName="Main"
    >
      <Stack.Screen name="Main" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen name="Scanner" component={ScannerScreen} options={{ title: 'Upload Prescription', presentation: 'modal' }} />
      <Stack.Screen name="Refills" component={RefillsScreen} options={{ title: 'Past Prescriptions' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Log in' }} />
      <Stack.Screen name="Otp" component={OtpScreen} options={{ title: 'Verify phone' }} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold,
    PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold,
  });

  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    const handleBack = () => {
      // 1. If an in-app dialog or modal is open, dismiss it
      if (isModalOpen()) {
        closeActiveModal();
        return true;
      }

      // 2. If stack navigator can go back (e.g. from Scanner, Refills, Login, Otp), pop one screen
      if (navigationRef.isReady() && navigationRef.canGoBack()) {
        navigationRef.goBack();
        return true;
      }

      // 3. If tab navigator is on a secondary tab (Cart, Orders, Labs), navigate back to Medicines tab
      if (navigationRef.isReady()) {
        const currentRoute = navigationRef.getCurrentRoute()?.name;
        if (currentRoute && currentRoute !== 'Medicines' && ['Cart', 'Orders', 'Labs'].includes(currentRoute)) {
          navigationRef.navigate('Medicines');
          return true;
        }
      }

      // 4. We are at root (Medicines tab, empty stack, no modal).
      // Check if running inside our native Android wrapper:
      const isAndroidShell = typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.includes(`${BRAND.brand.name}Android`);
      if (isAndroidShell) {
        // Return false so native MainActivity can show the native AlertDialog!
        return false;
      }

      // In browser/PWA (standalone web): show native-styled in-app exit confirmation dialog!
      showExitConfirmation(() => {
        try { window.close(); } catch (_) {}
      });
      return true;
    };

    if (typeof window !== 'undefined') {
      window.handleHardwareBack = handleBack;
    }

    const sub = BackHandler.addEventListener('hardwareBackPress', handleBack);
    return () => {
      sub.remove();
      if (typeof window !== 'undefined') {
        window.handleHardwareBack = undefined;
      }
    };
  }, [navigationRef]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer ref={navigationRef} linking={linking}>
          <StatusBar style={BRAND.brand.theme.statusBarStyle} />
          <Root />
          <ModalHost />
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
}
