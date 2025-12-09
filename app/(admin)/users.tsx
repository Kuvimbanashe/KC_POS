// app/(admin)/users.js
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { StyleSheet } from 'react-native';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { Ionicons } from '@expo/vector-icons';
import { 
  addUser, 
  updateUser, 
  deleteUser, 
  toggleUserStatus 
} from '../../store/slices/userManagementSlice';
import type { Permission, UserProfile, UserRole, UserStatus } from '../../store/types';

type RoleFilter = 'all' | UserRole;

interface UserFormData {
  id?: number;
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  type: UserRole;
  permissions: Permission[];
}

const AdminUsers = () => {
  const { users } = useAppSelector((state) => state.userManagement);
  const dispatch = useAppDispatch();
  
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  
  const [formData, setFormData] = useState<UserFormData>({
    id: undefined,
    email: '',
    password: '',
    name: '',
    phone: '',
    address: '',
    type: 'cashier',
    permissions: [],
  });

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
      setFilteredUsers(users);
    }, 1000);
    return () => clearTimeout(timer);
  }, [users]);

  useEffect(() => {
    let filtered = users;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query),
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.type === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [searchQuery, roleFilter, users]);

  const handleSubmit = () => {
    if (!formData.name || !formData.email || (!editingUser && !formData.password)) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const permissions = formData.permissions.length > 0 ? formData.permissions : ['sales'];

      if (editingUser) {
        dispatch(updateUser({
          id: editingUser.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          type: formData.type,
          permissions: permissions as Permission[],
        }));
        Alert.alert('Success', 'User updated successfully');
      } else {
        dispatch(addUser({
          name: formData.name,
          email: formData.email,
          password: formData.password ?? '',
          phone: formData.phone,
          address: formData.address,
          type: formData.type ?? 'cashier',
          permissions: permissions as Permission[],
        }));
        Alert.alert('Success', 'User created successfully');
      }
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'Failed to save user');
    }
  };

  const handleDelete = (userId: number, userName: string) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            dispatch(deleteUser(userId));
            Alert.alert('Success', 'User deleted successfully');
          }
        },
      ]
    );
  };

  const handleToggleStatus = (userId: number, userName: string, currentStatus: UserStatus) => {
    dispatch(toggleUserStatus(userId));
    Alert.alert(
      'Success', 
      `${userName} has been ${currentStatus === 'active' ? 'deactivated' : 'activated'}`
    );
  };

  const openEditDialog = (user: UserProfile) => {
    setEditingUser(user);
    setFormData({
      id: user.id,
      name: user.name,
      email: user.email,
      password: '',
      phone: user.phone || '',
      address: user.address || '',
      type: user.type,
      permissions: user.permissions ?? ['sales'],
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      id: undefined,
      name: '',
      email: '',
      password: '',
      phone: '',
      address: '',
      type: 'cashier',
      permissions: ['sales'],
    });
  };

  const getRoleBadge = (type: UserRole) => {
    const colorMap = {
      'admin': 'bg-purple-100 text-purple-800',
      'cashier': 'bg-blue-100 text-blue-800',
    };
    
    return (
      <View className={`px-2 py-1 rounded-full ${colorMap[type] || 'bg-gray-100'}`}>
        <Text style={styles.s_1}>
          {type}
        </Text>
      </View>
    );
  };

  const getStatusBadge = (status: UserStatus) => {
    const colorMap = {
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-red-100 text-red-800',
    };
    
    return (
      <View className={`px-2 py-1 rounded-full ${colorMap[status] || 'bg-gray-100'}`}>
        <Text style={styles.s_1}>
          {status}
        </Text>
      </View>
    );
  };

  const roleOptions: Array<{ value: RoleFilter; label: string }> = [
    { value: 'all', label: 'All Roles' },
    { value: 'admin', label: 'Admin' },
    { value: 'cashier', label: 'Cashier' },
  ];

  const permissionOptions: Permission[] = [
    'sales',
    'inventory_view',
    'inventory_manage',
    'reports_view',
    'reports_export',
    'users_view',
    'users_manage',
    'settings',
    'returns',
  ];

  const renderUserItem = ({ item }: { item: UserProfile }) => (
    <View style={styles.s_2}>
      <View style={styles.s_3}>
        <View style={styles.s_4}>
          <Text style={styles.s_5}>{item.name}</Text>
          
        </View>
        <View>
          <Text style={styles.s_6}>{item.email}</Text>
          
        </View>
        <View style={styles.s_7}>
          {getStatusBadge(item.status as UserStatus)}
         
        </View>
      </View>

    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.s_8}>
        <ScrollView style={styles.s_9}>
          {/* Header Skeleton */}
          <View style={styles.s_10}>
            <View>
              <View style={styles.s_11} />
              <View style={styles.s_12} />
            </View>
            <View style={styles.s_13} />
          </View>

          {/* Search and Filter Skeleton */}
          <View style={styles.s_14}>
            <View style={styles.s_15} />
            <View style={styles.s_16}>
              <View style={styles.s_17} />
              <View style={styles.s_18} />
            </View>
          </View>

          {/* Users List Skeleton */}
          <View style={styles.s_14}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={styles.s_19}>
                <View style={styles.s_20}>
                  <View style={styles.s_21}>
                    <View style={styles.s_22} />
                    <View style={styles.s_23} />
                  </View>
                  <View style={styles.s_24}>
                    <View style={styles.s_25} />
                    <View style={styles.s_26} />
                  </View>
                </View>
                <View style={styles.s_27}>
                  <View style={styles.s_28} />
                  <View style={styles.s_29} />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.s_8}>
      <ScrollView style={styles.s_21}>
        <View style={styles.s_30}>

          {/* Stats */}
          <View style={styles.s_31}>
            <View style={styles.s_32}>
              <View style={styles.s_33}>
                <Ionicons name="people" size={20} style={styles.s_34} />
                <Text style={styles.s_35}>
                  All Users
                </Text>
              </View>
              <Text style={styles.s_36}>
                {users.length}
              </Text>
            </View>
            <View style={styles.s_32}>
              <View style={styles.s_33}>
                <Ionicons name="shield" size={20} style={styles.s_37} />
                <Text style={styles.s_35}>
                  Admins
                </Text>
              </View>
              <Text style={styles.s_36}>
                {users.filter(u => u.type === 'admin').length}
              </Text>
            </View>
            <View style={styles.s_32}>
              <View style={styles.s_33}>
                <Ionicons name="person" size={20} style={styles.s_38} />
                <Text style={styles.s_35}>
                  Cashiers
                </Text>
              </View>
              <Text style={styles.s_36}>
                {users.filter(u => u.type === 'cashier').length}
              </Text>
            </View>
            <View style={styles.s_32}>
              <View style={styles.s_33}>
                <Ionicons name="checkmark-circle" size={20} style={styles.s_39} />
                <Text style={styles.s_35}>
                  Active
                </Text>
              </View>
              <Text style={styles.s_40}>
                {users.filter(u => u.status === 'active').length}
              </Text>
            </View>
          </View>

          {/* Search and Filter */}
          <View style={styles.s_41}>
            <View style={styles.s_42}>
              <View style={styles.s_43}>
              <Ionicons name="people" size={20} style={styles.s_37} />
              <Text style={styles.s_44}>
                All Users ({filteredUsers.length})
              </Text>
              </View>
              
              <TouchableOpacity
              style={styles.s_45}
              onPress={() => setIsDialogOpen(true)}
            >
              <Ionicons name="add" size={20} style={styles.s_46} />
              <Text style={styles.s_47}>Add User</Text>
            </TouchableOpacity>
            </View>
            
            <View style={styles.s_48}>
              {/* Search Input */}
              <View style={styles.s_21}>
                <View style={styles.s_49}>
                  <Ionicons 
                    name="search" 
                    size={20} 
                    style={styles.s_50} 
                  />
                  <TextInput
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    style={styles.s_51}
                    placeholderTextColor="#6B7280"
                  />
                </View>
              </View>

              {/* Role Filter */}
              <View style={styles.s_52}>
               
                  <View style={styles.s_53}>
                    {roleOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        className={`px-3 py-2 w-[30%] rounded mx-2 ${
                          roleFilter === option.value 
                            ? 'bg-accent' 
                            : 'bg-muted'
                        }`}
                        onPress={() => setRoleFilter(option.value)}
                      >
                        <Text className={
                          roleFilter === option.value 
                            ? 'text-accent-foreground text-xs font-medium text-center'
                            : 'text-muted-foreground text-xs text-center'
                        }>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                
              </View>
            </View>
          </View>

          {/* Users List */}
          <View style={styles.s_54}>
            {filteredUsers.length === 0 ? (
              <View style={styles.s_55}>
                <Ionicons name="people-outline" size={48} style={styles.s_56} />
                <Text style={styles.s_57}>
                  No users found
                </Text>
                <Text style={styles.s_58}>
                  {searchQuery || roleFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Get started by adding your first user'
                  }
                </Text>
                {(searchQuery || roleFilter !== 'all') && (
                  <TouchableOpacity
                    style={styles.s_59}
                    onPress={() => {
                      setSearchQuery('');
                      setRoleFilter('all');
                    }}
                  >
                    <Text style={styles.s_47}>
                      Clear Filters
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <FlatList
                data={filteredUsers}
                renderItem={renderUserItem}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={true}
                style={styles.s_60}
              />
            )}
          </View>
        </View>
      </ScrollView>

      {/* Add/Edit User Modal */}
      <Modal
        visible={isDialogOpen}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.s_61}>
          <View style={styles.s_62}>
            <Text style={styles.s_63}>
              {editingUser ? 'Edit User' : 'Create New User'}
            </Text>
            <TouchableOpacity onPress={() => {
              setIsDialogOpen(false);
              resetForm();
            }}>
              <Ionicons name="close" size={24} style={styles.s_64} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.s_65}>
            <View style={styles.s_66}>
              {/* Name */}
              <View>
                <Text style={styles.s_67}>Full Name</Text>
                <TextInput
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Enter full name"
                  style={styles.s_68}
                  placeholderTextColor="#6B7280"
                />
              </View>

              {/* Email */}
              <View>
                <Text style={styles.s_67}>Email</Text>
                <TextInput
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.s_68}
                  placeholderTextColor="#6B7280"
                />
              </View>

              {/* Password (only for new users) */}
              {!editingUser && (
                <View>
                  <Text style={styles.s_67}>Password</Text>
                  <TextInput
                    value={formData.password}
                    onChangeText={(text) => setFormData({ ...formData, password: text })}
                    placeholder="Enter password"
                    secureTextEntry
                    style={styles.s_68}
                    placeholderTextColor="#6B7280"
                  />
                </View>
              )}

              {/* Phone */}
              <View>
                <Text style={styles.s_67}>Phone</Text>
                <TextInput
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                  style={styles.s_68}
                  placeholderTextColor="#6B7280"
                />
              </View>

              {/* Address */}
              <View>
                <Text style={styles.s_67}>Address</Text>
                <TextInput
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                  placeholder="Enter address"
                  multiline
                  style={styles.s_69}
                  placeholderTextColor="#6B7280"
                />
              </View>

              {/* Role */}
              <View>
                <Text style={styles.s_67}>Role</Text>
                <View style={styles.s_70}>
                  {(['cashier', 'admin'] as UserRole[]).map((role) => (
                    <TouchableOpacity
                      key={role}
                      className={`flex-1 px-4 py-3 rounded-lg border ${
                        formData.type === role
                          ? 'bg-accent border-accent'
                          : 'bg-background border-input'
                      }`}
                      onPress={() => setFormData({ ...formData, type: role })}
                    >
                      <Text className={
                        formData.type === role
                          ? 'text-accent-foreground font-medium text-center capitalize'
                          : 'text-foreground text-center capitalize'
                      }>
                        {role}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Permissions (for admin users) */}
              {formData.type === 'admin' && (
                <View>
                  <Text style={styles.s_67}>Permissions</Text>
                  <View style={styles.s_71}>
                    {permissionOptions.map((permission) => (
                      <TouchableOpacity
                        key={permission}
                        style={styles.s_43}
                        onPress={() => {
                          const newPermissions = formData.permissions.includes(permission)
                            ? formData.permissions.filter(p => p !== permission)
                            : [...formData.permissions, permission];
                          setFormData({ ...formData, permissions: newPermissions });
                        }}
                      >
                        <View className={`w-6 h-6 rounded border-2 mr-3 ${
                          formData.permissions.includes(permission)
                            ? 'bg-accent border-accent'
                            : 'border-gray-300'
                        }`}>
                          {formData.permissions.includes(permission) && (
                            <Ionicons name="checkmark" size={16} style={styles.s_72} />
                          )}
                        </View>
                        <Text style={styles.s_64}>
                          {permission.split('_').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.s_73}
              onPress={handleSubmit}
            >
              <Text style={styles.s_74}>
                {editingUser ? 'Update User' : 'Create User'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};



const styles = StyleSheet.create({
  s_1: {
  fontSize: 12,
  fontWeight: "600"
},

  s_2: {
  borderColor: "#e6edf3",
  paddingVertical: 12,
  paddingHorizontal: 16,
  backgroundColor: "#ffffff"
},

  s_3: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: 8
},

  s_4: {},

  s_5: {
  color: "#0f172a"
},

  s_6: {
  color: "#6b7280",
  fontSize: 14
},

  s_7: {
  alignItems: "flex-end"
},

  s_8: {
  flex: 1,
  backgroundColor: "#ffffff"
},

  s_9: {
  flex: 1,
  padding: 16
},

  s_10: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center"
},

  s_11: {
  borderRadius: 6,
  marginBottom: 8
},

  s_12: {
  borderRadius: 6
},

  s_13: {
  borderRadius: 6
},

  s_14: {
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

  s_15: {
  borderRadius: 6,
  marginBottom: 8
},

  s_16: {
  flexDirection: "row",
  gap: 16
},

  s_17: {
  flex: 1,
  borderRadius: 6
},

  s_18: {
  borderRadius: 6
},

  s_19: {
  borderColor: "#e6edf3",
  paddingVertical: 12,
  marginBottom: 8
},

  s_20: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginBottom: 8
},

  s_21: {
  flex: 1
},

  s_22: {
  borderRadius: 6
},

  s_23: {
  borderRadius: 6
},

  s_24: {},

  s_25: {
  borderRadius: 6
},

  s_26: {
  borderRadius: 6
},

  s_27: {
  flexDirection: "row",
  justifyContent: "space-between"
},

  s_28: {
  borderRadius: 6
},

  s_29: {
  borderRadius: 6
},

  s_30: {
  padding: 16
},

  s_31: {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 16
},

  s_32: {
  backgroundColor: "#0f172a",
  borderRadius: 12,
  padding: 16,
  width: "100%",
  flex: 1,
  alignItems: "center",
  justifyContent: "center"
},

  s_33: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 8
},

  s_34: {
  color: "#f97316"
},

  s_35: {
  fontSize: 14,
  fontWeight: "600",
  color: "#ffffff"
},

  s_36: {
  fontSize: 20,
  fontWeight: "700",
  color: "#ffffff"
},

  s_37: {},

  s_38: {},

  s_39: {},

  s_40: {
  fontSize: 20,
  fontWeight: "700"
},

  s_41: {
  backgroundColor: "#ffffff",
  borderRadius: 12,
  padding: 16,
  borderWidth: 1,
  borderColor: "#e6edf3"
},

  s_42: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between"
},

  s_43: {
  flexDirection: "row",
  alignItems: "center"
},

  s_44: {
  fontSize: 18,
  fontWeight: "700",
  color: "#0f172a"
},

  s_45: {
  backgroundColor: "#f97316",
  borderRadius: 12,
  paddingHorizontal: 16,
  flexDirection: "row",
  alignItems: "center"
},

  s_46: {},

  s_47: {},

  s_48: {
  flexDirection: "column",
  gap: 16
},

  s_49: {},

  s_50: {
  color: "#6b7280"
},

  s_51: {
  backgroundColor: "#ffffff",
  borderWidth: 1,
  borderColor: "#e6edf3",
  borderRadius: 12,
  paddingRight: 16,
  paddingVertical: 12,
  color: "#0f172a"
},

  s_52: {
  borderWidth: 1,
  borderColor: "#e6edf3",
  borderRadius: 12,
  backgroundColor: "#ffffff"
},

  s_53: {
  flexDirection: "row",
  width: "100%",
  justifyContent: "center"
},

  s_54: {
  backgroundColor: "#ffffff",
  borderRadius: 12,
  borderWidth: 1,
  borderColor: "#e6edf3"
},

  s_55: {
  alignItems: "center"
},

  s_56: {
  color: "#6b7280",
  marginBottom: 16
},

  s_57: {
  fontSize: 18,
  fontWeight: "600",
  color: "#0f172a",
  marginBottom: 8
},

  s_58: {
  color: "#6b7280",
  marginBottom: 16
},

  s_59: {
  backgroundColor: "#f97316",
  borderRadius: 12,
  paddingHorizontal: 16
},

  s_60: {},

  s_61: {
  flex: 1,
  backgroundColor: "#ffffff",
  paddingTop: 16
},

  s_62: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingHorizontal: 16,
  paddingBottom: 16,
  borderColor: "#e6edf3"
},

  s_63: {
  fontSize: 20,
  fontWeight: "700",
  color: "#0f172a"
},

  s_64: {
  color: "#0f172a"
},

  s_65: {
  flex: 1,
  padding: 16
},

  s_66: {},

  s_67: {
  fontSize: 14,
  fontWeight: "600",
  color: "#0f172a",
  marginBottom: 8
},

  s_68: {
  backgroundColor: "#ffffff",
  borderWidth: 1,
  borderColor: "#e6edf3",
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 12,
  color: "#0f172a"
},

  s_69: {
  backgroundColor: "#ffffff",
  borderWidth: 1,
  borderColor: "#e6edf3",
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 12,
  color: "#0f172a"
},

  s_70: {
  flexDirection: "row"
},

  s_71: {},

  s_72: {},

  s_73: {
  backgroundColor: "#f97316",
  borderRadius: 12
},

  s_74: {
  fontSize: 18
}
});
export default AdminUsers;