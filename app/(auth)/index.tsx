
import { View, Text, TouchableOpacity } from 'react-native';
import { StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';



export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Feather name="shopping-bag" size={48} color="white" />
      </View>

      <View style={styles.headerContainer}>
        <Text style={styles.title}>
          Shop Manager
        </Text>
        <Text style={styles.subtitle}>
          Streamline your shop operations with ease
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Link href="/signin" asChild>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>
              Sign In
            </Text>
          </TouchableOpacity>
        </Link>
        
        <Link href="/signup" asChild>
          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>
              Create Account
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
      
     
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    width: '100%',
    padding: 20,
  },
  iconContainer: {
    backgroundColor: '#f97316',
    padding: 12,
    borderRadius: 12,
    marginBottom: 32,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
  },
  primaryButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: '#e6edf3',
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    color: '#6b7280',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  footerContainer: {
    marginTop: 'auto',
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
