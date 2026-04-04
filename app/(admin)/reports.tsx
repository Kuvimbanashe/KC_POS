import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchAssets } from '../../store/slices/assetsSlice';
import { apiClient } from '../../services/api';

type ReportSection = 'overview' | 'sales' | 'inventory' | 'expenses' | 'assets';
type ReportsPayload = Awaited<ReturnType<typeof apiClient.fetchReports>>;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scrollView: { flex: 1 },
  content: { padding: 16, gap: 16 },
  header: { gap: 6 },
  title: { fontSize: 28, fontWeight: '700', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#64748b' },
  refreshButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#0f172a',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  refreshButtonText: { color: '#fff', fontWeight: '600' },
  tabs: { flexDirection: 'row', gap: 8 },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
  },
  tabActive: { backgroundColor: '#f97316' },
  tabText: { color: '#475569', fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  card: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 16,
    backgroundColor: '#fff',
    gap: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  sectionSubtitle: { fontSize: 13, color: '#64748b' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: {
    width: '47%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#fff',
  },
  statLabel: { fontSize: 13, color: '#64748b', marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  statHint: { fontSize: 12, color: '#94a3b8', marginTop: 6 },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  rowTitle: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  rowSubtitle: { fontSize: 12, color: '#64748b', marginTop: 4 },
  rowValue: { fontSize: 14, fontWeight: '700', color: '#f97316' },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: '#475569' },
  emptyText: { fontSize: 13, color: '#94a3b8', textAlign: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: '#fff' },
  loadingText: { color: '#64748b' },
});

const toNumber = (value: number | string | undefined | null) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const currency = (value: number) => `$${value.toFixed(2)}`;

