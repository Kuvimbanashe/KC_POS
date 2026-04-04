import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { logout, updateProfile } from '../../../store/slices/authSlice';
import { updateUser as updateManagedUser } from '../../../store/slices/userManagementSlice';
import { apiClient } from '../../../services/api';
import {
  ADMIN_BUTTON_CONTENT,
  ADMIN_BUTTON_TEXT,
  ADMIN_COLORS,
  ADMIN_DANGER_OUTLINE_BUTTON,
  ADMIN_DANGER_OUTLINE_TEXT,
  ADMIN_DETAIL_LABEL,
  ADMIN_DETAIL_ROW,
  ADMIN_DETAIL_VALUE,
  ADMIN_INPUT_FIELD,
  ADMIN_MODAL_HEADER,
  ADMIN_PAGE_SUBTITLE,
  ADMIN_PRIMARY_BUTTON,
  ADMIN_PRIMARY_BUTTON_DISABLED,
  ADMIN_SECONDARY_BUTTON,
  ADMIN_SECONDARY_BUTTON_TEXT,
  ADMIN_SECTION_CARD,
  ADMIN_SECTION_TITLE,
} from '../../../theme/adminUi';
import { ReceiptPrinterSection } from '../../../components/profile/ReceiptPrinterSection';

const formatDateValue = (value?: string | null, withTime = false) => {
  if (!value) return 'Not available';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return withTime ? date.toLocaleString() : date.toLocaleDateString();
};

const formatValue = (value?: string | number | null) => {
  if (value === null || value === undefined) return 'Not provided';
  if (typeof value === 'string' && !value.trim()) return 'Not provided';
  return `${value}`;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ADMIN_COLORS.background },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ADMIN_COLORS.background,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '700',
    color: ADMIN_COLORS.text,
  },
  content: {
    padding: 16,
    gap: 14,
    paddingBottom: 28,
  },
  heroCard: {
    ...ADMIN_SECTION_CARD,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 22,
    backgroundColor: ADMIN_COLORS.primary,
    borderColor: ADMIN_COLORS.primary,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: ADMIN_COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '700',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  email: {
    ...ADMIN_PAGE_SUBTITLE,
    textAlign: 'center',
    color: '#cbd5e1',
  },
  businessName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    textAlign: 'center',
  },
  roleBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: ADMIN_COLORS.surfaceTint,
    borderWidth: 1,
    borderColor: '#fdba74',
  },
  roleText: {
    color: ADMIN_COLORS.accentStrong,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  sectionCard: {
    ...ADMIN_SECTION_CARD,
  },
  sectionTitle: {
    ...ADMIN_SECTION_TITLE,
    marginBottom: 4,
  },
  sectionSubtitle: {
    ...ADMIN_PAGE_SUBTITLE,
    marginBottom: 12,
  },
  detailRow: {
    ...ADMIN_DETAIL_ROW,
  },
  detailRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  detailLabel: {
    ...ADMIN_DETAIL_LABEL,
  },
  detailValue: {
    ...ADMIN_DETAIL_VALUE,
    maxWidth: '65%',
  },
  mutedValue: {
    color: ADMIN_COLORS.tertiaryText,
  },
  actionsCard: {
    ...ADMIN_SECTION_CARD,
    gap: 12,
  },
  actionButton: {
    ...ADMIN_PRIMARY_BUTTON,
  },
  editButton: {
    backgroundColor: ADMIN_COLORS.accent,
  },
  passwordButton: {
    backgroundColor: ADMIN_COLORS.primary,
  },
  actionText: {
    ...ADMIN_BUTTON_TEXT,
    fontWeight: '700',
  },
  buttonContent: {
    ...ADMIN_BUTTON_CONTENT,
  },
  logoutButton: {
    ...ADMIN_DANGER_OUTLINE_BUTTON,
  },
  logoutText: {
    ...ADMIN_DANGER_OUTLINE_TEXT,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: ADMIN_COLORS.background,
  },
  modalHeader: {
    ...ADMIN_MODAL_HEADER,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: ADMIN_COLORS.text,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ADMIN_COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
  },
  modalContent: {
    padding: 20,
    gap: 14,
    paddingBottom: 28,
  },
  modalCard: {
    ...ADMIN_SECTION_CARD,
    gap: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  input: {
    ...ADMIN_INPUT_FIELD,
    color: ADMIN_COLORS.text,
  },
  textArea: {
    ...ADMIN_INPUT_FIELD,
    minHeight: 96,
    textAlignVertical: 'top',
    color: ADMIN_COLORS.text,
  },
  primaryButton: {
    ...ADMIN_PRIMARY_BUTTON,
  },
  primaryButtonDisabled: {
    ...ADMIN_PRIMARY_BUTTON_DISABLED,
  },
  primaryButtonText: {
    ...ADMIN_BUTTON_TEXT,
    fontWeight: '700',
  },
  secondaryButton: {
    ...ADMIN_SECONDARY_BUTTON,
  },
  secondaryButtonText: {
    ...ADMIN_SECONDARY_BUTTON_TEXT,
  },
});

