// app/_layout.js

import '../global.css';
import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import { store } from '../store';
import { useCallback, useEffect } from 'react';
import { setCredentials, setLoading } from '../store/slices/authSlice';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import type { UserProfile, UserRole } from '../store/types';

function RootLayoutNav() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, userType, isLoading } = useAppSelector((state) => state.auth);

  const checkAuthState = useCallback(async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');

      if (userData) {
        const parsed = JSON.parse(userData) as Partial<{
          user: UserProfile;
          userType: UserRole;
        }>;

        if (parsed?.user && parsed?.userType) {
          dispatch(
            setCredentials({
              user: parsed.user,
              token: 'mock-token',
              userType: parsed.userType,
            }),
          );
        }
      }
    } catch (error) {
      console.log('Error checking auth state:', error);
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  useEffect(() => {
    checkAuthState();
  }, [checkAuthState]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0d1938' }}>
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