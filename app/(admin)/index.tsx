// app/(admin)/index.js
import { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { StyleSheet } from 'react-native';
import { useAppSelector } from '../../store/hooks';
import { Ionicons } from '@expo/vector-icons';

const AdminHome = () => {
  const [stats, setStats] = useState({
    todaySales: 0,
    todayRevenue: 0,
    lowStockItems: 0,
    totalProducts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const { sales, products } = useAppSelector((state) => state.user);

  useEffect(() => {
    const fetchDashboardData = async () => {
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

  const statCards = [
    {
      title: "Today's Sales",
      value: stats.todaySales.toString(),
      description: 'Number of transactions',
      icon: 'cart-outline',
      color: 'text-accent',
    },
    {
      title: "Today's Revenue",
      value: `$${stats.todayRevenue.toFixed(2)}`,
      description: 'Total earnings today',
      icon: 'cash-outline',
      color: 'text-accent',
    },
    {
      title: 'Total Products',
      value: stats.totalProducts.toString(),
      description: 'Items in inventory',
      icon: 'cube-outline',
      color: 'text-accent',
    },
    {
      title: 'Low Stock Alert',
      value: stats.lowStockItems.toString(),
      description: 'Items below 10 units',
      icon: 'warning-outline',
      color: 'text-destructive',
    },
  ];

  if (isLoading) {
    return (
      <ScrollView style={styles.s_1}>
        <View style={styles.s_2}>
          {/* Header Skeleton */}
          <View>
            <View style={styles.s_3} />
            <View style={styles.s_4} />
          </View>

          {/* Stats Grid Skeleton */}
          <View style={styles.s_5}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={styles.s_6}>
                <View style={styles.s_7}>
                  <View style={styles.s_8} />
                  <View style={styles.s_9} />
                </View>
                <View style={styles.s_10} />
                <View style={styles.s_11} />
              </View>
            ))}
          </View>

          {/* Content Skeleton */}
          <View style={styles.s_5}>
            <View style={styles.s_12}>
              <View style={styles.s_13} />
              <View style={styles.s_14} />
              {[1, 2, 3].map((i) => (
                <View key={i} style={styles.s_15}>
                  <View style={styles.s_16} />
                  <View style={styles.s_17} />
                </View>
              ))}
            </View>
            <View style={styles.s_12}>
              <View style={styles.s_13} />
              <View style={styles.s_14} />
              {[1, 2, 3].map((i) => (
                <View key={i} style={styles.s_15}>
                  <View style={styles.s_16} />
                  <View style={styles.s_11} />
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.s_1}>
      <View style={styles.s_2}>
        {/* Header */}
        <View style={styles.s_18}>
          
          <Text style={styles.s_19}>
            Welcome to your shop management system
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.s_20}>
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <View key={stat.title} style={styles.s_21}>  
                <View style={styles.s_7}>
                  <Text style={styles.s_22}>{stat.title}</Text>
                  <Ionicons name={stat.icon as any} size={16} className={stat.color} />
                </View>
                <Text style={styles.s_23}>{stat.value}</Text>
                <Text style={styles.s_24}>{stat.description}</Text>
              </View>
            );
          })}
        </View>

        {/* Quick Actions and Recent Activity */}
        <View style={styles.s_25}>
          {/* Quick Actions */}
          <View style={styles.s_26}>
            <Text style={styles.s_27}>Quick Actions</Text>
            <Text style={styles.s_28}>
              Common tasks for shop management
            </Text>
            
            <View style={styles.s_29}>
              <View style={styles.s_30}>
                <Text style={styles.s_31}>View Sales Report</Text>
                <Text style={styles.s_32}>Check today's transactions</Text>
              </View>
              <View style={styles.s_30}>
                <Text style={styles.s_31}>Manage Inventory</Text>
                <Text style={styles.s_32}>Update stock levels</Text>
              </View>
              <View style={styles.s_30}>
                <Text style={styles.s_31}>Add Expense</Text>
                <Text style={styles.s_32}>Record business expenses</Text>
              </View>
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.s_26}>
            <Text style={styles.s_27}>Recent Activity</Text>
            <Text style={styles.s_28}>
              Latest transactions and updates
            </Text>
            <View style={styles.s_33}>
              <View style={styles.s_34}>
                <View style={styles.s_35}>
                  <Text style={styles.s_36}>Sale completed</Text>
                  <Text style={styles.s_24}>2 minutes ago</Text>
                </View>
                <Text style={styles.s_37}>$349.99</Text>
              </View>
              <View style={styles.s_34}>
                <View style={styles.s_35}>
                  <Text style={styles.s_36}>Stock updated</Text>
                  <Text style={styles.s_24}>15 minutes ago</Text>
                </View>
                <Text style={styles.s_36}>+50 units</Text>
              </View>
              <View style={styles.s_34}>
                <View style={styles.s_35}>
                  <Text style={styles.s_36}>New purchase order</Text>
                  <Text style={styles.s_24}>1 hour ago</Text>
                </View>
                <Text style={styles.s_36}>20 items</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};



const styles = StyleSheet.create({
  s_1: {
  flex: 1,
  backgroundColor: "#ffffff"
},

  s_2: {
  padding: 16
},

  s_3: {
  borderRadius: 6,
  marginBottom: 8
},

  s_4: {
  borderRadius: 6
},

  s_5: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between",
  gap: 16
},

  s_6: {
  backgroundColor: "#ffffff",
  borderRadius: 12,
  padding: 16,
  width: "48%"
},

  s_7: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 8
},

  s_8: {
  borderRadius: 6
},

  s_9: {
  borderRadius: 6
},

  s_10: {
  borderRadius: 6
},

  s_11: {
  borderRadius: 6
},

  s_12: {
  backgroundColor: "#ffffff",
  borderRadius: 12,
  padding: 16,
  width: "48%"
},

  s_13: {
  borderRadius: 6
},

  s_14: {
  borderRadius: 6,
  marginBottom: 16
},

  s_15: {
  backgroundColor: "#f3f4f6",
  borderRadius: 12,
  padding: 12,
  marginBottom: 8
},

  s_16: {
  borderRadius: 6
},

  s_17: {
  borderRadius: 6
},

  s_18: {
  width: "100%"
},

  s_19: {
  fontSize: 18,
  color: "#6b7280"
},

  s_20: {
  flexDirection: "row",
  flexWrap: "wrap",
 
  width: "100%",
  gap: 14
},

  s_21: {
  backgroundColor: "#0f172a",
  borderRadius: 12,
  padding: 16,
  width: "48%"
},

  s_22: {
  fontSize: 14,
  fontWeight: "600"
},

  s_23: {
  fontSize: 20,
  fontWeight: "700",
  color: "#ffffff"
},

  s_24: {
  fontSize: 12,
  color: "#6b7280"
},

  s_25: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between",
  gap: 16,
  width: "100%"
},

  s_26: {
  backgroundColor: "#ffffff",
  borderRadius: 12,
  padding: 16,
  width: "100%"
},

  s_27: {
  fontSize: 18,
  fontWeight: "700",
  color: "#0f172a"
},

  s_28: {
  fontSize: 14,
  color: "#6b7280",
  marginBottom: 16
},

  s_29: {},

  s_30: {
  padding: 12,
  backgroundColor: "#f3f4f6",
  borderRadius: 12
},

  s_31: {
  fontWeight: "600",
  color: "#0f172a"
},

  s_32: {
  fontSize: 14,
  color: "#6b7280"
},

  s_33: {},

  s_34: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  padding: 8,
  backgroundColor: "#f3f4f6",
  borderRadius: 12
},

  s_35: {
  flex: 1
},

  s_36: {
  fontSize: 14,
  fontWeight: "600",
  color: "#0f172a"
},

  s_37: {
  fontSize: 14,
  fontWeight: "700",
  color: "#f97316"
}
});
export default AdminHome;