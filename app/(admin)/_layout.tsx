// app/(admin)/_layout.tsx
import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import {
  DrawerContentScrollView,
  DrawerItemList,
  type DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { Alert, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { logout } from '../../store/slices/authSlice';
import { useRouter } from 'expo-router';
import { useAppDispatch } from '../../store/hooks';

function CustomDrawerContent(props: DrawerContentComponentProps & { onLogoutPress: () => void }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0d1938' }}>
      <View style={{ padding: 16, paddingTop: 16, borderBottomWidth: 1, borderBottomColor: '#fff' }}>
        <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' }}>Shop Manager</Text>
        <Text style={{ color: '#FB923C' }}>Admin Panel</Text>
      </View>
      
      <DrawerContentScrollView {...props} style={{ backgroundColor: '#0d1938' }}>
        {/* This renders all your drawer items */}
        <DrawerItemList {...props} />
      </DrawerContentScrollView>
      
      <TouchableOpacity
        style={{ padding: 16, borderTopWidth: 1, borderTopColor: '#fff' }}
        onPress={props.onLogoutPress}
      >
        <Text style={{ color: '#FFFFFF', fontSize: 16 }}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

export default function AdminLayout() {
  const insets = useSafeAreaInsets();
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
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} onLogoutPress={confirmLogout} />}
        screenOptions={{
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
          drawerActiveTintColor: '#FB923C',
          drawerInactiveTintColor: '#FFFFFF',
          drawerStyle: {
            backgroundColor: '#1E3A8A',
          },
          sceneStyle: {
            backgroundColor: '#ffffff',
            paddingBottom: insets.bottom,
          },
        }}
      >
        <Drawer.Screen
          name="index"
          options={{
            title: 'Dashboard',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="sales"
          options={{
            title: 'Sales',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="trending-up" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="purchases"
          options={{
            title: 'Purchases',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="cart" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="stock"
          options={{
            title: 'Stock',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="cube" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="expenses"
          options={{
            title: 'Expenses',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="cash" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="reports"
          options={{
            title: 'Reports',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="document-text" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="assets"
          options={{
            title: 'Assets Management',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="cube" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="users"
          options={{
            title: 'User Management',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="people" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="profile"
          options={{
            title: 'Profile',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
      </Drawer>
    </>
  );
}
