import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Link, useRouter } from 'expo-router';

import { AuthScaffold } from '../../components/ui/AuthScaffold';
import { setCredentials } from '../../store/slices/authSlice';
import { useAppDispatch } from '../../store/hooks';
import { apiClient } from '../../services/api';
import { ADMIN_COLORS } from '../../theme/adminUi';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.login(email, password);
      dispatch(
        setCredentials({
          user: response.user,
          token: response.token,
          userType: response.user.type,
        }),
      );
      router.replace(response.user.type === 'admin' ? '/(admin)' : '/(cashier)');
    } catch (_apiError) {
      Alert.alert('Error', 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthScaffold
      title="Welcome back"
      subtitle="Sign in to resume selling, review reports, and keep the business moving."
      footer={
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Don&apos;t have an account?</Text>
          <Link href="/signup" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Create one</Text>
            </TouchableOpacity>
          </Link>
        </View>
      }
    >
      <View style={styles.formBlock}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor={ADMIN_COLORS.tertiaryText}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          placeholderTextColor={ADMIN_COLORS.tertiaryText}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <View style={styles.linkRow}>
        <Link href="/forgot-password" asChild>
          <TouchableOpacity>
            <Text style={styles.inlineLink}>Forgot password?</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
        onPress={handleSignIn}
        disabled={isLoading}
      >
        <View style={styles.buttonContent}>
          {isLoading ? <ActivityIndicator size="small" color="#ffffff" /> : null}
          <Text style={styles.primaryButtonText}>{isLoading ? 'Signing In...' : 'Sign In'}</Text>
        </View>
      </TouchableOpacity>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  formBlock: {
    gap: 8,
  },
  label: {
    marginTop: 4,
    color: ADMIN_COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: ADMIN_COLORS.text,
    backgroundColor: ADMIN_COLORS.surfaceMuted,
    fontSize: 15,
  },
  linkRow: {
    alignItems: 'flex-end',
  },
  inlineLink: {
    color: ADMIN_COLORS.accentStrong,
    fontSize: 13,
    fontWeight: '700',
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
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    color: ADMIN_COLORS.secondaryText,
    fontSize: 14,
  },
  footerLink: {
    color: ADMIN_COLORS.accentStrong,
    fontSize: 14,
    fontWeight: '700',
  },
});
