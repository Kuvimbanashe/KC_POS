// app/(auth)/signup.js
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { StyleSheet } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { setCredentials } from '../../store/slices/authSlice';
import { addUser } from '../../store/slices/userManagementSlice';
import { useAppDispatch } from '../../store/hooks';
import type { UserProfile, UserRole } from '../../store/types';

interface SignUpFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  confirmPassword: string;
  userType: UserRole;
}



const styles = StyleSheet.create({
  s_1: {
  flex: 1,
  padding: 24
},

  s_2: {
  fontWeight: "700",
  marginBottom: 8
},

  s_3: {
  color: "#6b7280"
},

  s_4: {},

  s_5: {
  borderWidth: 1,
  borderRadius: 12,
  padding: 12
},

  s_6: {
  borderWidth: 1,
  borderRadius: 12,
  padding: 12
},

  s_7: {
  marginBottom: 8
},

  s_8: {
  flexDirection: "row"
},

  s_9: {},

  s_10: {
  flexDirection: "row",
  justifyContent: "center"
},

  s_11: {
  color: "#6b7280"
},

  s_12: {}
});
export default function SignUpScreen() {
  const [formData, setFormData] = useState<SignUpFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
    userType: 'cashier',
  });
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useAppDispatch();
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
      const authUser: UserProfile = {
        id: Date.now(),
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        address: formData.address,
        type: formData.userType,
        status: 'active',
        permissions: formData.userType === 'admin' ? ['all'] : ['sales'],
        lastLogin: new Date().toISOString(),
        joinDate: new Date().toISOString().split('T')[0],
      };

      dispatch(
        setCredentials({
          user: authUser,
          token: 'mock-jwt-token',
          userType: formData.userType,
        }),
      );

      Alert.alert('Success', 'Account created successfully!');
      router.replace(formData.userType === 'admin' ? '/(admin)' : '/(cashier)');
    } catch (error) {
      Alert.alert('Error', 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.s_1}>
      <Text style={styles.s_2}>
        Create Account
      </Text>
      <Text style={styles.s_3}>
        Join our shop management system
      </Text>

      <View style={styles.s_4}>
        <TextInput
          style={styles.s_5}
          placeholder="Full Name *"
          value={formData.name}
          onChangeText={(text) => setFormData({...formData, name: text})}
        />
        
        <TextInput
          style={styles.s_5}
          placeholder="Email Address *"
          value={formData.email}
          onChangeText={(text) => setFormData({...formData, email: text})}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        
        <TextInput
          style={styles.s_5}
          placeholder="Phone Number"
          value={formData.phone}
          onChangeText={(text) => setFormData({...formData, phone: text})}
          keyboardType="phone-pad"
        />
        
        <TextInput
          style={styles.s_5}
          placeholder="Address"
          value={formData.address}
          onChangeText={(text) => setFormData({...formData, address: text})}
        />

        <View style={styles.s_6}>
          <Text style={styles.s_7}>Account Type</Text>
          <View style={styles.s_8}>
            {(['cashier', 'admin'] as UserRole[]).map((type) => (
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
          style={styles.s_5}
          placeholder="Password *"
          value={formData.password}
          onChangeText={(text) => setFormData({...formData, password: text})}
          secureTextEntry
        />
        
        <TextInput
          style={styles.s_5}
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

      <View style={styles.s_10}>
        <Text style={styles.s_11}>Already have an account? </Text>
        <Link href="/signin" asChild>

          <Text style={styles.s_12}
          style={{ color: '#FB923C' }}
          >Sign In</Text>
       
       
        </Link>
      </View>
    </ScrollView>
  );
}