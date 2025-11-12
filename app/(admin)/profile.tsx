// app/(admin)/profile.js
import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  Modal
} from 'react-native';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { Ionicons } from '@expo/vector-icons';
import { updateProfile } from '../../store/slices/authSlice';
import { updateUser } from '../../store/slices/userManagementSlice';

const AdminProfile = () => {
  const { user } = useAppSelector(state => state.auth);
  const { users } = useAppSelector(state => state.userManagement);
  const dispatch = useAppDispatch();
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  
  const [passwordForm, setPasswordForm] = useState({
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
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-foreground text-lg">User not found</Text>
      </View>
    );
  }

  const handleProfileUpdate = async () => {
    if (!profileForm.name || !profileForm.email) {
      Alert.alert('Error', 'Please fill in all required fields');
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
      icon: 'person-outline',
      label: 'Full Name',
      value: user.name,
      color: 'text-accent',
    },
    {
      icon: 'mail-outline',
      label: 'Email',
      value: user.email,
      color: 'text-accent',
    },
    {
      icon: 'call-outline',
      label: 'Phone',
      value: user.phone || 'Not provided',
      color: 'text-accent',
    },
    {
      icon: 'location-outline',
      label: 'Address',
      value: user.address || 'Not provided',
      color: 'text-accent',
    },
    {
      icon: 'shield-checkmark-outline',
      label: 'Role',
      value: 'Administrator',
      color: 'text-accent',
    },
    {
      icon: 'calendar-outline',
      label: 'Member Since',
      value: new Date().toLocaleDateString(), // Using current date as mock
      color: 'text-accent',
    },
  ];

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1">
        <View className="p-4 md:p-6 space-y-6">
          {/* Header */}
          <View>
            <Text className="text-2xl md:text-3xl font-bold text-foreground">
              Profile
            </Text>
            <Text className="text-sm md:text-base text-muted-foreground">
              View and manage your account
            </Text>
          </View>

          <View className="flex-col md:flex-row gap-6">
            {/* Account Information Card */}
            <View className="flex-1">
              <View className="bg-card rounded-lg p-4 shadow-sm">
                <Text className="text-lg font-bold text-foreground mb-1">
                  Account Information
                </Text>
                <Text className="text-sm text-muted-foreground mb-4">
                  Your personal details
                </Text>
                
                <View className="space-y-3">
                  {profileInfo.map((item, index) => (
                    <View 
                      key={index}
                      className="flex-row items-center gap-3 p-3 bg-secondary rounded-lg"
                    >
                      <Ionicons 
                        name={item.icon as keyof typeof Ionicons.glyphMap} 
                        size={20} 
                        className={item.color}
                      />
                      <View className="flex-1">
                        <Text className="text-sm font-medium text-muted-foreground">
                          {item.label}
                        </Text>
                        <Text className="font-semibold text-foreground">
                          {item.value}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Account Settings Card */}
            <View className="flex-1">
              <View className="bg-card rounded-lg p-4 shadow-sm">
                <Text className="text-lg font-bold text-foreground mb-1">
                  Account Settings
                </Text>
                <Text className="text-sm text-muted-foreground mb-4">
                  Manage your preferences
                </Text>
                
                <View className="space-y-3">
                  {/* Update Profile Button */}
                  <TouchableOpacity
                    className="flex-row items-center gap-3 p-3 border border-input rounded-lg active:bg-secondary"
                    onPress={() => setIsEditOpen(true)}
                  >
                    <Ionicons name="create-outline" size={20} className="text-foreground" />
                    <View className="flex-1">
                      <Text className="font-medium text-foreground">
                        Update Profile
                      </Text>
                      <Text className="text-sm text-muted-foreground">
                        Update your personal information
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} className="text-muted-foreground" />
                  </TouchableOpacity>

                  {/* Change Password Button */}
                  <TouchableOpacity
                    className="flex-row items-center gap-3 p-3 border border-input rounded-lg active:bg-secondary"
                    onPress={() => setIsPasswordOpen(true)}
                  >
                    <Ionicons name="key-outline" size={20} className="text-foreground" />
                    <View className="flex-1">
                      <Text className="font-medium text-foreground">
                        Change Password
                      </Text>
                      <Text className="text-sm text-muted-foreground">
                        Update your password
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} className="text-muted-foreground" />
                  </TouchableOpacity>

                  {/* Security Settings */}
                  <TouchableOpacity
                    className="flex-row items-center gap-3 p-3 border border-input rounded-lg active:bg-secondary"
                  >
                    <Ionicons name="shield-checkmark-outline" size={20} className="text-foreground" />
                    <View className="flex-1">
                      <Text className="font-medium text-foreground">
                        Security Settings
                      </Text>
                      <Text className="text-sm text-muted-foreground">
                        Manage security preferences
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} className="text-muted-foreground" />
                  </TouchableOpacity>

                  {/* Notification Settings */}
                  <TouchableOpacity
                    className="flex-row items-center gap-3 p-3 border border-input rounded-lg active:bg-secondary"
                  >
                    <Ionicons name="notifications-outline" size={20} className="text-foreground" />
                    <View className="flex-1">
                      <Text className="font-medium text-foreground">
                        Notifications
                      </Text>
                      <Text className="text-sm text-muted-foreground">
                        Configure notification settings
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} className="text-muted-foreground" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Additional Info Card */}
          <View className="bg-card rounded-lg p-4 shadow-sm">
            <Text className="text-lg font-bold text-foreground mb-4">
              Account Statistics
            </Text>
            <View className="flex-row flex-wrap justify-between gap-4">
              <View className="flex-1 min-w-[150px]">
                <Text className="text-sm text-muted-foreground mb-1">Last Login</Text>
                <Text className="font-semibold text-foreground">
                  {new Date().toLocaleString()}
                </Text>
              </View>
              <View className="flex-1 min-w-[150px]">
                <Text className="text-sm text-muted-foreground mb-1">Account Status</Text>
                <View className="bg-green-100 px-2 py-1 rounded-full self-start">
                  <Text className="text-green-800 text-xs font-medium">Active</Text>
                </View>
              </View>
              <View className="flex-1 min-w-[150px]">
                <Text className="text-sm text-muted-foreground mb-1">Two-Factor Auth</Text>
                <View className="bg-yellow-100 px-2 py-1 rounded-full self-start">
                  <Text className="text-yellow-800 text-xs font-medium">Disabled</Text>
                </View>
              </View>
              <View className="flex-1 min-w-[150px]">
                <Text className="text-sm text-muted-foreground mb-1">Login Sessions</Text>
                <Text className="font-semibold text-foreground">1 Active</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Update Profile Modal */}
      <Modal
        visible={isEditOpen}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-background pt-4">
          <View className="flex-row justify-between items-center px-4 pb-4 border-b border-border">
            <Text className="text-xl font-bold text-foreground">Update Profile</Text>
            <TouchableOpacity onPress={() => setIsEditOpen(false)}>
              <Ionicons name="close" size={24} className="text-foreground" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-4">
            <View className="space-y-4">
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">
                  Full Name *
                </Text>
                <TextInput
                  value={profileForm.name}
                  onChangeText={(text) => setProfileForm({ ...profileForm, name: text })}
                  className="bg-background border border-input rounded-lg px-4 py-3 text-foreground"
                  placeholderTextColor="#6B7280"
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-foreground mb-2">
                  Email *
                </Text>
                <TextInput
                  value={profileForm.email}
                  onChangeText={(text) => setProfileForm({ ...profileForm, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="bg-background border border-input rounded-lg px-4 py-3 text-foreground"
                  placeholderTextColor="#6B7280"
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-foreground mb-2">
                  Phone
                </Text>
                <TextInput
                  value={profileForm.phone}
                  onChangeText={(text) => setProfileForm({ ...profileForm, phone: text })}
                  keyboardType="phone-pad"
                  className="bg-background border border-input rounded-lg px-4 py-3 text-foreground"
                  placeholderTextColor="#6B7280"
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-foreground mb-2">
                  Address
                </Text>
                <TextInput
                  value={profileForm.address}
                  onChangeText={(text) => setProfileForm({ ...profileForm, address: text })}
                  multiline
                  numberOfLines={3}
                  className="bg-background border border-input rounded-lg px-4 py-3 text-foreground min-h-[100px]"
                  placeholderTextColor="#6B7280"
                />
              </View>
            </View>

            <View className="flex-row space-x-3 pt-6">
              <TouchableOpacity
                className="flex-1 border border-input rounded-lg py-3"
                onPress={() => setIsEditOpen(false)}
              >
                <Text className="text-foreground text-center font-semibold">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-accent rounded-lg py-3"
                onPress={handleProfileUpdate}
                disabled={loading}
              >
                <Text className="text-accent-foreground text-center font-semibold">
                  {loading ? 'Updating...' : 'Update Profile'}
                </Text>
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
      >
        <View className="flex-1 bg-background pt-4">
          <View className="flex-row justify-between items-center px-4 pb-4 border-b border-border">
            <Text className="text-xl font-bold text-foreground">Change Password</Text>
            <TouchableOpacity onPress={() => setIsPasswordOpen(false)}>
              <Ionicons name="close" size={24} className="text-foreground" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-4">
            <View className="space-y-4">
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">
                  Current Password *
                </Text>
                <TextInput
                  value={passwordForm.currentPassword}
                  onChangeText={(text) => setPasswordForm({ ...passwordForm, currentPassword: text })}
                  secureTextEntry
                  className="bg-background border border-input rounded-lg px-4 py-3 text-foreground"
                  placeholderTextColor="#6B7280"
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-foreground mb-2">
                  New Password *
                </Text>
                <TextInput
                  value={passwordForm.newPassword}
                  onChangeText={(text) => setPasswordForm({ ...passwordForm, newPassword: text })}
                  secureTextEntry
                  className="bg-background border border-input rounded-lg px-4 py-3 text-foreground"
                  placeholderTextColor="#6B7280"
                />
                <Text className="text-xs text-muted-foreground mt-1">
                  Password must be at least 6 characters long
                </Text>
              </View>

              <View>
                <Text className="text-sm font-medium text-foreground mb-2">
                  Confirm New Password *
                </Text>
                <TextInput
                  value={passwordForm.confirmPassword}
                  onChangeText={(text) => setPasswordForm({ ...passwordForm, confirmPassword: text })}
                  secureTextEntry
                  className="bg-background border border-input rounded-lg px-4 py-3 text-foreground"
                  placeholderTextColor="#6B7280"
                />
              </View>

              {/* Password Requirements */}
              <View className="bg-secondary rounded-lg p-4">
                <Text className="font-medium text-foreground mb-2">
                  Password Requirements
                </Text>
                <View className="space-y-1">
                  <Text className="text-xs text-muted-foreground">
                    • At least 6 characters long
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    • Include uppercase and lowercase letters
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    • Include numbers and special characters
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row space-x-3 pt-6">
              <TouchableOpacity
                className="flex-1 border border-input rounded-lg py-3"
                onPress={() => setIsPasswordOpen(false)}
              >
                <Text className="text-foreground text-center font-semibold">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-accent rounded-lg py-3"
                onPress={handlePasswordChange}
                disabled={loading}
              >
                <Text className="text-accent-foreground text-center font-semibold">
                  {loading ? 'Changing...' : 'Change Password'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

export default AdminProfile;