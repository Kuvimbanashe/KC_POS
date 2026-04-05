// app/_layout.tsx
import '../global.css';

import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
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
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const { isAuthenticated, userType, isLoading, user } = useAppSelector((state) => state.auth);

  const checkAuthState = useCallback(async () => {
    try {
      const [[, userData], [, authToken], [, sessionExpiry]] = await AsyncStorage.multiGet([
        'userData',
        'authToken',
        'sessionExpiry',
      ]);

      if (!authToken || !userData || !sessionExpiry || authToken === 'mock-jwt-token') {
        dispatch(logout());
        return;
      }

      const expiryTime = Date.parse(sessionExpiry);
      if (!Number.isFinite(expiryTime) || expiryTime <= Date.now()) {
        dispatch(logout());
        return;
      }

      const parsed = JSON.parse(userData) as Partial<{
        user: UserProfile;
        userType: UserRole;
      }>;

      if (parsed?.user && parsed?.userType) {
        dispatch(
          setCredentials({
            user: parsed.user,
            token: authToken,
            userType: parsed.userType,
          }),
        );
      } else {
        dispatch(logout());
      }
    } catch (error) {
      console.log('Error checking auth state:', error);
      dispatch(logout());
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

  useEffect(() => {
    if (isLoading || !navigationState?.key) {
      return;
    }

    const currentGroup = segments[0];
    const inAuthGroup = currentGroup === '(auth)';
    const inAdminGroup = currentGroup === '(admin)';
    const inCashierGroup = currentGroup === '(cashier)';

    if (!isAuthenticated) {
      if (!inAuthGroup) {
        router.replace('/');
      }
      return;
    }

    if (userType === 'admin' && !inAdminGroup) {
      router.replace('/(admin)');
      return;
    }

    if (userType === 'cashier' && !inCashierGroup) {
      router.replace('/(cashier)');
    }
  }, [isAuthenticated, isLoading, navigationState?.key, router, segments, userType]);


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
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="(cashier)" />
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
