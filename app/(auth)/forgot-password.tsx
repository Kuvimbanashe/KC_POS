import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiClient } from '../../services/api';

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
  hint: {
    fontSize: 13,
    color: '#f97316',
    marginBottom: 18,
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
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
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
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.requestPasswordReset(normalizedEmail);
      Alert.alert(
        'Verification Code Ready',
        `Use this code to continue: ${response.otpCode}\n\nIt expires in 10 minutes.`,
        [
          {
            text: 'Continue',
            onPress: () =>
              router.push({
                pathname: '/otp-verification',
                params: { email: response.email },
              }),
          },
        ],
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate reset code';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>Enter your account email to generate a reset code.</Text>
      <Text style={styles.hint}>This build shows the OTP in-app because email delivery is not configured yet.</Text>

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
        style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
        onPress={handleResetPassword}
        disabled={isLoading}
      >
        <View style={styles.buttonContent}>
          {isLoading && <ActivityIndicator size="small" color="#ffffff" />}
          <Text style={styles.submitButtonText}>{isLoading ? 'Generating...' : 'Generate Reset Code'}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Back to Sign In</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
