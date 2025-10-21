// app/_layout.js

import "../global.css"
import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import { store } from '../store';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials, setLoading } from '../store/slices/authSlice';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

function RootLayoutNav() {
  const dispatch = useDispatch();
  const { isAuthenticated, userType, isLoading } = useSelector(state => state.auth);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      
      if (userData) {
        const { user, userType } = JSON.parse(userData);
        dispatch(setCredentials({ 
          user, 
          token: 'mock-token', 
          userType 
        }));
      }
    } catch (error) {
      console.log('Error checking auth state:', error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E3A8A' }}>
        <ActivityIndicator size="large" color="#FB923C" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="(auth)" />
      ) : userType === 'admin' ? (
        <Stack.Screen name="(admin)" />
      ) : (
        <Stack.Screen name="(cashier)" />
      )}
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <RootLayoutNav />
    </Provider>
  );
}