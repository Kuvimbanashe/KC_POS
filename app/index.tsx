
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { Ionicons } from '@expo/vector-icons';



export default function WelcomeScreen() {
  return (
    <View style={styles.container}>

      <View style={styles.iconBadge}>
        <Ionicons name="briefcase" size={48} color="black" />

      </View>


      <View style={styles.header}>
        <Text style={styles.title}>
          Shop Manager
        </Text>
        <Text style={styles.subtitle}>
          Streamline your shop operations with ease
        </Text>

      </View>


      <View style={styles.actions}>
        <Link href="/signin" asChild>
          <TouchableOpacity style={styles.primaryCta}>
            <Text style={styles.primaryCtaText}>
              Sign In
            </Text>
          </TouchableOpacity>
        </Link>

        <Link href="/signup" asChild>
          <TouchableOpacity style={styles.secondaryCta}>
            <Text style={styles.secondaryCtaText}>
              Create Account
            </Text>
          </TouchableOpacity>
        </Link>
        <View>

          <Text style={styles.footerText}>
            Manage inventory, sales, and operations in one place.
          </Text>
        </View>
      </View>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 20,
    justifyContent: "center",
    gap: 32,
  },
  iconBadge: {
    backgroundColor: "#f97316",
    padding: 12,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  header: {
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontWeight: "700",
    fontSize: 24,
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
  actions: {
    width: "100%",
    gap: 12,
  },
  primaryCta: {
    backgroundColor: "#0f172a",
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryCtaText: {
    color: "#ffffff",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
  },
  secondaryCta: {
    paddingVertical: 14,
    borderRadius: 12,
    width: "100%",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  secondaryCtaText: {
    color: "#0f172a",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
  },
  footerText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
});
