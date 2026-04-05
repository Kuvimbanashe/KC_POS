// app/(auth)/otp-verification.js
import { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 24,
    justifyContent: 'center',
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
    marginBottom: 32,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 12,
  },
  otpInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e6edf3',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 16,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
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
  resendButton: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e6edf3',
    backgroundColor: 'transparent',
  },
  resendButtonText: {
    color: '#6b7280',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
});
export default function OTPVerificationScreen() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const inputs = useRef([]);
  const router = useRouter();

  const focusNext = (index: number, value: string) => {
    if (value && index < 5) {
      (inputs.current[index + 1] as TextInput).focus();
    }
  };

  const focusPrevious = (index: number, key: string) => {
    if (key === 'Backspace' && index > 0) {
      (inputs.current[index - 1] as TextInput).focus();
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
    <View style={styles.container}>
      <Text style={styles.title}>
        OTP Verification
      </Text>
      <Text style={styles.subtitle}>
        Enter the 6-digit code sent to your email
      </Text>

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref: TextInput | null) => {
              if (ref) {
                (inputs.current[index] as TextInput) = ref;
              }
            }}
            style={styles.otpInput}
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
        style={[
          styles.submitButton,
          isLoading && styles.submitButtonDisabled,
        ]}
        onPress={handleVerify}
        disabled={isLoading}
      >
        <Text style={styles.submitButtonText}>
          {isLoading ? 'Verifying...' : 'Verify OTP'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.resendButton}>
        <Text style={styles.resendButtonText}>
          Resend OTP
        </Text>
      </TouchableOpacity>
    </View>
  );
}