// store/index.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import accountingReducer from './slices/accountingSlice';
import userManagementReducer from './slices/userManagementSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    accounting: accountingReducer,
    userManagement: userManagementReducer,
  },
});

export default store;