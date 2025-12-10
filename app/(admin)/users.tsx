// app/(admin)/users.tsx
import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
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
    permissions: ['sales'],
  });

  useEffect(() => {
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
    if (!formData.name.trim() || !formData.email.trim() || (!editingUser && !formData.password)) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!formData.email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      const permissions = formData.permissions.length > 0 ? formData.permissions : ['sales'];

      if (editingUser) {
        dispatch(updateUser({
          id: editingUser.id,
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          type: formData.type,
          permissions: permissions as Permission[],
        }));
        Alert.alert('Success', 'User updated successfully');
      } else {
        dispatch(addUser({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          type: formData.type,
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

  const handleDelete = useCallback((userId: number, userName: string) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${userName}? This action cannot be undone.`,
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
  }, [dispatch]);

  const handleToggleStatus = useCallback((userId: number, userName: string, currentStatus: UserStatus) => {
    dispatch(toggleUserStatus(userId));
    Alert.alert(
      'Success', 
      `${userName} has been ${currentStatus === 'active' ? 'deactivated' : 'activated'}`
    );
  }, [dispatch]);

  const openEditDialog = useCallback((user: UserProfile) => {
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
  }, []);

  const resetForm = useCallback(() => {
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
  }, []);

  const getRoleBadge = useCallback((type: UserRole) => {
    const config = {
      admin: { bg: 'bg-purple-100', text: 'text-purple-800' },
      cashier: { bg: 'bg-blue-100', text: 'text-blue-800' },
    }[type] || { bg: 'bg-gray-100', text: 'text-gray-800' };
    
    return (
      <View className={`px-3 py-1 rounded-full ${config.bg}`}>
        <Text className={`text-xs font-semibold capitalize ${config.text}`}>
          {type}
        </Text>
      </View>
    );
  }, []);

  const getStatusBadge = useCallback((status: UserStatus) => {
    const config = {
      active: { bg: 'bg-green-100', text: 'text-green-800' },
      inactive: { bg: 'bg-red-100', text: 'text-red-800' },
    }[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
    
    return (
      <View className={`px-3 py-1 rounded-full ${config.bg}`}>
        <Text className={`text-xs font-semibold capitalize ${config.text}`}>
          {status}
        </Text>
      </View>
    );
  }, []);

  const roleOptions = [
    { value: 'all' as const, label: 'All Roles' },
    { value: 'admin' as const, label: 'Admin' },
    { value: 'cashier' as const, label: 'Cashier' },
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

  const renderUserItem = useCallback(({ item }: { item: UserProfile }) => (
    <View className="border-b border-border px-4 py-3 bg-background">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1 mr-4">
          <View className="flex-row items-center mb-1">
            <Text className="text-lg font-semibold text-foreground mr-2">
              {item.name}
            </Text>
            {getRoleBadge(item.type)}
          </View>
          <Text className="text-muted-foreground text-sm mb-2">
            {item.email}
          </Text>
          {item.phone && (
            <Text className="text-muted-foreground text-sm">
              {item.phone}
            </Text>
          )}
        </View>
        <View className="items-end">
          {getStatusBadge(item.status as UserStatus)}
          <Text className="text-xs text-muted-foreground mt-1">
            Last login: Today
          </Text>
        </View>
      </View>
      
      <View className="flex-row justify-end space-x-2 mt-3">
        <TouchableOpacity
          className={`px-3 py-1.5 rounded-lg ${
            item.status === 'active' 
              ? 'bg-red-50 border border-red-200' 
              : 'bg-green-50 border border-green-200'
          }`}
          onPress={() => handleToggleStatus(item.id, item.name, item.status as UserStatus)}
        >
          <Text className={`text-sm font-medium ${
            item.status === 'active' ? 'text-red-600' : 'text-green-600'
          }`}>
            {item.status === 'active' ? 'Deactivate' : 'Activate'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className="px-3 py-1.5 rounded-lg bg-secondary border border-border"
          onPress={() => openEditDialog(item)}
        >
          <Text className="text-sm font-medium text-foreground">Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-200"
          onPress={() => handleDelete(item.id, item.name)}
        >
          <Text className="text-sm font-medium text-red-600">Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [getRoleBadge, getStatusBadge, handleToggleStatus, openEditDialog, handleDelete]);

  const LoadingSkeleton = () => (
    <View className="flex-1 bg-background p-4">
      {/* Header Skeleton */}
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <View className="h-8 bg-muted rounded-lg w-48 mb-2" />
          <View className="h-4 bg-muted rounded-lg w-32" />
        </View>
        <View className="h-10 bg-muted rounded-lg w-28" />
      </View>

      {/* Stats Skeleton */}
      <View className="flex-row flex-wrap gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <View key={i} className="flex-1 min-w-[45%] bg-muted rounded-xl p-4">
            <View className="flex-row items-center mb-3">
              <View className="h-6 w-6 bg-gray-300 rounded-full mr-2" />
              <View className="h-4 bg-gray-300 rounded-lg w-16" />
            </View>
            <View className="h-8 bg-gray-300 rounded-lg" />
          </View>
        ))}
      </View>

      {/* Users List Skeleton */}
      <View className="bg-card rounded-xl border border-border p-4">
        {[1, 2, 3, 4].map((i) => (
          <View key={i} className="border-b border-border py-4 last:border-b-0">
            <View className="flex-row justify-between mb-3">
              <View>
                <View className="h-5 bg-muted rounded-lg w-32 mb-2" />
                <View className="h-4 bg-muted rounded-lg w-48" />
              </View>
              <View className="h-6 bg-muted rounded-lg w-20" />
            </View>
            <View className="flex-row justify-end space-x-2">
              <View className="h-8 bg-muted rounded-lg w-24" />
              <View className="h-8 bg-muted rounded-lg w-16" />
              <View className="h-8 bg-muted rounded-lg w-20" />
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1">
        <View className="p-4">
          {/* Stats Cards */}
          <View className="flex-row flex-wrap gap-4 mb-6">
            <View className="flex-1 min-w-[45%] bg-card rounded-xl border border-border p-4">
              <View className="flex-row items-center mb-2">
                <Ionicons name="people" size={20} className="text-muted-foreground mr-2" />
                <Text className="text-sm font-semibold text-muted-foreground">
                  All Users
                </Text>
              </View>
              <Text className="text-2xl font-bold text-foreground">
                {users.length}
              </Text>
            </View>
            
            <View className="flex-1 min-w-[45%] bg-card rounded-xl border border-border p-4">
              <View className="flex-row items-center mb-2">
                <Ionicons name="shield" size={20} className="text-purple-600 mr-2" />
                <Text className="text-sm font-semibold text-muted-foreground">
                  Admins
                </Text>
              </View>
              <Text className="text-2xl font-bold text-foreground">
                {users.filter(u => u.type === 'admin').length}
              </Text>
            </View>
            
            <View className="flex-1 min-w-[45%] bg-card rounded-xl border border-border p-4">
              <View className="flex-row items-center mb-2">
                <Ionicons name="person" size={20} className="text-blue-600 mr-2" />
                <Text className="text-sm font-semibold text-muted-foreground">
                  Cashiers
                </Text>
              </View>
              <Text className="text-2xl font-bold text-foreground">
                {users.filter(u => u.type === 'cashier').length}
              </Text>
            </View>
            
            <View className="flex-1 min-w-[45%] bg-card rounded-xl border border-border p-4">
              <View className="flex-row items-center mb-2">
                <Ionicons name="checkmark-circle" size={20} className="text-green-600 mr-2" />
                <Text className="text-sm font-semibold text-muted-foreground">
                  Active
                </Text>
              </View>
              <Text className="text-2xl font-bold text-foreground">
                {users.filter(u => u.status === 'active').length}
              </Text>
            </View>
          </View>

          {/* Header with Search and Filter */}
          <View className="bg-card rounded-xl border border-border p-4 mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className="text-2xl font-bold text-foreground">
                  User Management
                </Text>
                <Text className="text-muted-foreground text-sm">
                  {filteredUsers.length} users found
                </Text>
              </View>
              
              <TouchableOpacity
                className="flex-row items-center bg-accent px-4 py-3 rounded-lg"
                onPress={() => setIsDialogOpen(true)}
              >
                <Ionicons name="add" size={20} className="text-accent-foreground mr-2" />
                <Text className="font-semibold text-accent-foreground">
                  Add User
                </Text>
              </TouchableOpacity>
            </View>

            {/* Search and Filters */}
            <View className="space-y-4">
              {/* Search Input */}
              <View className="relative">
                <Ionicons 
                  name="search" 
                  size={20} 
                  className="absolute left-4 top-3.5 text-muted-foreground z-10" 
                />
                <TextInput
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  className="pl-12 pr-4 py-3 bg-background border border-input rounded-lg text-foreground"
                  placeholderTextColor="#6B7280"
                />
              </View>

              {/* Role Filter */}
              <View className="flex-row space-x-2">
                {roleOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    className={`flex-1 px-4 py-2.5 rounded-lg ${
                      roleFilter === option.value 
                        ? 'bg-accent' 
                        : 'bg-secondary'
                    }`}
                    onPress={() => setRoleFilter(option.value)}
                  >
                    <Text className={`text-center font-medium ${
                      roleFilter === option.value 
                        ? 'text-accent-foreground' 
                        : 'text-muted-foreground'
                    }`}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Users List */}
          <View className="bg-card rounded-xl border border-border overflow-hidden">
            {filteredUsers.length === 0 ? (
              <View className="items-center justify-center py-12 px-4">
                <Ionicons name="people-outline" size={64} className="text-muted mb-4" />
                <Text className="text-xl font-semibold text-foreground mb-2">
                  No users found
                </Text>
                <Text className="text-muted-foreground text-center mb-6">
                  {searchQuery || roleFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Get started by adding your first user'
                  }
                </Text>
                {(searchQuery || roleFilter !== 'all') && (
                  <TouchableOpacity
                    className="bg-secondary px-6 py-3 rounded-lg"
                    onPress={() => {
                      setSearchQuery('');
                      setRoleFilter('all');
                    }}
                  >
                    <Text className="font-semibold text-foreground">
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
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
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
        onRequestClose={() => {
          setIsDialogOpen(false);
          resetForm();
        }}
      >
        <View className="flex-1 bg-background pt-4">
          {/* Modal Header */}
          <View className="flex-row justify-between items-center px-6 pb-4 border-b border-border">
            <Text className="text-2xl font-bold text-foreground">
              {editingUser ? 'Edit User' : 'Create New User'}
            </Text>
            <TouchableOpacity 
              onPress={() => {
                setIsDialogOpen(false);
                resetForm();
              }}
              className="p-2"
            >
              <Ionicons name="close" size={24} className="text-foreground" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
            <View className="space-y-6">
              {/* Name */}
              <View>
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Full Name *
                </Text>
                <TextInput
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Enter full name"
                  className="bg-background border border-input rounded-lg px-4 py-3 text-foreground"
                  placeholderTextColor="#6B7280"
                />
              </View>

              {/* Email */}
              <View>
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Email Address *
                </Text>
                <TextInput
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="bg-background border border-input rounded-lg px-4 py-3 text-foreground"
                  placeholderTextColor="#6B7280"
                />
              </View>

              {/* Password (only for new users) */}
              {!editingUser && (
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-2">
                    Password *
                  </Text>
                  <TextInput
                    value={formData.password}
                    onChangeText={(text) => setFormData({ ...formData, password: text })}
                    placeholder="Enter password"
                    secureTextEntry
                    className="bg-background border border-input rounded-lg px-4 py-3 text-foreground"
                    placeholderTextColor="#6B7280"
                  />
                </View>
              )}

              {/* Phone */}
              <View>
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Phone Number
                </Text>
                <TextInput
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                  className="bg-background border border-input rounded-lg px-4 py-3 text-foreground"
                  placeholderTextColor="#6B7280"
                />
              </View>

              {/* Address */}
              <View>
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Address
                </Text>
                <TextInput
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                  placeholder="Enter address"
                  multiline
                  numberOfLines={3}
                  className="bg-background border border-input rounded-lg px-4 py-3 text-foreground min-h-[100px]"
                  placeholderTextColor="#6B7280"
                  textAlignVertical="top"
                />
              </View>

              {/* Role Selection */}
              <View>
                <Text className="text-sm font-semibold text-foreground mb-3">
                  Role *
                </Text>
                <View className="flex-row space-x-3">
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
                      <Text className={`text-center font-medium capitalize ${
                        formData.type === role
                          ? 'text-accent-foreground'
                          : 'text-foreground'
                      }`}>
                        {role}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Permissions (for admin users) */}
              {formData.type === 'admin' && (
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-3">
                    Permissions
                  </Text>
                  <View className="space-y-3">
                    {permissionOptions.map((permission) => (
                      <TouchableOpacity
                        key={permission}
                        className="flex-row items-center"
                        onPress={() => {
                          const newPermissions = formData.permissions.includes(permission)
                            ? formData.permissions.filter(p => p !== permission)
                            : [...formData.permissions, permission];
                          setFormData({ ...formData, permissions: newPermissions });
                        }}
                      >
                        <View className={`w-6 h-6 rounded-lg border-2 mr-3 flex items-center justify-center ${
                          formData.permissions.includes(permission)
                            ? 'bg-accent border-accent'
                            : 'border-input'
                        }`}>
                          {formData.permissions.includes(permission) && (
                            <Ionicons name="checkmark" size={16} className="text-accent-foreground" />
                          )}
                        </View>
                        <Text className="text-foreground">
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

            {/* Action Buttons */}
            <View className="mt-8 space-y-3">
              <TouchableOpacity
                className="bg-accent py-4 rounded-lg"
                onPress={handleSubmit}
              >
                <Text className="text-center font-semibold text-lg text-accent-foreground">
                  {editingUser ? 'Update User' : 'Create User'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className="py-4 rounded-lg border border-input"
                onPress={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                <Text className="text-center font-semibold text-foreground">
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

export default AdminUsers;