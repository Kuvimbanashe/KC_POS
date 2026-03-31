import type { AssetRecord, ExpenseRecord, Product, PurchaseRecord, SaleItem, SaleRecord, UserProfile } from '../store/types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://d3kf6j33-8000.inc1.devtunnels.ms/api';

interface CreateSalePayload {
  cashier: string;
  total: number;
  paymentMethod: 'Cash' | 'Card' | 'Mobile Payment';
  invoiceNumber: string;
  customer?: string;
  items: SaleItem[];
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

interface BackendUser {
  id: number;
  email: string;
  password: string;
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

const jsonHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: jsonHeaders,
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${path}`);
  }

  return response.json() as Promise<T>;
};

const appendBusinessId = (path: string, businessId?: number | null) => {
  if (!businessId) return path;
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}business_id=${businessId}`;
};

const mapUser = (data: BackendUser): UserProfile => ({
  id: data.id,
  email: data.email,
  password: data.password,
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

  async lookupProductByBarcode(barcode: string, businessId?: number | null): Promise<Product | null> {
    const path = appendBusinessId(`/products/lookup-by-barcode/?barcode=${encodeURIComponent(barcode)}`, businessId);
    const response = await fetch(`${API_BASE_URL}${path}`, { headers: jsonHeaders });
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
        total: payload.total,
        payment_method: payload.paymentMethod,
        invoice_number: payload.invoiceNumber,
        customer: payload.customer ?? '',
        items: payload.items.map((item) => ({
          product: item.productId,
          product_name: item.productName,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
          unit_type: item.unitType,
          pack_size: item.packSize,
        })),
      }),
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
      price: payload.price,
      cost: payload.cost ?? payload.price * 0.6,
      stock: payload.stock,
      supplier: payload.supplier ?? '',
      unit_type: payload.unitType,
      pack_size: payload.packSize,
      pack_price: payload.packPrice,
      single_price: payload.singlePrice,
      min_stock_level: payload.minStockLevel ?? 10,
      barcode: payload.barcode,
      description: payload.description ?? '',
    };

    const path = productId ? `/products/${productId}/` : '/products/';
    const method = productId ? 'PUT' : 'POST';
    const data = await request<BackendProduct>(path, { method, body: JSON.stringify(body) });
    return mapProduct(data);
  },

  async fetchProducts(businessId?: number | null): Promise<Product[]> {
    const data = await request<PagedResponse<BackendProduct> | BackendProduct[]>(appendBusinessId('/products/', businessId));
    return unwrapResults(data).map(mapProduct);
  },
  async fetchUsers(businessId?: number | null): Promise<UserProfile[]> {
    const data = await request<PagedResponse<BackendUser> | BackendUser[]>(appendBusinessId('/users/', businessId));
    return unwrapResults(data).map(mapUser);
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

    const [dashboard, sales, inventory, expenses, profitLoss] = await Promise.all([
      request<Record<string, unknown>>(`/reports/dashboard/${suffix}`),
      request<Record<string, unknown>>(`/reports/sales/${suffix}`),
      request<Record<string, unknown>>(`/reports/inventory/${suffix}`),
      request<Record<string, unknown>>(`/reports/expenses/${suffix}`),
      request<Record<string, unknown>>(`/reports/profit-loss/${suffix}`),
    ]);
    return { dashboard, sales, inventory, expenses, profitLoss };
  },
};
