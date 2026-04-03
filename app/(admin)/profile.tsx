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
import { Ionicons } from '@expo/vector-icons';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout, updateProfile } from '../../store/slices/authSlice';
import { updateUser as updateManagedUser } from '../../store/slices/userManagementSlice';
import { apiClient } from '../../services/api';
import {
  ADMIN_BUTTON_CONTENT,
  ADMIN_BUTTON_TEXT,
  ADMIN_COLORS,
  ADMIN_INPUT_FIELD,
  ADMIN_PRIMARY_BUTTON,
  ADMIN_PRIMARY_BUTTON_DISABLED,
  ADMIN_PAGE_SUBTITLE,
  ADMIN_SECTION_CARD,
  ADMIN_SECTION_TITLE,
} from '../../theme/adminUi';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ADMIN_COLORS.background },
  content: { padding: 16, gap: 14 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: ADMIN_COLORS.background },
  emptyTitle: { marginTop: 10, fontSize: 18, fontWeight: '700' },
  card: { ...ADMIN_SECTION_CARD, gap: 12 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', color: ADMIN_COLORS.text },
  meta: { ...ADMIN_PAGE_SUBTITLE, marginTop: 4 },
  sectionTitle: { ...ADMIN_SECTION_TITLE },
  label: { fontSize: 13, fontWeight: '600', color: '#475569' },
  input: {
    ...ADMIN_INPUT_FIELD,
    color: ADMIN_COLORS.text,
  },
  btn: {
    marginTop: 4,
    ...ADMIN_PRIMARY_BUTTON,
  },
  btnDisabled: {
    ...ADMIN_PRIMARY_BUTTON_DISABLED,
  },
  buttonContent: {
    ...ADMIN_BUTTON_CONTENT,
  },
  btnText: { ...ADMIN_BUTTON_TEXT, fontWeight: '700' },
  secondaryBtn: {
    marginTop: 4,
    ...ADMIN_PRIMARY_BUTTON,
  },
  secondaryBtnDisabled: {
    ...ADMIN_PRIMARY_BUTTON_DISABLED,
  },
  logout: { backgroundColor: ADMIN_COLORS.danger },
});

export default function AdminProfile() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);

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
        <Ionicons name="person-circle-outline" size={64} color="#94a3b8" />
        <Text style={styles.emptyTitle}>User not found</Text>
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

  const saveProfile = async () => {
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
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      Alert.alert('Error', message);
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async () => {
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
      Alert.alert('Success', 'Password updated successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update password';
      Alert.alert('Error', message);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    router.replace('/(auth)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.meta}>{user.email}</Text>
          <Text style={styles.meta}>Role: {user.type}</Text>
          <Text style={styles.meta}>Business: {user.businessName ?? 'N/A'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Profile Details</Text>

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
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Phone" />

          <Text style={styles.label}>Address</Text>
          <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Address" multiline />

          <TouchableOpacity style={[styles.btn, savingProfile && styles.btnDisabled]} onPress={saveProfile} disabled={savingProfile}>
            <View style={styles.buttonContent}>
              {savingProfile && <ActivityIndicator size="small" color="#FFFFFF" />}
              <Text style={styles.btnText}>{savingProfile ? 'Saving...' : 'Save Profile'}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Change Password</Text>

          <Text style={styles.label}>Current Password</Text>
          <TextInput style={styles.input} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />

          <Text style={styles.label}>New Password</Text>
          <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry />

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

          <TouchableOpacity style={[styles.secondaryBtn, savingPassword && styles.secondaryBtnDisabled]} onPress={changePassword} disabled={savingPassword}>
            <View style={styles.buttonContent}>
              {savingPassword && <ActivityIndicator size="small" color="#FFFFFF" />}
              <Text style={styles.btnText}>{savingPassword ? 'Updating...' : 'Update Password'}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleLogout} style={[styles.btn, styles.logout]}>
          <Text style={styles.btnText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
