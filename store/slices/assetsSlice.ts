// store/slices/assetsSlice.js
import { createSlice } from '@reduxjs/toolkit';

// Mock assets data
const mockAssets = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  name: `Asset ${i + 1}`,
  category: ['Equipment', 'Furniture', 'Vehicle', 'Electronics', 'Software'][i % 5],
  purchaseValue: Math.floor(Math.random() * 10000) + 1000,
  currentValue: Math.floor(Math.random() * 8000) + 800,
  purchaseDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000 * 3).toISOString().split('T')[0],
  condition: ['excellent', 'good', 'fair', 'poor'][i % 4],
  location: ['Main Office', 'Warehouse', 'Branch A', 'Branch B'][i % 4],
  createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
}));

const initialState = {
  assets: mockAssets,
};

const assetsSlice = createSlice({
  name: 'assets',
  initialState,
  reducers: {
    addAsset: (state, action) => {
      state.assets.unshift({
        ...action.payload,
        id: Math.max(...state.assets.map(a => a.id)) + 1,
        createdAt: new Date().toISOString(),
      });
    },
    updateAsset: (state, action) => {
      const { id, ...updates } = action.payload;
      const index = state.assets.findIndex(asset => asset.id === id);
      if (index !== -1) {
        state.assets[index] = { ...state.assets[index], ...updates };
      }
    },
    deleteAsset: (state, action) => {
      state.assets = state.assets.filter(asset => asset.id !== action.payload);
    },
  },
});

export const { addAsset, updateAsset, deleteAsset } = assetsSlice.actions;
export default assetsSlice.reducer;