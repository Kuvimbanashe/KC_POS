import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { axiosClient } from '../../services/axiosClient';
import type {
  ExpenseRecord,
  PaymentMethod,
  Product,
  PurchaseRecord,
  SaleItem,
  SaleRecord,
  StoreInfo,
  UserProfile,
  UserState,
} from '../types';


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

interface BackendUser {
  id: number;
  email: string;
  name: string;
  role: UserProfile['type'];
  phone?: string;
  address?: string;
  join_date?: string;
  status?: UserProfile['status'];
  permissions?: UserProfile['permissions'];
  last_login_at?: string | null;
  business?: number;
  business_name?: string | null;
}

interface BackendSale {
  id: number;
  date: string;
  cashier: string;
  total: string | number;
  payment_method: PaymentMethod;
  invoice_number: string;
  customer?: string;
  items?: Array<{
    product?: number;
    product_id?: number;
    product_name?: string;
    quantity?: number;
    price?: string | number;
    subtotal?: string | number;
    unit_type?: SaleItem['unitType'];
    pack_size?: number;
  }>;
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

interface BackendBusiness {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  currency?: string;
  timezone?: string;
}

const initialState: UserState = {
  users: [],
  products: [],
  sales: [],
  purchases: [],
  expenses: [],
  currentStore: {
    name: '',
    address: '',
    phone: '',
    email: '',
    taxId: '',
    currency: 'USD',
    openingTime: '08:00',
    closingTime: '22:00',
    timezone: 'UTC',
  },
};

const withBusiness = (businessId?: number | null) => (businessId ? { params: { business_id: businessId } } : {});

export const fetchOperationalData = createAsyncThunk(
  'user/fetchOperationalData',
  async (businessId?: number | null) => {
    const [businesses, users, products, sales, purchases, expenses] = await Promise.all([
      axiosClient.get('/businesses/', withBusiness(businessId)),
      axiosClient.get('/users/', withBusiness(businessId)),
      axiosClient.get('/products/', withBusiness(businessId)),
      axiosClient.get('/sales/', withBusiness(businessId)),
      axiosClient.get('/purchases/', withBusiness(businessId)),
      axiosClient.get('/expenses/', withBusiness(businessId)),
    ]);

    const unwrap = <T>(data: { results?: T[] } | T[]) => (Array.isArray(data) ? data : (data.results ?? []));
    const business = unwrap<BackendBusiness>(businesses.data)[0];

    const mappedUsers = unwrap<BackendUser>(users.data).map((u) => ({
      id: u.id,
      email: u.email,
      password: '',
      name: u.name,
      type: u.role,
      phone: u.phone,
      address: u.address,
      joinDate: u.join_date,
      status: u.status,
      permissions: u.permissions,
      lastLogin: u.last_login_at,
      businessId: u.business,
      businessName: u.business_name,
    })) as UserProfile[];

    const mappedProducts = unwrap<BackendProduct>(products.data).map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: Number(p.price),
      cost: Number(p.cost),
      stock: Number(p.stock),
      sku: p.sku,
      barcode: p.barcode ?? undefined,
      supplier: p.supplier,
      unitType: p.unit_type,
      packSize: p.pack_size,
      packPrice: p.pack_price ? Number(p.pack_price) : undefined,
      singlePrice: p.single_price ? Number(p.single_price) : undefined,
      minStockLevel: Number(p.min_stock_level ?? 10),
      description: p.description ?? '',
      createdAt: p.created_at,
    })) as Product[];

    const mappedSales = unwrap<BackendSale>(sales.data).map((s) => {
      const mappedItems: SaleItem[] = (s.items ?? []).map((item) => ({
        productId: Number(item.product_id ?? item.product ?? 0),
        productName: item.product_name ?? 'Item',
        quantity: Number(item.quantity ?? 0),
        price: Number(item.price ?? 0),
        subtotal: Number(item.subtotal ?? 0),
        unitType: item.unit_type ?? 'single',
        packSize: item.pack_size,
      }));

      return {
        id: s.id,
        date: s.date,
        cashier: s.cashier,
        total: Number(s.total),
        paymentMethod: s.payment_method,
        invoiceNumber: s.invoice_number,
        customer: s.customer,
        items: mappedItems,
        productId: mappedItems[0]?.productId,
        productName: mappedItems[0]?.productName,
        quantity: mappedItems.reduce((sum, item) => sum + item.quantity, 0),
        price: mappedItems[0]?.price,
      };
    }) as SaleRecord[];

    const mappedPurchases = unwrap<BackendPurchase>(purchases.data).map((p) => ({
      id: p.id,
      productId: p.product,
      productName: p.product_name,
      quantity: p.quantity,
      unitCost: Number(p.unit_cost),
      total: Number(p.total),
      date: p.date,
      supplier: p.supplier,
      orderNumber: p.order_number,
      status: p.status,
      deliveryDate: p.delivery_date,
      createdAt: p.created_at,
    })) as PurchaseRecord[];

    const mappedExpenses = unwrap<BackendExpense>(expenses.data).map((e) => ({
      id: e.id,
      category: e.category,
      amount: Number(e.amount),
      date: e.date,
      description: e.description,
      paymentMethod: e.payment_method,
      vendor: e.vendor,
      status: e.status,
      receiptNumber: e.receipt_number,
    })) as ExpenseRecord[];

    const mappedStore: StoreInfo = {
      name: business?.name ?? '',
      address: business?.address ?? '',
      phone: business?.phone ?? '',
      email: business?.email ?? '',
      taxId: business?.tax_id ?? '',
      currency: business?.currency ?? 'USD',
      openingTime: '08:00',
      closingTime: '22:00',
      timezone: business?.timezone ?? 'UTC',
    };

    return {
      currentStore: mappedStore,
      users: mappedUsers,
      products: mappedProducts,
      sales: mappedSales,
      purchases: mappedPurchases,
      expenses: mappedExpenses,
    };
  },
);

