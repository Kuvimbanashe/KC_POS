// store/slices/userSlice.js
import { createSlice } from '@reduxjs/toolkit';

// Mock data for the application
const mockUsers = [
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
const mockProducts = Array.from({ length: 25 }, (_, i) => {
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
    unitType: ['single', 'pack', 'both'][i % 3],
    packSize: [6, 12, 24, 48, 100][i % 5],
    minStockLevel: 10,
    description: `High-quality ${category.name.toLowerCase()} product from ${brand}`,
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
  };
});

// Enhanced mock sales with realistic data
const mockSales = Array.from({ length: 25 }, (_, i) => {
  const product = mockProducts[i % 25];
  const quantity = Math.floor(Math.random() * 5) + 1;
  const price = product.price * (0.8 + Math.random() * 0.4); // Some variation in selling price
  const total = quantity * price;
  
  return {
    id: i + 1,
    productId: product.id,
    productName: product.name,
    quantity: quantity,
    price: parseFloat(price.toFixed(2)),
    date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    cashier: ['Jane Cashier', 'Mike Johnson', 'Sarah Wilson', 'David Brown'][i % 4],
    total: parseFloat(total.toFixed(2)),
    paymentMethod: ['Cash', 'Card', 'Mobile Payment'][i % 3],
    customer: `Customer ${(i % 50) + 1}`,
    invoiceNumber: `INV${(1000 + i).toString().padStart(4, '0')}`
  };
});

// Enhanced mock purchases with realistic data
const mockPurchases = Array.from({ length: 25 }, (_, i) => {
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
    supplier: product.supplier,
    orderNumber: `PO${(500 + i).toString().padStart(4, '0')}`,
    status: ['Completed', 'Completed', 'Completed', 'Pending'][i % 4],
    deliveryDate: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString()
  };
});

// Enhanced mock expenses with realistic data
const mockExpenses = Array.from({ length: 25 }, (_, i) => {
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
    paymentMethod: ['Bank Transfer', 'Cash', 'Check', 'Online Payment'][i % 4],
    vendor: ['Property Management Co.', 'Utility Company', 'Staff Payments', 'Repair Services Ltd.', 'Marketing Agency'][i % 5],
    status: ['Paid', 'Paid', 'Paid', 'Pending'][i % 4],
    receiptNumber: `RCPT${(200 + i).toString().padStart(4, '0')}`
  };
});

const initialState = {
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

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    addSale: (state, action) => {
      const newSale = {
        ...action.payload,
        id: Math.max(...state.sales.map(s => s.id)) + 1,
        date: new Date().toISOString(),
        invoiceNumber: `INV${(1000 + state.sales.length).toString().padStart(4, '0')}`
      };
      state.sales.unshift(newSale);
      
      // Update product stock
      const product = state.products.find(p => p.id === action.payload.productId);
      if (product) {
        product.stock -= action.payload.quantity;
      }
    },
    
    updateProductStock: (state, action) => {
      const { productId, quantity } = action.payload;
      const product = state.products.find(p => p.id === productId);
      if (product) {
        product.stock -= quantity;
      }
    },
    
    addPurchase: (state, action) => {
      const newPurchase = {
        ...action.payload,
        id: Math.max(...state.purchases.map(p => p.id)) + 1,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        orderNumber: `PO${(500 + state.purchases.length).toString().padStart(4, '0')}`,
        status: 'Completed'
      };
      state.purchases.unshift(newPurchase);
      
      // Update product stock
      const product = state.products.find(p => p.id === action.payload.productId);
      if (product) {
        product.stock += action.payload.quantity;
        
        // Also update product supplier if provided in purchase
        if (action.payload.supplier && !product.supplier) {
          product.supplier = action.payload.supplier;
        }
        
        // Update product cost if provided
        if (action.payload.unitCost) {
          product.cost = action.payload.unitCost;
        }
      }
    },
    
    addExpense: (state, action) => {
      const newExpense = {
        ...action.payload,
        id: Math.max(...state.expenses.map(e => e.id)) + 1,
        date: new Date().toISOString(),
        receiptNumber: `RCPT${(200 + state.expenses.length).toString().padStart(4, '0')}`,
        status: 'Paid'
      };
      state.expenses.unshift(newExpense);
    },
    
    updateProduct: (state, action) => {
      const { id, ...updates } = action.payload;
      const productIndex = state.products.findIndex(p => p.id === id);
      if (productIndex !== -1) {
        state.products[productIndex] = { ...state.products[productIndex], ...updates };
      }
    },
    
    // Additional useful actions
    addProduct: (state, action) => {
      const newProduct = {
        ...action.payload,
        id: Math.max(...state.products.map(p => p.id)) + 1,
        stock: action.payload.stock || 0,
        cost: action.payload.cost || action.payload.price * 0.6, // Default cost at 60% of price
        sku: action.payload.sku || `SKU${Date.now()}`,
        minStockLevel: action.payload.minStockLevel || 10,
        createdAt: new Date().toISOString()
      };
      state.products.unshift(newProduct);
    },
    
    deleteProduct: (state, action) => {
      state.products = state.products.filter(product => product.id !== action.payload);
    },
    
    updateSale: (state, action) => {
      const { id, ...updates } = action.payload;
      const saleIndex = state.sales.findIndex(s => s.id === id);
      if (saleIndex !== -1) {
        state.sales[saleIndex] = { ...state.sales[saleIndex], ...updates };
      }
    },
    
    updatePurchase: (state, action) => {
      const { id, ...updates } = action.payload;
      const purchaseIndex = state.purchases.findIndex(p => p.id === id);
      if (purchaseIndex !== -1) {
        state.purchases[purchaseIndex] = { ...state.purchases[purchaseIndex], ...updates };
      }
    },
    
    updateExpense: (state, action) => {
      const { id, ...updates } = action.payload;
      const expenseIndex = state.expenses.findIndex(e => e.id === id);
      if (expenseIndex !== -1) {
        state.expenses[expenseIndex] = { ...state.expenses[expenseIndex], ...updates };
      }
    },
    
    // Store management
    updateStoreInfo: (state, action) => {
      state.currentStore = { ...state.currentStore, ...action.payload };
    },
    
    // Bulk operations
    bulkUpdateProducts: (state, action) => {
      action.payload.forEach(update => {
        const productIndex = state.products.findIndex(p => p.id === update.id);
        if (productIndex !== -1) {
          state.products[productIndex] = { ...state.products[productIndex], ...update };
        }
      });
    },
    
    // Inventory management
    adjustStock: (state, action) => {
      const { productId, adjustment, reason } = action.payload;
      const product = state.products.find(p => p.id === productId);
      if (product) {
        product.stock += adjustment;
        
        // Log the adjustment (you might want to add an adjustments array to track this)
        console.log(`Stock adjusted for ${product.name}: ${adjustment > 0 ? '+' : ''}${adjustment} (${reason})`);
      }
    }
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