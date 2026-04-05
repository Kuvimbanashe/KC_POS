// app/_layout.tsx
import '../global.css';

import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import { store } from '../store';
import { useCallback, useEffect } from 'react';
import { logout, setCredentials, setLoading } from '../store/slices/authSlice';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import type { UserProfile, UserRole } from '../store/types';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { syncWholeAppFromBackend } from '../services/bootstrapSync';

function RootLayoutNav() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, userType, isLoading, user } = useAppSelector((state) => state.auth);

  const checkAuthState = useCallback(async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const authToken = await AsyncStorage.getItem('authToken');
      const sessionExpiry = await AsyncStorage.getItem('sessionExpiry');

      if (sessionExpiry) {
        const expiryTime = new Date(sessionExpiry).getTime();
        if (!Number.isFinite(expiryTime) || Date.now() > expiryTime) {
          dispatch(logout());
          return;
        }
      }

      if (userData) {
        const parsed = JSON.parse(userData) as Partial<{
          user: UserProfile;
          userType: UserRole;
        }>;

        if (parsed?.user && parsed?.userType && authToken) {
          dispatch(
            setCredentials({
              user: parsed.user,
              token: authToken,
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


  useEffect(() => {
    if (process.env.EXPO_PUBLIC_ENABLE_BACKEND_SYNC !== 'true') return;
    if (!user?.businessId) return;

    syncWholeAppFromBackend(dispatch, user.businessId).catch((error) => {
      console.log('Backend bootstrap sync failed:', error);
    });
  }, [dispatch, user?.businessId]);


  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FB923C" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="(auth)" />
        ) : userType === 'admin' ? (
          <Stack.Screen name="(admin)" />
        ) : (
          <Stack.Screen name="(cashier)" />
        )}
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <RootLayoutNav />
      </SafeAreaProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});
