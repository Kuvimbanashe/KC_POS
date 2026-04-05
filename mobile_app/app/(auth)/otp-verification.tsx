import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

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
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 24,
  },
  email: {
    fontSize: 14,
    color: '#f97316',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '600',
  },
  otpInput: {
    height: 56,
    borderWidth: 1,
    borderColor: '#e6edf3',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: '#0f172a',
    backgroundColor: '#ffffff',
    letterSpacing: 8,
    marginBottom: 24,
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

export default function OTPVerificationScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const email = Array.isArray(params.email) ? params.email[0] : params.email ?? '';
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleVerify = async () => {
    const normalizedCode = otpCode.trim();
    if (!email) {
      Alert.alert('Error', 'Reset context is missing. Start again from forgot password.');
      return;
    }
    if (normalizedCode.length !== 6) {
      Alert.alert('Error', 'Please enter the full 6-digit code.');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.verifyPasswordResetCode(email, normalizedCode);
      router.push({
        pathname: '/reset-password',
        params: {
          email,
          code: normalizedCode,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Verification failed';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container} >
      <Text style={styles.title}>Verify Code</Text>
      <Text style={styles.subtitle}>Enter the 6-digit reset code generated for your account.</Text>
      <Text style={styles.email}>{email || 'No email provided'}</Text>

      <TextInput
        style={styles.otpInput}
        value={otpCode}
        onChangeText={(value) => setOtpCode(value.replace(/[^0-9]/g, '').slice(0, 6))}
        keyboardType="numeric"
        maxLength={6}
        placeholder="000000"
        placeholderTextColor="#9ca3af"
      />

      <TouchableOpacity
        style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
        onPress={handleVerify}
        disabled={isLoading}
      >
        <View style={styles.buttonContent}>
          {isLoading && <ActivityIndicator size="small" color="#ffffff" />}
          <Text style={styles.submitButtonText}>{isLoading ? 'Verifying...' : 'Verify Code'}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}
