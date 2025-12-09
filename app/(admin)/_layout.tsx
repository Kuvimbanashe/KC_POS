// app/(admin)/_layout.tsx
import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import {
  DrawerContentScrollView,
  DrawerItemList,
  type DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { logout } from '../../store/slices/authSlice';
import { useRouter } from 'expo-router';
import { useAppDispatch } from '../../store/hooks';

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleLogout = () => {
    dispatch(logout());
    router.replace('/(auth)');
  };

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
        onPress={handleLogout}
      >
        <Text style={{ color: '#FFFFFF', fontSize: 16 }}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

export default function AdminLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0d1938',
        },
        headerTintColor: '#FFFFFF',
        drawerActiveTintColor: '#FB923C',
        drawerInactiveTintColor: '#FFFFFF',
        drawerStyle: {
          backgroundColor: '#1E3A8A',
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
  );
}