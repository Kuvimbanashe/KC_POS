// app/(cashier)/_layout.js
import { ActivityIndicator, Alert, Text, TouchableOpacity } from 'react-native';
import { Tabs, useRootNavigationState } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CashierLayout() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const { isAuthenticated, isLoading, userType } = useAppSelector((state) => state.auth);

  const confirmLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          dispatch(logout());
          router.replace('/(auth)');
        },
      },
    ]);
  };

  useEffect(() => {
    if (isLoading || !navigationState?.key) return;

    if (!isAuthenticated) {
      router.replace('/(auth)');
      return;
    }

    if (userType !== 'cashier') {
      router.replace(userType === 'admin' ? '/(admin)' : '/(auth)');
    }
  }, [isAuthenticated, isLoading, navigationState?.key, router, userType]);

  if (isLoading || !navigationState?.key || !isAuthenticated || userType !== 'cashier') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0d1938', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#FB923C" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0d1938' }} edges={['bottom']}>
      <StatusBar style="light" backgroundColor="#0d1938" />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#FB923C',
          tabBarInactiveTintColor: '#1E3A8A',
          headerStyle: {
            backgroundColor: '#0d1938',
          },

          headerTintColor: '#FFFFFF',
          tabBarStyle: {
              height: 64,
              paddingTop: 8,
              paddingBottom: 10,
              backgroundColor: '#ffffff',
              borderTopColor: '#e2e8f0',
            },
          headerRight: () => (
            <TouchableOpacity
              onPress={confirmLogout}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 14,
                paddingVertical: 8,
                marginRight: 12,
                borderRadius: 999,
                backgroundColor: '#1e293b',
              }}
            >
              <Ionicons name="log-out-outline" size={16} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>Logout</Text>
            </TouchableOpacity>
          ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="sell"
          options={{
            title: 'Sell',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cart" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}
