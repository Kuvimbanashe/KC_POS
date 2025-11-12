import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  UserState,
  UserProfile,
  Product,
  SaleRecord,
  PurchaseRecord,
  ExpenseRecord,
  SaleItem,
  UnitType,
  PaymentMethod,
} from '../types';

// Mock data for the application
const mockUsers: UserProfile[] = [
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

// Enhanced mock products with realistic data
const mockProducts: Product[] = Array.from({ length: 25 }, (_, i) => {
  const categories = [
    { name: 'Electronics', brands: ['Samsung', 'Apple', 'Sony', 'LG', 'HP'] },
    { name: 'Clothing', brands: ['Nike', 'Adidas', 'Zara', 'H&M', 'Levi\'s'] },
    { name: 'Food & Beverages', brands: ['Coca-Cola', 'Nestle', 'Kellogg\'s', 'Heinz', 'Cadbury'] },
    { name: 'Home & Kitchen', brands: ['IKEA', 'Philips', 'KitchenAid', 'Black+Decker', 'Dyson'] },
    { name: 'Beauty & Personal Care', brands: ['L\'Oreal', 'Nivea', 'Dove', 'Garnier', 'Maybelline'] }
  ];
  
  const category = categories[i % 5];
  const brand = category.brands[i % 5];
  
  return {
    id: i + 1,
    name: `${brand} ${['Smartphone', 'Laptop', 'T-Shirt', 'Jeans', 'Cereal', 'Shampoo', 'Coffee Maker', 'Headphones', 'Sneakers', 'Chocolate'][i % 10]} ${i + 1}`,
    category: category.name,
    price: Math.floor(Math.random() * 1000) + 10,
    cost: Math.floor(Math.random() * 500) + 5, // Added cost for profit calculation
    stock: Math.floor(Math.random() * 100) + 10,
    sku: `SKU${(1000 + i).toString().padStart(4, '0')}`,
    supplier: ['TechSuppliers Inc.', 'Fashion Distributors', 'Food Importers Ltd.', 'Home Essentials Co.', 'Beauty World'][i % 5],
    unitType: ['single', 'pack', 'both'][i % 3] as UnitType,
    packSize: [6, 12, 24, 48, 100][i % 5],
    minStockLevel: 10,
    description: `High-quality ${category.name.toLowerCase()} product from ${brand}`,
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
  };
});

// Enhanced mock sales with realistic data
const mockSales: SaleRecord[] = Array.from({ length: 25 }, (_, i) => {
  const product = mockProducts[i % 25];
  const quantity = Math.floor(Math.random() * 5) + 1;
  const price = product.price * (0.8 + Math.random() * 0.4); // Some variation in selling price
  const total = quantity * price;
  
  const baseSale: SaleRecord = {
    id: i + 1,
    productId: product.id,
    productName: product.name,
    quantity: quantity,
    price: parseFloat(price.toFixed(2)),
    date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    cashier: ['Jane Cashier', 'Mike Johnson', 'Sarah Wilson', 'David Brown'][i % 4],
    total: parseFloat(total.toFixed(2)),
    paymentMethod: ['Cash', 'Card', 'Mobile Payment'][i % 3] as PaymentMethod,
    customer: `Customer ${(i % 50) + 1}`,
    invoiceNumber: `INV${(1000 + i).toString().padStart(4, '0')}`,
    items: [
      {
        productId: product.id,
        productName: product.name,
        quantity,
        price: parseFloat(price.toFixed(2)),
        subtotal: parseFloat(total.toFixed(2)),
        unitType: product.unitType,
        packSize: product.packSize,
      },
    ],
  };
  return baseSale;
});

// Enhanced mock purchases with realistic data
const mockPurchases: PurchaseRecord[] = Array.from({ length: 25 }, (_, i) => {
  const product = mockProducts[i % 25];
  const quantity = Math.floor(Math.random() * 50) + 10;
  const unitCost = product.cost * (0.9 + Math.random() * 0.2); // Some variation in purchase cost
  const total = quantity * unitCost;
  
  return {
    id: i + 1,
    productId: product.id,
    productName: product.name,
    quantity: quantity,
    unitCost: parseFloat(unitCost.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
    date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
    supplier: product.supplier ?? 'Unknown Supplier',
    orderNumber: `PO${(500 + i).toString().padStart(4, '0')}`,
    status: ['Completed', 'Completed', 'Completed', 'Pending'][i % 4] as PurchaseRecord['status'],
    deliveryDate: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString()
  };
});

// Enhanced mock expenses with realistic data
const mockExpenses: ExpenseRecord[] = Array.from({ length: 25 }, (_, i) => {
  const expenseTypes = [
    { category: 'Rent', descriptions: ['Monthly store rent', 'Warehouse rental', 'Office space rent'] },
    { category: 'Utilities', descriptions: ['Electricity bill', 'Water bill', 'Internet bill', 'Gas bill'] },
    { category: 'Salaries', descriptions: ['Staff salaries', 'Manager salary', 'Cashier wages', 'Cleaner payment'] },
    { category: 'Maintenance', descriptions: ['Equipment repair', 'Store maintenance', 'Computer servicing', 'Vehicle maintenance'] },
    { category: 'Marketing', descriptions: ['Facebook ads', 'Google ads', 'Flyer printing', 'Promotional events'] },
    { category: 'Office Supplies', descriptions: ['Paper and printing', 'Cleaning supplies', 'Stationery', 'Packaging materials'] },
    { category: 'Insurance', descriptions: ['Business insurance', 'Equipment insurance', 'Vehicle insurance'] },
    { category: 'Professional Services', descriptions: ['Accountant fees', 'Legal consultation', 'IT support'] }
  ];
  
  const expenseType = expenseTypes[i % 8];
  const description = expenseType.descriptions[i % expenseType.descriptions.length];
  const amount = Math.floor(Math.random() * 2000) + 100;
  
  return {
    id: i + 1,
    category: expenseType.category,
    amount: amount,
    date: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
    description: description,
    paymentMethod: ['Bank Transfer', 'Cash', 'Check', 'Online Payment'][i % 4] as ExpenseRecord['paymentMethod'],
    vendor: ['Property Management Co.', 'Utility Company', 'Staff Payments', 'Repair Services Ltd.', 'Marketing Agency'][i % 5],
    status: ['Paid', 'Paid', 'Paid', 'Pending'][i % 4] as ExpenseRecord['status'],
    receiptNumber: `RCPT${(200 + i).toString().padStart(4, '0')}`
  };
});

const initialState: UserState = {
  users: mockUsers,
  products: mockProducts,
  sales: mockSales,
  purchases: mockPurchases,
  expenses: mockExpenses,
  currentStore: {
    name: 'Metro Supermarket',
    address: '123 Business Avenue, Downtown, City 10001',
    phone: '+1-555-0123',
    email: 'info@metrosupermarket.com',
    taxId: 'TAX-123-456-789',
    currency: 'USD',
    openingTime: '08:00',
    closingTime: '22:00',
    timezone: 'UTC-5'
  }
};

type AddSalePayload = {
  items: SaleItem[];
  cashier: string;
  total: number;
  paymentMethod: SaleRecord['paymentMethod'];
  customer?: string;
};

type UpdateStockPayload = {
  productId: number;
  quantity: number;
};

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
  description: string;
  amount: number;
  paymentMethod?: ExpenseRecord['paymentMethod'];
  vendor?: string;
};

type AddProductPayload = {
  name: string;
  category: string;
  price: number;
  stock?: number;
  sku: string;
  supplier?: string;
  unitType: Product['unitType'];
  packSize?: number;
  packPrice?: number;
  singlePrice?: number;
  minStockLevel?: number;
  description?: string;
  cost?: number;
};

type UpdateProductPayload = { id: number } & Partial<Omit<Product, 'id'>>;

type UpdateSalePayload = { id: number } & Partial<SaleRecord>;

type UpdatePurchasePayload = { id: number } & Partial<PurchaseRecord>;

type UpdateExpensePayload = { id: number } & Partial<ExpenseRecord>;

type UpdateStorePayload = Partial<UserState['currentStore']>;

type AdjustStockPayload = {
  productId: number;
  adjustment: number;
  reason: string;
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    addSale: (state, action: PayloadAction<AddSalePayload>) => {
      const nextId = state.sales.length > 0 ? Math.max(...state.sales.map((s) => s.id)) + 1 : 1;
      const invoiceSuffix = (1000 + state.sales.length).toString().padStart(4, '0');
      const timestamp = new Date().toISOString();
      const primaryItem = action.payload.items[0];

      const newSale: SaleRecord = {
        id: nextId,
        date: timestamp,
        cashier: action.payload.cashier,
        total: action.payload.total,
        paymentMethod: action.payload.paymentMethod,
        invoiceNumber: `INV${invoiceSuffix}`,
        customer: action.payload.customer,
        items: action.payload.items,
        productId: primaryItem?.productId,
        productName: primaryItem?.productName,
        quantity: primaryItem?.quantity,
        price: primaryItem?.price,
      };

      state.sales.unshift(newSale);
    },

    updateProductStock: (state, action: PayloadAction<UpdateStockPayload>) => {
      const { productId, quantity } = action.payload;
      const product = state.products.find((p) => p.id === productId);
      if (product) {
        product.stock = Math.max(0, product.stock - quantity);
      }
    },

    addPurchase: (state, action: PayloadAction<AddPurchasePayload>) => {
      const nextId = state.purchases.length > 0 ? Math.max(...state.purchases.map((p) => p.id)) + 1 : 1;
      const timestamp = new Date().toISOString();
      const orderSuffix = (500 + state.purchases.length).toString().padStart(4, '0');

      const newPurchase: PurchaseRecord = {
        id: nextId,
        productId: action.payload.productId,
        productName: action.payload.productName,
        quantity: action.payload.quantity,
        unitCost: action.payload.unitCost,
        total: action.payload.total,
        date: timestamp,
        supplier: action.payload.supplier,
        orderNumber: `PO${orderSuffix}`,
        status: 'Completed',
        deliveryDate: timestamp,
        createdAt: timestamp,
      };

      state.purchases.unshift(newPurchase);

      const product = state.products.find((p) => p.id === action.payload.productId);
      if (product) {
        product.stock += action.payload.quantity;
        if (action.payload.supplier && !product.supplier) {
          product.supplier = action.payload.supplier;
        }
        product.cost = action.payload.unitCost;
      }
    },

    addExpense: (state, action: PayloadAction<AddExpensePayload>) => {
      const nextId = state.expenses.length > 0 ? Math.max(...state.expenses.map((e) => e.id)) + 1 : 1;
      const timestamp = new Date().toISOString();
      const receiptSuffix = (200 + state.expenses.length).toString().padStart(4, '0');

      const newExpense: ExpenseRecord = {
        id: nextId,
        category: action.payload.category,
        amount: action.payload.amount,
        date: timestamp,
        description: action.payload.description,
        paymentMethod: action.payload.paymentMethod ?? 'Cash',
        vendor: action.payload.vendor ?? 'Unknown Vendor',
        status: 'Paid',
        receiptNumber: `RCPT${receiptSuffix}`,
      };

      state.expenses.unshift(newExpense);
    },

    updateProduct: (state, action: PayloadAction<UpdateProductPayload>) => {
      const { id, ...updates } = action.payload;
      const productIndex = state.products.findIndex((p) => p.id === id);
      if (productIndex !== -1) {
        state.products[productIndex] = { ...state.products[productIndex], ...updates };
      }
    },

    addProduct: (state, action: PayloadAction<AddProductPayload>) => {
      const nextId = state.products.length > 0 ? Math.max(...state.products.map((p) => p.id)) + 1 : 1;
      const timestamp = new Date().toISOString();
      const cost = action.payload.cost ?? action.payload.price * 0.6;

      const newProduct: Product = {
        id: nextId,
        name: action.payload.name,
        category: action.payload.category,
        price: action.payload.price,
        cost,
        stock: action.payload.stock ?? 0,
        sku: action.payload.sku,
        supplier: action.payload.supplier,
        unitType: action.payload.unitType,
        packSize: action.payload.packSize,
        packPrice: action.payload.packPrice,
        singlePrice: action.payload.singlePrice,
        minStockLevel: action.payload.minStockLevel ?? 10,
        description: action.payload.description ?? '',
        createdAt: timestamp,
      };

      state.products.unshift(newProduct);
    },

    deleteProduct: (state, action: PayloadAction<number>) => {
      state.products = state.products.filter((product) => product.id !== action.payload);
    },

    updateSale: (state, action: PayloadAction<UpdateSalePayload>) => {
      const { id, ...updates } = action.payload;
      const saleIndex = state.sales.findIndex((s) => s.id === id);
      if (saleIndex !== -1) {
        state.sales[saleIndex] = { ...state.sales[saleIndex], ...updates };
      }
    },

    updatePurchase: (state, action: PayloadAction<UpdatePurchasePayload>) => {
      const { id, ...updates } = action.payload;
      const purchaseIndex = state.purchases.findIndex((p) => p.id === id);
      if (purchaseIndex !== -1) {
        state.purchases[purchaseIndex] = { ...state.purchases[purchaseIndex], ...updates };
      }
    },

    updateExpense: (state, action: PayloadAction<UpdateExpensePayload>) => {
      const { id, ...updates } = action.payload;
      const expenseIndex = state.expenses.findIndex((e) => e.id === id);
      if (expenseIndex !== -1) {
        state.expenses[expenseIndex] = { ...state.expenses[expenseIndex], ...updates };
      }
    },

    updateStoreInfo: (state, action: PayloadAction<UpdateStorePayload>) => {
      state.currentStore = { ...state.currentStore, ...action.payload };
    },

    bulkUpdateProducts: (state, action: PayloadAction<UpdateProductPayload[]>) => {
      action.payload.forEach((update) => {
        const productIndex = state.products.findIndex((p) => p.id === update.id);
        if (productIndex !== -1) {
          state.products[productIndex] = { ...state.products[productIndex], ...update };
        }
      });
    },

    adjustStock: (state, action: PayloadAction<AdjustStockPayload>) => {
      const { productId, adjustment } = action.payload;
      const product = state.products.find((p) => p.id === productId);
      if (product) {
        product.stock = Math.max(0, product.stock + adjustment);
      }
    },
  },
});

export const { 
  addSale, 
  updateProductStock, 
  addPurchase, 
  addExpense, 
  updateProduct,
  addProduct,
  deleteProduct,
  updateSale,
  updatePurchase,
  updateExpense,
  updateStoreInfo,
  bulkUpdateProducts,
  adjustStock
} = userSlice.actions;

export default userSlice.reducer;