// app/(admin)/profile.tsx
import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  Modal,
  ActivityIndicator
} from 'react-native';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { Ionicons } from '@expo/vector-icons';
import { updateProfile } from '../../store/slices/authSlice';
import { updateUser } from '../../store/slices/userManagementSlice';

interface ProfileFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const AdminProfile = () => {
  const { user } = useAppSelector(state => state.auth);
  const { users } = useAppSelector(state => state.userManagement);
  const dispatch = useAppDispatch();
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  
  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
      });
    }
  }, [user]);

  if (!user) {
    return (
      <View className="flex-1 bg-background justify-center items-center p-6">
        <Ionicons name="person-circle-outline" size={64} className="text-muted-foreground mb-4" />
        <Text className="text-xl font-semibold text-foreground mb-2">User not found</Text>
        <Text className="text-muted-foreground text-center">Please log in to view your profile</Text>
      </View>
    );
  }

  const handleProfileUpdate = async () => {
    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!profileForm.email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      // Update in auth slice
      dispatch(updateProfile(profileForm));
      
      // Update in user management slice
      const currentUser = users.find(u => u.id === user.id);
      if (currentUser) {
        dispatch(updateUser({ 
          id: user.id, 
          ...profileForm 
        }));
      }

      Alert.alert('Success', 'Profile updated successfully');
      setIsEditOpen(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      // In a real app, you would verify current password with backend
      // For now, we'll just simulate the process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert('Success', 'Password changed successfully');
      setIsPasswordOpen(false);
      setPasswordForm({ 
        currentPassword: '', 
        newPassword: '', 
        confirmPassword: '' 
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const profileInfo = [
    {
      icon: 'person-outline' as const,
      label: 'Full Name',
      value: user.name,
    },
    {
      icon: 'mail-outline' as const,
      label: 'Email',
      value: user.email,
    },
    {
      icon: 'call-outline' as const,
      label: 'Phone',
      value: user.phone || 'Not provided',
    },
    {
      icon: 'location-outline' as const,
      label: 'Address',
      value: user.address || 'Not provided',
    },
    {
      icon: 'shield-checkmark-outline' as const,
      label: 'Role',
      value: 'Administrator',
    },
    {
      icon: 'calendar-outline' as const,
      label: 'Member Since',
      value: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
    },
  ];

  const settingsOptions = [
    {
      icon: 'create-outline' as const,
      title: 'Update Profile',
      description: 'Update your personal information',
      onPress: () => setIsEditOpen(true),
    },
    {
      icon: 'key-outline' as const,
      title: 'Change Password',
      description: 'Update your password',
      onPress: () => setIsPasswordOpen(true),
    },
    {
      icon: 'shield-checkmark-outline' as const,
      title: 'Security Settings',
      description: 'Manage security preferences',
      onPress: () => Alert.alert('Coming Soon', 'This feature is coming soon'),
    },
    {
      icon: 'notifications-outline' as const,
      title: 'Notifications',
      description: 'Configure notification settings',
      onPress: () => Alert.alert('Coming Soon', 'This feature is coming soon'),
    },
  ];

  const stats = [
    {
      label: 'Last Login',
      value: 'Today, 09:30 AM',
    },
    {
      label: 'Account Status',
      value: 'Active',
      badge: true,
      type: 'success' as const,
    },
    {
      label: 'Two-Factor Auth',
      value: 'Disabled',
      badge: true,
      type: 'warning' as const,
    },
    {
      label: 'Login Sessions',
      value: '1 Active',
    },
  ];

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1">
        <View className="p-4">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-3xl font-bold text-foreground mb-2">
              My Profile
            </Text>
            <Text className="text-muted-foreground">
              View and manage your account settings
            </Text>
          </View>

          {/* User Profile Card */}
          <View className="bg-card rounded-2xl border border-border p-6 mb-6">
            <View className="flex-row items-center mb-6">
              <View className="w-20 h-20 bg-accent rounded-full items-center justify-center mr-4">
                <Text className="text-2xl font-bold text-accent-foreground">
                  {user.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-2xl font-bold text-foreground mb-1">
                  {user.name}
                </Text>
                <Text className="text-muted-foreground mb-2">
                  {user.email}
                </Text>
                <View className="flex-row items-center">
                  <View className="px-3 py-1 bg-accent/10 rounded-full">
                    <Text className="text-sm font-medium text-accent">
                      Administrator
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Profile Information */}
            <Text className="text-lg font-semibold text-foreground mb-4">
              Profile Information
            </Text>
            <View className="space-y-3">
              {profileInfo.map((item, index) => (
                <View 
                  key={index}
                  className="flex-row items-start p-4 bg-secondary/50 rounded-xl"
                >
                  <Ionicons 
                    name={item.icon} 
                    size={20} 
                    className="text-muted-foreground mr-4 mt-0.5"
                  />
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-muted-foreground mb-1">
                      {item.label}
                    </Text>
                    <Text className="text-foreground">
                      {item.value}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Account Settings */}
          <View className="bg-card rounded-2xl border border-border p-6 mb-6">
            <Text className="text-lg font-semibold text-foreground mb-4">
              Account Settings
            </Text>
            <Text className="text-muted-foreground mb-6">
              Manage your account preferences
            </Text>
            
            <View className="space-y-3">
              {settingsOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  className="flex-row items-center p-4 border border-border rounded-xl bg-background"
                  onPress={option.onPress}
                  activeOpacity={0.7}
                >
                  <View className="w-10 h-10 bg-secondary rounded-lg items-center justify-center mr-4">
                    <Ionicons name={option.icon} size={20} className="text-foreground" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground mb-1">
                      {option.title}
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      {option.description}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} className="text-muted-foreground" />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Account Statistics */}
          <View className="bg-card rounded-2xl border border-border p-6">
            <Text className="text-lg font-semibold text-foreground mb-6">
              Account Statistics
            </Text>
            <View className="grid grid-cols-2 gap-4">
              {stats.map((stat, index) => (
                <View 
                  key={index} 
                  className="bg-background p-4 rounded-xl border border-border"
                >
                  <Text className="text-sm font-medium text-muted-foreground mb-2">
                    {stat.label}
                  </Text>
                  {stat.badge ? (
                    <View className={`px-3 py-1 rounded-full self-start ${
                      stat.type === 'success' 
                        ? 'bg-green-100' 
                        : 'bg-yellow-100'
                    }`}>
                      <Text className={`text-sm font-medium ${
                        stat.type === 'success' 
                          ? 'text-green-800' 
                          : 'text-yellow-800'
                      }`}>
                        {stat.value}
                      </Text>
                    </View>
                  ) : (
                    <Text className="text-lg font-semibold text-foreground">
                      {stat.value}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Update Profile Modal */}
      <Modal
        visible={isEditOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsEditOpen(false)}
      >
        <View className="flex-1 bg-background pt-4">
          <View className="flex-row justify-between items-center px-6 pb-4 border-b border-border">
            <Text className="text-2xl font-bold text-foreground">
              Update Profile
            </Text>
            <TouchableOpacity 
              onPress={() => setIsEditOpen(false)}
              className="p-2"
            >
              <Ionicons name="close" size={24} className="text-foreground" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
            <View className="space-y-6">
              <View>
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Full Name *
                </Text>
                <TextInput
                  value={profileForm.name}
                  onChangeText={(text) => setProfileForm({ ...profileForm, name: text })}
                  placeholder="Enter your full name"
                  className="bg-background border border-input rounded-xl px-4 py-3 text-foreground"
                  placeholderTextColor="#6B7280"
                />
              </View>

              <View>
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Email Address *
                </Text>
                <TextInput
                  value={profileForm.email}
                  onChangeText={(text) => setProfileForm({ ...profileForm, email: text })}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="bg-background border border-input rounded-xl px-4 py-3 text-foreground"
                  placeholderTextColor="#6B7280"
                />
              </View>

              <View>
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Phone Number
                </Text>
                <TextInput
                  value={profileForm.phone}
                  onChangeText={(text) => setProfileForm({ ...profileForm, phone: text })}
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                  className="bg-background border border-input rounded-xl px-4 py-3 text-foreground"
                  placeholderTextColor="#6B7280"
                />
              </View>

              <View>
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Address
                </Text>
                <TextInput
                  value={profileForm.address}
                  onChangeText={(text) => setProfileForm({ ...profileForm, address: text })}
                  placeholder="Enter your address"
                  multiline
                  numberOfLines={3}
                  className="bg-background border border-input rounded-xl px-4 py-3 text-foreground min-h-[100px]"
                  placeholderTextColor="#6B7280"
                  textAlignVertical="top"
                />
              </View>
            </View>

            <View className="flex-row space-x-3 mt-8">
              <TouchableOpacity
                className="flex-1 py-4 border border-input rounded-xl"
                onPress={() => setIsEditOpen(false)}
              >
                <Text className="text-center font-semibold text-foreground">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-accent py-4 rounded-xl"
                onPress={handleProfileUpdate}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-center font-semibold text-accent-foreground">
                    Save Changes
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={isPasswordOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsPasswordOpen(false)}
      >
        <View className="flex-1 bg-background pt-4">
          <View className="flex-row justify-between items-center px-6 pb-4 border-b border-border">
            <Text className="text-2xl font-bold text-foreground">
              Change Password
            </Text>
            <TouchableOpacity 
              onPress={() => setIsPasswordOpen(false)}
              className="p-2"
            >
              <Ionicons name="close" size={24} className="text-foreground" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
            <View className="space-y-6">
              <View>
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Current Password *
                </Text>
                <TextInput
                  value={passwordForm.currentPassword}
                  onChangeText={(text) => setPasswordForm({ ...passwordForm, currentPassword: text })}
                  placeholder="Enter current password"
                  secureTextEntry
                  className="bg-background border border-input rounded-xl px-4 py-3 text-foreground"
                  placeholderTextColor="#6B7280"
                />
              </View>

              <View>
                <Text className="text-sm font-semibold text-foreground mb-2">
                  New Password *
                </Text>
                <TextInput
                  value={passwordForm.newPassword}
                  onChangeText={(text) => setPasswordForm({ ...passwordForm, newPassword: text })}
                  placeholder="Enter new password"
                  secureTextEntry
                  className="bg-background border border-input rounded-xl px-4 py-3 text-foreground"
                  placeholderTextColor="#6B7280"
                />
                <Text className="text-xs text-muted-foreground mt-2">
                  Password must be at least 6 characters long
                </Text>
              </View>

              <View>
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Confirm New Password *
                </Text>
                <TextInput
                  value={passwordForm.confirmPassword}
                  onChangeText={(text) => setPasswordForm({ ...passwordForm, confirmPassword: text })}
                  placeholder="Confirm new password"
                  secureTextEntry
                  className="bg-background border border-input rounded-xl px-4 py-3 text-foreground"
                  placeholderTextColor="#6B7280"
                />
              </View>

              {/* Password Requirements */}
              <View className="bg-secondary/30 rounded-xl p-4">
                <Text className="text-sm font-semibold text-foreground mb-3">
                  Password Requirements
                </Text>
                <View className="space-y-2">
                  <View className="flex-row items-center">
                    <Ionicons name="checkmark-circle" size={16} className="text-green-600 mr-2" />
                    <Text className="text-sm text-muted-foreground">
                      At least 6 characters long
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="checkmark-circle" size={16} className="text-green-600 mr-2" />
                    <Text className="text-sm text-muted-foreground">
                      Include uppercase and lowercase letters
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="checkmark-circle" size={16} className="text-green-600 mr-2" />
                    <Text className="text-sm text-muted-foreground">
                      Include numbers and special characters
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View className="flex-row space-x-3 mt-8">
              <TouchableOpacity
                className="flex-1 py-4 border border-input rounded-xl"
                onPress={() => setIsPasswordOpen(false)}
              >
                <Text className="text-center font-semibold text-foreground">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-accent py-4 rounded-xl"
                onPress={handlePasswordChange}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-center font-semibold text-accent-foreground">
                    Change Password
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

export default AdminProfile;