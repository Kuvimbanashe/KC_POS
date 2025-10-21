// app/(auth)/forgot-password.js
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      router.push('/otp-verification')
      Alert.alert(
        'Success', 
        'Password reset instructions have been sent to your email.',
        [
          {
            text: 'OK',
            onPress: () => router.push('/otp-verification')
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send reset instructions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-primary-white p-6 justify-center">
      <Text className="text-3xl font-bold text-primary mb-2 text-center">
        Forgot Password
      </Text>
      <Text className="text-muted-foreground mb-8 text-center">
        Enter your email to receive reset instructions
      </Text>

      <View className="space-y-4 mb-6">
        <TextInput
          className="border border-gray-300 rounded-lg p-3 text-primary-navy-dark"
          placeholder="Email Address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      <TouchableOpacity 
        className={`py-3 rounded-lg mb-4 ${
          isLoading ? 'bg-gray-400' : 'bg-primary text-orange-300'
        }`}
        onPress={handleResetPassword}
        disabled={isLoading}
      >
        <Text style={{ color: '#FB923C' }} className=" text-center ">
          {isLoading ? 'Sending...' : 'Send Reset Instructions'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        className="py-3 rounded-md border border-muted-foreground text-primary"
        onPress={() => router.back()}
      >
        <Text className="text-muted-foreground font-semibold text-center">
          Back to Sign In
        </Text>
      </TouchableOpacity>
    </View>
  );
}