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
  Alert
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { 
  addUser, 
  updateUser, 
  deleteUser, 
  toggleUserStatus 
} from '../../store/slices/userManagementSlice';

const AdminUsers = () => {
  const { users } = useSelector(state => state.userManagement);
  const dispatch = useDispatch();
  
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    type: 'cashier',
    permissions: ['sales'],
  });

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
      setFilteredUsers(users);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let filtered = users;

    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.type === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [searchQuery, roleFilter, users]);

  const handleSubmit = () => {
    if (!formData.name || !formData.email || (!editingUser && !formData.password)) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      if (editingUser) {
        dispatch(updateUser({
          id: editingUser.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          type: formData.type,
          permissions: formData.permissions,
        }));
        Alert.alert('Success', 'User updated successfully');
      } else {
        dispatch(addUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          address: formData.address,
          type: formData.type,
          permissions: formData.permissions,
        }));
        Alert.alert('Success', 'User created successfully');
      }
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'Failed to save user');
    }
  };

  const handleDelete = (userId, userName) => {
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

  const handleToggleStatus = (userId, userName, currentStatus) => {
    dispatch(toggleUserStatus(userId));
    Alert.alert(
      'Success', 
      `${userName} has been ${currentStatus === 'active' ? 'deactivated' : 'activated'}`
    );
  };

  const openEditDialog = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      phone: user.phone || '',
      address: user.address || '',
      type: user.type,
      permissions: user.permissions || ['sales'],
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      address: '',
      type: 'cashier',
      permissions: ['sales'],
    });
  };

  const getRoleBadge = (type) => {
    const colorMap = {
      'admin': 'bg-purple-100 text-purple-800',
      'cashier': 'bg-blue-100 text-blue-800',
    };
    
    return (
      <View className={`px-2 py-1 rounded-full ${colorMap[type] || 'bg-gray-100'}`}>
        <Text className="text-xs font-medium capitalize">
          {type}
        </Text>
      </View>
    );
  };

  const getStatusBadge = (status) => {
    const colorMap = {
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-red-100 text-red-800',
    };
    
    return (
      <View className={`px-2 py-1 rounded-full ${colorMap[status] || 'bg-gray-100'}`}>
        <Text className="text-xs font-medium capitalize">
          {status}
        </Text>
      </View>
    );
  };

  const roleOptions = [
    { value: 'all', label: 'All Roles' },
    { value: 'admin', label: 'Admin' },
    { value: 'cashier', label: 'Cashier' },
  ];

  const permissionOptions = [
    'sales',
    'inventory_view',
    'inventory_manage',
    'reports_view',
    'users_view',
    'settings'
  ];

  const renderUserItem = ({ item }) => (
    <View className="border-b border-border py-3 px-4 bg-card">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="font-semibold text-foreground text-base">{item.name}</Text>
          <Text className="text-muted-foreground text-sm">{item.email}</Text>
        </View>
        <View className="items-end">
          {getStatusBadge(item.status)}
          {getRoleBadge(item.type)}
        </View>
      </View>
      
      <View className="flex-row justify-between items-center">
        <Text className="text-xs text-muted-foreground">
          {item.phone}
        </Text>
        <Text className="text-xs text-muted-foreground">
          Joined: {new Date(item.joinDate).toLocaleDateString()}
        </Text>
      </View>

      {/* Action Buttons */}
      <View className="flex-row justify-end space-x-2 mt-3">
        <TouchableOpacity 
          className={`px-3 py-1 rounded ${
            item.status === 'active' ? 'bg-red-500' : 'bg-green-500'
          }`}
          onPress={() => handleToggleStatus(item.id, item.name, item.status)}
        >
          <Text className="text-primary-white text-sm">
            {item.status === 'active' ? 'Deactivate' : 'Activate'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="bg-accent px-3 py-1 rounded"
          onPress={() => openEditDialog(item)}
        >
          <Text className="text-accent-foreground text-sm">Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="bg-destructive px-3 py-1 rounded"
          onPress={() => handleDelete(item.id, item.name)}
        >
          <Text className="text-destructive-foreground text-sm">Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        <ScrollView className="flex-1 p-4 md:p-6 space-y-6">
          {/* Header Skeleton */}
          <View className="flex-row justify-between items-center">
            <View>
              <View className="h-8 w-40 bg-muted rounded mb-2 animate-pulse" />
              <View className="h-4 w-56 bg-muted rounded animate-pulse" />
            </View>
            <View className="h-10 w-32 bg-muted rounded animate-pulse" />
          </View>

          {/* Search and Filter Skeleton */}
          <View className="bg-card rounded-lg p-4 shadow-sm">
            <View className="h-6 w-40 bg-muted rounded mb-2 animate-pulse" />
            <View className="flex-row gap-4">
              <View className="flex-1 h-10 bg-muted rounded animate-pulse" />
              <View className="w-32 h-10 bg-muted rounded animate-pulse" />
            </View>
          </View>

          {/* Users List Skeleton */}
          <View className="bg-card rounded-lg p-4 shadow-sm">
            {[1, 2, 3, 4].map((i) => (
              <View key={i} className="border-b border-border py-3 mb-2">
                <View className="flex-row justify-between mb-2">
                  <View className="flex-1">
                    <View className="h-4 w-32 bg-muted rounded mb-1 animate-pulse" />
                    <View className="h-3 w-48 bg-muted rounded animate-pulse" />
                  </View>
                  <View className="space-y-1">
                    <View className="h-4 w-16 bg-muted rounded animate-pulse" />
                    <View className="h-4 w-12 bg-muted rounded animate-pulse" />
                  </View>
                </View>
                <View className="flex-row justify-between">
                  <View className="h-3 w-24 bg-muted rounded animate-pulse" />
                  <View className="h-3 w-20 bg-muted rounded animate-pulse" />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1">
        <View className="p-4 md:p-6 space-y-6">

          {/* Stats */}
          <View className="grid grid-cols-2 gap-4">
            <View className="bg-primary rounded-lg p-4 w-full flex-1 items-center justify-center">
              <View className="flex-row items-center mb-2">
                <Ionicons name="people" size={20} className="text-accent mr-2" />
                <Text className="text-sm font-medium text-primary-foreground">
                  All Users
                </Text>
              </View>
              <Text className="text-xl md:text-2xl font-bold text-primary-foreground">
                {users.length}
              </Text>
            </View>
            <View className="bg-primary rounded-lg p-4 w-full flex-1 items-center justify-center">
              <View className="flex-row items-center mb-2">
                <Ionicons name="shield" size={20} className="text-purple-500 mr-2" />
                <Text className="text-sm font-medium text-primary-foreground">
                  Admins
                </Text>
              </View>
              <Text className="text-xl md:text-2xl font-bold text-primary-foreground">
                {users.filter(u => u.type === 'admin').length}
              </Text>
            </View>
            <View className="bg-primary rounded-lg p-4 w-full flex-1 items-center justify-center">
              <View className="flex-row items-center mb-2">
                <Ionicons name="person" size={20} className="text-blue-500 mr-2" />
                <Text className="text-sm font-medium text-primary-foreground">
                  Cashiers
                </Text>
              </View>
              <Text className="text-xl md:text-2xl font-bold text-primary-foreground">
                {users.filter(u => u.type === 'cashier').length}
              </Text>
            </View>
            <View className="bg-primary rounded-lg p-4 w-full flex-1 items-center justify-center">
              <View className="flex-row items-center mb-2">
                <Ionicons name="checkmark-circle" size={20} className="text-green-500 mr-2" />
                <Text className="text-sm font-medium text-primary-foreground">
                  Active
                </Text>
              </View>
              <Text className="text-xl md:text-2xl font-bold text-muted primary-foreground">
                {users.filter(u => u.status === 'active').length}
              </Text>
            </View>
          </View>

          {/* Search and Filter */}
          <View className="bg-card rounded-lg p-4 border border-border">
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-row items-center">
              <Ionicons name="people" size={20} className="text-purple-500 mr-2" />
              <Text className="text-lg font-bold text-foreground">
                All Users ({filteredUsers.length})
              </Text>
              </View>
              
              <TouchableOpacity
              className="bg-accent rounded-lg px-4 py-2 flex-row items-center"
              onPress={() => setIsDialogOpen(true)}
            >
              <Ionicons name="add" size={20} className="text-accent-foreground mr-2" />
              <Text className="text-accent-foreground font-semibold">Add User</Text>
            </TouchableOpacity>
            </View>
            
            <View className="flex-col gap-4">
              {/* Search Input */}
              <View className="flex-1">
                <View className="relative">
                  <Ionicons 
                    name="search" 
                    size={20} 
                    className="absolute left-3 top-3 text-muted-foreground" 
                  />
                  <TextInput
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    className="bg-background border border-input rounded-lg pl-10 pr-4 py-3 text-foreground"
                    placeholderTextColor="#6B7280"
                  />
                </View>
              </View>

              {/* Role Filter */}
              <View className="border border-input rounded-lg bg-background min-w-[140px]">
               
                  <View className="flex-row px-2 py-2 w-full justify-center">
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
                            ? 'text-accent-foreground text-xs font-medium'
                            : 'text-muted-foreground text-xs'
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
          <View className="bg-card rounded-lg border border-border overflow-hidden">
            {filteredUsers.length === 0 ? (
              <View className="p-8 items-center">
                <Ionicons name="people-outline" size={48} className="text-muted-foreground mb-4" />
                <Text className="text-lg font-medium text-foreground mb-2">
                  No users found
                </Text>
                <Text className="text-muted-foreground text-center mb-4">
                  {searchQuery || roleFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Get started by adding your first user'
                  }
                </Text>
                {(searchQuery || roleFilter !== 'all') && (
                  <TouchableOpacity
                    className="bg-accent rounded-lg px-4 py-2"
                    onPress={() => {
                      setSearchQuery('');
                      setRoleFilter('all');
                    }}
                  >
                    <Text className="text-accent-foreground font-semibold">
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
                className="max-h-96"
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
        <View className="flex-1 bg-background pt-4">
          <View className="flex-row justify-between items-center px-4 pb-4 border-b border-border">
            <Text className="text-xl font-bold text-foreground">
              {editingUser ? 'Edit User' : 'Create New User'}
            </Text>
            <TouchableOpacity onPress={() => {
              setIsDialogOpen(false);
              resetForm();
            }}>
              <Ionicons name="close" size={24} className="text-foreground" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-4">
            <View className="space-y-4">
              {/* Name */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Full Name</Text>
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
                <Text className="text-sm font-medium text-foreground mb-2">Email</Text>
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
                  <Text className="text-sm font-medium text-foreground mb-2">Password</Text>
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
                <Text className="text-sm font-medium text-foreground mb-2">Phone</Text>
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
                <Text className="text-sm font-medium text-foreground mb-2">Address</Text>
                <TextInput
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                  placeholder="Enter address"
                  multiline
                  className="bg-background border border-input rounded-lg px-4 py-3 text-foreground min-h-[80px]"
                  placeholderTextColor="#6B7280"
                />
              </View>

              {/* Role */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Role</Text>
                <View className="flex-row space-x-2">
                  {['cashier', 'admin'].map((role) => (
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
                  <Text className="text-sm font-medium text-foreground mb-2">Permissions</Text>
                  <View className="space-y-2">
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
                        <View className={`w-6 h-6 rounded border-2 mr-3 ${
                          formData.permissions.includes(permission)
                            ? 'bg-accent border-accent'
                            : 'border-gray-300'
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

            {/* Submit Button */}
            <TouchableOpacity
              className="bg-accent rounded-lg py-4 mt-6"
              onPress={handleSubmit}
            >
              <Text className="text-accent-foreground text-center font-semibold text-lg">
                {editingUser ? 'Update User' : 'Create User'}
              </Text>
            </TouchableOpacity>
          </ScrollView>0
        </View>
      </Modal>
    </View>
  );
};

export default AdminUsers;