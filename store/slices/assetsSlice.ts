import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AssetsState, AssetRecord } from '../types';

// Mock assets data
const mockAssets: AssetRecord[] = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  name: `Asset ${i + 1}`,
  category: ['Equipment', 'Furniture', 'Vehicle', 'Electronics', 'Software'][i % 5],
  purchaseValue: Math.floor(Math.random() * 10000) + 1000,
  currentValue: Math.floor(Math.random() * 8000) + 800,
  purchaseDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000 * 3).toISOString().split('T')[0],
  condition: ['excellent', 'good', 'fair', 'poor'][i % 4] as AssetRecord['condition'],
  location: ['Main Office', 'Warehouse', 'Branch A', 'Branch B'][i % 4],
  createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
}));

const initialState: AssetsState = {
  assets: mockAssets,
};

type AddAssetPayload = {
  name: string;
  category: string;
  purchaseValue: number;
  currentValue: number;
  purchaseDate: string;
  condition: AssetRecord['condition'];
  location: string;
};

type UpdateAssetPayload = { id: number } & Partial<Omit<AssetRecord, 'id'>>;

const assetsSlice = createSlice({
  name: 'assets',
  initialState,
  reducers: {
    addAsset: (state, action: PayloadAction<AddAssetPayload>) => {
      const nextId = state.assets.length > 0 ? Math.max(...state.assets.map((a) => a.id)) + 1 : 1;
      const timestamp = new Date().toISOString();

      const newAsset: AssetRecord = {
        id: nextId,
        name: action.payload.name,
        category: action.payload.category,
        purchaseValue: action.payload.purchaseValue,
        currentValue: action.payload.currentValue,
        purchaseDate: action.payload.purchaseDate,
        condition: action.payload.condition,
        location: action.payload.location,
        createdAt: timestamp,
      };

      state.assets.unshift(newAsset);
    },

    updateAsset: (state, action: PayloadAction<UpdateAssetPayload>) => {
      const { id, ...updates } = action.payload;
      const index = state.assets.findIndex((asset) => asset.id === id);
      if (index !== -1) {
        state.assets[index] = { ...state.assets[index], ...updates };
      }
    },

    deleteAsset: (state, action: PayloadAction<number>) => {
      state.assets = state.assets.filter((asset) => asset.id !== action.payload);
    },
  },
});

export const { addAsset, updateAsset, deleteAsset } = assetsSlice.actions;
export default assetsSlice.reducer;