import { useState } from 'react';
import {
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
import { Ionicons } from '@expo/vector-icons';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout, updateProfile } from '../../store/slices/authSlice';

const AdminProfile = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [address, setAddress] = useState(user?.address ?? '');

  if (!user) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="person-circle-outline" size={64} color="#94a3b8" />
        <Text style={styles.emptyTitle}>User not found</Text>
      </SafeAreaView>
    );
  }

  const save = () => {
    dispatch(updateProfile({ name, phone, address }));
    setEditing(false);
    Alert.alert('Success', 'Profile updated.');
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
          <Text style={styles.sectionTitle}>Contact</Text>
          <Text style={styles.meta}>Phone: {user.phone || 'N/A'}</Text>
          <Text style={styles.meta}>Address: {user.address || 'N/A'}</Text>
          <TouchableOpacity onPress={() => setEditing(true)} style={styles.btn}>
            <Text style={styles.btnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => dispatch(logout())} style={[styles.btn, styles.logout]}>
          <Text style={styles.btnText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={editing} animationType="slide" onRequestClose={() => setEditing(false)}>
        <SafeAreaView style={styles.modal}>
          <Text style={styles.sectionTitle}>Edit Profile</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Name" />
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Phone" />
          <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Address" />

          <TouchableOpacity onPress={save} style={styles.btn}>
            <Text style={styles.btnText}>Save Changes</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setEditing(false)} style={[styles.btn, styles.cancel]}>
            <Text>Cancel</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, gap: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  emptyTitle: { marginTop: 10, fontSize: 18, fontWeight: '700' },
  card: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 16 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#f97316', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700' },
  meta: { fontSize: 14, color: '#64748b', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  btn: { marginTop: 14, backgroundColor: '#0f172a', borderRadius: 10, alignItems: 'center', paddingVertical: 12 },
  btnText: { color: '#fff', fontWeight: '700' },
  logout: { backgroundColor: '#ef4444' },
  cancel: { backgroundColor: '#f1f5f9' },
  modal: { flex: 1, padding: 16, backgroundColor: '#fff' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, marginBottom: 10 },
});

export default AdminProfile;
