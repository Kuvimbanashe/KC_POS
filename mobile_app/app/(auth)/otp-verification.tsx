import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AuthScaffold } from '../../components/ui/AuthScaffold';
import { apiClient } from '../../services/api';
import { ADMIN_COLORS } from '../../theme/adminUi';

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
    <AuthScaffold
      title="Verify the reset code"
      subtitle="Enter the six-digit code generated for your account to continue."
    >
      <View style={styles.emailBadge}>
        <Text style={styles.emailLabel}>Code sent for</Text>
        <Text style={styles.emailValue}>{email || 'No email provided'}</Text>
      </View>

      <TextInput
        style={styles.otpInput}
        value={otpCode}
        onChangeText={(value) => setOtpCode(value.replace(/[^0-9]/g, '').slice(0, 6))}
        keyboardType="numeric"
        maxLength={6}
        placeholder="000000"
        placeholderTextColor={ADMIN_COLORS.tertiaryText}
      />

      <TouchableOpacity
        style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
        onPress={handleVerify}
        disabled={isLoading}
      >
        <View style={styles.buttonContent}>
          {isLoading && <ActivityIndicator size="small" color="#ffffff" />}
          <Text style={styles.primaryButtonText}>{isLoading ? 'Verifying...' : 'Verify Code'}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
        <Text style={styles.secondaryButtonText}>Back</Text>
      </TouchableOpacity>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  emailBadge: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    backgroundColor: ADMIN_COLORS.navyTint,
    padding: 14,
    gap: 4,
  },
  emailLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: ADMIN_COLORS.secondaryText,
  },
  emailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: ADMIN_COLORS.accentStrong,
  },
  otpInput: {
    height: 58,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    borderRadius: 16,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: ADMIN_COLORS.text,
    backgroundColor: ADMIN_COLORS.surfaceMuted,
    letterSpacing: 8,
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
