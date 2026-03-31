import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addUser, deleteUser, updateUser } from '../../store/slices/userManagementSlice';
import type { UserProfile, UserRole } from '../../store/types';

const AdminUsers = () => {
  const dispatch = useAppDispatch();
  const users = useAppSelector((state) => state.userManagement.users);

  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UserProfile | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', password: '', type: 'cashier' as UserRole });

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
      password: user.password,
      type: user.type,
    });
    setModalOpen(true);
  };

  const saveUser = () => {
    if (!form.name || !form.email || !form.password) {
      Alert.alert('Missing fields', 'Name, email and password are required.');
      return;
    }

    if (editing) {
      dispatch(updateUser({ id: editing.id, ...form }));
    } else {
      dispatch(addUser({ ...form }));
    }
    setModalOpen(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Users</Text>
        <TouchableOpacity onPress={openCreate} style={styles.addBtn}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addText}>Add User</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Search users..."
        value={query}
        onChangeText={setQuery}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
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
                onPress={() => dispatch(deleteUser(item.id))}
                style={[styles.actionBtn, { borderColor: '#ef4444' }]}
              >
                <Text style={{ color: '#ef4444' }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={modalOpen} animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <Text style={styles.modalTitle}>{editing ? 'Edit User' : 'Create User'}</Text>
          <TextInput style={styles.input} placeholder="Name" value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} />
          <TextInput style={styles.input} placeholder="Email" value={form.email} onChangeText={(t) => setForm({ ...form, email: t })} autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="Phone" value={form.phone} onChangeText={(t) => setForm({ ...form, phone: t })} />
          <TextInput style={styles.input} placeholder="Address" value={form.address} onChangeText={(t) => setForm({ ...form, address: t })} />
          <TextInput style={styles.input} placeholder="Password" value={form.password} onChangeText={(t) => setForm({ ...form, password: t })} secureTextEntry />

          <View style={styles.roleRow}>
            {(['admin', 'cashier'] as UserRole[]).map((role) => (
              <TouchableOpacity
                key={role}
                style={[styles.roleBtn, form.type === role && styles.roleBtnActive]}
                onPress={() => setForm({ ...form, type: role })}
              >
                <Text style={form.type === role ? { color: '#fff' } : undefined}>{role}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={saveUser}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>{editing ? 'Update User' : 'Create User'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalOpen(false)}>
            <Text>Cancel</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '700' },
  addBtn: { backgroundColor: '#f97316', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', gap: 6 },
  addText: { color: '#fff', fontWeight: '600' },
  search: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  card: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, marginBottom: 10, flexDirection: 'row' },
  name: { fontSize: 16, fontWeight: '700' },
  meta: { color: '#64748b', marginTop: 2 },
  actions: { justifyContent: 'center', gap: 8 },
  actionBtn: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  modalContainer: { flex: 1, padding: 16, backgroundColor: '#fff' },
  modalTitle: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10 },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  roleBtn: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14 },
  roleBtnActive: { backgroundColor: '#f97316', borderColor: '#0f172a' },
  saveBtn: { backgroundColor: '#f97316', borderRadius: 10, alignItems: 'center', paddingVertical: 12, marginBottom: 10 },
  cancelBtn: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, alignItems: 'center', paddingVertical: 12 },
});

export default AdminUsers;
