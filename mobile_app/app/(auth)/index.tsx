import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Link } from 'expo-router';

import { AuthScaffold } from '../../components/ui/AuthScaffold';
import { ADMIN_COLORS } from '../../theme/adminUi';

export default function WelcomeScreen() {
  return (
    <AuthScaffold
      title="Run the shop with calm, clear tools."
      subtitle="Sign in to keep sales moving, inventory accurate, and reporting beautifully organized across the floor."
      keyboard={false}
    >
      <View style={styles.actions}>
        <Link href="/signin" asChild>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Sign In</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/signup" asChild>
          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Create Account</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 12,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ADMIN_COLORS.primary,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ADMIN_COLORS.surfaceTint,
    borderWidth: 1,
    borderColor: '#fdba74',
  },
  secondaryButtonText: {
    color: ADMIN_COLORS.accentStrong,
    fontSize: 16,
    fontWeight: '700',
  },
});
