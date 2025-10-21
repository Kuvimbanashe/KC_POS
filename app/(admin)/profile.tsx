// app/(admin)/profile.js
import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile } from '../../store/slices/authSlice';
import { updateUser } from '../../store/slices/userManagementSlice';

export default function AdminProfileScreen() {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSaveProfile = () => {
    if (!formData.name || !formData.email) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    const updatedData = {
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

    // In a real app, you would verify current password with backend
    Alert.alert('Success', 'Password changed successfully');
    setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  return (
    <ScrollView className="flex-1 bg-primary-white p-4">
      <Text className="text-2xl font-bold text-primary-navy-dark mb-6">
        Profile Settings
      </Text>

      {/* Personal Information */}
      <View className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-semibold text-primary-navy-dark">
            Personal Information
          </Text>
          <TouchableOpacity
            onPress={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
          >
            <Text className="text-primary-orange-400 font-semibold">
              {isEditing ? 'Save' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="space-y-3">
          <View>
            <Text className="text-gray-600 mb-1">Full Name</Text>
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
            <Text className="text-gray-600 mb-1">Email</Text>
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
            <Text className="text-gray-600 mb-1">Phone</Text>
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
            <Text className="text-gray-600 mb-1">Address</Text>
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
      <View className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <Text className="text-lg font-semibold text-primary-navy-dark mb-4">
          Change Password
        </Text>

        <View className="space-y-3">
          <TextInput
            className="border border-gray-300 rounded-lg p-3 bg-gray-50"
            placeholder="Current Password"
            value={formData.currentPassword}
            onChangeText={(text) => setFormData({...formData, currentPassword: text})}
            secureTextEntry
          />
          
          <TextInput
            className="border border-gray-300 rounded-lg p-3 bg-gray-50"
            placeholder="New Password"
            value={formData.newPassword}
            onChangeText={(text) => setFormData({...formData, newPassword: text})}
            secureTextEntry
          />
          
          <TextInput
            className="border border-gray-300 rounded-lg p-3 bg-gray-50"
            placeholder="Confirm New Password"
            value={formData.confirmPassword}
            onChangeText={(text) => setFormData({...formData, confirmPassword: text})}
            secureTextEntry
          />

          <TouchableOpacity
            className="bg-primary-orange-400 py-3 rounded-lg"
            onPress={handleChangePassword}
          >
            <Text className="text-primary-white text-center font-semibold">
              Change Password
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Account Information */}
      <View className="bg-white p-4 rounded-lg shadow-sm">
        <Text className="text-lg font-semibold text-primary-navy-dark mb-4">
          Account Information
        </Text>

        <View className="space-y-2">
          <View className="flex-row justify-between">
            <Text className="text-gray-600">User Role</Text>
            <Text className="text-primary-navy-dark font-semibold">Administrator</Text>
          </View>
          
          <View className="flex-row justify-between">
            <Text className="text-gray-600">Account Status</Text>
            <Text className="text-green-600 font-semibold">Active</Text>
          </View>
          
          <View className="flex-row justify-between">
            <Text className="text-gray-600">Last Login</Text>
            <Text className="text-primary-navy-dark">
              {new Date().toLocaleString()}
            </Text>
          </View>
          
          <View className="flex-row justify-between">
            <Text className="text-gray-600">Member Since</Text>
            <Text className="text-primary-navy-dark">
              {new Date('2024-01-15').toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}