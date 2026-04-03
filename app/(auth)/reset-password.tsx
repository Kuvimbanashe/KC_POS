import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
    marginBottom: 12,
  },
  hint: {
    fontSize: 13,
    color: '#f97316',
    marginBottom: 24,
  },
  inputContainer: {
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

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string; code?: string }>();
  const email = Array.isArray(params.email) ? params.email[0] : params.email ?? '';
  const code = Array.isArray(params.code) ? params.code[0] : params.code ?? '';
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleReset = async () => {
    if (!email || !code) {
      Alert.alert('Error', 'Reset session is missing. Start again from forgot password.');
      return;
    }
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
      await apiClient.resetPassword(email, code, passwords.newPassword);
      Alert.alert('Success', 'Password has been reset successfully.', [
        {
          text: 'OK',
          onPress: () => router.replace('/signin'),
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reset password';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>Enter your new password for {email || 'your account'}.</Text>
      <Text style={styles.hint}>Your verification code has already been confirmed.</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="New Password"
          placeholderTextColor="#9ca3af"
          value={passwords.newPassword}
          onChangeText={(text) => setPasswords({ ...passwords, newPassword: text })}
          secureTextEntry
        />

        <TextInput
          style={styles.input}
          placeholder="Confirm New Password"
          placeholderTextColor="#9ca3af"
          value={passwords.confirmPassword}
          onChangeText={(text) => setPasswords({ ...passwords, confirmPassword: text })}
          secureTextEntry
        />
      </View>

      <TouchableOpacity
        style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
        onPress={handleReset}
        disabled={isLoading}
      >
        <View style={styles.buttonContent}>
          {isLoading && <ActivityIndicator size="small" color="#ffffff" />}
          <Text style={styles.submitButtonText}>{isLoading ? 'Resetting...' : 'Reset Password'}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
