import { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity
} from 'react-native';
import { StyleSheet } from 'react-native';
import { useAppSelector } from '../../store/hooks';
import { Ionicons } from '@expo/vector-icons';

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

const AdminHome = () => {
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    todayRevenue: 0,
    lowStockItems: 0,
    totalProducts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const { sales, products } = useAppSelector((state) => state.user);

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
      action: () => console.log('Sales Report'),
    },
    {
      id: 2,
      title: 'Manage Inventory',
      description: 'Update stock',
      icon: 'cube-outline',
      action: () => console.log('Manage Inventory'),
    },
    {
      id: 3,
      title: 'Add Expense',
      description: 'Record costs',
      icon: 'add-circle-outline',
      action: () => console.log('Add Expense'),
    },
    {
      id: 4,
      title: 'Add Product',
      description: 'New item',
      icon: 'add-outline',
      action: () => console.log('Add Product'),
    },
  ];

  // Recent activity data
  const recentActivities: RecentActivity[] = [
    {
      id: 1,
      type: 'sale',
      title: 'Sale completed',
      description: 'Customer purchase',
      time: '2 min ago',
      amount: '$349.99',
    },
    {
      id: 2,
      type: 'stock',
      title: 'Stock updated',
      description: 'Inventory replenished',
      time: '15 min ago',
      amount: '+50 units',
    },
    {
      id: 3,
      type: 'purchase',
      title: 'Purchase order',
      description: 'Supplier order',
      time: '1 hr ago',
      amount: '20 items',
    },
  ];

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
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Dashboard</Text>
          <Text style={styles.subtitle}>
            Overview of your store performance
          </Text>
        </View>

        {/* Stats Grid - 2x2 layout */}
        <View style={styles.statsGrid}>
          {statCards.map((stat, index) => (
            <View key={stat.title} style={styles.statCardWrapper}>
              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: stat.iconBg }]}>
                  <Ionicons 
                    name={stat.icon} 
                    size={20} 
                    color="#374151" 
                  />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statTitle}>{stat.title}</Text>
                <Text style={styles.statDescription}>{stat.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Quick Actions Grid - 2x2 layout */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
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
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionDescription}>{action.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activitiesList}>
            {recentActivities.map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={styles.activityIconContainer}>
                  <Ionicons 
                    name={
                      activity.type === 'sale' ? 'cart' : 
                      activity.type === 'stock' ? 'cube' : 'document-text'
                    } 
                    size={18} 
                    color="#4B5563" 
                  />
                </View>
                <View style={styles.activityContent}>
                  <View style={styles.activityHeader}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activityTime}>{activity.time}</Text>
                  </View>
                  <Text style={styles.activityDescription}>{activity.description}</Text>
                </View>
                {activity.amount && (
                  <Text style={styles.activityAmount}>
                    {activity.amount}
                  </Text>
                )}
              </View>
            ))}
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
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  
  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  
  // Stats Grid - 2x2 layout
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  statCardWrapper: {
    width: '50%',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    color: '#111827',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  statDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  
  // Section
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  
  // Quick Actions Grid - 2x2 layout
  actionsGrid: {
    
    flexWrap: 'wrap',
  },
  actionCard: {
    width: '100%',
    paddingHorizontal: 8,
    paddingVertical: 8,
    flexDirection:"row",
    alignItems:"center",
    
    gap:7,

  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  
  // Recent Activity
  activitiesList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
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
    color: '#111827',
  },
  activityTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  activityDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 8,
  },
  
  // Bottom spacing
  bottomSpacing: {
    height: 24,
  },
});

export default AdminHome;