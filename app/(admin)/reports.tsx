// app/(admin)/reports.js
import { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

const AdminReports = () => {
  const { sales, purchases, expenses, products } = useSelector(state => state.user);
  const { assets } = useSelector(state => state.assets);
  const { financialReports } = useSelector(state => state.accounting);
  
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('income');

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Calculate financial metrics
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalCost = purchases.reduce((sum, purchase) => sum + purchase.total, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const grossProfit = totalRevenue - totalCost;
  const netProfit = grossProfit - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const totalAssetsValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
  const totalInventoryValue = products.reduce((sum, product) => sum + (product.price * product.stock), 0);
  const totalAssetsPurchaseValue = assets.reduce((sum, asset) => sum + asset.purchaseValue, 0);
  const assetDepreciation = totalAssetsPurchaseValue - totalAssetsValue;
  
  const returnOnAssets = totalAssetsValue > 0 ? (netProfit / totalAssetsValue) * 100 : 0;
  const inventoryTurnover = totalCost > 0 && totalInventoryValue > 0 ? totalCost / totalInventoryValue : 0;
  
  const currentAssets = totalAssetsValue + totalInventoryValue;
  const currentLiabilities = totalExpenses;
  const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
  
  const operatingIncome = grossProfit - totalExpenses;
  const operatingMargin = totalRevenue > 0 ? (operatingIncome / totalRevenue) * 100 : 0;
  
  const expenseRatio = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0;
  const costOfGoodsSoldRatio = totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : 0;

  const averageTransactionValue = sales.length > 0 ? totalRevenue / sales.length : 0;
  const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const assetDepreciationRate = totalAssetsPurchaseValue > 0 ? (assetDepreciation / totalAssetsPurchaseValue) * 100 : 0;

  const StatCard = ({ title, value, description, isPositive = true, isCurrency = false }) => (
    <View className="bg-card rounded-lg p-4 shadow-sm mb-4">
      <Text className="text-sm font-medium text-muted-foreground mb-1">
        {title}
      </Text>
      <Text className={`text-xl font-bold ${
        typeof value === 'number' && value < 0 ? 'text-destructive' : 
        isPositive ? 'text-accent' : 'text-foreground'
      }`}>
        {isCurrency && typeof value === 'number' ? `$${value.toFixed(2)}` : 
         typeof value === 'number' ? `${value.toFixed(2)}${title.includes('Ratio') || title.includes('Margin') ? '%' : ''}` : value}
      </Text>
      {description && (
        <Text className="text-xs text-muted-foreground mt-1">
          {description}
        </Text>
      )}
    </View>
  );

  const MetricItem = ({ label, value, isPositive = true, isCurrency = false }) => (
    <View className="bg-secondary rounded-lg p-3 mb-2">
      <View className="flex-row justify-between items-center">
        <Text className="font-medium text-foreground text-sm flex-1">
          {label}
        </Text>
        <Text className={`font-bold text-base ${
          typeof value === 'number' && value < 0 ? 'text-destructive' : 
          isPositive ? 'text-accent' : 'text-foreground'
        }`}>
          {isCurrency && typeof value === 'number' ? `$${value.toFixed(2)}` : 
           typeof value === 'number' ? `${value.toFixed(2)}${label.includes('Ratio') || label.includes('Margin') || label.includes('Rate') ? '%' : ''}` : value}
        </Text>
      </View>
    </View>
  );

  const SectionHeader = ({ title, subtitle, icon }) => (
    <View className="flex-row items-center mb-4">
      <Ionicons name={icon} size={24} className="text-accent mr-3" />
      <View>
        <Text className="text-xl font-bold text-foreground">{title}</Text>
        <Text className="text-muted-foreground">{subtitle}</Text>
      </View>
    </View>
  );

  const renderIncomeStatement = () => (
    <View>
      <SectionHeader 
        title="Income Statement" 
        subtitle="Revenue, costs, and profitability"
        icon="trending-up"
      />
      <View className="flex-row flex-wrap justify-between">
        <View className="w-[48%]">
          <StatCard
            title="Total Revenue"
            value={totalRevenue}
            description="From all sales"
            isPositive={true}
            isCurrency={true}
          />
        </View>
        <View className="w-[48%]">
          <StatCard
            title="Cost of Goods"
            value={totalCost}
            description="Purchase costs"
            isPositive={false}
            isCurrency={true}
          />
        </View>
        <View className="w-[48%]">
          <StatCard
            title="Operating Expenses"
            value={totalExpenses}
            description="Business costs"
            isPositive={false}
            isCurrency={true}
          />
        </View>
        <View className="w-[48%]">
          <StatCard
            title="Gross Profit"
            value={grossProfit}
            description="Revenue - COGS"
            isPositive={true}
            isCurrency={true}
          />
        </View>
        <View className="w-[48%]">
          <StatCard
            title="Net Profit"
            value={netProfit}
            description="After all expenses"
            isPositive={netProfit >= 0}
            isCurrency={true}
          />
        </View>
        <View className="w-[48%]">
          <StatCard
            title="Profit Margin"
            value={profitMargin}
            description="Net profit percentage"
            isPositive={profitMargin >= 0}
            isCurrency={false}
          />
        </View>
        <View className="w-[48%]">
          <StatCard
            title="Operating Margin"
            value={operatingMargin}
            description="Operating income %"
            isPositive={operatingMargin >= 0}
            isCurrency={false}
          />
        </View>
        <View className="w-[48%]">
          <StatCard
            title="COGS Ratio"
            value={costOfGoodsSoldRatio}
            description="Cost vs revenue"
            isPositive={false}
            isCurrency={false}
          />
        </View>
        <View className="w-[48%]">
          <StatCard
            title="Expense Ratio"
            value={expenseRatio}
            description="Expenses vs revenue"
            isPositive={false}
            isCurrency={false}
          />
        </View>
      </View>
    </View>
  );

  const renderBalanceSheet = () => (
    <View>
      <SectionHeader 
        title="Balance Sheet" 
        subtitle="Assets, liabilities, and equity"
        icon="wallet"
      />
      <View className="flex-row flex-wrap justify-between">
        <View className="w-[48%]">
          <StatCard
            title="Total Assets Value"
            value={totalAssetsValue}
            description="Current asset worth"
            isPositive={true}
            isCurrency={true}
          />
        </View>
        <View className="w-[48%]">
          <StatCard
            title="Inventory Value"
            value={totalInventoryValue}
            description="Stock on hand"
            isPositive={true}
            isCurrency={true}
          />
        </View>
        <View className="w-[48%]">
          <StatCard
            title="Asset Depreciation"
            value={assetDepreciation}
            description="Value loss"
            isPositive={false}
            isCurrency={true}
          />
        </View>
        <View className="w-[48%]">
          <StatCard
            title="Current Ratio"
            value={currentRatio}
            description="Liquidity measure"
            isPositive={currentRatio >= 1}
            isCurrency={false}
          />
        </View>
      </View>
    </View>
  );

  const renderPerformanceMetrics = () => (
    <View>
      <SectionHeader 
        title="Performance Metrics" 
        subtitle="Key business indicators"
        icon="analytics"
      />
      <View className="flex-row flex-wrap justify-between">
        <View className="w-[48%] mb-4">
          <View className="bg-card rounded-lg p-4 shadow-sm">
            <Text className="text-lg font-bold text-foreground mb-3">Summary</Text>
            <MetricItem
              label="Total Transactions"
              value={sales.length}
              isPositive={true}
            />
            <MetricItem
              label="Total Purchase Orders"
              value={purchases.length}
              isPositive={true}
            />
            <MetricItem
              label="Total Expense Records"
              value={expenses.length}
              isPositive={true}
            />
          </View>
        </View>
        
        <View className="w-[48%] mb-4">
          <View className="bg-card rounded-lg p-4 shadow-sm">
            <Text className="text-lg font-bold text-foreground mb-3">Performance</Text>
            <MetricItem
              label="Avg Transaction Value"
              value={averageTransactionValue}
              isPositive={true}
              isCurrency={true}
            />
            <MetricItem
              label="Return on Assets (ROA)"
              value={returnOnAssets}
              isPositive={returnOnAssets >= 0}
            />
            <MetricItem
              label="Inventory Turnover"
              value={inventoryTurnover}
              isPositive={true}
            />
            <MetricItem
              label="Gross Profit Margin"
              value={grossProfitMargin}
              isPositive={true}
            />
          </View>
        </View>

        <View className="w-[48%]">
          <View className="bg-card rounded-lg p-4 shadow-sm">
            <Text className="text-lg font-bold text-foreground mb-3">Asset Overview</Text>
            <MetricItem
              label="Number of Assets"
              value={assets.length}
              isPositive={true}
            />
            <MetricItem
              label="Number of Products"
              value={products.length}
              isPositive={true}
            />
            <MetricItem
              label="Total Current Assets"
              value={currentAssets}
              isPositive={true}
              isCurrency={true}
            />
            <MetricItem
              label="Asset Depreciation Rate"
              value={assetDepreciationRate}
              isPositive={false}
            />
          </View>
        </View>
      </View>
    </View>
  );

  const renderFinancialRatios = () => (
    <View>
      <SectionHeader 
        title="Financial Ratios" 
        subtitle="Business health indicators"
        icon="calculator"
      />
      <View className="flex-row flex-wrap justify-between">
        <View className="w-[48%] mb-4">
          <View className="bg-card rounded-lg p-4 shadow-sm">
            <Text className="text-lg font-bold text-foreground mb-3">Profitability</Text>
            <MetricItem
              label="Net Profit Margin"
              value={profitMargin}
              isPositive={profitMargin >= 0}
            />
            <MetricItem
              label="Operating Margin"
              value={operatingMargin}
              isPositive={operatingMargin >= 0}
            />
            <MetricItem
              label="Gross Margin"
              value={grossProfitMargin}
              isPositive={true}
            />
          </View>
        </View>
        
        <View className="w-[48%] mb-4">
          <View className="bg-card rounded-lg p-4 shadow-sm">
            <Text className="text-lg font-bold text-foreground mb-3">Efficiency</Text>
            <MetricItem
              label="Inventory Turnover"
              value={inventoryTurnover}
              isPositive={true}
            />
            <MetricItem
              label="Asset Turnover"
              value={totalRevenue > 0 ? totalRevenue / totalAssetsValue : 0}
              isPositive={true}
            />
            <MetricItem
              label="Expense Ratio"
              value={expenseRatio}
              isPositive={false}
            />
          </View>
        </View>

        <View className="w-[48%]">
          <View className="bg-card rounded-lg p-4 shadow-sm">
            <Text className="text-lg font-bold text-foreground mb-3">Liquidity</Text>
            <MetricItem
              label="Current Ratio"
              value={currentRatio}
              isPositive={currentRatio >= 1}
            />
            <MetricItem
              label="Quick Ratio"
              value={currentLiabilities > 0 ? (currentAssets - totalInventoryValue) / currentLiabilities : 0}
              isPositive={true}
            />
            <MetricItem
              label="Working Capital"
              value={currentAssets - currentLiabilities}
              isPositive={true}
              isCurrency={true}
            />
          </View>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#FB923C" />
        <Text className="text-muted-foreground mt-4">Loading reports...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="bg-card p-4 border-b border-border">
        <Text className="text-2xl font-bold text-foreground">Reports</Text>
        <Text className="text-muted-foreground">Financial reports and analytics</Text>
      </View>

      {/* Section Navigation */}
    <View>
      
        <ScrollView 
      horizontal showsHorizontalScrollIndicator={false}
        className=" border-b border-border bg-card h-fit flex flex-row px-4 py-2 ">
          {[
            { key: 'income', label: 'Income', icon: 'trending-up' },
            { key: 'balance', label: 'Balance Sheet', icon: 'wallet' },
            { key: 'performance', label: 'Performance', icon: 'analytics' },
            { key: 'ratios', label: 'Ratios', icon: 'calculator' },
          ].map((section) => (
            <TouchableOpacity
              key={section.key}
              className={`px-4 py-2 rounded-full h-fit w-fit flex-row items-center ${
                activeSection === section.key ? 'bg-accent' : 'bg-transparent'
              }`}
              onPress={() => setActiveSection(section.key)}
            >
              <Ionicons 
                name={section.icon} 
                size={16} 
                className={
                  activeSection === section.key ? 'text-accent-foreground mr-2' : 'text-muted-foreground mr-2'
                } 
              />
              <Text className={
                activeSection === section.key 
                  ? 'text-accent-foreground font-semibold' 
                  : 'text-muted-foreground'
              }>
                {section.label}
              </Text>
            </TouchableOpacity>
          ))}
        
      </ScrollView>
      
    </View>

      {/* Content */}
      <ScrollView className="flex-1 p-4">
        <View className="space-y-6">
          {activeSection === 'income' && renderIncomeStatement()}
          {activeSection === 'balance' && renderBalanceSheet()}
          {activeSection === 'performance' && renderPerformanceMetrics()}
          {activeSection === 'ratios' && renderFinancialRatios()}
        </View>

        {/* Quick Stats Footer */}
        <View className="bg-primary rounded-lg p-4 mt-6">
          <Text className="text-lg font-semibold text-primary-foreground mb-3">
            Quick Financial Overview
          </Text>
          <View className="flex-row flex-wrap justify-between">
            <View className="mb-3 w-[48%]">
              <Text className="text-accent text-sm">Monthly Revenue</Text>
              <Text className="text-primary-foreground text-lg font-bold">
                ${(totalRevenue / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </Text>
            </View>
            <View className="mb-3 w-[48%]">
              <Text className="text-accent text-sm">Monthly Profit</Text>
              <Text className="text-primary-foreground text-lg font-bold">
                ${(netProfit / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </Text>
            </View>
            <View className="mb-3 w-[48%]">
              <Text className="text-accent text-sm">Active Products</Text>
              <Text className="text-primary-foreground text-lg font-bold">
                {products.length}
              </Text>
            </View>
            <View className="mb-3 w-[48%]">
              <Text className="text-accent text-sm">Business Health</Text>
              <Text className={`text-lg font-bold ${
                profitMargin > 20 ? 'text-green-400' : 
                profitMargin > 10 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {profitMargin > 20 ? 'Excellent' : profitMargin > 10 ? 'Good' : 'Needs Attention'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default AdminReports;