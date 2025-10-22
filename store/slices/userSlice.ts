// store/slices/userSlice.js
import { createSlice } from '@reduxjs/toolkit';

// Mock data for the application
const mockUsers = [
  {
    id: 1,
    email: 'admin@shop.com',
    password: 'admin123',
    name: 'John Admin',
    type: 'admin',
  },
  {
    id: 2,
    email: 'cashier@shop.com',
    password: 'cashier123',
    name: 'Jane Cashier',
    type: 'cashier',
  }
];

const mockProducts = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  name: `Product ${i + 1}`,
  category: ['Electronics', 'Clothing', 'Food', 'Books'][i % 4],
  price: Math.floor(Math.random() * 1000) + 10,
  stock: Math.floor(Math.random() * 100),
  sku: `SKU${1000 + i}`,
}));

const mockSales = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  productId: (i % 25) + 1,
  productName: `Product ${(i % 25) + 1}`,
  quantity: Math.floor(Math.random() * 5) + 1,
  price: Math.floor(Math.random() * 1000) + 10,
  date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  cashier: `Cashier ${(i % 3) + 1}`,
  total: Math.floor(Math.random() * 5000) + 100,
}));

const mockPurchases = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  productId: (i % 25) + 1,
  productName: `Product ${(i % 25) + 1}`,
  quantity: Math.floor(Math.random() * 50) + 10,
  cost: Math.floor(Math.random() * 500) + 10,
  date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  supplier: `Supplier ${(i % 5) + 1}`,
  total: Math.floor(Math.random() * 25000) + 1000,
}));

const mockExpenses = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  category: ['Rent', 'Utilities', 'Salaries', 'Maintenance', 'Other'][i % 5],
  amount: Math.floor(Math.random() * 2000) + 100,
  date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  description: `Expense for ${['Rent', 'Utilities', 'Salaries', 'Maintenance', 'Other'][i % 5]}`,
}));

const initialState = {
  users: mockUsers,
  products: mockProducts,
  sales: mockSales,
  purchases: mockPurchases,
  expenses: mockExpenses,
  currentStore: {
    name: 'My Awesome Shop',
    address: '123 Business Street, City',
    phone: '+1-555-0123',
  }
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    addSale: (state, action) => {
      state.sales.unshift(action.payload);
    },
    updateProductStock: (state, action) => {
      const { productId, quantity } = action.payload;
      const product = state.products.find(p => p.id === productId);
      if (product) {
        product.stock -= quantity;
      }
    },
    addPurchase: (state, action) => {
      state.purchases.unshift(action.payload);
    },
    updateProfile: (state, action) => {
  if (state.user) {
    state.user = { ...state.user, ...action.payload };
    // Update AsyncStorage if you're using it
    AsyncStorage.setItem('userData', JSON.stringify({ 
      user: state.user, 
      userType: state.userType 
    }));
  }
},
    addExpense: (state, action) => {
  state.expenses.unshift({
    ...action.payload,
    id: Math.max(...state.expenses.map(e => e.id)) + 1,
  });
},
  },
});

export const { addSale, updateProductStock, addPurchase, addExpense } = userSlice.actions;
export default userSlice.reducer;