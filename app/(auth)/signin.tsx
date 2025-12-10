// app/(auth)/signin.js
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { setCredentials } from '../../store/slices/authSlice';
import Feather from '@expo/vector-icons/Feather';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { UserProfile } from '../../store/types';
import { Ionicons } from '@expo/vector-icons';



export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useAppDispatch();
  const router = useRouter();
  const users = useAppSelector((state) => state.userManagement.users);

  const handleSignIn = () => {
    const user = users.find((u) => u.email === email && u.password === password);
    
    if (user) {
      const authUser: UserProfile = {
        id: user.id,
        email: user.email,
        password: user.password,
        name: user.name,
        phone: user.phone,
        address: user.address,
        type: user.type,
        permissions: user.permissions,
        status: user.status,
        lastLogin: user.lastLogin,
        joinDate: user.joinDate,
      };

      dispatch(
        setCredentials({
          user: authUser,
          token: 'mock-jwt-token',
          userType: user.type,
        }),
      );
      router.replace(user.type === 'admin' ? '/(admin)' : '/(cashier)');
    } else {
      Alert.alert('Error', 'Invalid email or password');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.backRow}>
        <Link href="/" style={styles.backLink}>
          <Feather name="arrow-left-circle" size={30} color="#0f172a" />
          
        </Link>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Sign In</Text>
        <Text style={styles.subtitle}>Enter your credentials to access your account</Text>

        <View style={styles.formBlock}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder=".........."
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <View style={styles.linkRowEnd}>
          <Link href="/forgot-password" asChild>
            <TouchableOpacity>
              <Text style={styles.accentText}>Forgot Password?</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleSignIn}>
          <Text style={styles.primaryButtonText}>Sign In</Text>
        </TouchableOpacity>

        <View style={styles.inlineRow}>
          <Text style={styles.mutedText}>{"Don't have an account? "}</Text>
          <Link href="/signup" asChild>
            <TouchableOpacity>
              <Text style={styles.accentText}>Sign Up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>

      <View style={styles.demoCard}>
        <Text style={styles.demoTitle}>Demo Credentials</Text>
        <Text style={styles.demoText}>Admin : admin@shop.com / admin123</Text>
        <Text style={styles.demoText}>Cashier : cashier@shop.com / cashier123</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  backRow: {
    marginBottom: 32,
    width: "100%",
    display:"none"
  },
  backLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backText: {
    color: "#0f172a",
    fontWeight: "600",
  },
  card: {
    width: "100%",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
    gap: 12,
  },
  title: {
    fontWeight: "700",
    fontSize: 22,
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  formBlock: {
    width: "100%",
    gap: 8,
    marginTop: 4,
  },
  label: {
    marginTop: 8,
    marginBottom: 4,
    color: "#0f172a",
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 14,
    color: "#0f172a",
    backgroundColor: "#f8fafc",
  },
  linkRowEnd: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: "#0f172a",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  inlineRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  mutedText: {
    color: "#6b7280",
  },
  accentText: {
    color: "#FB923C",
    fontWeight: "600",
  },
  demoCard: {
    marginTop: 24,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  demoTitle: {
    color: "#0f172a",
    fontWeight: "700",
    marginBottom: 4,
  },
  demoText: {
    color: "#0f172a",
    fontWeight: "500",
  },
});