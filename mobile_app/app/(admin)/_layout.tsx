import { useEffect } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import { Tabs, useRootNavigationState, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SystemUI from 'expo-system-ui';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';

const NAVY = '#0d1938';
const ORANGE = '#FB923C';

export default function AdminLayout() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const { isAuthenticated, isLoading, userType } = useAppSelector((state) => state.auth);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(NAVY).catch(() => {});

    return () => {
      SystemUI.setBackgroundColorAsync('#ffffff').catch(() => {});
    };
  }, []);

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

    if (userType !== 'admin') {
      router.replace(userType === 'cashier' ? '/(cashier)' : '/(auth)');
    }
  }, [isAuthenticated, isLoading, navigationState?.key, router, userType]);

  if (isLoading || !navigationState?.key || !isAuthenticated || userType !== 'admin') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#FB923C" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: NAVY }} edges={['bottom']}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <View style={{ flex: 1, backgroundColor: NAVY }}>
        <Tabs
          backBehavior="history"
          screenOptions={{
            headerStyle: {
              backgroundColor: NAVY,
            },
            headerTintColor: '#FFFFFF',
            headerShadowVisible: false,
            sceneStyle: {
              backgroundColor: '#ffffff',
            },
            tabBarActiveTintColor: ORANGE,
            tabBarInactiveTintColor: '#1e3a8a',
            tabBarHideOnKeyboard: true,
            tabBarStyle: {
              height: 64,
              paddingTop: 8,
              paddingBottom: 10,
              backgroundColor: '#ffffff',
              borderTopColor: '#e2e8f0',
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '700',
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
            name="sales"
            options={{
              title: 'Sales',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="trending-up" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="stock"
            options={{
              title: 'Inventory',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="cube" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="reports"
            options={{
              title: 'Reports',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="document-text" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="(more)"
            options={{
              title: 'More',
              headerShown: false,
              tabBarStyle: {
                display: 'none',
              },
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="grid" size={size} color={color} />
              ),
            }}
          />
        </Tabs>
      </View>
    </SafeAreaView>
  );
}
