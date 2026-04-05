// app/(cashier)/_layout.js
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAppSelector } from '../../store/hooks';

export default function CashierLayout() {
  const router = useRouter();
  const { isAuthenticated, userType } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated || userType !== 'cashier') {
      router.replace('/(auth)');
    }
  }, [isAuthenticated, router, userType]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FB923C',
        tabBarInactiveTintColor: '#1E3A8A',
        headerStyle: {
          backgroundColor: '#0d1938',
        },
        headerTintColor: '#FFFFFF',
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
  );
}
