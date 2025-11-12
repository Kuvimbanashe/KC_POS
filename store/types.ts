export type UserRole = 'admin' | 'cashier';

export type UserStatus = 'active' | 'inactive';

export type Permission =
  | 'sales'
  | 'inventory'
  | 'inventory_view'
  | 'inventory_manage'
  | 'reports'
  | 'reports_view'
  | 'reports_export'
  | 'users_view'
  | 'users_manage'
  | 'settings'
  | 'returns'
  | 'all';

export interface UserProfile {
  id: number;
  email: string;
  password: string;
  name: string;
  type: UserRole;
  phone?: string;
  address?: string;
  joinDate?: string;
  status?: UserStatus;
  permissions?: Permission[];
  lastLogin?: string | null;
}

export interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  userType: UserRole | null;
  isLoading: boolean;
  sessionExpiry: string | null;
}

export type UnitType = 'single' | 'pack' | 'both';

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  sku: string;
  supplier?: string;
  unitType: UnitType;
  packSize?: number;
  packPrice?: number;
  singlePrice?: number;
  minStockLevel: number;
  description: string;
  createdAt: string;
}

export interface SaleItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
  unitType: UnitType;
  packSize?: number;
}

export type PaymentMethod = 'Cash' | 'Card' | 'Mobile Payment';

export interface SaleRecord {
  id: number;
  date: string;
  cashier: string;
  total: number;
  paymentMethod: PaymentMethod;
  invoiceNumber: string;
  productId?: number;
  productName?: string;
  quantity?: number;
  price?: number;
  customer?: string;
  items?: SaleItem[];
}

export interface PurchaseRecord {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitCost: number;
  total: number;
  date: string;
  supplier: string;
  orderNumber: string;
  status: 'Completed' | 'Pending';
  deliveryDate: string;
  createdAt: string;
}

export interface ExpenseRecord {
  id: number;
  category: string;
  amount: number;
  date: string;
  description: string;
  paymentMethod: 'Bank Transfer' | 'Cash' | 'Check' | 'Online Payment';
  vendor: string;
  status: 'Paid' | 'Pending';
  receiptNumber: string;
}

export interface StoreInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxId: string;
  currency: string;
  openingTime: string;
  closingTime: string;
  timezone: string;
}

export interface UserState {
  users: UserProfile[];
  products: Product[];
  sales: SaleRecord[];
  purchases: PurchaseRecord[];
  expenses: ExpenseRecord[];
  currentStore: StoreInfo;
}

export interface AssetsState {
  assets: AssetRecord[];
}

export interface AssetRecord {
  id: number;
  name: string;
  category: string;
  purchaseValue: number;
  currentValue: number;
  purchaseDate: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  location: string;
  createdAt: string;
}

export interface RoleDefinition {
  id: number;
  name: string;
  permissions: Permission[];
}

export interface UserManagementState {
  users: UserProfile[];
  roles: RoleDefinition[];
  permissions: Permission[];
}

export interface ChartOfAccount {
  id: number;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  category: string;
}

export interface JournalEntryLine {
  accountCode: string;
  debit: number;
  credit: number;
}

export type JournalEntryType = 'sale' | 'purchase' | 'expense' | 'adjustment';

export interface JournalEntry {
  id: number;
  date: string;
  reference: string;
  description: string;
  type: JournalEntryType;
  entries: JournalEntryLine[];
  total: number;
}

export interface FinancialReports {
  balanceSheet: {
    assets: {
      current_assets: number;
      fixed_assets: number;
      total_assets: number;
    };
    liabilities: {
      current_liabilities: number;
      long_term_liabilities: number;
      total_liabilities: number;
    };
    equity: {
      capital: number;
      retained_earnings: number;
      total_equity: number;
    };
  };
  incomeStatement: {
    revenue: number;
    cogs: number;
    gross_profit: number;
    operating_expenses: number;
    net_income: number;
  };
  cashFlow: {
    operating: number;
    investing: number;
    financing: number;
    net_cash_flow: number;
  };
}

export interface AccountingState {
  chartOfAccounts: ChartOfAccount[];
  journalEntries: JournalEntry[];
  financialReports: FinancialReports;
  taxRates: {
    vat: number;
    corporate_tax: number;
  };
  fiscalYear: {
    start: string;
    end: string;
  };
}

