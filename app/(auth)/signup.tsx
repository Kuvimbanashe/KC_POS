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
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
  },
  formContainer: {
    gap: 16,
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e6edf3',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  accountTypeContainer: {
    borderWidth: 1,
    borderColor: '#e6edf3',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
  },
  accountTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  accountTypeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  accountTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e6edf3',
  },
  accountTypeButtonActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  accountTypeText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  accountTypeTextActive: {
    color: '#f97316',
  },
  submitButton: {
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#0f172a',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  signInText: {
    fontSize: 14,
    color: '#6b7280',
  },
  signInLink: {
    fontSize: 14,
    color: '#f97316',
    fontWeight: '600',
  },
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
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <Text style={styles.title}>
        Create Account
      </Text>
      <Text style={styles.subtitle}>
        Join our shop management system
      </Text>

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Full Name *"
          placeholderTextColor="#9ca3af"
          value={formData.name}
          onChangeText={(text) => setFormData({...formData, name: text})}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Email Address *"
          placeholderTextColor="#9ca3af"
          value={formData.email}
          onChangeText={(text) => setFormData({...formData, email: text})}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          placeholderTextColor="#9ca3af"
          value={formData.phone}
          onChangeText={(text) => setFormData({...formData, phone: text})}
          keyboardType="phone-pad"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Address"
          placeholderTextColor="#9ca3af"
          value={formData.address}
          onChangeText={(text) => setFormData({...formData, address: text})}
        />

        <View style={styles.accountTypeContainer}>
          <Text style={styles.accountTypeLabel}>Account Type</Text>
          <View style={styles.accountTypeRow}>
            {(['cashier', 'admin'] as UserRole[]).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.accountTypeButton,
                  formData.userType === type && styles.accountTypeButtonActive,
                ]}
                onPress={() => setFormData({...formData, userType: type})}
              >
                <Text style={[
                  styles.accountTypeText,
                  formData.userType === type && styles.accountTypeTextActive,
                ]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <TextInput
          style={styles.input}
          placeholder="Password *"
          placeholderTextColor="#9ca3af"
          value={formData.password}
          onChangeText={(text) => setFormData({...formData, password: text})}
          secureTextEntry
        />
        
        <TextInput
          style={styles.input}
          placeholder="Confirm Password *"
          placeholderTextColor="#9ca3af"
          value={formData.confirmPassword}
          onChangeText={(text) => setFormData({...formData, confirmPassword: text})}
          secureTextEntry
        />
      </View>

      <TouchableOpacity 
        style={[
          styles.submitButton,
          isLoading && styles.submitButtonDisabled,
        ]}
        onPress={handleSignUp}
        disabled={isLoading}
      >
        <Text style={styles.submitButtonText}>
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Text>
      </TouchableOpacity>

      <View style={styles.signInContainer}>
        <Text style={styles.signInText}>Already have an account? </Text>
        <Link href="/signin" asChild>
          <TouchableOpacity>
            <Text style={styles.signInLink}>Sign In</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </ScrollView>
  );
}