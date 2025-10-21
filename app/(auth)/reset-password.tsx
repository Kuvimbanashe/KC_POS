// app/(auth)/reset-password.js
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';

export default function ResetPasswordScreen() {
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleReset = async () => {
    if (!passwords.newPassword || !passwords.confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (passwords.newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate password reset
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert(
        'Success', 
        'Password has been reset successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/signin')
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-primary-white p-6 justify-center">
      <Text className="text-3xl font-bold text-primary  mb-2 text-center">
        Reset Password
      </Text>
      <Text className="text-muted-foreground mb-8 text-center">
        Enter your new password
      </Text>

      <View className="space-y-4 mb-6">
        <TextInput
          className="border border-gray-300 rounded-lg p-3 text-primary-navy-dark"
          placeholder="New Password"
          value={passwords.newPassword}
          onChangeText={(text) => setPasswords({...passwords, newPassword: text})}
          secureTextEntry
        />
        
        <TextInput
          className="border border-gray-300 rounded-lg p-3 text-primary-navy-dark"
          placeholder="Confirm New Password"
          value={passwords.confirmPassword}
          onChangeText={(text) => setPasswords({...passwords, confirmPassword: text})}
          secureTextEntry
        />
      </View>

      <TouchableOpacity 
        className={`py-3 rounded-lg mb-4 ${
          isLoading ? 'bg-gray-400' : 'bg-primary -orange-400'
        }`}
        onPress={handleReset}
        disabled={isLoading}
      >
        <Text className="text-muted text-center  font-semibold">
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        className="py-3 hidden rounded-lg border border-muted"
        onPress={() => router.back()}
      >
        <Text className="text-primary text-center  font-semibold">
          Back to OTP Verification
        </Text>
      </TouchableOpacity>
    </View>
  );
}