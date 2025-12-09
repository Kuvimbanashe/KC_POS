// app/(cashier)/profile.js
import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { StyleSheet } from 'react-native';
import { updateProfile, logout } from '../../store/slices/authSlice';
import { updateUser } from '../../store/slices/userManagementSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { UserProfile } from '../../store/types';
import { useRouter } from 'expo-router';

interface ProfileFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}



const styles = StyleSheet.create({
  s_1: {
  flex: 1,
  padding: 16
},

  s_2: {
  backgroundColor: "#0f172a",
  padding: 24,
  borderRadius: 12
},

  s_3: {
  alignItems: "center"
},

  s_4: {},

  s_5: {
  fontSize: 20
},

  s_6: {
  color: "#f97316",
  fontSize: 18
},

  s_7: {
  padding: 16,
  borderRadius: 12
},

  s_8: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 16
},

  s_9: {
  fontSize: 18
},

  s_10: {},

  s_11: {},

  s_12: {},

  s_13: {
  padding: 16,
  borderRadius: 12
},

  s_14: {
  fontSize: 18,
  marginBottom: 16
},

  s_15: {
  borderWidth: 1,
  borderRadius: 12,
  padding: 12
},

  s_16: {
  backgroundColor: "#0f172a",
  paddingVertical: 12,
  borderRadius: 12
},

  s_17: {},

  s_18: {
  paddingVertical: 12,
  borderRadius: 12
},

  s_19: {}
});
export default function CashierProfileScreen() {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    address: user?.address ?? '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSaveProfile = () => {
    if (!formData.name || !formData.email) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'Unable to update profile at this time.');
      return;
    }

    const updatedData: Partial<UserProfile> = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
    };

    dispatch(updateProfile(updatedData));
    dispatch(updateUser({ id: user.id, ...updatedData }));
    setIsEditing(false);
    Alert.alert('Success', 'Profile updated successfully');
  };

  const handleChangePassword = () => {
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    Alert.alert('Success', 'Password changed successfully');
    setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleLogout = () => {
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
    <ScrollView style={styles.s_1}>


      {/* Profile Header */}
      <View style={styles.s_2}>
        <View style={styles.s_3}>
 
          <Text style={styles.s_4}>
            {user?.name}
          </Text>
          <Text style={styles.s_5}>
            {user?.email}
          </Text>
          <Text style={styles.s_6}>
            Cashier
          </Text>
        </View>
      </View>

      {/* Personal Information */}
      <View style={styles.s_7}>
        <View style={styles.s_8}>
          <Text style={styles.s_9}>
            Personal Information
          </Text>
          <TouchableOpacity
            onPress={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
          >
            <Text style={styles.s_10}>
              {isEditing ? 'Save' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.s_11}>
          <View>
            <Text style={styles.s_12}>Full Name</Text>
            <TextInput
              className={`border rounded-lg p-3 ${
                isEditing ? 'border-primary-orange-400 bg-gray-50' : 'border-gray-300 bg-gray-100'
              }`}
              value={formData.name}
              onChangeText={(text) => setFormData({...formData, name: text})}
              editable={isEditing}
            />
          </View>

          <View>
            <Text style={styles.s_12}>Email</Text>
            <TextInput
              className={`border rounded-lg p-3 ${
                isEditing ? 'border-primary-orange-400 bg-gray-50' : 'border-gray-300 bg-gray-100'
              }`}
              value={formData.email}
              onChangeText={(text) => setFormData({...formData, email: text})}
              editable={isEditing}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View>
            <Text style={styles.s_12}>Phone</Text>
            <TextInput
              className={`border rounded-lg p-3 ${
                isEditing ? 'border-primary-orange-400 bg-gray-50' : 'border-gray-300 bg-gray-100'
              }`}
              value={formData.phone}
              onChangeText={(text) => setFormData({...formData, phone: text})}
              editable={isEditing}
              keyboardType="phone-pad"
            />
          </View>

          <View>
            <Text style={styles.s_12}>Address</Text>
            <TextInput
              className={`border rounded-lg p-3 ${
                isEditing ? 'border-primary-orange-400 bg-gray-50' : 'border-gray-300 bg-gray-100'
              }`}
              value={formData.address}
              onChangeText={(text) => setFormData({...formData, address: text})}
              editable={isEditing}
              multiline
            />
          </View>
        </View>
      </View>

      {/* Change Password */}
      <View className="bg-white p-4 rounded-lg ">
        <Text style={styles.s_14}>
          Change Password
        </Text>

        <View style={styles.s_11}>
          <TextInput
            style={styles.s_15}
            placeholder="Current Password"
            value={formData.currentPassword}
            onChangeText={(text) => setFormData({...formData, currentPassword: text})}
            secureTextEntry
          />
          
          <TextInput
            style={styles.s_15}
            placeholder="New Password"
            value={formData.newPassword}
            onChangeText={(text) => setFormData({...formData, newPassword: text})}
            secureTextEntry
          />
          
          <TextInput
            style={styles.s_15}
            placeholder="Confirm New Password"
            value={formData.confirmPassword}
            onChangeText={(text) => setFormData({...formData, confirmPassword: text})}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.s_16}
            onPress={handleChangePassword}
          >
            <Text style={styles.s_17}>
              Change Password
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout */}
      <View className="bg-white p-4 rounded-lg ">
        <Text style={styles.s_14}>
          Session
        </Text>
        <TouchableOpacity
          style={styles.s_18}
          onPress={handleLogout}
        >
          <Text style={styles.s_19}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}