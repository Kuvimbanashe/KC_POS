import type { AssetRecord, ExpenseRecord, Product, PurchaseRecord, SaleItem, SaleRecord, UserProfile } from '../store/types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000/api';

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

const jsonHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

const request = async (path: string, init?: RequestInit) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: jsonHeaders,
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${path}`);
  }

  return response.json();
};

const appendBusinessId = (path: string, businessId?: number | null) => {
  if (!businessId) return path;
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}business_id=${businessId}`;
};

const mapUser = (data: any): UserProfile => ({
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

const mapProduct = (data: any): Product => ({
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

const mapSale = (data: any): SaleRecord => ({
  id: data.id,
  date: data.date,
  cashier: data.cashier,
  total: Number(data.total),
  paymentMethod: data.payment_method,
  invoiceNumber: data.invoice_number,
  customer: data.customer,
  items: (data.items ?? []).map((item: any) => ({
    productId: item.product,
    productName: item.product_name,
    quantity: item.quantity,
    price: Number(item.price),
    subtotal: Number(item.subtotal),
    unitType: item.unit_type,
    packSize: item.pack_size,
  })),
});

const mapPurchase = (data: any): PurchaseRecord => ({
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

const mapExpense = (data: any): ExpenseRecord => ({
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

const mapAsset = (data: any): AssetRecord => ({
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

export const apiClient = {
  async registerBusinessOwner(payload: RegisterBusinessPayload) {
    const data = await request('/auth/register-business/', {
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
    const data = await request('/auth/login/', {
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
    return mapProduct(await response.json());
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
    const data = await request(path, { method, body: JSON.stringify(body) });
    return mapProduct(data);
  },

  async fetchProducts(businessId?: number | null): Promise<Product[]> {
    const data = await request(appendBusinessId('/products/', businessId));
    return (data.results ?? data).map(mapProduct);
  },
  async fetchUsers(businessId?: number | null): Promise<UserProfile[]> {
    const data = await request(appendBusinessId('/users/', businessId));
    return (data.results ?? data).map(mapUser);
  },
  async fetchSales(businessId?: number | null): Promise<SaleRecord[]> {
    const data = await request(appendBusinessId('/sales/', businessId));
    return (data.results ?? data).map(mapSale);
  },
  async fetchPurchases(businessId?: number | null): Promise<PurchaseRecord[]> {
    const data = await request(appendBusinessId('/purchases/', businessId));
    return (data.results ?? data).map(mapPurchase);
  },
  async fetchExpenses(businessId?: number | null): Promise<ExpenseRecord[]> {
    const data = await request(appendBusinessId('/expenses/', businessId));
    return (data.results ?? data).map(mapExpense);
  },
  async fetchAssets(businessId?: number | null): Promise<AssetRecord[]> {
    const data = await request(appendBusinessId('/assets/', businessId));
    return (data.results ?? data).map(mapAsset);
  },

  async fetchReports(start?: string, end?: string, businessId?: number | null) {
    const query = new URLSearchParams();
    if (start) query.set('start', start);
    if (end) query.set('end', end);
    if (businessId) query.set('business_id', `${businessId}`);
    const suffix = query.toString() ? `?${query.toString()}` : '';

    const [dashboard, sales, inventory, expenses, profitLoss] = await Promise.all([
      request(`/reports/dashboard/${suffix}`),
      request(`/reports/sales/${suffix}`),
      request(`/reports/inventory/${suffix}`),
      request(`/reports/expenses/${suffix}`),
      request(`/reports/profit-loss/${suffix}`),
    ]);
    return { dashboard, sales, inventory, expenses, profitLoss };
  },
};
