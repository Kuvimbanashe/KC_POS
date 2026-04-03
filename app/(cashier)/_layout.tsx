// app/(cashier)/_layout.js
import { Alert, Text, TouchableOpacity } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useAppDispatch } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';

export default function CashierLayout() {
  const dispatch = useAppDispatch();
  const router = useRouter();

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

  return (
    <>
      <StatusBar style="light" backgroundColor="#0d1938" />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#FB923C',
          tabBarInactiveTintColor: '#1E3A8A',
          headerStyle: {
            backgroundColor: '#0d1938',
          },
          headerTintColor: '#FFFFFF',
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
    </>
  );
}
