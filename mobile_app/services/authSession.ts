import AsyncStorage from '@react-native-async-storage/async-storage';

export const AUTH_TOKEN_KEY = 'authToken';
export const USER_DATA_KEY = 'userData';
export const SESSION_EXPIRY_KEY = 'sessionExpiry';

let runtimeAuthToken: string | null = null;

export const setRuntimeAuthToken = (token: string | null) => {
  runtimeAuthToken = token;
};

export const getAuthToken = async (): Promise<string | null> => {
  if (runtimeAuthToken) {
    return runtimeAuthToken;
  }

  const storedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  runtimeAuthToken = storedToken;
  return storedToken;
};

export const persistAuthToken = async (token: string) => {
  setRuntimeAuthToken(token);
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const clearAuthToken = async () => {
  setRuntimeAuthToken(null);
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
};
