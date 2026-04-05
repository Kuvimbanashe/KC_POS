import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { axiosClient } from '../../services/axiosClient';
import type { AssetsState, AssetRecord } from '../types';

const initialState: AssetsState = { assets: [] };

export const fetchAssets = createAsyncThunk('assets/fetchAssets', async (businessId?: number | null) => {
  const params = businessId ? { params: { business_id: businessId } } : {};
  const response = await axiosClient.get('/assets/', params);
  const rows = Array.isArray(response.data) ? response.data : (response.data.results ?? []);

  return rows.map(
    (a: {
      id: number;
      name: string;
      category: string;
      purchase_value: string | number;
      current_value: string | number;
      purchase_date: string;
      condition: AssetRecord['condition'];
      location: string;
      created_at: string;
    }) => ({
      id: a.id,
      name: a.name,
      category: a.category,
      purchaseValue: Number(a.purchase_value),
      currentValue: Number(a.current_value),
      purchaseDate: a.purchase_date,
      condition: a.condition,
      location: a.location,
      createdAt: a.created_at,
    }),
  ) as AssetRecord[];
});

const assetsSlice = createSlice({
  name: 'assets',
  initialState,
  reducers: {
    setAssets: (state, action: PayloadAction<AssetRecord[]>) => {
      state.assets = action.payload;
    },
    addAsset: (state, action: PayloadAction<AssetRecord>) => {
      state.assets.unshift(action.payload);
    },
    deleteAsset: (state, action: PayloadAction<number>) => {
      state.assets = state.assets.filter((asset) => asset.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchAssets.fulfilled, (state, action) => {
      state.assets = action.payload;
    });
  },
});

export const { setAssets, addAsset, deleteAsset } = assetsSlice.actions;
export default assetsSlice.reducer;
