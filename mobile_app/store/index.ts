import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import accountingReducer from './slices/accountingSlice';
import userManagementReducer from './slices/userManagementSlice';
import assetsReducer from './slices/assetsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    accounting: accountingReducer,
    userManagement: userManagementReducer,
    assets: assetsReducer,
  },
  // Disable the serializable-state-invariant middleware in development
  // to avoid expensive checks on large states/actions while developing.
  // You can re-enable or fine-tune `serializableCheck` if needed.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;