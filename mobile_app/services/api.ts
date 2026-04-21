import type { AssetRecord, ExpenseRecord, Product, PurchaseRecord, SaleItem, SaleRecord, UserProfile } from '../store/types';
import { getAuthToken } from './authSession';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://kc-pos-backend.vercel.app/api';
const MAX_CURRENCY_VALUE = 9_999_999_999.99;
const PUBLIC_AUTH_PATHS = [
  '/auth/login/',
  '/auth/register-business/',
  '/auth/request-password-reset/',
  '/auth/verify-reset-otp/',
  '/auth/reset-password/',
];

const roundCurrency = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  const rounded = Number(value.toFixed(2));
  if (rounded > MAX_CURRENCY_VALUE) return MAX_CURRENCY_VALUE;
  if (rounded < -MAX_CURRENCY_VALUE) return -MAX_CURRENCY_VALUE;
  return rounded;
};

const toNumber = (value: string | number | undefined | null): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const isWithinDateRange = (value: string, start?: string, end?: string) => {
  const day = value.slice(0, 10);
  if (start && day < start) return false;
  if (end && day > end) return false;
  return true;
};

interface CreateSalePayload {
  cashier: string;
  total: number;
  paymentMethod: 'Cash' | 'Card' | 'Mobile Payment';
  invoiceNumber: string;
  customer?: string;
  items: SaleItem[];
  businessId?: number | null;
}
interface CreatePurchasePayload {
  productId: number;
  productName: string;
  quantity: number;
  unitCost: number;
  total: number;
  supplier: string;
  status?: PurchaseRecord['status'];
  businessId?: number | null;
}
interface CreateExpensePayload {
  category: string;
  amount: number;
  description: string;
  paymentMethod?: 'Bank Transfer' | 'Cash' | 'Check' | 'Online Payment';
  vendor?: string;
  status?: ExpenseRecord['status'];
  businessId?: number | null;
}

interface RegisterBusinessPayload {
  businessName: string;
  businessEmail?: string;
  businessPhone?: string;
  businessAddress?: string;
  businessTaxId?: string;
  businessCurrency?: string;
  businessTimezone?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  password: string;
  role: 'admin' | 'cashier';
}

interface SaveUserPayload {
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'cashier';
  phone?: string;
  address?: string;
  businessId: number;
}

interface BackendUser {
  id: number;
  email: string;
  password?: string;
  name: string;
  role: 'admin' | 'cashier';
  phone?: string;
  address?: string;
  join_date?: string;
  status?: 'active' | 'inactive';
  permissions?: UserProfile['permissions'];
  last_login_at?: string | null;
  business?: number;
  business_name?: string;
}

interface BackendProduct {
  id: number;
  name: string;
  category: string;
  price: string | number;
  cost: string | number;
  stock: number;
  sku: string;
  barcode?: string | null;
  supplier?: string;
  unit_type: Product['unitType'];
  pack_size?: number;
  pack_price?: string | number | null;
  single_price?: string | number | null;
  min_stock_level?: number;
  description?: string;
  created_at: string;
}

interface BackendSaleItem {
  product: number;
  product_name: string;
  quantity: number;
  price: string | number;
  subtotal: string | number;
  unit_type: Product['unitType'];
  pack_size?: number;
}

interface BackendSale {
  id: number;
  date: string;
  cashier: string;
  total: string | number;
  payment_method: SaleRecord['paymentMethod'];
  invoice_number: string;
  customer?: string;
  items?: BackendSaleItem[];
}

interface BackendPurchase {
  id: number;
  product: number;
  product_name: string;
  quantity: number;
  unit_cost: string | number;
  total: string | number;
  date: string;
  supplier: string;
  order_number: string;
  status: PurchaseRecord['status'];
  delivery_date: string;
  created_at: string;
}

interface BackendExpense {
  id: number;
  category: string;
  amount: string | number;
  date: string;
  description: string;
  payment_method: ExpenseRecord['paymentMethod'];
  vendor: string;
  status: ExpenseRecord['status'];
  receipt_number: string;
}