export default function AdminProfile() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const currentStore = useAppSelector((state) => state.user.currentStore);

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [address, setAddress] = useState(user?.address ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  if (!user) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="person-circle-outline" size={68} color="#94a3b8" />
        <Text style={styles.emptyTitle}>Profile unavailable</Text>
      </SafeAreaView>
    );
  }

  const syncUserState = (updates: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  }) => {
    dispatch(updateProfile(updates));
    dispatch(updateManagedUser({ id: user.id, ...updates }));
  };

  const openProfileModal = () => {
    setName(user.name ?? '');
    setEmail(user.email ?? '');
    setPhone(user.phone ?? '');
    setAddress(user.address ?? '');
    setProfileModalOpen(true);
  };

  const openPasswordModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordModalOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Error', 'Name and email are required.');
      return;
    }

    setSavingProfile(true);
    try {
      const updated = await apiClient.updateUser(user.id, {
        businessId: user.businessId ?? undefined,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: user.type,
        phone: phone.trim(),
        address: address.trim(),
      });

      syncUserState({
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        address: updated.address,
      });
      setProfileModalOpen(false);
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      Alert.alert('Error', message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long.');
      return;
    }

    setSavingPassword(true);
    try {
      await apiClient.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordModalOpen(false);
      Alert.alert('Success', 'Password updated successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update password';
      Alert.alert('Error', message);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          dispatch(logout());
          router.replace('/(auth)');
        },
      },
    ]);
  };

  const initial = user.name?.trim().charAt(0).toUpperCase() || 'A';
  const personalDetails = [
    { label: 'Full Name', value: formatValue(user.name) },
    { label: 'Email', value: formatValue(user.email) },
    { label: 'Phone', value: formatValue(user.phone) },
    { label: 'Address', value: formatValue(user.address) },
  ];
  const accountDetails = [
    { label: 'Role', value: formatValue(user.type) },
    { label: 'Status', value: formatValue(user.status ?? 'active') },
    { label: 'Business', value: formatValue(user.businessName ?? 'Not linked') },
    { label: 'Business ID', value: formatValue(user.businessId) },
    {
      label: 'Access',
      value: user.permissions?.length ? user.permissions.join(', ') : user.type === 'admin' ? 'Full admin access' : 'Cashier access',
    },
    { label: 'Member Since', value: formatDateValue(user.joinDate) },
    { label: 'Last Login', value: formatDateValue(user.lastLogin, true) },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <Text style={styles.businessName}>{formatValue(user.businessName ?? 'No business linked')}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user.type}</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          <Text style={styles.sectionSubtitle}>Everything about your personal account information is visible here.</Text>

          {personalDetails.map((detail, index) => (
            <View
              key={detail.label}
              style={[styles.detailRow, index === personalDetails.length - 1 && styles.detailRowLast]}
            >
              <Text style={styles.detailLabel}>{detail.label}</Text>
              <Text
                style={[
                  styles.detailValue,
                  detail.value === 'Not provided' && styles.mutedValue,
                ]}
                numberOfLines={1}
              >
                {detail.value}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          <Text style={styles.sectionSubtitle}>These account-level details help you confirm role, access, and business linkage.</Text>

          {accountDetails.map((detail, index) => (
            <View
              key={detail.label}
              style={[styles.detailRow, index === accountDetails.length - 1 && styles.detailRowLast]}
            >
              <Text style={styles.detailLabel}>{detail.label}</Text>
              <Text
                style={[
                  styles.detailValue,
                  (detail.value === 'Not provided' || detail.value === 'Not available') && styles.mutedValue,
                ]}
                numberOfLines={1}
              >
                {detail.value}
              </Text>
            </View>
          ))}
        </View>

        <ReceiptPrinterSection user={user} currentStore={currentStore} />

        <View style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <Text style={styles.sectionSubtitle}>Open a focused modal when you want to change details instead of editing directly on the page.</Text>

          <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={openProfileModal}>
            <View style={styles.buttonContent}>
              <Ionicons name="create-outline" size={18} color="#ffffff" />
              <Text style={styles.actionText}>Edit Personal Info</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.passwordButton]} onPress={openPasswordModal}>
            <View style={styles.buttonContent}>
              <Ionicons name="lock-closed-outline" size={18} color="#ffffff" />
              <Text style={styles.actionText}>Change Password</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <View style={styles.buttonContent}>
            <Ionicons name="log-out-outline" size={18} color={ADMIN_COLORS.danger} />
            <Text style={styles.logoutText}>Logout</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={profileModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setProfileModalOpen(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Personal Info</Text>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setProfileModalOpen(false)}>
              <Ionicons name="close" size={22} color={ADMIN_COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.modalCard}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Full Name" />

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Text style={styles.label}>Phone</Text>
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Phone Number" />

              <Text style={styles.label}>Address</Text>
              <TextInput
                style={styles.textArea}
                value={address}
                onChangeText={setAddress}
                placeholder="Address"
                multiline
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, savingProfile && styles.primaryButtonDisabled]}
              onPress={handleSaveProfile}
              disabled={savingProfile}
            >
              <View style={styles.buttonContent}>
                {savingProfile && <ActivityIndicator size="small" color="#ffffff" />}
                <Text style={styles.primaryButtonText}>{savingProfile ? 'Saving...' : 'Save Changes'}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => setProfileModalOpen(false)}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={passwordModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPasswordModalOpen(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setPasswordModalOpen(false)}>
              <Ionicons name="close" size={22} color={ADMIN_COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.modalCard}>
              <Text style={styles.label}>Current Password</Text>
              <TextInput
                style={styles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Current Password"
                secureTextEntry
              />

              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="New Password"
                secureTextEntry
              />

              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm Password"
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, savingPassword && styles.primaryButtonDisabled]}
              onPress={handleChangePassword}
              disabled={savingPassword}
            >
              <View style={styles.buttonContent}>
                {savingPassword && <ActivityIndicator size="small" color="#ffffff" />}
                <Text style={styles.primaryButtonText}>{savingPassword ? 'Updating...' : 'Update Password'}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => setPasswordModalOpen(false)}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
