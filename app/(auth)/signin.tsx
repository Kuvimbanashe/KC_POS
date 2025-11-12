// app/(auth)/signin.js
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { setCredentials } from '../../store/slices/authSlice';
import Feather from '@expo/vector-icons/Feather';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { UserProfile } from '../../store/types';

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
    <View className="bg-background w-full h-full p-5 flex justify-center flex-col items-center">
      
      <View className="mb-10 w-full  ">
        <Link href="/" className="inline- flex items-center justify-center gap-5 w-fit">
          <Feather name="arrow-left" size={22} className="text-primary " />
          <Text className="text-primary text-">
            Back
          </Text>
        </Link>
      </View>
      
      
 <View className="border rounded-md border-muted-foreground p-5 w-full">
        
     <Text className="text-3xl text-primary font-bold mb-2">
              
        Sign In
      </Text>
      
      <Text className="text-sm text-muted-foreground  mb-6" >
        Enter your credentials to access your account
      </Text>

      <View className="w-full mb-4 " >
        
        <Text className="text-primary font-semibold mb-2">
          Email
        </Text>
        <TextInput className="mb-4"
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
        
         <Text className="text-primary font-semibold mb-2">
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
      <View className="flex items-end justify-end mb-4">
          <Link href="/forgot-password" asChild>
          <TouchableOpacity>
            <Text style={{ color: '#FB923C' }}>Forgot Password?</Text>
          </TouchableOpacity>
        </Link>
      </View>
      <TouchableOpacity 
        className="w-full py-3 px-6 bg-primary mb-5 text-muted rounded-md"
        onPress={handleSignIn}
      >
        <Text className="text-muted text-l text-center" >
          Sign In
        </Text>
      </TouchableOpacity>

      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'center' 
      }}>
      
        
        <Link href="/signup"  className="inline-flex gap-2">
         
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