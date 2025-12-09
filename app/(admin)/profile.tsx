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
import { StyleSheet } from 'react-native';
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
      <View style={styles.s_1}>
        <Text style={styles.s_2}>User not found</Text>
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
    <View style={styles.s_3}>
      <ScrollView style={styles.s_4}>
        <View style={styles.s_5}>
          {/* Header */}
          <View>
            <Text style={styles.s_6}>
              Profile
            </Text>
            <Text style={styles.s_7}>
              View and manage your account
            </Text>
          </View>

          <View style={styles.s_8}>
            {/* Account Information Card */}
            <View style={styles.s_4}>
              <View style={styles.s_9}>
                <Text style={styles.s_10}>
                  Account Information
                </Text>
                <Text style={styles.s_11}>
                  Your personal details
                </Text>
                
                <View style={styles.s_12}>
                  {profileInfo.map((item, index) => (
                    <View 
                      key={index}
                      style={styles.s_13}
                    >
                      <Ionicons 
                        name={item.icon as keyof typeof Ionicons.glyphMap} 
                        size={20} 
                        className={item.color}
                      />
                      <View style={styles.s_4}>
                        <Text style={styles.s_14}>
                          {item.label}
                        </Text>
                        <Text style={styles.s_15}>
                          {item.value}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Account Settings Card */}
            <View style={styles.s_4}>
              <View style={styles.s_9}>
                <Text style={styles.s_10}>
                  Account Settings
                </Text>
                <Text style={styles.s_11}>
                  Manage your preferences
                </Text>
                
                <View style={styles.s_12}>
                  {/* Update Profile Button */}
                  <TouchableOpacity
                    style={styles.s_16}
                    onPress={() => setIsEditOpen(true)}
                  >
                    <Ionicons name="create-outline" size={20} style={styles.s_17} />
                    <View style={styles.s_4}>
                      <Text style={styles.s_18}>
                        Update Profile
                      </Text>
                      <Text style={styles.s_19}>
                        Update your personal information
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} style={styles.s_20} />
                  </TouchableOpacity>

                  {/* Change Password Button */}
                  <TouchableOpacity
                    style={styles.s_16}
                    onPress={() => setIsPasswordOpen(true)}
                  >
                    <Ionicons name="key-outline" size={20} style={styles.s_17} />
                    <View style={styles.s_4}>
                      <Text style={styles.s_18}>
                        Change Password
                      </Text>
                      <Text style={styles.s_19}>
                        Update your password
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} style={styles.s_20} />
                  </TouchableOpacity>

                  {/* Security Settings */}
                  <TouchableOpacity
                    style={styles.s_16}
                  >
                    <Ionicons name="shield-checkmark-outline" size={20} style={styles.s_17} />
                    <View style={styles.s_4}>
                      <Text style={styles.s_18}>
                        Security Settings
                      </Text>
                      <Text style={styles.s_19}>
                        Manage security preferences
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} style={styles.s_20} />
                  </TouchableOpacity>

                  {/* Notification Settings */}
                  <TouchableOpacity
                    style={styles.s_16}
                  >
                    <Ionicons name="notifications-outline" size={20} style={styles.s_17} />
                    <View style={styles.s_4}>
                      <Text style={styles.s_18}>
                        Notifications
                      </Text>
                      <Text style={styles.s_19}>
                        Configure notification settings
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} style={styles.s_20} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Additional Info Card */}
          <View style={styles.s_9}>
            <Text style={styles.s_21}>
              Account Statistics
            </Text>
            <View style={styles.s_22}>
              <View style={styles.s_23}>
                <Text style={styles.s_24}>Last Login</Text>
                <Text style={styles.s_15}>
                  {new Date().toLocaleString()}
                </Text>
              </View>
              <View style={styles.s_23}>
                <Text style={styles.s_24}>Account Status</Text>
                <View style={styles.s_25}>
                  <Text style={styles.s_26}>Active</Text>
                </View>
              </View>
              <View style={styles.s_23}>
                <Text style={styles.s_24}>Two-Factor Auth</Text>
                <View style={styles.s_27}>
                  <Text style={styles.s_28}>Disabled</Text>
                </View>
              </View>
              <View style={styles.s_23}>
                <Text style={styles.s_24}>Login Sessions</Text>
                <Text style={styles.s_15}>1 Active</Text>
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
        <View style={styles.s_29}>
          <View style={styles.s_30}>
            <Text style={styles.s_31}>Update Profile</Text>
            <TouchableOpacity onPress={() => setIsEditOpen(false)}>
              <Ionicons name="close" size={24} style={styles.s_17} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.s_32}>
            <View style={styles.s_33}>
              <View>
                <Text style={styles.s_34}>
                  Full Name *
                </Text>
                <TextInput
                  value={profileForm.name}
                  onChangeText={(text) => setProfileForm({ ...profileForm, name: text })}
                  style={styles.s_35}
                  placeholderTextColor="#6B7280"
                />
              </View>

              <View>
                <Text style={styles.s_34}>
                  Email *
                </Text>
                <TextInput
                  value={profileForm.email}
                  onChangeText={(text) => setProfileForm({ ...profileForm, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.s_35}
                  placeholderTextColor="#6B7280"
                />
              </View>

              <View>
                <Text style={styles.s_34}>
                  Phone
                </Text>
                <TextInput
                  value={profileForm.phone}
                  onChangeText={(text) => setProfileForm({ ...profileForm, phone: text })}
                  keyboardType="phone-pad"
                  style={styles.s_35}
                  placeholderTextColor="#6B7280"
                />
              </View>

              <View>
                <Text style={styles.s_34}>
                  Address
                </Text>
                <TextInput
                  value={profileForm.address}
                  onChangeText={(text) => setProfileForm({ ...profileForm, address: text })}
                  multiline
                  numberOfLines={3}
                  style={styles.s_36}
                  placeholderTextColor="#6B7280"
                />
              </View>
            </View>

            <View style={styles.s_37}>
              <TouchableOpacity
                style={styles.s_38}
                onPress={() => setIsEditOpen(false)}
              >
                <Text style={styles.s_39}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.s_40}
                onPress={handleProfileUpdate}
                disabled={loading}
              >
                <Text style={styles.s_41}>
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
        <View style={styles.s_29}>
          <View style={styles.s_30}>
            <Text style={styles.s_31}>Change Password</Text>
            <TouchableOpacity onPress={() => setIsPasswordOpen(false)}>
              <Ionicons name="close" size={24} style={styles.s_17} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.s_32}>
            <View style={styles.s_33}>
              <View>
                <Text style={styles.s_34}>
                  Current Password *
                </Text>
                <TextInput
                  value={passwordForm.currentPassword}
                  onChangeText={(text) => setPasswordForm({ ...passwordForm, currentPassword: text })}
                  secureTextEntry
                  style={styles.s_35}
                  placeholderTextColor="#6B7280"
                />
              </View>

              <View>
                <Text style={styles.s_34}>
                  New Password *
                </Text>
                <TextInput
                  value={passwordForm.newPassword}
                  onChangeText={(text) => setPasswordForm({ ...passwordForm, newPassword: text })}
                  secureTextEntry
                  style={styles.s_35}
                  placeholderTextColor="#6B7280"
                />
                <Text style={styles.s_42}>
                  Password must be at least 6 characters long
                </Text>
              </View>

              <View>
                <Text style={styles.s_34}>
                  Confirm New Password *
                </Text>
                <TextInput
                  value={passwordForm.confirmPassword}
                  onChangeText={(text) => setPasswordForm({ ...passwordForm, confirmPassword: text })}
                  secureTextEntry
                  style={styles.s_35}
                  placeholderTextColor="#6B7280"
                />
              </View>

              {/* Password Requirements */}
              <View style={styles.s_43}>
                <Text style={styles.s_44}>
                  Password Requirements
                </Text>
                <View style={styles.s_45}>
                  <Text style={styles.s_46}>
                    • At least 6 characters long
                  </Text>
                  <Text style={styles.s_46}>
                    • Include uppercase and lowercase letters
                  </Text>
                  <Text style={styles.s_46}>
                    • Include numbers and special characters
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.s_37}>
              <TouchableOpacity
                style={styles.s_38}
                onPress={() => setIsPasswordOpen(false)}
              >
                <Text style={styles.s_39}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.s_40}
                onPress={handlePasswordChange}
                disabled={loading}
              >
                <Text style={styles.s_41}>
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



