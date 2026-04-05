import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Permission, UserManagementState, UserProfile, UserStatus } from '../types';

const initialState: UserManagementState = {
  users: [],
  roles: [
    { id: 1, name: 'Super Admin', permissions: ['all'] },
    { id: 2, name: 'Shop Manager', permissions: ['sales', 'inventory', 'reports', 'users_view'] },
    { id: 3, name: 'Senior Cashier', permissions: ['sales', 'inventory_view', 'returns'] },
    { id: 4, name: 'Cashier', permissions: ['sales'] },
  ],
  permissions: [
    'sales',
    'inventory_view',
    'inventory_manage',
    'reports_view',
    'reports_export',
    'users_view',
    'users_manage',
    'settings',
    'all'
  ],
};

type AddUserPayload = {
  email: string;
  password: string;
  name: string;
  type: UserProfile['type'];
  phone?: string;
  address?: string;
  permissions?: Permission[];
  status?: UserStatus;
  joinDate?: string;
  businessId?: number | null;
  businessName?: string | null;
};

type UpdateUserPayload = { id: number } & Partial<UserProfile>;

type UpdateUserPermissionsPayload = {
  userId: number;
  permissions: Permission[];
};

const userManagementSlice = createSlice({
  name: 'userManagement',
  initialState,
  reducers: {
    addUser: (state, action: PayloadAction<AddUserPayload>) => {
      state.users.push({
        ...action.payload,
        id: state.users.length > 0 ? Math.max(...state.users.map((u) => u.id)) + 1 : 1,
        joinDate: action.payload.joinDate ?? new Date().toISOString().split('T')[0],
        lastLogin: null,
        status: action.payload.status ?? 'active',
      });
    },

    updateUser: (state, action: PayloadAction<UpdateUserPayload>) => {
      const { id, ...updates } = action.payload;
      const userIndex = state.users.findIndex((user) => user.id === id);
      if (userIndex !== -1) {
        state.users[userIndex] = { ...state.users[userIndex], ...updates };
      }
    },

    deleteUser: (state, action: PayloadAction<number>) => {
      state.users = state.users.filter((user) => user.id !== action.payload);
    },

    toggleUserStatus: (state, action: PayloadAction<number>) => {
      const user = state.users.find((user) => user.id === action.payload);
      if (user) {
        user.status = user.status === 'active' ? 'inactive' : 'active';
      }
    },

    updateUserPermissions: (state, action: PayloadAction<UpdateUserPermissionsPayload>) => {
      const { userId, permissions } = action.payload;
      const user = state.users.find((user) => user.id === userId);
      if (user) {
        user.permissions = permissions;
      }
    },

    updateLastLogin: (state, action: PayloadAction<number>) => {
      const user = state.users.find((user) => user.id === action.payload);
      if (user) {
        user.lastLogin = new Date().toISOString();
      }
    },

    setManagedUsers: (state, action: PayloadAction<UserProfile[]>) => {
      state.users = action.payload;
    },
  },
});

export const { 
  addUser, 
  updateUser, 
  deleteUser, 
  toggleUserStatus, 
  updateUserPermissions,
  updateLastLogin,
  setManagedUsers 
} = userManagementSlice.actions;
export default userManagementSlice.reducer;
