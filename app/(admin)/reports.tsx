// app/(admin)/reports.js
import { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { StyleSheet } from 'react-native';
import { useAppSelector } from '../../store/hooks';
import { Ionicons } from '@expo/vector-icons';

const AdminReports = () => {
  const { sales, purchases, expenses, products } = useAppSelector(state => state.user);
  const { assets } = useAppSelector(state => state.assets);
  const { financialReports } = useAppSelector(state => state.accounting);
  
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

  const StatCard = ({ title, value, description, isPositive = true, isCurrency = false }: { title: string, value: number, description: string, isPositive: boolean, isCurrency: boolean }) => (
    <View style={styles.s_1}>
      <View>
          <Text style={styles.s_2}>
          {title}
        </Text>
        
              {description && (
        <Text style={styles.s_3}>
          {description}
        </Text>
      )}
      </View>
      
      <Text className={`text-xl font-bold ${
        typeof value === 'number' && value < 0 ? 'text-destructive' : 
        isPositive ? 'text-accent' : 'text-foreground'
      }`}>
        {isCurrency && typeof value === 'number' ? `$${value.toFixed(2)}` : 
         typeof value === 'number' ? `${value.toFixed(2)}${title.includes('Ratio') || title.includes('Margin') ? '%' : ''}` : value}
      </Text>

    </View>
  );

  const MetricItem = ({ label, value, isPositive = true, isCurrency = false }: { label: string, value: number, isPositive: boolean, isCurrency: boolean }) => (
    <View style={styles.s_4}>
      <View style={styles.s_5}>
        <Text style={styles.s_6}>
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

  const SectionHeader = ({ title, subtitle, icon }: { title: string, subtitle: string, icon: keyof typeof Ionicons.glyphMap }) => (
    <View style={styles.s_7}>
      <Ionicons name={icon} size={24} style={styles.s_8} />
      <View>
        <Text style={styles.s_9}>{title}</Text>
        <Text style={styles.s_10}>{subtitle}</Text>
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
      <View style={styles.s_11}>
        <View style={styles.s_12}>
          <StatCard
            title="Total Revenue"
            value={totalRevenue}
            description="From all sales"
            isPositive={true}
            isCurrency={true}
          />
        </View>
        <View style={styles.s_12}>
          <StatCard
            title="Cost of Goods"
            value={totalCost}
            description="Purchase costs"
            isPositive={false}
            isCurrency={true}
          />
        </View>
        <View style={styles.s_12}>
          <StatCard
            title="Operating Expenses"
            value={totalExpenses}
            description="Business costs"
            isPositive={false}
            isCurrency={true}
          />
        </View>
        <View style={styles.s_12}>
          <StatCard
            title="Gross Profit"
            value={grossProfit}
            description="Revenue - COGS"
            isPositive={true}
            isCurrency={true}
          />
        </View>
        <View style={styles.s_12}>
          <StatCard
            title="Net Profit"
            value={netProfit}
            description="After all expenses"
            isPositive={netProfit >= 0}
            isCurrency={true}
          />
        </View>
        <View style={styles.s_12}>
          <StatCard
            title="Profit Margin"
            value={profitMargin}
            description="Net profit percentage"
            isPositive={profitMargin >= 0}
            isCurrency={false}
          />
        </View>
        <View style={styles.s_12}>
          <StatCard
            title="Operating Margin"
            value={operatingMargin}
            description="Operating income %"
            isPositive={operatingMargin >= 0}
            isCurrency={false}
          />
        </View>
        <View style={styles.s_12}>
          <StatCard
            title="COGS Ratio"
            value={costOfGoodsSoldRatio}
            description="Cost vs revenue"
            isPositive={false}
            isCurrency={false}
          />
        </View>
        <View style={styles.s_12}>
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
      <View className="flex-col w-full  ">
        <View style={styles.s_12}>
          <StatCard
            title="Total Assets Value"
            value={totalAssetsValue}
            description="Current asset worth"
            isPositive={true}
            isCurrency={true}
          />
        </View>
        <View style={styles.s_12}>
          <StatCard
            title="Inventory Value"
            value={totalInventoryValue}
            description="Stock on hand"
            isPositive={true}
            isCurrency={true}
          />
        </View>
        <View style={styles.s_12}>
          <StatCard
            title="Asset Depreciation"
            value={assetDepreciation}
            description="Value loss"
            isPositive={false}
            isCurrency={true}
          />
        </View>
        <View style={styles.s_12}>
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
      <View style={styles.s_13}>
        <View style={styles.s_14}>
          <View style={styles.s_15}>
            <Text style={styles.s_16}>Summary</Text>
            <MetricItem
              label="Total Transactions"
              value={sales.length}
              isPositive={true}
              isCurrency={false}
            />
            <MetricItem
              label="Total Purchase Orders"
              value={purchases.length}
              isPositive={true}
              isCurrency={false}
            />
            <MetricItem
              label="Total Expense Records"
              value={expenses.length}
              isPositive={true}
              isCurrency={false}
            />
          </View>
        </View>
        
        <View style={styles.s_14}>
          <View style={styles.s_15}>
            <Text style={styles.s_16}>Performance</Text>
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
              isCurrency={false}
            />
            <MetricItem
              label="Inventory Turnover"
              value={inventoryTurnover}
              isPositive={true}
              isCurrency={false}
            
            />
            <MetricItem
              label="Gross Profit Margin"
              value={grossProfitMargin}
              isPositive={true}
              isCurrency={false}
              />
          </View>
        </View>

        <View style={styles.s_12}>
          <View style={styles.s_15}>
            <Text style={styles.s_16}>Asset Overview</Text>
            <MetricItem
              label="Number of Assets"
              value={assets.length}
              isPositive={true}
              isCurrency={false}
            />
            <MetricItem
              label="Number of Products"
              value={products.length}
              isCurrency={false}
              isPositive={true}
              
              />
            <MetricItem
              label="Total Current Assets"
              value={currentAssets}
              isCurrency={true}
              isPositive={true}
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
      <View className="flex-col w-full ">
        <View style={styles.s_14}>
          <View style={styles.s_15}>
            <Text style={styles.s_16}>Profitability</Text>
            <MetricItem
              label="Net Profit Margin"
              value={profitMargin}
              isPositive={profitMargin >= 0}
              isCurrency={false}
            />
            <MetricItem
              label="Operating Margin"
              value={operatingMargin}
              isPositive={operatingMargin >= 0}
              isCurrency={false}
            />
            <MetricItem
              label="Gross Margin"
              value={grossProfitMargin}
              isPositive={true}
              isCurrency={false}
            />
          </View>
        </View>
        
        <View style={styles.s_14}>
          <View style={styles.s_15}>
            <Text style={styles.s_16}>Efficiency</Text>
            <MetricItem
              label="Inventory Turnover"
              value={inventoryTurnover}
              isPositive={true}
              isCurrency={false}
            />
            <MetricItem
              label="Asset Turnover"
              value={totalRevenue > 0 ? totalRevenue / totalAssetsValue : 0}
              isPositive={true}
              isCurrency={false}
              />
            <MetricItem
              label="Expense Ratio"
              value={expenseRatio}
              isPositive={false}
              isCurrency={false}
              />
          </View>
        </View>

        <View style={styles.s_12}>
          <View style={styles.s_15}>
            <Text style={styles.s_16}>Liquidity</Text>
            <MetricItem
              label="Current Ratio"
              value={currentRatio}
              isPositive={currentRatio >= 1}
              isCurrency={false}
              />
            <MetricItem
              label="Quick Ratio"
              value={currentLiabilities > 0 ? (currentAssets - totalInventoryValue) / currentLiabilities : 0}
              isPositive={true}
              isCurrency={false}
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
      <View style={styles.s_17}>
        <ActivityIndicator size="large" color="#FB923C" />
        <Text style={styles.s_18}>Loading reports...</Text>
      </View>
    );
  }

  return (
    <View style={styles.s_19}>
      {/* Header */}
      <View style={styles.s_20}>
        <Text style={styles.s_21}>Reports</Text>
        <Text style={styles.s_10}>Financial reports and analytics</Text>
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
                name={section.icon as keyof typeof Ionicons.glyphMap} 
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
      <ScrollView style={styles.s_23}>
        <View style={styles.s_24}>
          {activeSection === 'income' && renderIncomeStatement()}
          {activeSection === 'balance' && renderBalanceSheet()}
          {activeSection === 'performance' && renderPerformanceMetrics()}
          {activeSection === 'ratios' && renderFinancialRatios()}
        </View>

        {/* Quick Stats Footer */}
        <View style={styles.s_25}>
          <Text style={styles.s_26}>
            Quick Financial Overview
          </Text>
          <View style={styles.s_27}>
            <View style={styles.s_28}>
              <Text style={styles.s_29}>Monthly Revenue</Text>
              <Text style={styles.s_30}>
                ${(totalRevenue / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </Text>
            </View>
            <View style={styles.s_28}>
              <Text style={styles.s_29}>Monthly Profit</Text>
              <Text style={styles.s_30}>
                ${(netProfit / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </Text>
            </View>
            <View style={styles.s_28}>
              <Text style={styles.s_29}>Active Products</Text>
              <Text style={styles.s_30}>
                {products.length}
              </Text>
            </View>
            <View style={styles.s_28}>
              <Text style={styles.s_29}>Business Health</Text>
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



const styles = StyleSheet.create({
  s_1: {
  borderRadius: 12,
  padding: 16,
  marginBottom: 16,
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between"
},

  s_2: {
  fontSize: 14,
  fontWeight: "600",
  color: "#6b7280"
},

  s_3: {
  fontSize: 12,
  color: "#6b7280"
},

  s_4: {
  backgroundColor: "#f3f4f6",
  borderRadius: 12,
  padding: 12,
  marginBottom: 8
},

  s_5: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center"
},

  s_6: {
  fontWeight: "600",
  color: "#0f172a",
  fontSize: 14,
  flex: 1
},

  s_7: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 16
},

  s_8: {
  color: "#f97316"
},

  s_9: {
  fontSize: 20,
  fontWeight: "700",
  color: "#0f172a"
},

  s_10: {
  color: "#6b7280"
},

  s_11: {},

  s_12: {
  width: "100%"
},

  s_13: {
  flexDirection: "column",
  width: "100%"
},

  s_14: {
  width: "100%",
  marginBottom: 16
},

  s_15: {
  backgroundColor: "#ffffff",
  borderRadius: 12,
  padding: 16,
  borderWidth: 1,
  borderColor: "#e6edf3"
},

  s_16: {
  fontSize: 18,
  fontWeight: "700",
  color: "#0f172a",
  marginBottom: 12
},

  s_17: {
  flex: 1,
  backgroundColor: "#ffffff",
  justifyContent: "center",
  alignItems: "center"
},

  s_18: {
  color: "#6b7280",
  marginTop: 16
},

  s_19: {
  flex: 1,
  backgroundColor: "#ffffff"
},

  s_20: {
  backgroundColor: "#ffffff",
  padding: 16,
  borderColor: "#e6edf3"
},

  s_21: {
  fontSize: 24,
  fontWeight: "700",
  color: "#0f172a"
},

  s_22: {
  borderColor: "#e6edf3",
  backgroundColor: "#ffffff",
  display: "flex",
  flexDirection: "row",
  paddingHorizontal: 16
},

  s_23: {
  flex: 1,
  padding: 16
},

  s_24: {},

  s_25: {
  backgroundColor: "#0f172a",
  borderRadius: 12,
  padding: 16
},

  s_26: {
  fontSize: 18,
  color: "#ffffff",
  marginBottom: 12
},

  s_27: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between"
},

  s_28: {
  marginBottom: 12,
  width: "48%"
},

  s_29: {
  color: "#f97316",
  fontSize: 14
},

  s_30: {
  color: "#ffffff",
  fontSize: 18,
  fontWeight: "700"
}
});
export default AdminReports;