interface BackendAsset {
  id: number;
  name: string;
  category: string;
  purchase_value: string | number;
  current_value: string | number;
  purchase_date: string;
  condition: AssetRecord['condition'];
  location: string;
  created_at: string;
}

interface PagedResponse<T> {
  results?: T[];
}

interface PasswordResetRequestResponse {
  detail: string;
  email: string;
  otp_code: string;
  expires_at: string;
}

interface DashboardReportResponse {
  totals: {
    sales: string | number;
    expenses: string | number;
    inventory_value: string | number;
    net: string | number;
  };
  alerts: {
    low_stock_products: number;
  };
}

interface SalesReportResponse {
  filters: {
    start?: string | null;
    end?: string | null;
  };
  summary: {
    total_sales: string | number;
    count: number;
  };
  daily: Array<{
    day: string;
    total: string | number;
  }>;
}

interface InventoryReportResponse {
  summary: {
    inventory_value: string | number;
    products_count: number;
  };
  low_stock: Array<{
    id: number;
    name: string;
    stock: number;
    min_stock_level: number;
  }>;
  products: Array<{
    id: number;
    name: string;
    sku: string;
    barcode?: string | null;
    stock: number;
    min_stock_level: number;
    cost: string | number;
    price: string | number;
  }>;
}

interface ExpensesReportResponse {
  summary: {
    total_expenses: string | number;
    count: number;
  };
  by_category: Array<{
    category: string;
    total: string | number;
  }>;
}

interface ProfitLossReportResponse {
  filters: {
    start?: string | null;
    end?: string | null;
  };
  income_statement: {
    revenue: string | number;
    cogs: string | number;
    gross_profit: string | number;
    operating_expenses: string | number;
    net_profit: string | number;
  };
}

const jsonHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

const isPublicPath = (path: string) => PUBLIC_AUTH_PATHS.some((publicPath) => path.startsWith(publicPath));

const buildHeaders = async (path: string, headers?: HeadersInit): Promise<Headers> => {
  const mergedHeaders = new Headers(jsonHeaders);
  if (headers) {
    new Headers(headers).forEach((value, key) => mergedHeaders.set(key, value));
  }

  if (!isPublicPath(path) && !mergedHeaders.has('Authorization')) {
    const token = await getAuthToken();
    if (token) {
      mergedHeaders.set('Authorization', `Bearer ${token}`);
    }
  }

  return mergedHeaders;
};

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: await buildHeaders(path, init?.headers),
  });
  const responseBody = await response.text();

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${path} ${responseBody}`);
  }

  if (!responseBody.trim()) {
    return undefined as T;
  }

  return JSON.parse(responseBody) as T;
};

const appendBusinessId = (path: string, businessId?: number | null) => {
  if (!businessId) return path;
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}business_id=${businessId}`;
};

const mapUser = (data: BackendUser): UserProfile => ({
  id: data.id,
  email: data.email,
  password: data.password ?? '',
  name: data.name,
  type: data.role,
  phone: data.phone,
  address: data.address,
  joinDate: data.join_date,
  status: data.status,
  permissions: data.permissions,
  lastLogin: data.last_login_at,
  businessId: data.business,
  businessName: data.business_name,
});

const mapProduct = (data: BackendProduct): Product => ({
  id: data.id,
  name: data.name,
  category: data.category,
  price: Number(data.price),
  cost: Number(data.cost),
  stock: Number(data.stock),
  sku: data.sku,
  barcode: data.barcode ?? undefined,
  supplier: data.supplier,
  unitType: data.unit_type,
  packSize: data.pack_size,
  packPrice: data.pack_price ? Number(data.pack_price) : undefined,
  singlePrice: data.single_price ? Number(data.single_price) : undefined,
  minStockLevel: Number(data.min_stock_level ?? 10),
  description: data.description ?? '',
  createdAt: data.created_at,
});

