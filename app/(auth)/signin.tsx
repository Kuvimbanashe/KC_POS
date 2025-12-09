// app/(auth)/signin.js
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { StyleSheet } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { setCredentials } from '../../store/slices/authSlice';
import Feather from '@expo/vector-icons/Feather';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { UserProfile } from '../../store/types';



const styles = StyleSheet.create({
  s_1: {
  backgroundColor: "#ffffff",
  width: "100%",
  height: "100%",
  display: "flex",
  justifyContent: "center",
  flexDirection: "column",
  alignItems: "center"
},

  s_2: {
  width: "100%"
},

  s_3: {
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
},

  s_4: {},

  s_5: {},

  s_6: {
  borderWidth: 1,
  width: "100%"
},

  s_7: {
  fontWeight: "700",
  marginBottom: 8
},

  s_8: {
  fontSize: 14,
  color: "#6b7280"
},

  s_9: {
  width: "100%",
  marginBottom: 16
},

  s_10: {
  marginBottom: 8
},

  s_11: {
  marginBottom: 16
},

  s_12: {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "flex-end",
  marginBottom: 16
},

  s_13: {
  width: "100%",
  paddingVertical: 12,
  backgroundColor: "#0f172a"
},

  s_14: {},

  s_15: {},

  s_16: {
  color: "#6b7280"
},

  s_17: {
  backgroundColor: "#f3f4f6",
  width: "100%"
},

  s_18: {},

  s_19: {}
});
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
    <View style={styles.s_1}>
      
      <View className="mb-10 w-full  ">
        <Link href="/" style={styles.s_3}>
          <Feather name="arrow-left" size={22} className="text-primary " />
          <Text style={styles.s_5}>
            Back
          </Text>
        </Link>
      </View>
      
      
 <View style={styles.s_6}>
        
     <Text style={styles.s_7}>
              
        Sign In
      </Text>
      
      <Text style={styles.s_8} >
        Enter your credentials to access your account
      </Text>

      <View className="w-full mb-4 " >
        
        <Text style={styles.s_10}>
          Email
        </Text>
        <TextInput style={styles.s_11}
          style={{ 
            borderWidth: 1, 
            borderColor: '#D1D5DB', 
            borderRadius: 6, 
            padding: 14, 
            color: '#1E3A8A' 
          }}
          placeholder="you@example.com"
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        
         <Text style={styles.s_10}>
          Password
        </Text>
        <TextInput 
          style={{ 
            borderWidth: 1, 
            borderColor: '#D1D5DB', 
            borderRadius: 6, 
            padding: 14, 
            color: '#1E3A8A' 
          }}
          placeholder=".........."
          placeholderTextColor="#9CA3AF"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View> 
      <View style={styles.s_12}>
          <Link href="/forgot-password" asChild>
          <TouchableOpacity>
            <Text style={{ color: '#FB923C' }}>Forgot Password?</Text>
          </TouchableOpacity>
        </Link>
      </View>
      <TouchableOpacity 
        style={styles.s_13}
        onPress={handleSignIn}
      >
        <Text style={styles.s_14} >
          Sign In
        </Text>
      </TouchableOpacity>

      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'center' 
      }}>
      
        
        <Link href="/signup"  style={styles.s_15}>
         
            <Text className="text-muted-foreground ">
              {"Don't have an account? "}
            </Text>
            <Text style={{ color: '#FB923C' }}> Sign Up</Text>
          
        </Link>
      </View>
        
        
        
      </View>
      
<View className=" rounded-md bg-secondary w-full p-5 mt-6 space-y-4">
        
        <Text className="text-primary font-semibold ">
          Demo Credentials
        </Text>
         <Text className="text-primary f ">
          {"Admin : admin@shop.com / admin123"}
        </Text>       
        <Text className="text-primary  ">
           {"Cashier : cashier@shop.com / cashier123"}
        </Text>        
      </View>
      
 
    </View>
  );
}