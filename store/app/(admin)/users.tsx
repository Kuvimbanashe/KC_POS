// app/(admin)/users.js
import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { 
  addUser, 
  updateUser, 
  deleteUser, 
  toggleUserStatus,
  updateUserPermissions 
} from '../../store/slices/userManagementSlice';

export default function UsersManagementScreen() {
  const [activeTab, setActiveTab] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    type: 'cashier',
    permissions: ['sales'],
  });

  const { users, roles, permissions } = useSelector(state => state.userManagement);
  const dispatch = useDispatch();

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddUser = () => {
    if (!formData.name || !formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    dispatch(addUser(formData));
    setShowUserForm(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      password: '',
      type: 'cashier',
      permissions: ['sales'],
    });
    Alert.alert('Success', 'User added successfully');
  };

  const handleDeleteUser = (userId, userName) => {
    Alert.alert(
      'Confirm Delete',
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

  const renderUserList = () => (
    <View className="space-y-4">
      <View className="bg-gray-100 p-3 rounded-lg">
        <TextInput
          className="bg-primary-white p-2 rounded"
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <TouchableOpacity
        className="bg-primary-orange-400 py-3 rounded-lg flex-row items-center justify-center"
        onPress={() => setShowUserForm(true)}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text className="text-primary-white ml-2 font-semibold">Add New User</Text>
      </TouchableOpacity>

      {filteredUsers.map(user => (
        <View key={user.id} className="bg-white p-4 rounded-lg shadow-sm">
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-1">
              <Text className="text-lg font-semibold text-primary-navy-dark">
                {user.name}
              </Text>
              <Text className="text-gray-600">{user.email}</Text>
              <Text className="text-gray-600">{user.phone}</Text>
            </View>
            <View className="items-end">
              <View className={`px-2 py-1 rounded-full ${
                user.status === 'active' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <Text className={
                  user.status === 'active' ? 'text-green-800' : 'text-red-800'
                }>
                  {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                </Text>
              </View>
              <Text className="text-gray-600 text-sm mt-1">
                {user.type.charAt(0).toUpperCase() + user.type.slice(1)}
              </Text>
            </View>
          </View>

          <View className="flex-row justify-between items-center">
            <Text className="text-gray-600 text-sm">
              Joined: {new Date(user.joinDate).toLocaleDateString()}
            </Text>
            <View className="flex-row space-x-2">
              <TouchableOpacity 
                className={`px-3 py-1 rounded ${
                  user.status === 'active' ? 'bg-red-500' : 'bg-green-500'
                }`}
                onPress={() => handleToggleStatus(user.id, user.name, user.status)}
              >
                <Text className="text-primary-white text-sm">
                  {user.status === 'active' ? 'Deactivate' : 'Activate'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="bg-primary-orange-400 px-3 py-1 rounded"
                onPress={() => {
                  setSelectedUser(user);
                  setActiveTab('permissions');
                }}
              >
                <Text className="text-primary-white text-sm">Permissions</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="bg-red-500 px-3 py-1 rounded"
                onPress={() => handleDeleteUser(user.id, user.name)}
              >
                <Text className="text-primary-white text-sm">Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const renderUserForm = () => (
    <View className="bg-white p-4 rounded-lg shadow-sm">
      <Text className="text-xl font-semibold text-primary-navy-dark mb-4">
        Add New User
      </Text>

      <View className="space-y-3">
        <TextInput
          className="border border-gray-300 rounded-lg p-3"
          placeholder="Full Name *"
          value={formData.name}
          onChangeText={(text) => setFormData({...formData, name: text})}
        />
        
        <TextInput
          className="border border-gray-300 rounded-lg p-3"
          placeholder="Email *"
          value={formData.email}
          onChangeText={(text) => setFormData({...formData, email: text})}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        
        <TextInput
          className="border border-gray-300 rounded-lg p-3"
          placeholder="Phone"
          value={formData.phone}
          onChangeText={(text) => setFormData({...formData, phone: text})}
          keyboardType="phone-pad"
        />
        
        <TextInput
          className="border border-gray-300 rounded-lg p-3"
          placeholder="Address"
          value={formData.address}
          onChangeText={(text) => setFormData({...formData, address: text})}
        />

        <TextInput
          className="border border-gray-300 rounded-lg p-3"
          placeholder="Password *"
          value={formData.password}
          onChangeText={(text) => setFormData({...formData, password: text})}
          secureTextEntry
        />

        <View className="border border-gray-300 rounded-lg p-3">
          <Text className="text-gray-600 mb-2">User Type</Text>
          <View className="flex-row space-x-2">
            {['cashier', 'admin'].map((type) => (
              <TouchableOpacity
                key={type}
                className={`flex-1 py-2 rounded ${
                  formData.type === type 
                    ? 'bg-primary-orange-400' 
                    : 'bg-gray-200'
                }`}
                onPress={() => setFormData({...formData, type})}
              >
                <Text className={
                  `text-center font-semibold ${
                    formData.type === type 
                      ? 'text-primary-white' 
                      : 'text-gray-600'
                  }`
                }>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="flex-row space-x-2">
          <TouchableOpacity
            className="flex-1 bg-gray-500 py-3 rounded-lg"
            onPress={() => setShowUserForm(false)}
          >
            <Text className="text-primary-white text-center font-semibold">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-primary-orange-400 py-3 rounded-lg"
            onPress={handleAddUser}
          >
            <Text className="text-primary-white text-center font-semibold">Add User</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderPermissions = () => (
    <View className="space-y-4">
      {selectedUser && (
        <>
          <View className="bg-white p-4 rounded-lg shadow-sm">
            <Text className="text-lg font-semibold text-primary-navy-dark mb-2">
              Permissions for {selectedUser.name}
            </Text>
            <Text className="text-gray-600 mb-4">{selectedUser.email}</Text>

            <View className="space-y-3">
              {permissions.map(permission => (
                <TouchableOpacity
                  key={permission}
                  className="flex-row items-center"
                  onPress={() => {
                    const newPermissions = selectedUser.permissions.includes(permission)
                      ? selectedUser.permissions.filter(p => p !== permission)
                      : [...selectedUser.permissions, permission];
                    
                    dispatch(updateUserPermissions({
                      userId: selectedUser.id,
                      permissions: newPermissions
                    }));
                    
                    setSelectedUser({
                      ...selectedUser,
                      permissions: newPermissions
                    });
                  }}
                >
                  <View className={`w-6 h-6 rounded border-2 mr-3 ${
                    selectedUser.permissions.includes(permission)
                      ? 'bg-primary-orange-400 border-primary-orange-400'
                      : 'border-gray-300'
                  }`}>
                    {selectedUser.permissions.includes(permission) && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </View>
                  <Text className="text-primary-navy-dark">
                    {permission.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            className="bg-primary-orange-400 py-3 rounded-lg"
            onPress={() => setActiveTab('list')}
          >
            <Text className="text-primary-white text-center font-semibold">
              Back to User List
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-primary-white">
      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="bg-gray-100">
        <View className="flex-row p-2 space-x-2">
          {['list', 'permissions'].map((tab) => (
            <TouchableOpacity
              key={tab}
              className={`px-4 py-2 rounded-full ${
                activeTab === tab 
                  ? 'bg-primary-orange-400' 
                  : 'bg-primary-white'
              }`}
              onPress={() => setActiveTab(tab)}
            >
              <Text className={
                activeTab === tab 
                  ? 'text-primary-white font-semibold' 
                  : 'text-primary-navy-dark'
              }>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Content */}
      <ScrollView className="flex-1 p-4">
        {showUserForm ? (
          renderUserForm()
        ) : activeTab === 'list' ? (
          renderUserList()
        ) : activeTab === 'permissions' ? (
          renderPermissions()
        ) : null}
      </ScrollView>
    </View>
  );
}