const mapSale = (data: BackendSale): SaleRecord => ({
  id: data.id,
  date: data.date,
  cashier: data.cashier,
  total: Number(data.total),
  paymentMethod: data.payment_method,
  invoiceNumber: data.invoice_number,
  customer: data.customer,
  items: (data.items ?? []).map((item: BackendSaleItem) => ({
    productId: item.product,
    productName: item.product_name,
    quantity: item.quantity,
    price: Number(item.price),
    subtotal: Number(item.subtotal),
    unitType: item.unit_type,
    packSize: item.pack_size,
  })),
});

const mapPurchase = (data: BackendPurchase): PurchaseRecord => ({
  id: data.id,
  productId: data.product,
  productName: data.product_name,
  quantity: data.quantity,
  unitCost: Number(data.unit_cost),
  total: Number(data.total),
  date: data.date,
  supplier: data.supplier,
  orderNumber: data.order_number,
  status: data.status,
  deliveryDate: data.delivery_date,
  createdAt: data.created_at,
});

const mapExpense = (data: BackendExpense): ExpenseRecord => ({
  id: data.id,
  category: data.category,
  amount: Number(data.amount),
  date: data.date,
  description: data.description,
  paymentMethod: data.payment_method,
  vendor: data.vendor,
  status: data.status,
  receiptNumber: data.receipt_number,
});

const mapAsset = (data: BackendAsset): AssetRecord => ({
  id: data.id,
  name: data.name,
  category: data.category,
  purchaseValue: Number(data.purchase_value),
  currentValue: Number(data.current_value),
  purchaseDate: data.purchase_date,
  condition: data.condition,
  location: data.location,
  createdAt: data.created_at,
});

const unwrapResults = <T>(data: PagedResponse<T> | T[]): T[] => (Array.isArray(data) ? data : (data.results ?? []));

