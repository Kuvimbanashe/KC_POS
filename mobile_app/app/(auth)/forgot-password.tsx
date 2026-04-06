import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AuthScaffold } from '../../components/ui/AuthScaffold';
import { apiClient } from '../../services/api';
import { ADMIN_COLORS } from '../../theme/adminUi';

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
    <AuthScaffold
      title="Recover your account"
      subtitle="Enter the email tied to the account and we’ll walk you through the reset flow."
    >
      <View style={styles.callout}>
        <Text style={styles.calloutText}>
          This build shows the OTP in-app because email delivery is not configured yet.
        </Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Email Address"
        placeholderTextColor={ADMIN_COLORS.tertiaryText}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TouchableOpacity
        style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
        onPress={handleResetPassword}
        disabled={isLoading}
      >
        <View style={styles.buttonContent}>
          {isLoading && <ActivityIndicator size="small" color="#ffffff" />}
          <Text style={styles.primaryButtonText}>
            {isLoading ? 'Generating...' : 'Generate Reset Code'}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
        <Text style={styles.secondaryButtonText}>Back to Sign In</Text>
      </TouchableOpacity>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  callout: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fdba74',
    backgroundColor: ADMIN_COLORS.surfaceTint,
    padding: 14,
  },
  calloutText: {
    color: ADMIN_COLORS.accentStrong,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
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
    marginTop: 4,
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
