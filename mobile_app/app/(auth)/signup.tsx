import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Link, useRouter } from 'expo-router';

import { AuthScaffold } from '../../components/ui/AuthScaffold';
import { setCredentials } from '../../store/slices/authSlice';
import { apiClient } from '../../services/api';
import { useAppDispatch } from '../../store/hooks';
import type { UserRole } from '../../store/types';
import { ADMIN_COLORS } from '../../theme/adminUi';

interface SignUpFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  confirmPassword: string;
  userType: UserRole;
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  businessTaxId: string;
}

export default function SignUpScreen() {
  const [formData, setFormData] = useState<SignUpFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
    userType: 'admin',
    businessName: '',
    businessEmail: '',
    businessPhone: '',
    businessAddress: '',
    businessTaxId: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleSignUp = async () => {
    if (!formData.name || !formData.email || !formData.password || !formData.businessName) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.registerBusinessOwner({
        businessName: formData.businessName,
        businessEmail: formData.businessEmail || formData.email,
        businessPhone: formData.businessPhone,
        businessAddress: formData.businessAddress,
        businessTaxId: formData.businessTaxId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        password: formData.password,
        role: formData.userType,
      });

      dispatch(
        setCredentials({
          user: response.user,
          token: response.token,
          userType: response.user.type,
        }),
      );

      Alert.alert('Success', 'Business and owner account created successfully!');
      router.replace(response.user.type === 'admin' ? '/(admin)' : '/(cashier)');
    } catch (error) {
      console.log('Sign up error:', error);
      Alert.alert('Error', 'Failed to create business account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthScaffold
      title="Create your business account"
      subtitle="Set up the owner profile and the business details in one clean step."
      footer={
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Link href="/signin" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </Link>
        </View>
      }
      formBorder={0}
      formPadding={0}
    >
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Owner Details</Text>
        <View style={styles.formStack}>
          <TextInput
            style={styles.input}
            placeholder="Full Name *"
            placeholderTextColor={ADMIN_COLORS.tertiaryText}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Email Address *"
            placeholderTextColor={ADMIN_COLORS.tertiaryText}
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            placeholderTextColor={ADMIN_COLORS.tertiaryText}
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Address"
            placeholderTextColor={ADMIN_COLORS.tertiaryText}
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
          />
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Business Details</Text>
        <View style={styles.formStack}>
          <TextInput
            style={styles.input}
            placeholder="Business Name *"
            placeholderTextColor={ADMIN_COLORS.tertiaryText}
            value={formData.businessName}
            onChangeText={(text) => setFormData({ ...formData, businessName: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Business Email"
            placeholderTextColor={ADMIN_COLORS.tertiaryText}
            value={formData.businessEmail}
            onChangeText={(text) => setFormData({ ...formData, businessEmail: text })}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Business Phone"
            placeholderTextColor={ADMIN_COLORS.tertiaryText}
            value={formData.businessPhone}
            onChangeText={(text) => setFormData({ ...formData, businessPhone: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Business Address"
            placeholderTextColor={ADMIN_COLORS.tertiaryText}
            value={formData.businessAddress}
            onChangeText={(text) => setFormData({ ...formData, businessAddress: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Tax ID"
            placeholderTextColor={ADMIN_COLORS.tertiaryText}
            value={formData.businessTaxId}
            onChangeText={(text) => setFormData({ ...formData, businessTaxId: text })}
          />
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Password Setup</Text>
       

        <View style={styles.formStack}>
          <TextInput
            style={styles.input}
            placeholder="Password *"
            placeholderTextColor={ADMIN_COLORS.tertiaryText}
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password *"
            placeholderTextColor={ADMIN_COLORS.tertiaryText}
            value={formData.confirmPassword}
            onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
            secureTextEntry
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
        onPress={handleSignUp}
        disabled={isLoading}
      >
        <View style={styles.buttonContent}>
          {isLoading ? <ActivityIndicator size="small" color="#ffffff" /> : null}
          <Text style={styles.primaryButtonText}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Text>
        </View>
      </TouchableOpacity>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    borderRadius: 18,
    padding: 16,
    backgroundColor: ADMIN_COLORS.navyTint,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ADMIN_COLORS.text,
  },
  formStack: {
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
    backgroundColor: '#ffffff',
  },
  roleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roleButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  roleButtonActive: {
    backgroundColor: ADMIN_COLORS.primary,
    borderColor: ADMIN_COLORS.primary,
  },
  roleText: {
    color: ADMIN_COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  roleTextActive: {
    color: '#ffffff',
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: ADMIN_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
