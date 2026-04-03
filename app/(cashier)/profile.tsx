import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout, updateProfile } from '../../store/slices/authSlice';
import { updateUser as updateManagedUser } from '../../store/slices/userManagementSlice';
import { apiClient } from '../../services/api';
import {
  ADMIN_BUTTON_CONTENT,
  ADMIN_BUTTON_TEXT,
  ADMIN_COLORS,
  ADMIN_INPUT_FIELD,
  ADMIN_PAGE_SUBTITLE,
  ADMIN_PRIMARY_BUTTON,
  ADMIN_PRIMARY_BUTTON_DISABLED,
  ADMIN_SECTION_CARD,
  ADMIN_SECTION_TITLE,
} from '../../theme/adminUi';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ADMIN_COLORS.background },
  scrollView: { flex: 1 },
  profileHeader: { padding: 24, alignItems: 'center', backgroundColor: '#0f172a' },
  profileInfo: { alignItems: 'center' },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  userName: { color: '#fff', fontSize: 20, fontWeight: '700' },
  userEmail: { color: '#cbd5e1', marginTop: 4 },
  roleBadge: { marginTop: 12, backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  roleText: { color: '#fb923c', fontWeight: '600' },
  card: { ...ADMIN_SECTION_CARD, margin: 16, marginBottom: 0, gap: 12 },
  cardTitle: { ...ADMIN_SECTION_TITLE },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#475569' },
  input: {
    ...ADMIN_INPUT_FIELD,
    color: ADMIN_COLORS.text,
  },
  textArea: {
    ...ADMIN_INPUT_FIELD,
    minHeight: 84,
    textAlignVertical: 'top',
    color: ADMIN_COLORS.text,
  },
  primaryButton: {
    ...ADMIN_PRIMARY_BUTTON,
    backgroundColor: ADMIN_COLORS.accent,
  },
  secondaryButton: {
    ...ADMIN_PRIMARY_BUTTON,
  },
  dangerButton: {
    margin: 16,
    ...ADMIN_PRIMARY_BUTTON,
    backgroundColor: ADMIN_COLORS.danger,
  },
  buttonDisabled: { ...ADMIN_PRIMARY_BUTTON_DISABLED },
  buttonContent: { ...ADMIN_BUTTON_CONTENT },
  buttonText: { ...ADMIN_BUTTON_TEXT, fontWeight: '700' },
});

export default function CashierProfileScreen() {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();

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
      <SafeAreaView style={styles.container}>
        <View style={styles.profileHeader}>
          <Text style={styles.userName}>Profile unavailable</Text>
        </View>
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

  const handleSaveProfile = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Error', 'Name and email are required');
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
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      Alert.alert('Error', message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setSavingPassword(true);
    try {
      await apiClient.changePassword(currentPassword, newPassword);

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Password updated successfully');
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.profileHeader}>
          <View style={styles.profileInfo}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{user.name?.charAt(0)?.toUpperCase() || 'C'}</Text>
            </View>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>Cashier</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Personal Information</Text>

          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Enter your name" />

          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.inputLabel}>Phone Number</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Enter your phone number" />

          <Text style={styles.inputLabel}>Address</Text>
          <TextInput style={styles.textArea} value={address} onChangeText={setAddress} placeholder="Enter your address" multiline />

          <TouchableOpacity style={[styles.primaryButton, savingProfile && styles.buttonDisabled]} onPress={handleSaveProfile} disabled={savingProfile}>
            <View style={styles.buttonContent}>
              {savingProfile && <ActivityIndicator size="small" color="#FFFFFF" />}
              <Text style={styles.buttonText}>{savingProfile ? 'Saving...' : 'Save Profile'}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Change Password</Text>

          <Text style={styles.inputLabel}>Current Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
          />

          <Text style={styles.inputLabel}>New Password</Text>
          <TextInput style={styles.input} placeholder="Enter new password" value={newPassword} onChangeText={setNewPassword} secureTextEntry />

          <Text style={styles.inputLabel}>Confirm New Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <TouchableOpacity style={[styles.secondaryButton, savingPassword && styles.buttonDisabled]} onPress={handleChangePassword} disabled={savingPassword}>
            <View style={styles.buttonContent}>
              {savingPassword && <ActivityIndicator size="small" color="#FFFFFF" />}
              <Text style={styles.buttonText}>{savingPassword ? 'Updating...' : 'Update Password'}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.dangerButton} onPress={handleLogout}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
