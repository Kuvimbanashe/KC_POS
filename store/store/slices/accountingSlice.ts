// store/slices/accountingSlice.js
import { createSlice } from '@reduxjs/toolkit';

// Enhanced mock data with accounting records
const mockChartOfAccounts = [
  { id: 1, code: '1000', name: 'Cash', type: 'asset', category: 'current_asset' },
  { id: 2, code: '1100', name: 'Accounts Receivable', type: 'asset', category: 'current_asset' },
  { id: 3, code: '1200', name: 'Inventory', type: 'asset', category: 'current_asset' },
  { id: 4, code: '2000', name: 'Accounts Payable', type: 'liability', category: 'current_liability' },
  { id: 5, code: '3000', name: 'Owner\'s Equity', type: 'equity', category: 'equity' },
  { id: 6, code: '4000', name: 'Sales Revenue', type: 'revenue', category: 'revenue' },
  { id: 7, code: '5000', name: 'Cost of Goods Sold', type: 'expense', category: 'cogs' },
  { id: 8, code: '6000', name: 'Operating Expenses', type: 'expense', category: 'operating' },
  { id: 9, code: '7000', name: 'Other Income', type: 'revenue', category: 'other_income' },
];

const mockJournalEntries = Array.from({ length: 50 }, (_, i) => {
  const date = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);
  const types = ['sale', 'purchase', 'expense', 'adjustment'];
  const type = types[i % 4];
  
  return {
    id: i + 1,
    date: date.toISOString(),
    reference: `JE${1000 + i}`,
    description: `Journal Entry ${i + 1}`,
    type: type,
    entries: [
      {
        accountCode: type === 'sale' ? '4000' : '5000',
        debit: type === 'sale' ? 0 : Math.floor(Math.random() * 1000) + 100,
        credit: type === 'sale' ? Math.floor(Math.random() * 1000) + 100 : 0,
      },
      {
        accountCode: '1000',
        debit: type === 'sale' ? Math.floor(Math.random() * 1000) + 100 : 0,
        credit: type === 'sale' ? 0 : Math.floor(Math.random() * 1000) + 100,
      }
    ],
    total: Math.floor(Math.random() * 1000) + 100,
  };
});

const mockFinancialReports = {
  balanceSheet: {
    assets: {
      current_assets: 150000,
      fixed_assets: 80000,
      total_assets: 230000,
    },
    liabilities: {
      current_liabilities: 50000,
      long_term_liabilities: 30000,
      total_liabilities: 80000,
    },
    equity: {
      capital: 120000,
      retained_earnings: 30000,
      total_equity: 150000,
    },
  },
  incomeStatement: {
    revenue: 200000,
    cogs: 80000,
    gross_profit: 120000,
    operating_expenses: 40000,
    net_income: 80000,
  },
  cashFlow: {
    operating: 65000,
    investing: -15000,
    financing: -10000,
    net_cash_flow: 40000,
  },
};

const initialState = {
  chartOfAccounts: mockChartOfAccounts,
  journalEntries: mockJournalEntries,
  financialReports: mockFinancialReports,
  taxRates: {
    vat: 0.16,
    corporate_tax: 0.30,
  },
  fiscalYear: {
    start: '2024-01-01',
    end: '2024-12-31',
  },
};

const accountingSlice = createSlice({
  name: 'accounting',
  initialState,
  reducers: {
    addJournalEntry: (state, action) => {
      state.journalEntries.unshift(action.payload);
    },
    updateFinancialReports: (state, action) => {
      state.financialReports = action.payload;
    },
    addAccount: (state, action) => {
      state.chartOfAccounts.push(action.payload);
    },
  },
});

export const { addJournalEntry, updateFinancialReports, addAccount } = accountingSlice.actions;
export default accountingSlice.reducer;