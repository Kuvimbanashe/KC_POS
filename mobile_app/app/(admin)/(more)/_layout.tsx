import { Alert, Text, TouchableOpacity } from 'react-native';
import { Stack, useNavigation, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAppDispatch } from '../../../store/hooks';
import { logout } from '../../../store/slices/authSlice';
import { SafeAreaView } from 'react-native-safe-area-context';

const NAVY = '#0d1938';

export default function AdminMoreLayout() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const navigation = useNavigation();

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

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(admin)');
  };

  return (
    
      <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: NAVY,
        },
        headerTintColor: '#FFFFFF',
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: '#ffffff',
        },
        headerLeft: () => (
          <TouchableOpacity
            onPress={handleBackPress}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 12,
              paddingVertical: 8,
              marginLeft: 12,
               marginRight: 20,
              borderRadius: 999,
              backgroundColor: '#1e293b',
            }}
          >
            <Ionicons name="arrow-back-outline" size={16} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>Back</Text>
          </TouchableOpacity>
        ),
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
      <Stack.Screen
        name="index"
        options={{
          title: 'More',
        }}
      />
      <Stack.Screen
        name="expenses"
        options={{
          title: 'Expenses',
        }}
      />
      <Stack.Screen
        name="purchases"
        options={{
          title: 'Purchases',
        }}
      />
      <Stack.Screen
        name="assets"
        options={{
          title: 'Assets',
        }}
      />
      <Stack.Screen
        name="users"
        options={{
          title: 'Users',
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Stack>

    
  );
}
