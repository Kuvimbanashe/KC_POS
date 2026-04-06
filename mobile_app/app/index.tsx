import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';

import { useAppSelector } from '../store/hooks';

export default function AppEntry() {
  const { isAuthenticated, isLoading, userType } = useAppSelector((state) => state.auth);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FB923C" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)" />;
  }

  if (userType === 'admin') {
    return <Redirect href="/(admin)" />;
  }

  if (userType === 'cashier') {
    return <Redirect href="/(cashier)" />;
  }

  return <Redirect href="/(auth)" />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
});