export default function AdminReports() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const assets = useAppSelector((state) => state.assets.assets);

  const [reports, setReports] = useState<ReportsPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState<ReportSection>('overview');

  const loadReports = useCallback(async (refresh = false) => {
    if (!user?.businessId) return;

    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const payload = await apiClient.fetchReports(undefined, undefined, user.businessId);
      setReports(payload);
      dispatch(fetchAssets(user.businessId));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load reports';
      console.error(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [dispatch, user?.businessId]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const tabs: { key: ReportSection; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'sales', label: 'Sales' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'expenses', label: 'Expenses' },
    { key: 'assets', label: 'Assets' },
  ];

  const overviewStats = useMemo(() => {
    if (!reports) return [];

    const totalSales = toNumber(reports.dashboard.totals.sales);
    const totalExpenses = toNumber(reports.dashboard.totals.expenses);
    const inventoryValue = toNumber(reports.dashboard.totals.inventory_value);
    const net = toNumber(reports.dashboard.totals.net);
    const revenue = toNumber(reports.profitLoss.income_statement.revenue);
    const cogs = toNumber(reports.profitLoss.income_statement.cogs);
    const lowStockProducts = reports.dashboard.alerts.low_stock_products;

    return [
      { label: 'Total Sales', value: currency(totalSales), hint: `${reports.sales.summary.count} transactions` },
      { label: 'Revenue', value: currency(revenue), hint: 'From profit & loss report' },
      { label: 'COGS', value: currency(cogs), hint: 'Purchases treated as cost of goods' },
      { label: 'Expenses', value: currency(totalExpenses), hint: `${reports.expenses.summary.count} expense records` },
      { label: 'Inventory Value', value: currency(inventoryValue), hint: `${reports.inventory.summary.products_count} products` },
      { label: 'Net', value: currency(net), hint: `${lowStockProducts} low-stock alerts` },
    ];
  }, [reports]);

  const assetStats = useMemo(() => {
    const purchaseValue = assets.reduce((sum, asset) => sum + asset.purchaseValue, 0);
    const currentValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
    const depreciation = purchaseValue - currentValue;

    return {
      totalAssets: assets.length,
      purchaseValue,
      currentValue,
      depreciation,
    };
  }, [assets]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Loading reports...</Text>
      </View>
    );
  }

  if (!reports) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="bar-chart-outline" size={42} color="#94a3b8" />
        <Text style={styles.loadingText}>No reports available right now.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => loadReports(true)} tintColor="#f97316" />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Reports</Text>
          <Text style={styles.subtitle}>Live backend summaries for sales, inventory, expenses, and assets.</Text>
         
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tabs}>
            {tabs.map((tab) => {
              const isActive = activeSection === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tab, isActive && styles.tabActive]}
                  onPress={() => setActiveSection(tab.key)}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {activeSection === 'overview' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <Text style={styles.sectionSubtitle}>High-level financial and operational health.</Text>
            <View style={styles.statsGrid}>
              {overviewStats.map((item) => (
                <View key={item.label} style={styles.statCard}>
                  <Text style={styles.statLabel}>{item.label}</Text>
                  <Text style={styles.statValue}>{item.value}</Text>
                  <Text style={styles.statHint}>{item.hint}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeSection === 'sales' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Sales Trend</Text>
            <Text style={styles.sectionSubtitle}>Daily totals returned by the backend.</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Transactions</Text>
                <Text style={styles.statValue}>{reports.sales.summary.count}</Text>
                <Text style={styles.statHint}>Recorded sales</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total Sales</Text>
                <Text style={styles.statValue}>{currency(toNumber(reports.sales.summary.total_sales))}</Text>
                <Text style={styles.statHint}>Aggregated total</Text>
              </View>
            </View>
            {reports.sales.daily.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={36} color="#94a3b8" />
                <Text style={styles.emptyTitle}>No sales trend data yet</Text>
                <Text style={styles.emptyText}>Sales will appear here as soon as the backend has dated transactions.</Text>
              </View>
            ) : (
              reports.sales.daily.map((item) => (
                <View key={item.day} style={styles.rowItem}>
                  <View>
                    <Text style={styles.rowTitle}>{new Date(item.day).toLocaleDateString()}</Text>
                    <Text style={styles.rowSubtitle}>Daily sales total</Text>
                  </View>
                  <Text style={styles.rowValue}>{currency(toNumber(item.total))}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {activeSection === 'inventory' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Inventory</Text>
            <Text style={styles.sectionSubtitle}>Stock and low-stock visibility from the API.</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Products</Text>
                <Text style={styles.statValue}>{reports.inventory.summary.products_count}</Text>
                <Text style={styles.statHint}>Tracked products</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Inventory Value</Text>
                <Text style={styles.statValue}>{currency(toNumber(reports.inventory.summary.inventory_value))}</Text>
                <Text style={styles.statHint}>Based on cost x stock</Text>
              </View>
            </View>
            {reports.inventory.low_stock.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="cube-outline" size={36} color="#94a3b8" />
                <Text style={styles.emptyTitle}>No low-stock items</Text>
                <Text style={styles.emptyText}>Everything is currently above minimum stock.</Text>
              </View>
            ) : (
              reports.inventory.low_stock.map((item) => (
                <View key={item.id} style={styles.rowItem}>
                  <View>
                    <Text style={styles.rowTitle}>{item.name}</Text>
                    <Text style={styles.rowSubtitle}>Minimum: {item.min_stock_level}</Text>
                  </View>
                  <Text style={styles.rowValue}>{item.stock} left</Text>
                </View>
              ))
            )}
          </View>
        )}

        {activeSection === 'expenses' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Expenses</Text>
            <Text style={styles.sectionSubtitle}>Breakdown by category.</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Expense Records</Text>
                <Text style={styles.statValue}>{reports.expenses.summary.count}</Text>
                <Text style={styles.statHint}>Tracked expenses</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total Expenses</Text>
                <Text style={styles.statValue}>{currency(toNumber(reports.expenses.summary.total_expenses))}</Text>
                <Text style={styles.statHint}>Across all categories</Text>
              </View>
            </View>
            {reports.expenses.by_category.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="cash-outline" size={36} color="#94a3b8" />
                <Text style={styles.emptyTitle}>No expense data yet</Text>
                <Text style={styles.emptyText}>Expenses will appear here once they have been recorded.</Text>
              </View>
            ) : (
              reports.expenses.by_category.map((item) => (
                <View key={item.category} style={styles.rowItem}>
                  <View>
                    <Text style={styles.rowTitle}>{item.category}</Text>
                    <Text style={styles.rowSubtitle}>Category total</Text>
                  </View>
                  <Text style={styles.rowValue}>{currency(toNumber(item.total))}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {activeSection === 'assets' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Fixed Assets</Text>
            <Text style={styles.sectionSubtitle}>Pulled from the assets module and combined into report-friendly totals.</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Assets</Text>
                <Text style={styles.statValue}>{assetStats.totalAssets}</Text>
                <Text style={styles.statHint}>Tracked assets</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Current Value</Text>
                <Text style={styles.statValue}>{currency(assetStats.currentValue)}</Text>
                <Text style={styles.statHint}>Current combined worth</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Purchase Value</Text>
                <Text style={styles.statValue}>{currency(assetStats.purchaseValue)}</Text>
                <Text style={styles.statHint}>Original cost basis</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Depreciation</Text>
                <Text style={styles.statValue}>{currency(assetStats.depreciation)}</Text>
                <Text style={styles.statHint}>Purchase minus current value</Text>
              </View>
            </View>
            {assets.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="briefcase-outline" size={36} color="#94a3b8" />
                <Text style={styles.emptyTitle}>No assets recorded</Text>
                <Text style={styles.emptyText}>Add business assets to see them summarized here.</Text>
              </View>
            ) : (
              assets.slice(0, 8).map((asset) => (
                <View key={asset.id} style={styles.rowItem}>
                  <View>
                    <Text style={styles.rowTitle}>{asset.name}</Text>
                    <Text style={styles.rowSubtitle}>{asset.location || asset.category}</Text>
                  </View>
                  <Text style={styles.rowValue}>{currency(asset.currentValue)}</Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
