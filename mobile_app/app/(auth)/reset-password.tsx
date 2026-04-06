import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AuthScaffold } from '../../components/ui/AuthScaffold';
import { apiClient } from '../../services/api';
import { ADMIN_COLORS } from '../../theme/adminUi';

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
    <AuthScaffold
      title="Choose a new password"
      subtitle={`You’re resetting access for ${email || 'your account'}. Set a strong password to finish.`}
    >
      <View style={styles.callout}>
        <Text style={styles.calloutText}>Your verification code has already been confirmed.</Text>
      </View>

      <View style={styles.inputStack}>
        <TextInput
          style={styles.input}
          placeholder="New Password"
          placeholderTextColor={ADMIN_COLORS.tertiaryText}
          value={passwords.newPassword}
          onChangeText={(text) => setPasswords({ ...passwords, newPassword: text })}
          secureTextEntry
        />

        <TextInput
          style={styles.input}
          placeholder="Confirm New Password"
          placeholderTextColor={ADMIN_COLORS.tertiaryText}
          value={passwords.confirmPassword}
          onChangeText={(text) => setPasswords({ ...passwords, confirmPassword: text })}
          secureTextEntry
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
        onPress={handleReset}
        disabled={isLoading}
      >
        <View style={styles.buttonContent}>
          {isLoading && <ActivityIndicator size="small" color="#ffffff" />}
          <Text style={styles.primaryButtonText}>{isLoading ? 'Resetting...' : 'Reset Password'}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
        <Text style={styles.secondaryButtonText}>Back</Text>
      </TouchableOpacity>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  callout: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    backgroundColor: ADMIN_COLORS.navyTint,
    padding: 14,
  },
  calloutText: {
    color: ADMIN_COLORS.secondaryText,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
  inputStack: {
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: ADMIN_COLORS.text,
    backgroundColor: ADMIN_COLORS.surfaceMuted,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ADMIN_COLORS.primary,
  },
  primaryButtonDisabled: {
    backgroundColor: ADMIN_COLORS.tertiaryText,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ADMIN_COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
  },
  secondaryButtonText: {
    color: ADMIN_COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
});
