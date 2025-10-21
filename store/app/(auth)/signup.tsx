// app/(auth)/signup.js
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../store/slices/authSlice';
import { addUser } from '../../store/slices/userManagementSlice';

export default function SignUpScreen() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
    userType: 'cashier',
  });
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();

  const handleSignUp = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newUser = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        password: formData.password,
        type: formData.userType,
      };

      // Add user to management system
      dispatch(addUser(newUser));

      // Auto-login the new user
      dispatch(setCredentials({
        user: { 
          id: Date.now(), 
          name: formData.name, 
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
        },
        token: 'mock-jwt-token',
        userType: formData.userType
      }));

      Alert.alert('Success', 'Account created successfully!');
      router.replace(formData.userType === 'admin' ? '/(admin)' : '/(cashier)');
    } catch (error) {
      Alert.alert('Error', 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-primary-white p-6">
      <Text className="text-3xl font-bold text-primary mb-2 text-center">
        Create Account
      </Text>
      <Text className="text-muted-foreground mb-6 text-center">
        Join our shop management system
      </Text>

      <View className="space-y-4 mb-6">
        <TextInput
          className="border border-gray-300 rounded-lg p-3 text-primary-navy-dark"
          placeholder="Full Name *"
          value={formData.name}
          onChangeText={(text) => setFormData({...formData, name: text})}
        />
        
        <TextInput
          className="border border-gray-300 rounded-lg p-3 text-primary-navy-dark"
          placeholder="Email Address *"
          value={formData.email}
          onChangeText={(text) => setFormData({...formData, email: text})}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        
        <TextInput
          className="border border-gray-300 rounded-lg p-3 text-primary-navy-dark"
          placeholder="Phone Number"
          value={formData.phone}
          onChangeText={(text) => setFormData({...formData, phone: text})}
          keyboardType="phone-pad"
        />
        
        <TextInput
          className="border border-gray-300 rounded-lg p-3 text-primary-navy-dark"
          placeholder="Address"
          value={formData.address}
          onChangeText={(text) => setFormData({...formData, address: text})}
        />

        <View className="border border-gray-300 rounded-lg p-3">
          <Text className="text-gray-600 mb-2">Account Type</Text>
          <View className="flex-row space-x-4">
            {['cashier', 'admin'].map((type) => (
              <TouchableOpacity
                key={type}
                className={`flex-1 py-2 rounded-lg ${
                  formData.userType === type 
                    ? 'bg-primary text-orange-400' 
                    : 'bg-gray-200'
                }`}
                onPress={() => setFormData({...formData, userType: type})}
              >
                <Text className={
                  `text-center font-semibold ${
                    formData.userType === type 
                      ? 'text-orange-400' 
                      : 'text-gray-600'
                  }`
                }>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <TextInput
          className="border border-gray-300 rounded-lg p-3 text-primary-navy-dark"
          placeholder="Password *"
          value={formData.password}
          onChangeText={(text) => setFormData({...formData, password: text})}
          secureTextEntry
        />
        
        <TextInput
          className="border border-gray-300 rounded-lg p-3 text-primary-navy-dark"
          placeholder="Confirm Password *"
          value={formData.confirmPassword}
          onChangeText={(text) => setFormData({...formData, confirmPassword: text})}
          secureTextEntry
        />
      </View>

      <TouchableOpacity 
        className={`py-3 rounded-lg mb-4 ${
          isLoading ? 'bg-gray-400' : 'bg-primary text-muted'
        }`}
        onPress={handleSignUp}
        disabled={isLoading}
      >
        <Text className="text-muted text-center  ">
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Text>
      </TouchableOpacity>

      <View className="flex-row justify-center">
        <Text className="text-muted-foreground">Already have an account? </Text>
        <Link href="/signin" asChild>

          <Text className="text-[#FB923C] font-semibold"
          style={{ color: '#FB923C' }}
          >Sign In</Text>
       
       
        </Link>
      </View>
    </ScrollView>
  );
}