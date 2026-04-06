import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { updateProfile } from '../../../store/slices/authSlice';
import { addUser, deleteUser, setManagedUsers, updateUser } from '../../../store/slices/userManagementSlice';
import type { UserProfile, UserRole } from '../../../store/types';
import { apiClient } from '../../../services/api';
import {
  ADMIN_BUTTON_CONTENT,
  ADMIN_BUTTON_TEXT,
  ADMIN_COLORS,
  ADMIN_INPUT_FIELD,
  ADMIN_INPUT_SURFACE,
  ADMIN_LIST_CARD,
  ADMIN_MODAL_HEADER,
  ADMIN_MODAL_SECTION,
  ADMIN_PAGE_SUBTITLE,
  ADMIN_PRIMARY_BUTTON,
  ADMIN_PRIMARY_BUTTON_DISABLED,
  ADMIN_PAGE_TITLE,
  ADMIN_SECTION_CARD,
  ADMIN_SECTION_SUBTITLE,
  ADMIN_SECTION_TITLE,
} from '../../../theme/adminUi';

const AdminUsers = () => {
  const dispatch = useAppDispatch();
  const users = useAppSelector((state) => state.userManagement.users);
  const authUser = useAppSelector((state) => state.auth.user);

  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editing, setEditing] = useState<UserProfile | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', password: '', type: 'cashier' as UserRole });

  const loadUsers = useCallback(async () => {
    if (!authUser?.businessId) return;
    try {
      const remoteUsers = await apiClient.fetchUsers(authUser.businessId);
      dispatch(setManagedUsers(remoteUsers));
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  }, [authUser?.businessId, dispatch]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadUsers();
    } finally {
      setIsRefreshing(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.businessName ?? '').toLowerCase().includes(q),
    );
  }, [users, query]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', phone: '', address: '', password: '', type: 'cashier' });
    setModalOpen(true);
  };

  const openEdit = (user: UserProfile) => {
    setEditing(user);
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone ?? '',
      address: user.address ?? '',
      password: '',
      type: user.type,
    });
    setModalOpen(true);
  };

  const saveUser = async () => {
    if (!form.name || !form.email || (!editing && !form.password)) {
      Alert.alert('Missing fields', editing ? 'Name and email are required.' : 'Name, email and password are required.');
      return;
    }

    if (!authUser?.businessId) {
      Alert.alert('Error', 'Business context is missing. Please sign in again.');
      return;
    }

    setSubmitting(true);
    try {
      if (editing) {
        const updated = await apiClient.updateUser(editing.id, {
          businessId: authUser.businessId,
          name: form.name,
          email: form.email,
          role: form.type,
          phone: form.phone,
          address: form.address,
          ...(form.password.trim() ? { password: form.password } : {}),
        });
        dispatch(updateUser(updated));
        if (authUser.id === editing.id) {
          dispatch(updateProfile(updated));
        }
      } else {
        const created = await apiClient.createUser({
          businessId: authUser.businessId,
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.type,
          phone: form.phone,
          address: form.address,
        });
        dispatch(addUser({ ...created }));
      }
      setModalOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save user';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete User', 'Are you sure you want to delete this user?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeletingUserId(id);
          try {
            await apiClient.deleteUser(id);
            dispatch(deleteUser(id));
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete user';
            Alert.alert('Error', message);
          } finally {
            setDeletingUserId(null);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.heroCard}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Users</Text>
            <Text style={styles.subtitle}>Manage admin and cashier access for this business.</Text>
          </View>
          <TouchableOpacity onPress={openCreate} style={styles.addBtn}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addText}>Add User</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchCard}>
          <Ionicons name="search" size={18} color={ADMIN_COLORS.secondaryText} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor={ADMIN_COLORS.tertiaryText}
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#f97316" />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>{item.email}</Text>
              <Text style={styles.meta}>Role: {item.type}</Text>
              <Text style={styles.meta}>Business: {item.businessName ?? 'N/A'}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionBtn}>
                <Text>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(item.id)}
                style={[
                  styles.actionBtn,
                  { borderColor: '#ef4444' },
                  deletingUserId === item.id && styles.actionBtnDisabled,
                ]}
                disabled={deletingUserId === item.id}
              >
                <View style={styles.inlineButtonContent}>
                  {deletingUserId === item.id ? (
                    <ActivityIndicator size="small" color="#ef4444" />
                  ) : null}
                  <Text style={{ color: '#ef4444' }}>
                    {deletingUserId === item.id ? 'Deleting...' : 'Delete'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalOpen(false)}>
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editing ? 'Edit User' : 'Create User'}</Text>
            <TouchableOpacity onPress={() => setModalOpen(false)}>
              <Ionicons name="close" size={24} color={ADMIN_COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalSection}>
              <TextInput style={styles.input} placeholder="Name" placeholderTextColor={ADMIN_COLORS.tertiaryText} value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} />
              <TextInput style={styles.input} placeholder="Email" placeholderTextColor={ADMIN_COLORS.tertiaryText} value={form.email} onChangeText={(t) => setForm({ ...form, email: t })} autoCapitalize="none" />
              <TextInput style={styles.input} placeholder="Phone" placeholderTextColor={ADMIN_COLORS.tertiaryText} value={form.phone} onChangeText={(t) => setForm({ ...form, phone: t })} />
              <TextInput style={styles.input} placeholder="Address" placeholderTextColor={ADMIN_COLORS.tertiaryText} value={form.address} onChangeText={(t) => setForm({ ...form, address: t })} />
              <TextInput
                style={styles.input}
                placeholder={editing ? 'Leave blank to keep current password' : 'Password'}
                placeholderTextColor={ADMIN_COLORS.tertiaryText}
                value={form.password}
                onChangeText={(t) => setForm({ ...form, password: t })}
                secureTextEntry
              />
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.roleTitle}>Role</Text>
              <View style={styles.roleRow}>
                {(['admin', 'cashier'] as UserRole[]).map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[styles.roleBtn, form.type === role && styles.roleBtnActive]}
                    onPress={() => setForm({ ...form, type: role })}
                  >
                    <Text style={[styles.roleText, form.type === role && styles.roleTextActive]}>{role}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, submitting && styles.saveBtnDisabled]}
              onPress={saveUser}
              disabled={submitting}
            >
              <View style={styles.buttonContent}>
                {submitting && <ActivityIndicator size="small" color="#FFFFFF" />}
                <Text style={styles.saveBtnText}>
                  {submitting ? 'Saving...' : editing ? 'Update User' : 'Create User'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalOpen(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ADMIN_COLORS.background, padding: 16 },
  heroCard: { ...ADMIN_SECTION_CARD, marginBottom: 16, gap: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  headerCopy: { flex: 1, gap: 4 },
  title: { ...ADMIN_PAGE_TITLE },
  subtitle: { ...ADMIN_PAGE_SUBTITLE },
  addBtn: { backgroundColor: '#f97316', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', gap: 6 },
  addText: { color: '#fff', fontWeight: '600' },
  searchCard: { ...ADMIN_INPUT_SURFACE, flexDirection: 'row', alignItems: 'center' },
  searchInput: { flex: 1, color: ADMIN_COLORS.text, marginLeft: 8, fontSize: 14 },
  list: { flex: 1 },
  listContent: { paddingBottom: 24 },
  card: { ...ADMIN_LIST_CARD, marginBottom: 10, flexDirection: 'row', gap: 12 },
  name: { fontSize: 16, fontWeight: '700', color: ADMIN_COLORS.text },
  meta: { color: ADMIN_COLORS.secondaryText, marginTop: 2 },
  actions: { justifyContent: 'center', gap: 8 },
  actionBtn: { borderWidth: 1, borderColor: ADMIN_COLORS.border, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: ADMIN_COLORS.surfaceMuted },
  actionBtnDisabled: { opacity: 0.7 },
  inlineButtonContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  modalContainer: { flex: 1, backgroundColor: ADMIN_COLORS.background },
  modalHeader: { ...ADMIN_MODAL_HEADER, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  modalTitle: { fontSize: 22, fontWeight: '700', color: ADMIN_COLORS.text },
  modalContent: { padding: 20, gap: 16 },
  modalSection: { ...ADMIN_MODAL_SECTION },
  input: { ...ADMIN_INPUT_FIELD, color: ADMIN_COLORS.text, marginBottom: 10 },
  roleTitle: { ...ADMIN_SECTION_TITLE, fontSize: 16 },
  roleRow: { flexDirection: 'row', gap: 10 },
  roleBtn: { flex: 1, borderWidth: 1, borderColor: ADMIN_COLORS.border, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: ADMIN_COLORS.surfaceMuted, alignItems: 'center' },
  roleBtnActive: { backgroundColor: ADMIN_COLORS.primary, borderColor: ADMIN_COLORS.primary },
  roleText: { color: ADMIN_COLORS.secondaryText, fontWeight: '600' },
  roleTextActive: { color: '#fff' },
  saveBtn: { ...ADMIN_PRIMARY_BUTTON },
  saveBtnDisabled: { ...ADMIN_PRIMARY_BUTTON_DISABLED },
  buttonContent: { ...ADMIN_BUTTON_CONTENT },
  saveBtnText: { ...ADMIN_BUTTON_TEXT, fontWeight: '700' },
  cancelBtn: { borderWidth: 1, borderColor: ADMIN_COLORS.border, borderRadius: 10, alignItems: 'center', paddingVertical: 12, backgroundColor: ADMIN_COLORS.surfaceMuted },
  cancelText: { color: ADMIN_COLORS.text, fontWeight: '600' },
});

export default AdminUsers;
