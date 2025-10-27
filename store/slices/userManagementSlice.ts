// store/slices/userManagementSlice.js
import { createSlice } from '@reduxjs/toolkit';

// Enhanced mock users with more details
const mockUsers = [
  {
    id: 1,
    email: 'admin@shop.com',
    password: 'admin123',
    name: 'John Admin',
    type: 'admin',
    phone: '+1-555-0101',
    address: '123 Admin Street, City',
    joinDate: '2024-01-15',
    status: 'active',
    permissions: ['all'],
    lastLogin: new Date().toISOString(),
  },
  {
    id: 2,
    email: 'cashier@shop.com',
    password: 'cashier123',
    name: 'Jane Cashier',
    type: 'cashier',
    phone: '+1-555-0102',
    address: '456 Cashier Ave, City',
    joinDate: '2024-02-20',
    status: 'active',
    permissions: ['sales', 'inventory_view'],
    lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    email: 'manager@shop.com',
    password: 'manager123',
    name: 'Bob Manager',
    type: 'admin',
    phone: '+1-555-0103',
    address: '789 Manager Rd, City',
    joinDate: '2024-01-10',
    status: 'active',
    permissions: ['sales', 'inventory', 'reports'],
    lastLogin: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 4,
    email: 'cashier2@shop.com',
    password: 'cashier123',
    name: 'Alice Johnson',
    type: 'cashier',
    phone: '+1-555-0104',
    address: '321 Worker Lane, City',
    joinDate: '2024-03-01',
    status: 'inactive',
    permissions: ['sales'],
    lastLogin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

// Add more users to reach 20+
const additionalUsers = Array.from({ length: 16 }, (_, i) => ({
  id: i + 5,
  email: `user${i + 1}@shop.com`,
  password: 'password123',
  name: `User ${i + 1}`,
  type: i % 3 === 0 ? 'admin' : 'cashier',
  phone: `+1-555-01${(i + 5).toString().padStart(2, '0')}`,
  address: `${i + 100} User Street, City`,
  joinDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  status: Math.random() > 0.2 ? 'active' : 'inactive',
  permissions: i % 3 === 0 ? ['all'] : ['sales', 'inventory_view'],
  lastLogin: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
}));

const allUsers = [...mockUsers, ...additionalUsers];

const initialState = {
  users: allUsers,
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

const userManagementSlice = createSlice({
  name: 'userManagement',
  initialState,
  reducers: {
    addUser: (state, action) => {
      state.users.push({
        ...action.payload,
        id: Math.max(...state.users.map(u => u.id)) + 1,
        joinDate: new Date().toISOString().split('T')[0],
        lastLogin: null,
        status: 'active',
      });
    },
    updateUser: (state, action) => {
  const { id, ...updates } = action.payload;
  const userIndex = state.users.findIndex(user => user.id === id);
  if (userIndex !== -1) {
    state.users[userIndex] = { ...state.users[userIndex], ...updates };
  }
},
    deleteUser: (state, action) => {
      state.users = state.users.filter(user => user.id !== action.payload);
    },
    toggleUserStatus: (state, action) => {
      const user = state.users.find(user => user.id === action.payload);
      if (user) {
        user.status = user.status === 'active' ? 'inactive' : 'active';
      }
    },
    updateUserPermissions: (state, action) => {
      const { userId, permissions } = action.payload;
      const user = state.users.find(user => user.id === userId);
      if (user) {
        user.permissions = permissions;
      }
    },
    updateLastLogin: (state, action) => {
      const user = state.users.find(user => user.id === action.payload);
      if (user) {
        user.lastLogin = new Date().toISOString();
      }
    },
  },
});

export const { 
  addUser, 
  updateUser, 
  deleteUser, 
  toggleUserStatus, 
  updateUserPermissions,
  updateLastLogin 
} = userManagementSlice.actions;
export default userManagementSlice.reducer;