export const apiClient = {
  async registerBusinessOwner(payload: RegisterBusinessPayload) {
    const data = await request<{ token: string; user: BackendUser; business?: { id: number; name: string } }>('/auth/register-business/', {
      method: 'POST',
      body: JSON.stringify({
        business_name: payload.businessName,
        business_email: payload.businessEmail,
        business_phone: payload.businessPhone,
        business_address: payload.businessAddress,
        business_tax_id: payload.businessTaxId,
        business_currency: payload.businessCurrency,
        business_timezone: payload.businessTimezone,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        address: payload.address,
        password: payload.password,
        role: payload.role,
      }),
    });

    return {
      token: data.token,
      user: mapUser({ ...data.user, business_name: data.business?.name }),
      business: data.business,
    };
  },

  async login(email: string, password: string) {
    const data = await request<{ token: string; user: BackendUser; business?: { id: number; name: string } }>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    return {
      token: data.token,
      user: mapUser({ ...data.user, business_name: data.business?.name }),
      business: data.business,
    };
  },

  async requestPasswordReset(email: string) {
    const data = await request<PasswordResetRequestResponse>('/auth/request-password-reset/', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    return {
      detail: data.detail,
      email: data.email,
      otpCode: data.otp_code,
      expiresAt: data.expires_at,
    };
  },

  async verifyPasswordResetCode(email: string, code: string) {
    return request<{ detail: string }>('/auth/verify-reset-otp/', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  },

  async resetPassword(email: string, code: string, newPassword: string) {
    return request<{ detail: string }>('/auth/reset-password/', {
      method: 'POST',
      body: JSON.stringify({
        email,
        code,
        new_password: newPassword,
      }),
    });
  },

  async changePassword(currentPassword: string, newPassword: string) {
    return request<{ detail: string }>('/auth/change-password/', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });
  },

  async lookupProductByBarcode(barcode: string, businessId?: number | null): Promise<Product | null> {
    const path = appendBusinessId(`/products/lookup-by-barcode/?barcode=${encodeURIComponent(barcode)}`, businessId);
    const response = await fetch(`${API_BASE_URL}${path}`, { headers: await buildHeaders(path) });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Lookup failed with status ${response.status}`);
    return mapProduct((await response.json()) as BackendProduct);
  },

  async createSale(payload: CreateSalePayload): Promise<void> {
    await request('/sales/', {
      method: 'POST',
      body: JSON.stringify({
        business: payload.businessId,
        cashier: payload.cashier,
        total: roundCurrency(payload.total),
        payment_method: payload.paymentMethod,
        invoice_number: payload.invoiceNumber,
        customer: payload.customer ?? '',
        items: payload.items.map((item) => ({
          product: item.productId,
          product_name: item.productName,
          quantity: item.quantity,
          price: roundCurrency(item.price),
          subtotal: roundCurrency(item.subtotal),
          unit_type: item.unitType,
          pack_size: item.packSize,
        })),
      }),
    });
  },
  async createPurchase(payload: CreatePurchasePayload): Promise<PurchaseRecord> {
    const data = await request<BackendPurchase>('/purchases/', {
      method: 'POST',
      body: JSON.stringify({
        business: payload.businessId,
        product: payload.productId,
        product_name: payload.productName,
        quantity: payload.quantity,
        unit_cost: roundCurrency(payload.unitCost),
        total: roundCurrency(payload.total),
        supplier: payload.supplier,
        order_number: `PO-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        status: payload.status ?? 'Completed',
      }),
    });
    return mapPurchase(data);
  },
  async updatePurchase(
    purchaseId: number,
    payload: Partial<CreatePurchasePayload>,
  ): Promise<PurchaseRecord> {
    const body: Record<string, unknown> = {};
    if (payload.businessId !== undefined) body.business = payload.businessId;
    if (payload.productId !== undefined) body.product = payload.productId;
    if (payload.productName !== undefined) body.product_name = payload.productName;
    if (payload.quantity !== undefined) body.quantity = payload.quantity;
    if (payload.unitCost !== undefined) body.unit_cost = roundCurrency(payload.unitCost);
    if (payload.total !== undefined) body.total = roundCurrency(payload.total);
    if (payload.supplier !== undefined) body.supplier = payload.supplier;
    if (payload.status !== undefined) body.status = payload.status;

    const data = await request<BackendPurchase>(`/purchases/${purchaseId}/`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return mapPurchase(data);
  },
  async deletePurchase(purchaseId: number): Promise<void> {
    await request<void>(`/purchases/${purchaseId}/`, {
      method: 'DELETE',
    });
  },
  async createExpense(payload: CreateExpensePayload): Promise<ExpenseRecord> {
    const data = await request<BackendExpense>('/expenses/', {
      method: 'POST',
      body: JSON.stringify({
        business: payload.businessId,
        category: payload.category,
        amount: roundCurrency(payload.amount),
        description: payload.description,
        payment_method: payload.paymentMethod ?? 'Cash',
        vendor: payload.vendor ?? 'General',
        status: payload.status ?? 'Paid',
        receipt_number: `EXP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      }),
    });
    return mapExpense(data);
  },
  async updateExpense(
    expenseId: number,
    payload: Partial<CreateExpensePayload>,
  ): Promise<ExpenseRecord> {
    const body: Record<string, unknown> = {};
    if (payload.businessId !== undefined) body.business = payload.businessId;
    if (payload.category !== undefined) body.category = payload.category;
    if (payload.amount !== undefined) body.amount = roundCurrency(payload.amount);
    if (payload.description !== undefined) body.description = payload.description;
    if (payload.paymentMethod !== undefined) body.payment_method = payload.paymentMethod;
    if (payload.vendor !== undefined) body.vendor = payload.vendor;
    if (payload.status !== undefined) body.status = payload.status;

    const data = await request<BackendExpense>(`/expenses/${expenseId}/`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return mapExpense(data);
  },
  async deleteExpense(expenseId: number): Promise<void> {
    await request<void>(`/expenses/${expenseId}/`, {
      method: 'DELETE',
    });
  },

  async saveProduct(
    payload: {
      name: string;
      category: string;
      price: number;
      stock: number;
      supplier?: string;
      unitType: Product['unitType'];
      packSize?: number;
      packPrice?: number;
      singlePrice?: number;
      minStockLevel?: number;
      barcode?: string;
      description?: string;
      cost?: number;
    },
    businessId?: number | null,
    productId?: number,
  ): Promise<Product> {
    const body = {
      business: businessId,
      name: payload.name,
      category: payload.category,
      price: roundCurrency(payload.price),
      cost: roundCurrency(payload.cost ?? payload.price * 0.6),
      stock: payload.stock,
      supplier: payload.supplier ?? '',
      unit_type: payload.unitType,
      pack_size: payload.packSize,
      pack_price: payload.packPrice === undefined ? undefined : roundCurrency(payload.packPrice),
      single_price: payload.singlePrice === undefined ? undefined : roundCurrency(payload.singlePrice),
      min_stock_level: payload.minStockLevel ?? 10,
      barcode: payload.barcode,
      description: payload.description ?? '',
    };

    const path = productId ? `/products/${productId}/` : '/products/';
    const method = productId ? 'PATCH' : 'POST';
    const data = await request<BackendProduct>(path, { method, body: JSON.stringify(body) });
    return mapProduct(data);
  },

  async createAsset(
    payload: {
      name: string;
      category: string;
      purchaseValue: number;
      currentValue: number;
      purchaseDate: string;
      condition: AssetRecord['condition'];
      location: string;
    },
    businessId?: number | null,
  ): Promise<AssetRecord> {
    const data = await request<BackendAsset>('/assets/', {
      method: 'POST',
      body: JSON.stringify({
        business: businessId,
        name: payload.name,
        category: payload.category,
        purchase_value: roundCurrency(payload.purchaseValue),
        current_value: roundCurrency(payload.currentValue),
        purchase_date: payload.purchaseDate,
        condition: payload.condition,
        location: payload.location,
      }),
    });
    return mapAsset(data);
  },

  async updateAsset(
    assetId: number,
    payload: Partial<{
      name: string;
      category: string;
      purchaseValue: number;
      currentValue: number;
      purchaseDate: string;
      condition: AssetRecord['condition'];
      location: string;
      businessId: number | null;
    }>,
  ): Promise<AssetRecord> {
    const body: Record<string, unknown> = {};
    if (payload.businessId !== undefined) body.business = payload.businessId;
    if (payload.name !== undefined) body.name = payload.name;
    if (payload.category !== undefined) body.category = payload.category;
    if (payload.purchaseValue !== undefined) body.purchase_value = roundCurrency(payload.purchaseValue);
    if (payload.currentValue !== undefined) body.current_value = roundCurrency(payload.currentValue);
    if (payload.purchaseDate !== undefined) body.purchase_date = payload.purchaseDate;
    if (payload.condition !== undefined) body.condition = payload.condition;
    if (payload.location !== undefined) body.location = payload.location;

    const data = await request<BackendAsset>(`/assets/${assetId}/`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return mapAsset(data);
  },

  async deleteAsset(assetId: number): Promise<void> {
    await request<void>(`/assets/${assetId}/`, {
      method: 'DELETE',
    });
  },

  async deleteProduct(productId: number): Promise<void> {
    await request<void>(`/products/${productId}/`, {
      method: 'DELETE',
    });
  },

  async fetchProducts(businessId?: number | null): Promise<Product[]> {
    const data = await request<PagedResponse<BackendProduct> | BackendProduct[]>(appendBusinessId('/products/', businessId));
    return unwrapResults(data).map(mapProduct);
  },
  async fetchUsers(businessId?: number | null): Promise<UserProfile[]> {
    const data = await request<PagedResponse<BackendUser> | BackendUser[]>(appendBusinessId('/users/', businessId));
    return unwrapResults(data).map(mapUser);
  },
  async createUser(payload: SaveUserPayload): Promise<UserProfile> {
    const data = await request<BackendUser>('/users/', {
      method: 'POST',
      body: JSON.stringify({
        business: payload.businessId,
        name: payload.name,
        email: payload.email,
        role: payload.role,
        phone: payload.phone ?? '',
        address: payload.address ?? '',
        status: 'active',
        ...(payload.password ? { password: payload.password } : {}),
      }),
    });
    return mapUser(data);
  },
  async updateUser(userId: number, payload: Partial<SaveUserPayload>): Promise<UserProfile> {
    const body: Record<string, unknown> = {};
    if (payload.businessId !== undefined) body.business = payload.businessId;
    if (payload.name !== undefined) body.name = payload.name;
    if (payload.email !== undefined) body.email = payload.email;
    if (payload.password) body.password = payload.password;
    if (payload.role !== undefined) body.role = payload.role;
    if (payload.phone !== undefined) body.phone = payload.phone;
    if (payload.address !== undefined) body.address = payload.address;

    const data = await request<BackendUser>(`/users/${userId}/`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return mapUser(data);
  },
  async deleteUser(userId: number): Promise<void> {
    await request<void>(`/users/${userId}/`, {
      method: 'DELETE',
    });
  },
  async fetchSales(businessId?: number | null): Promise<SaleRecord[]> {
    const data = await request<PagedResponse<BackendSale> | BackendSale[]>(appendBusinessId('/sales/', businessId));
    return unwrapResults(data).map(mapSale);
  },
  async fetchPurchases(businessId?: number | null): Promise<PurchaseRecord[]> {
    const data = await request<PagedResponse<BackendPurchase> | BackendPurchase[]>(appendBusinessId('/purchases/', businessId));
    return unwrapResults(data).map(mapPurchase);
  },
  async fetchExpenses(businessId?: number | null): Promise<ExpenseRecord[]> {
    const data = await request<PagedResponse<BackendExpense> | BackendExpense[]>(appendBusinessId('/expenses/', businessId));
    return unwrapResults(data).map(mapExpense);
  },
  async fetchAssets(businessId?: number | null): Promise<AssetRecord[]> {
    const data = await request<PagedResponse<BackendAsset> | BackendAsset[]>(appendBusinessId('/assets/', businessId));
    return unwrapResults(data).map(mapAsset);
  },

  async fetchReports(start?: string, end?: string, businessId?: number | null) {
    const query = new URLSearchParams();
    if (start) query.set('start', start);
    if (end) query.set('end', end);
    if (businessId) query.set('business_id', `${businessId}`);
    const suffix = query.toString() ? `?${query.toString()}` : '';

    const [dashboard, sales, inventory, expenses] = await Promise.all([
      request<DashboardReportResponse>(`/reports/dashboard/${suffix}`),
      request<SalesReportResponse>(`/reports/sales/${suffix}`),
      request<InventoryReportResponse>(`/reports/inventory/${suffix}`),
      request<ExpensesReportResponse>(`/reports/expenses/${suffix}`),
    ]);

    let profitLoss: ProfitLossReportResponse;

    try {
      profitLoss = await request<ProfitLossReportResponse>(`/reports/profit-loss/${suffix}`);
    } catch (error) {
      console.error('Profit & loss report request failed, using purchase-data fallback:', error);

      const purchases = await this.fetchPurchases(businessId);
      const filteredPurchases = purchases.filter((purchase) => isWithinDateRange(purchase.date, start, end));
      const revenue = toNumber(sales.summary.total_sales);
      const operatingExpenses = toNumber(expenses.summary.total_expenses);
      const cogs = filteredPurchases.reduce((sum, purchase) => sum + toNumber(purchase.total), 0);
      const grossProfit = revenue - cogs;
      const netProfit = grossProfit - operatingExpenses;

      profitLoss = {
        filters: { start: start ?? null, end: end ?? null },
        income_statement: {
          revenue,
          cogs,
          gross_profit: grossProfit,
          operating_expenses: operatingExpenses,
          net_profit: netProfit,
        },
      };
    }

    return { dashboard, sales, inventory, expenses, profitLoss };
  },
};
