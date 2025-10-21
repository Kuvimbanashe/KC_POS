// app/(admin)/_layout.tsx
import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { View, Text, TouchableOpacity } from 'react-native';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { useRouter } from 'expo-router';

function CustomDrawerContent(props) {
  const dispatch = useDispatch();
  const router = useRouter();

  const handleLogout = () => {
    dispatch(logout());
    router.replace('/(auth)');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#1E3A8A' }}>
      <View style={{ padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#FB923C' }}>
        <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' }}>Shop Manager</Text>
        <Text style={{ color: '#FB923C' }}>Admin Panel</Text>
      </View>
      
      <DrawerContentScrollView {...props} style={{ backgroundColor: '#1E3A8A' }}>
        {/* This renders all your drawer items */}
        <DrawerItemList {...props} />
      </DrawerContentScrollView>
      
      <TouchableOpacity
        style={{ padding: 16, borderTopWidth: 1, borderTopColor: '#FB923C' }}
        onPress={handleLogout}
      >
        <Text style={{ color: '#FFFFFF', fontSize: 16 }}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function AdminLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1E3A8A',
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
        name="accounting"
        options={{
          title: 'Accounting',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="calculator" size={size} color={color} />
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