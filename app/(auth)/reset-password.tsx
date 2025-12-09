// app/(auth)/reset-password.js
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';



const styles = StyleSheet.create({
  s_1: {
  flex: 1,
  padding: 24,
  justifyContent: "center"
},

  s_2: {
  fontWeight: "700",
  marginBottom: 8
},

  s_3: {
  color: "#6b7280"
},

  s_4: {},

  s_5: {
  borderWidth: 1,
  borderRadius: 12,
  padding: 12
},

  s_6: {},

  s_7: {
  paddingVertical: 12,
  borderRadius: 12,
  borderWidth: 1
},

  s_8: {}
});
export default function ResetPasswordScreen() {
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleReset = async () => {
    if (!passwords.newPassword || !passwords.confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (passwords.newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate password reset
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert(
        'Success', 
        'Password has been reset successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/signin')
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.s_1}>
      <Text style={styles.s_2}>
        Reset Password
      </Text>
      <Text style={styles.s_3}>
        Enter your new password
      </Text>

      <View style={styles.s_4}>
        <TextInput
          style={styles.s_5}
          placeholder="New Password"
          value={passwords.newPassword}
          onChangeText={(text) => setPasswords({...passwords, newPassword: text})}
          secureTextEntry
        />
        
        <TextInput
          style={styles.s_5}
          placeholder="Confirm New Password"
          value={passwords.confirmPassword}
          onChangeText={(text) => setPasswords({...passwords, confirmPassword: text})}
          secureTextEntry
        />
      </View>

      <TouchableOpacity 
        className={`py-3 rounded-lg mb-4 ${
          isLoading ? 'bg-gray-400' : 'bg-primary -orange-400'
        }`}
        onPress={handleReset}
        disabled={isLoading}
      >
        <Text style={styles.s_6}>
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.s_7}
        onPress={() => router.back()}
      >
        <Text style={styles.s_8}>
          Back to OTP Verification
        </Text>
      </TouchableOpacity>
    </View>
  );
}