import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthState, UserProfile, UserRole } from '../types';
import {
  AUTH_TOKEN_KEY,
  SESSION_EXPIRY_KEY,
  USER_DATA_KEY,
  clearAuthToken,
  persistAuthToken,
} from '../../services/authSession';

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  userType: null,
  isLoading: true,
  sessionExpiry: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: UserProfile;
        token: string;
        userType: UserRole;
      }>,
    ) => {
      const { user, token, userType } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      state.userType = userType;
      state.isLoading = false;
      state.sessionExpiry = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
      
      // Store in AsyncStorage
      AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify({ user, userType }));
      persistAuthToken(token);
      AsyncStorage.setItem(SESSION_EXPIRY_KEY, state.sessionExpiry);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.userType = null;
      state.isLoading = false;
      state.sessionExpiry = null;
      
      // Clear AsyncStorage
      clearAuthToken();
      AsyncStorage.multiRemove([USER_DATA_KEY, AUTH_TOKEN_KEY, SESSION_EXPIRY_KEY]);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    updateProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify({ 
          user: state.user, 
          userType: state.userType 
        }));
      }
    },
  },
});

export const { setCredentials, logout, setLoading, updateProfile } = authSlice.actions;
export default authSlice.reducer;
