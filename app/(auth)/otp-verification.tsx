// app/(auth)/otp-verification.js
import { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';



const styles = StyleSheet.create({
  s_1: {
  flex: 1,
  padding: 24,
  justifyContent: "center"
},

  s_2: {
  fontWeight: "700",
  marginBottom: 8
},

  s_3: {
  color: "#6b7280"
},

  s_4: {
  flexDirection: "row",
  justifyContent: "space-between"
},

  s_5: {
  borderRadius: 12,
  fontSize: 18,
  fontWeight: "700"
},

  s_6: {},

  s_7: {
  paddingVertical: 12,
  borderWidth: 1
},

  s_8: {}
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
    <View style={styles.s_1}>
      <Text style={styles.s_2}>
        OTP Verification
      </Text>
      <Text style={styles.s_3}>
        Enter the 6-digit code sent to your email
      </Text>

      <View style={styles.s_4}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref: TextInput | null) => {
              if (ref) {
                (inputs.current[index] as TextInput) = ref;
              }
            }}
            style={styles.s_5}
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
        <Text style={styles.s_6}>
          {isLoading ? 'Verifying...' : 'Verify OTP'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity className="py-3 border-muted-foreground border rounded-md ">
        <Text style={styles.s_8}>
          Resend OTP
        </Text>
      </TouchableOpacity>
    </View>
  );
}