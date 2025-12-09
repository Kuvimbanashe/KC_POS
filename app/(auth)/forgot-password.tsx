// app/(auth)/forgot-password.js
import { useState } from 'react';
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

  s_4: {},

  s_5: {
  borderWidth: 1,
  borderRadius: 12,
  padding: 12
},

  s_6: {},

  s_7: {
  paddingVertical: 12,
  borderWidth: 1
},

  s_8: {
  color: "#6b7280"
}
});
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
    <View style={styles.s_1}>
      <Text style={styles.s_2}>
        Forgot Password
      </Text>
      <Text style={styles.s_3}>
        Enter your email to receive reset instructions
      </Text>

      <View style={styles.s_4}>
        <TextInput
          style={styles.s_5}
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
        style={styles.s_7}
        onPress={() => router.back()}
      >
        <Text style={styles.s_8}>
          Back to Sign In
        </Text>
      </TouchableOpacity>
    </View>
  );
}