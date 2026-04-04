import { apiClient } from './api';
import type { AppDispatch } from '../store';
import { hydrateOperationalData } from '../store/slices/userSlice';
import { setAssets } from '../store/slices/assetsSlice';
import { setManagedUsers } from '../store/slices/userManagementSlice';

export const syncWholeAppFromBackend = async (dispatch: AppDispatch, businessId?: number | null) => {
  const [users, products, sales, purchases, expenses, assets] = await Promise.all([
    apiClient.fetchUsers(businessId),
    apiClient.fetchProducts(businessId),
    apiClient.fetchSales(businessId),
    apiClient.fetchPurchases(businessId),
    apiClient.fetchExpenses(businessId),
    apiClient.fetchAssets(businessId),
  ]);

  dispatch(hydrateOperationalData({ users, products, sales, purchases, expenses }));
  dispatch(setAssets(assets));
  dispatch(setManagedUsers(users));
};
