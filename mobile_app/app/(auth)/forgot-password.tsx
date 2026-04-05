// app/(auth)/forgot-password.js
import { useState } from 'react';
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
    marginBottom: 24,
  },
  inputContainer: {
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
  backButton: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e6edf3',
    backgroundColor: 'transparent',
  },
  backButtonText: {
    color: '#6b7280',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
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
    <View style={styles.container}>
      <Text style={styles.title}>
        Forgot Password
      </Text>
      <Text style={styles.subtitle}>
        Enter your email to receive reset instructions
      </Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor="#9ca3af"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      <TouchableOpacity 
        style={[
          styles.submitButton,
          isLoading && styles.submitButtonDisabled,
        ]}
        onPress={handleResetPassword}
        disabled={isLoading}
      >
        <Text style={styles.submitButtonText}>
          {isLoading ? 'Sending...' : 'Send Reset Instructions'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>
          Back to Sign In
        </Text>
      </TouchableOpacity>
    </View>
  );
}