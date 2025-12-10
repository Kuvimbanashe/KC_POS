import { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { StyleSheet } from 'react-native';
import { useAppSelector } from '../../store/hooks';
import { Ionicons } from '@expo/vector-icons';

interface StatCardProps {
  title: string;
  value: number;
  description: string;
  isPositive?: boolean;
  isCurrency?: boolean;
}

interface MetricItemProps {
  label: string;
  value: number;
  isPositive?: boolean;
  isCurrency?: boolean;
}

interface SectionHeaderProps {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const AdminReports = () => {
  const { sales, purchases, expenses, products } = useAppSelector(state => state.user);
  const { assets } = useAppSelector(state => state.assets);
  const { financialReports } = useAppSelector(state => state.accounting);
  
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('income');

  // Colors based on your Tailwind config
  const COLORS = {
    primary: '#0f172a', // hsl(220 90% 15%)
    primaryLight: '#1e293b',
    accent: '#f97316', // hsl(25 95% 53%)
    accentLight: '#fb923c',
    background: '#ffffff',
    card: '#ffffff',
    border: '#e2e8f0', // hsl(220 20% 90%)
    input: '#e2e8f0',
    destructive: '#ef4444',
    muted: '#64748b', // hsl(220 30% 45%)
    mutedLight: '#f1f5f9', // hsl(220 20% 95%)
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#dc2626',
  };

  useEffect(() => {
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

  // Navigation sections
  const sections = [
    { key: 'income', label: 'Income', icon: 'trending-up' as const },
    { key: 'balance', label: 'Balance', icon: 'wallet' as const },
    { key: 'performance', label: 'Performance', icon: 'analytics' as const },
    { key: 'ratios', label: 'Ratios', icon: 'calculator' as const },
  ];

  // Stat Card Component
  const StatCard = ({ title, value, description, isPositive = true, isCurrency = false }: StatCardProps) => {
    const valueColor = typeof value === 'number' && value < 0 ? COLORS.danger : 
                      isPositive ? COLORS.accent : COLORS.primary;
    
    const formattedValue = isCurrency ? `$${Math.abs(value).toFixed(2)}` :
                           title.includes('Ratio') || title.includes('Margin') || title.includes('Rate') ? 
                           `${value.toFixed(1)}%` : value.toFixed(2);

    return (
      <View style={[styles.statCard, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}>
        <View>
          <Text style={[styles.statCardTitle, { color: COLORS.muted }]}>{title}</Text>
          {description && (
            <Text style={[styles.statCardDescription, { color: COLORS.muted }]}>{description}</Text>
          )}
        </View>
        <Text style={[styles.statCardValue, { color: valueColor }]}>
          {formattedValue}
        </Text>
      </View>
    );
  };

  // Metric Item Component
  const MetricItem = ({ label, value, isPositive = true, isCurrency = false }: MetricItemProps) => {
    const valueColor = typeof value === 'number' && value < 0 ? COLORS.danger : 
                      isPositive ? COLORS.accent : COLORS.primary;
    
    const formattedValue = isCurrency ? `$${Math.abs(value).toFixed(2)}` :
                           label.includes('Ratio') || label.includes('Margin') || label.includes('Rate') ? 
                           `${value.toFixed(1)}%` : value.toFixed(2);

    return (
      <View style={[styles.metricItem, { backgroundColor: COLORS.mutedLight }]}>
        <Text style={[styles.metricLabel, { color: COLORS.primary }]}>{label}</Text>
        <Text style={[styles.metricValue, { color: valueColor }]}>{formattedValue}</Text>
      </View>
    );
  };

  // Section Header Component
  const SectionHeader = ({ title, subtitle, icon }: SectionHeaderProps) => (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIcon, { backgroundColor: `${COLORS.accent}20` }]}>
        <Ionicons name={icon} size={24} color={COLORS.accent} />
      </View>
      <View style={styles.sectionTitleContainer}>
        <Text style={[styles.sectionTitle, { color: COLORS.primary }]}>{title}</Text>
        <Text style={[styles.sectionSubtitle, { color: COLORS.muted }]}>{subtitle}</Text>
      </View>
    </View>
  );

  // Income Statement Section
  const renderIncomeStatement = () => (
    <View style={styles.sectionContainer}>
      <SectionHeader 
        title="Income Statement" 
        subtitle="Revenue, costs, and profitability"
        icon="trending-up"
      />
      
      <View style={styles.metricsGrid}>
        <StatCard
          title="Total Revenue"
          value={totalRevenue}
          description="From all sales"
          isPositive={true}
          isCurrency={true}
        />
        <StatCard
          title="Cost of Goods"
          value={totalCost}
          description="Purchase costs"
          isPositive={false}
          isCurrency={true}
        />
        <StatCard
          title="Gross Profit"
          value={grossProfit}
          description="Revenue - COGS"
          isPositive={true}
          isCurrency={true}
        />
        <StatCard
          title="Operating Expenses"
          value={totalExpenses}
          description="Business costs"
          isPositive={false}
          isCurrency={true}
        />
        <StatCard
          title="Net Profit"
          value={netProfit}
          description="After all expenses"
          isPositive={netProfit >= 0}
          isCurrency={true}
        />
        <StatCard
          title="Profit Margin"
          value={profitMargin}
          description="Net profit percentage"
          isPositive={profitMargin >= 0}
          isCurrency={false}
        />
      </View>
    </View>
  );

  // Balance Sheet Section
  const renderBalanceSheet = () => (
    <View style={styles.sectionContainer}>
      <SectionHeader 
        title="Balance Sheet" 
        subtitle="Assets, liabilities, and equity"
        icon="wallet"
      />
      
      <View style={styles.metricsGrid}>
        <StatCard
          title="Total Assets"
          value={totalAssetsValue}
          description="Current asset worth"
          isPositive={true}
          isCurrency={true}
        />
        <StatCard
          title="Inventory Value"
          value={totalInventoryValue}
          description="Stock on hand"
          isPositive={true}
          isCurrency={true}
        />
        <StatCard
          title="Current Assets"
          value={currentAssets}
          description="Total liquid assets"
          isPositive={true}
          isCurrency={true}
        />
        <StatCard
          title="Current Ratio"
          value={currentRatio}
          description="Liquidity measure"
          isPositive={currentRatio >= 1}
          isCurrency={false}
        />
        <StatCard
          title="Asset Depreciation"
          value={assetDepreciation}
          description="Value loss"
          isPositive={false}
          isCurrency={true}
        />
        <StatCard
          title="Depreciation Rate"
          value={assetDepreciationRate}
          description="Annual depreciation"
          isPositive={false}
          isCurrency={false}
        />
      </View>
    </View>
  );

  // Performance Metrics Section
  const renderPerformanceMetrics = () => (
    <View style={styles.sectionContainer}>
      <SectionHeader 
        title="Performance Metrics" 
        subtitle="Key business indicators"
        icon="analytics"
      />
      
      <View style={styles.metricsGrid}>
        <StatCard
          title="Total Transactions"
          value={sales.length}
          description="Number of sales"
          isPositive={true}
          isCurrency={false}
        />
        <StatCard
          title="Avg Transaction"
          value={averageTransactionValue}
          description="Average sale value"
          isPositive={true}
          isCurrency={true}
        />
        <StatCard
          title="Inventory Turnover"
          value={inventoryTurnover}
          description="Turnover ratio"
          isPositive={true}
          isCurrency={false}
        />
        <StatCard
          title="ROA"
          value={returnOnAssets}
          description="Return on assets"
          isPositive={returnOnAssets >= 0}
          isCurrency={false}
        />
        <StatCard
          title="Gross Margin"
          value={grossProfitMargin}
          description="Gross profit percentage"
          isPositive={true}
          isCurrency={false}
        />
        <StatCard
          title="Operating Margin"
          value={operatingMargin}
          description="Operating income %"
          isPositive={operatingMargin >= 0}
          isCurrency={false}
        />
      </View>
    </View>
  );

  // Financial Ratios Section
  const renderFinancialRatios = () => (
    <View style={styles.sectionContainer}>
      <SectionHeader 
        title="Financial Ratios" 
        subtitle="Business health indicators"
        icon="calculator"
      />
      
      <View style={styles.metricsGrid}>
        <StatCard
          title="Current Ratio"
          value={currentRatio}
          description="Liquidity measure"
          isPositive={currentRatio >= 1}
          isCurrency={false}
        />
        <StatCard
          title="Quick Ratio"
          value={currentLiabilities > 0 ? (currentAssets - totalInventoryValue) / currentLiabilities : 0}
          description="Acid-test ratio"
          isPositive={true}
          isCurrency={false}
        />
        <StatCard
          title="Profit Margin"
          value={profitMargin}
          description="Net profit percentage"
          isPositive={profitMargin >= 0}
          isCurrency={false}
        />
        <StatCard
          title="COGS Ratio"
          value={costOfGoodsSoldRatio}
          description="Cost vs revenue"
          isPositive={false}
          isCurrency={false}
        />
        <StatCard
          title="Expense Ratio"
          value={expenseRatio}
          description="Expenses vs revenue"
          isPositive={false}
          isCurrency={false}
        />
        <StatCard
          title="Asset Turnover"
          value={totalRevenue > 0 ? totalRevenue / totalAssetsValue : 0}
          description="Asset efficiency"
          isPositive={true}
          isCurrency={false}
        />
      </View>
    </View>
  );

  // Quick Stats Footer
  const renderQuickStats = () => {
    const monthlyRevenue = totalRevenue / 12;
    const monthlyProfit = netProfit / 12;
    const businessHealth = profitMargin > 20 ? 'Excellent' : profitMargin > 10 ? 'Good' : 'Needs Attention';
    const healthColor = profitMargin > 20 ? COLORS.success : profitMargin > 10 ? COLORS.warning : COLORS.danger;

    return (
      <View style={[styles.quickStats, { backgroundColor: COLORS.primary }]}>
        <Text style={[styles.quickStatsTitle, { color: '#FFFFFF' }]}>Quick Overview</Text>
        
        <View style={styles.quickStatsGrid}>
          <View style={styles.quickStatItem}>
            <Text style={[styles.quickStatLabel, { color: COLORS.accent }]}>Monthly Revenue</Text>
            <Text style={[styles.quickStatValue, { color: '#FFFFFF' }]}>
              ${monthlyRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </Text>
          </View>
          
          <View style={styles.quickStatItem}>
            <Text style={[styles.quickStatLabel, { color: COLORS.accent }]}>Monthly Profit</Text>
            <Text style={[styles.quickStatValue, { color: '#FFFFFF' }]}>
              ${monthlyProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </Text>
          </View>
          
          <View style={styles.quickStatItem}>
            <Text style={[styles.quickStatLabel, { color: COLORS.accent }]}>Active Products</Text>
            <Text style={[styles.quickStatValue, { color: '#FFFFFF' }]}>{products.length}</Text>
          </View>
          
          <View style={styles.quickStatItem}>
            <Text style={[styles.quickStatLabel, { color: COLORS.accent }]}>Business Health</Text>
            <Text style={[styles.quickStatHealth, { color: healthColor }]}>{businessHealth}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: COLORS.background }]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={[styles.loadingText, { color: COLORS.muted }]}>Loading reports...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: COLORS.primary }]}>Reports</Text>
        <Text style={[styles.subtitle, { color: COLORS.muted }]}>Financial reports and analytics</Text>
      </View>

      {/* Section Navigation */}
     <View>
     <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.navigationScroll}
        contentContainerStyle={styles.navigationContent}
      >
        {sections.map((section) => (
          <TouchableOpacity
            key={section.key}
            style={[
              styles.navButton,
              { 
                backgroundColor: activeSection === section.key ? COLORS.accent : COLORS.card,
                borderColor: activeSection === section.key ? COLORS.accent : COLORS.border
              }
            ]}
            onPress={() => setActiveSection(section.key)}
          >
            <Ionicons 
              name={section.icon} 
              size={16} 
              color={activeSection === section.key ? '#FFFFFF' : COLORS.muted} 
            />
            <Text style={[
              styles.navButtonText,
              { color: activeSection === section.key ? '#FFFFFF' : COLORS.primary }
            ]}>
              {section.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
     </View>

      {/* Content */}
      <ScrollView style={styles.contentScroll}>
        <View style={styles.contentContainer}>
          {activeSection === 'income' && renderIncomeStatement()}
          {activeSection === 'balance' && renderBalanceSheet()}
          {activeSection === 'performance' && renderPerformanceMetrics()}
          {activeSection === 'ratios' && renderFinancialRatios()}
        </View>

        {/* Quick Stats Footer */}
        {renderQuickStats()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },

  // Navigation
  navigationScroll: {
    marginBottom: 20,
    
     alignSelf:"flex-start",
   
  },
  navigationContent: {
    paddingHorizontal: 20,
   
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    alignSelf:"flex-start"
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },

  // Content
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
  },

  // Section
  sectionContainer: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  sectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
  },

  // Metrics Grid
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },

  // Stat Card
  statCard: {
    width: "100%",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems:"center",
    justifyContent:"space-between"
  },
  statCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  statCardDescription: {
    fontSize: 12,
    marginBottom: 12,
  },
  statCardValue: {
    fontSize: 20,
    fontWeight: "700",
  },

  // Metric Item
  metricItem: {
    width: "48%",
    borderRadius: 12,
    padding: 16,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "700",
  },

  // Quick Stats
  quickStats: {
    marginHorizontal: 20,
    marginBottom: 32,
    borderRadius: 16,
    padding: 20,
  },
  quickStatsTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 20,
  },
  quickStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  quickStatItem: {
    width: "48%",
  },
  quickStatLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  quickStatHealth: {
    fontSize: 16,
    fontWeight: "700",
  },
});

export default AdminReports;