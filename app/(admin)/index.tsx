import { useEffect, useMemo, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { StyleSheet } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { Ionicons } from '@expo/vector-icons';
import { fetchOperationalData } from '../../store/slices/userSlice';
import { useRouter } from 'expo-router';
import {
  ADMIN_CARD,
  ADMIN_COLORS,
  ADMIN_LIST_CARD,
  ADMIN_PAGE_SUBTITLE,
  ADMIN_PAGE_TITLE,
  ADMIN_SECTION_CARD,
  ADMIN_SECTION_SUBTITLE,
  ADMIN_SECTION_TITLE,
  ADMIN_STAT_CARD,
} from '../../theme/adminUi';

interface DashboardStats {
  todaySales: number;
  todayRevenue: number;
  lowStockItems: number;
  totalProducts: number;
}

interface StatCard {
  title: string;
  value: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
}

interface RecentActivity {
  id: number;
  type: 'sale' | 'stock' | 'purchase';
  title: string;
  description: string;
  time: string;
  amount?: string;
}

interface QuickAction {
  id: number;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  action: () => void;
}

const formatRelativeTime = (input: string) => {
  const value = new Date(input).getTime();
  if (!Number.isFinite(value)) return 'Recently';

  const diffMs = Date.now() - value;
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
};

const AdminHome = () => {
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    todayRevenue: 0,
    lowStockItems: 0,
    totalProducts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const { sales, products, purchases, expenses } = useAppSelector((state) => state.user);

  useEffect(() => {
    if (!user?.businessId) return;
    dispatch(fetchOperationalData(user.businessId));
  }, [dispatch, user?.businessId]);

  useEffect(() => {
    const fetchDashboardData = () => {
      try {
        const today = new Date().toDateString();
        const todaySales = sales.filter(
          (sale) => new Date(sale.date).toDateString() === today
        );

        const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
        const lowStockItems = products.filter((p) => p.stock < 10).length;

        setStats({
          todaySales: todaySales.length,
          todayRevenue,
          lowStockItems,
          totalProducts: products.length,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [sales, products]);

  const handleRefresh = async () => {
    if (!user?.businessId) return;
    setIsRefreshing(true);
    try {
      await dispatch(fetchOperationalData(user.businessId));
    } finally {
      setIsRefreshing(false);
    }
  };

  // Stat cards configuration - clean color scheme
  const statCards: StatCard[] = [
    {
      title: "Today's Sales",
      value: stats.todaySales.toString(),
      description: 'Transactions',
      icon: 'cart-outline',
      iconBg: '#E8F4FD',
    },
    {
      title: "Today's Revenue",
      value: `$${stats.todayRevenue.toFixed(2)}`,
      description: 'Total earnings',
      icon: 'cash-outline',
      iconBg: '#E6F7EF',
    },
    {
      title: 'Total Products',
      value: stats.totalProducts.toString(),
      description: 'In inventory',
      icon: 'cube-outline',
      iconBg: '#F2F0FF',
    },
    {
      title: 'Low Stock Alert',
      value: stats.lowStockItems.toString(),
      description: 'Items below 10 units',
      icon: 'warning-outline',
      iconBg: '#FEEBEB',
    },
  ];

  // Quick actions configuration
  const quickActions: QuickAction[] = [
    {
      id: 1,
      title: 'Sales Report',
      description: 'View transactions',
      icon: 'bar-chart-outline',
      action: () => router.push('/(admin)/reports'),
    },
    {
      id: 2,
      title: 'Manage Inventory',
      description: 'Update stock',
      icon: 'cube-outline',
      action: () => router.push('/(admin)/stock'),
    },
    {
      id: 3,
      title: 'Add Expense',
      description: 'Record costs',
      icon: 'add-circle-outline',
      action: () => router.push('/(admin)/expenses'),
    },
    {
      id: 4,
      title: 'Add Product',
      description: 'New item',
      icon: 'add-outline',
      action: () => router.push('/(admin)/stock'),
    },
  ];

  const recentActivities: RecentActivity[] = useMemo(() => {
    const saleActivities = sales.slice(0, 2).map((sale) => ({
      id: Number(`1${sale.id}`),
      type: 'sale' as const,
      title: `Sale ${sale.invoiceNumber || `#${sale.id}`}`,
      description: sale.cashier || 'Transaction completed',
      time: formatRelativeTime(sale.date),
      amount: `$${sale.total.toFixed(2)}`,
    }));

    const purchaseActivities = purchases.slice(0, 2).map((purchase) => ({
      id: Number(`2${purchase.id}`),
      type: 'purchase' as const,
      title: `Purchase ${purchase.orderNumber || `#${purchase.id}`}`,
      description: purchase.productName,
      time: formatRelativeTime(purchase.createdAt || purchase.date),
      amount: `${purchase.quantity} units`,
    }));

    const expenseActivities = expenses.slice(0, 1).map((expense) => ({
      id: Number(`3${expense.id}`),
      type: 'purchase' as const,
      title: `Expense ${expense.receiptNumber || `#${expense.id}`}`,
      description: expense.category,
      time: formatRelativeTime(expense.date),
      amount: `$${expense.amount.toFixed(2)}`,
    }));

    const stockActivities = products
      .filter((product) => product.stock <= (product.minStockLevel || 10))
      .slice(0, 1)
      .map((product) => ({
        id: Number(`4${product.id}`),
        type: 'stock' as const,
        title: `Low stock: ${product.name}`,
        description: `${product.stock} units remaining`,
        time: 'Needs attention',
      }));

    return [...saleActivities, ...purchaseActivities, ...expenseActivities, ...stockActivities].slice(0, 5);
  }, [expenses, products, purchases, sales]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#f97316" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Dashboard</Text>
          <Text style={styles.subtitle}>
            Overview of your store performance
          </Text>
        </View>

        <View style={styles.section}>
          {/* <Text style={styles.sectionTitle}>Store Snapshot</Text>
          <Text style={styles.sectionSubtitle}>A quick look at sales, revenue, and stock health today.</Text> */}
          <View style={styles.statsGrid}>
            {statCards.map((stat) => (
              <View key={stat.title} style={styles.statCardWrapper}>
                <View style={styles.statCard}>
                  <View style={[styles.statIconContainer, { backgroundColor: stat.iconBg }]}>
                    <Ionicons 
                      name={stat.icon} 
                      size={20} 
                      color={ADMIN_COLORS.text} 
                    />
                  </View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statTitle}>{stat.title}</Text>
                  <Text style={styles.statDescription}>{stat.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions Grid - 2x2 layout */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <Text style={styles.sectionSubtitle}>Jump straight into the admin tools you use most.</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionCard}
                onPress={action.action}
               
              >
                <View style={styles.actionIconContainer}>
                  <Ionicons 
                    name={action.icon} 
                    size={24} 
                    color="#2563EB" 
                  />
                </View>
                <View style={styles.actionCopy}>
                 <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionDescription}>{action.description}</Text>
                </View>

                <Ionicons 
                  name="chevron-forward" 
                  size={22}
                  color={ADMIN_COLORS.tertiaryText}
                />

              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Text style={styles.sectionSubtitle}>New transactions, stock alerts, and updates from the floor.</Text>
          <View style={styles.activitiesList}>
            {recentActivities.length === 0 ? (
              <View style={styles.activityItem}>
                <View style={styles.activityIconContainer}>
                  <Ionicons name="time-outline" size={18} color={ADMIN_COLORS.secondaryText} />
                </View>
                <View style={styles.activityContent}>
                  <View style={styles.activityHeader}>
                    <Text style={styles.activityTitle}>No recent activity yet</Text>
                  </View>
                  <Text style={styles.activityDescription}>New sales, purchases, and alerts will appear here.</Text>
                </View>
              </View>
            ) : (
              recentActivities.map((activity) => (
                <View key={activity.id} style={styles.activityItem}>
                  <View style={styles.activityIconContainer}>
                    <Ionicons
                      name={
                        activity.type === 'sale' ? 'cart' :
                        activity.type === 'stock' ? 'cube' : 'document-text'
                      }
                      size={18}
                      color={ADMIN_COLORS.secondaryText}
                    />
                  </View>
                  <View style={styles.activityContent}>
                    <View style={styles.activityHeader}>
                      <Text style={styles.activityTitle}>{activity.title}</Text>
                       
                    </View>
                     <Text style={styles.activityDescription}>{activity.description}</Text>
                   <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    
                    {activity.amount && <Text style={styles.activityAmount}>{activity.amount}</Text>}
                     <Text style={styles.activityTime}>{activity.time}</Text>
                   </View>
                  </View>
                 
                 
                </View>
              ))
            )}
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ADMIN_COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
    gap: 16,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ADMIN_COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: ADMIN_COLORS.secondaryText,
  },
  
  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 0,
  },
  greeting: {
    ...ADMIN_PAGE_TITLE,
    marginBottom: 4,
  },
  subtitle: {
    ...ADMIN_PAGE_SUBTITLE,
  },
  
  // Stats Grid - 2x2 layout
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginTop: 4,
  },
  statCardWrapper: {
    width: '50%',
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  statCard: {
    ...ADMIN_STAT_CARD,
    padding: 16,
    minHeight: 136,
    alignItems: 'center',
    
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: ADMIN_COLORS.text,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: ADMIN_COLORS.text,
    marginBottom: 2,
  },
  statDescription: {
    fontSize: 12,
    color: ADMIN_COLORS.secondaryText,
  },
  
  // Section
  section: {
    ...ADMIN_SECTION_CARD,
    marginHorizontal: 20,
    gap: 12,
  },
  sectionTitle: {
    ...ADMIN_SECTION_TITLE,
  },
  sectionSubtitle: {
    ...ADMIN_SECTION_SUBTITLE,
    marginTop: -6,
  },
  
  // Quick Actions Grid - 2x2 layout
  actionsGrid: {
    gap: 10,
  },
  actionCard: {
    ...ADMIN_LIST_CARD,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection:"row",
    alignItems:"center",
    justifyContent: 'space-between',
    gap:12,
  },
  actionCopy: {
    flex: 1,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: ADMIN_COLORS.text,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 12,
    color: ADMIN_COLORS.secondaryText,
  },
  
  // Recent Activity
  activitiesList: {
    gap: 10,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    ...ADMIN_CARD,
    borderRadius: 14,
    padding: 16,
  },
  activityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ADMIN_COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: ADMIN_COLORS.text,
  },
  activityTime: {
    fontSize: 12,
    color: ADMIN_COLORS.tertiaryText,
  },
  activityDescription: {
    fontSize: 13,
    color: ADMIN_COLORS.secondaryText,
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: ADMIN_COLORS.success,
   
  },
  
  // Bottom spacing
  bottomSpacing: {
    height: 24,
  },
});

export default AdminHome;
