// store/slices/authSlice.js
import { createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const initialState = {
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
    setCredentials: (state, action) => {
      const { user, token, userType } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      state.userType = userType;
      state.isLoading = false;
      state.sessionExpiry = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
      
      // Store in AsyncStorage
      AsyncStorage.setItem('userData', JSON.stringify({ user, userType }));
      AsyncStorage.setItem('sessionExpiry', state.sessionExpiry);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.userType = null;
      state.isLoading = false;
      state.sessionExpiry = null;
      
      // Clear AsyncStorage
      AsyncStorage.multiRemove(['userData', 'sessionExpiry']);
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    updateProfile: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        AsyncStorage.setItem('userData', JSON.stringify({ 
          user: state.user, 
          userType: state.userType 
        }));
      }
    },
  },
});

export const { setCredentials, logout, setLoading, updateProfile } = authSlice.actions;
export default authSlice.reducer;