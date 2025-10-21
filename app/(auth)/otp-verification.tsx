// app/(auth)/otp-verification.js
import { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';

export default function OTPVerificationScreen() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const inputs = useRef([]);
  const router = useRouter();

  const focusNext = (index, value) => {
    if (value && index < 5) {
      inputs.current[index + 1].focus();
    }
  };

  const focusPrevious = (index, key) => {
    if (key === 'Backspace' && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      Alert.alert('Error', 'Please enter the complete OTP code');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate OTP verification
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (otpCode === '123456') { // Mock valid OTP
        router.push('/reset-password');
      } else {
        Alert.alert('Error', 'Invalid OTP code. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-primary-white p-6 justify-center">
      <Text className="text-3xl font-bold text-primary mb-2 text-center">
        OTP Verification
      </Text>
      <Text className="text-muted-foreground mb-8 text-center">
        Enter the 6-digit code sent to your email
      </Text>

      <View className="flex-row justify-between mb-8">
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={ref => inputs.current[index] = ref}
            className="w-12 h-12 border-2  rounded-lg text-center text-lg font-bold text-primary"
            value={digit}
            onChangeText={(value) => {
              const newOtp = [...otp];
              newOtp[index] = value;
              setOtp(newOtp);
              focusNext(index, value);
            }}
            onKeyPress={({ nativeEvent: { key } }) => focusPrevious(index, key)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
          />
        ))}
      </View>

      <TouchableOpacity 
        className={`py-3 rounded-md mb-4 ${
          isLoading ? 'bg-gray-400' : 'bg-primary text-orange-400'
        }`}
        onPress={handleVerify}
        disabled={isLoading}
      >
        <Text className="text-muted text-center  font-semibold">
          {isLoading ? 'Verifying...' : 'Verify OTP'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity className="py-3 border-muted-foreground border rounded-md ">
        <Text className="text-primary
         text-center  font-semibold">
          Resend OTP
        </Text>
      </TouchableOpacity>
    </View>
  );
}