const styles = StyleSheet.create({
  s_1: {
  flex: 1,
  backgroundColor: "#ffffff",
  justifyContent: "center",
  alignItems: "center"
},

  s_2: {
  color: "#0f172a",
  fontSize: 18
},

  s_3: {
  flex: 1,
  backgroundColor: "#ffffff"
},

  s_4: {
  flex: 1
},

  s_5: {
  padding: 16
},

  s_6: {
  fontSize: 24,
  fontWeight: "700",
  color: "#0f172a"
},

  s_7: {
  fontSize: 14,
  color: "#6b7280"
},

  s_8: {
  flexDirection: "column"
},

  s_9: {
  backgroundColor: "#ffffff",
  borderRadius: 12,
  padding: 16,
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 1
  },
  shadowOpacity: 0.06,
  shadowRadius: 4,
  elevation: 1
},

  s_10: {
  fontSize: 18,
  fontWeight: "700",
  color: "#0f172a"
},

  s_11: {
  fontSize: 14,
  color: "#6b7280",
  marginBottom: 16
},

  s_12: {},

  s_13: {
  flexDirection: "row",
  alignItems: "center",
  padding: 12,
  backgroundColor: "#f3f4f6",
  borderRadius: 12
},

  s_14: {
  fontSize: 14,
  fontWeight: "600",
  color: "#6b7280"
},

  s_15: {
  color: "#0f172a"
},

  s_16: {
  flexDirection: "row",
  alignItems: "center",
  padding: 12,
  borderWidth: 1,
  borderColor: "#e6edf3",
  borderRadius: 12
},

  s_17: {
  color: "#0f172a"
},

  s_18: {
  fontWeight: "600",
  color: "#0f172a"
},

  s_19: {
  fontSize: 14,
  color: "#6b7280"
},

  s_20: {
  color: "#6b7280"
},

  s_21: {
  fontSize: 18,
  fontWeight: "700",
  color: "#0f172a",
  marginBottom: 16
},

  s_22: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between",
  gap: 16
},

  s_23: {
  flex: 1
},

  s_24: {
  fontSize: 14,
  color: "#6b7280"
},

  s_25: {},

  s_26: {
  fontSize: 12,
  fontWeight: "600"
},

  s_27: {},

  s_28: {
  fontSize: 12,
  fontWeight: "600"
},

  s_29: {
  flex: 1,
  backgroundColor: "#ffffff",
  paddingTop: 16
},

  s_30: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingHorizontal: 16,
  paddingBottom: 16,
  borderColor: "#e6edf3"
},

  s_31: {
  fontSize: 20,
  fontWeight: "700",
  color: "#0f172a"
},

  s_32: {
  flex: 1,
  padding: 16
},

  s_33: {},

  s_34: {
  fontSize: 14,
  fontWeight: "600",
  color: "#0f172a",
  marginBottom: 8
},

  s_35: {
  backgroundColor: "#ffffff",
  borderWidth: 1,
  borderColor: "#e6edf3",
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 12,
  color: "#0f172a"
},

  s_36: {
  backgroundColor: "#ffffff",
  borderWidth: 1,
  borderColor: "#e6edf3",
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 12,
  color: "#0f172a"
},

  s_37: {
  flexDirection: "row"
},

  s_38: {
  flex: 1,
  borderWidth: 1,
  borderColor: "#e6edf3",
  borderRadius: 12,
  paddingVertical: 12
},

  s_39: {
  color: "#0f172a"
},

  s_40: {
  flex: 1,
  backgroundColor: "#f97316",
  borderRadius: 12,
  paddingVertical: 12
},

  s_41: {},

  s_42: {
  fontSize: 12,
  color: "#6b7280"
},

  s_43: {
  backgroundColor: "#f3f4f6",
  borderRadius: 12,
  padding: 16
},

  s_44: {
  fontWeight: "600",
  color: "#0f172a",
  marginBottom: 8
},

  s_45: {},

  s_46: {
  fontSize: 12,
  color: "#6b7280"
}
});
export default AdminProfile;