type AddSalePayload = {
  items: SaleItem[];
  cashier: string;
  total: number;
  paymentMethod: PaymentMethod;
  customer?: string;
};

type UpdateStockPayload = { productId: number; quantity: number };
type AddPurchasePayload = {
  productId: number;
  productName: string;
  quantity: number;
  unitCost: number;
  total: number;
  supplier: string;
};
type AddExpensePayload = {
  category: string;
  amount: number;
  description: string;
};
type AddProductPayload = Omit<Product, 'id' | 'createdAt'> & {
  id?: number;
  createdAt?: string;
  stock?: number;
  minStockLevel?: number;
  sku?: string;
};
type UpdateProductPayload = { id: number } & Partial<Omit<Product, 'id'>>;

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    addSale: (state, action: PayloadAction<AddSalePayload>) => {
      const nextId = state.sales.length > 0 ? Math.max(...state.sales.map((s) => s.id)) + 1 : 1;
      const timestamp = new Date().toISOString();
      state.sales.unshift({
        id: nextId,
        date: timestamp,
        cashier: action.payload.cashier,
        total: action.payload.total,
        paymentMethod: action.payload.paymentMethod,
        invoiceNumber: `INV${(1000 + nextId).toString().padStart(4, '0')}`,
        customer: action.payload.customer,
        items: action.payload.items,
      });
    },
    addPurchase: (state, action: PayloadAction<AddPurchasePayload>) => {
      const nextId = state.purchases.length > 0 ? Math.max(...state.purchases.map((p) => p.id)) + 1 : 1;
      const timestamp = new Date().toISOString();
      state.purchases.unshift({
        id: nextId,
        productId: action.payload.productId,
        productName: action.payload.productName,
        quantity: action.payload.quantity,
        unitCost: action.payload.unitCost,
        total: action.payload.total,
        date: timestamp,
        supplier: action.payload.supplier,
        orderNumber: `PO-${(1000 + nextId).toString().padStart(4, '0')}`,
        status: 'Completed',
        deliveryDate: timestamp,
        createdAt: timestamp,
      });
    },
    addExpense: (state, action: PayloadAction<AddExpensePayload>) => {
      const nextId = state.expenses.length > 0 ? Math.max(...state.expenses.map((e) => e.id)) + 1 : 1;
      const date = new Date().toISOString().split('T')[0];
      state.expenses.unshift({
        id: nextId,
        category: action.payload.category,
        amount: action.payload.amount,
        date,
        description: action.payload.description,
        paymentMethod: 'Cash',
        vendor: 'N/A',
        status: 'Paid',
        receiptNumber: `EXP-${(1000 + nextId).toString().padStart(4, '0')}`,
      });
    },
    updateProductStock: (state, action: PayloadAction<UpdateStockPayload>) => {
      const product = state.products.find((p) => p.id === action.payload.productId);
      if (product) product.stock = Math.max(0, product.stock - action.payload.quantity);
    },
    addProduct: (state, action: PayloadAction<AddProductPayload>) => {
      const nextId = state.products.length > 0 ? Math.max(...state.products.map((p) => p.id)) + 1 : 1;
      state.products.unshift({
        id: action.payload.id ?? nextId,
        createdAt: action.payload.createdAt ?? new Date().toISOString(),
        ...action.payload,
        stock: action.payload.stock ?? 0,
        sku: action.payload.sku ?? `SKU-LOCAL-${nextId.toString().padStart(5, '0')}`,
        minStockLevel: action.payload.minStockLevel ?? 10,
      });
    },
    updateProduct: (state, action: PayloadAction<UpdateProductPayload>) => {
      const idx = state.products.findIndex((p) => p.id === action.payload.id);
      if (idx >= 0) state.products[idx] = { ...state.products[idx], ...action.payload };
    },
    hydrateOperationalData: (
      state,
      action: PayloadAction<{
        users: UserProfile[];
        products: Product[];
        sales: SaleRecord[];
        purchases: PurchaseRecord[];
        expenses: ExpenseRecord[];
      }>,
    ) => {
      state.users = action.payload.users;
      state.products = action.payload.products;
      state.sales = action.payload.sales;
      state.purchases = action.payload.purchases;
      state.expenses = action.payload.expenses;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchOperationalData.fulfilled, (state, action) => {
      state.currentStore = action.payload.currentStore;
      state.users = action.payload.users;
      state.products = action.payload.products;
      state.sales = action.payload.sales;
      state.purchases = action.payload.purchases;
      state.expenses = action.payload.expenses;
    });
  },
});

export const { addSale, addPurchase, addExpense, updateProductStock, addProduct, updateProduct, hydrateOperationalData } =
  userSlice.actions;
export default userSlice.reducer;
