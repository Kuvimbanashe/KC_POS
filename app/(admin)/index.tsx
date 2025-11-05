// app/(admin)/index.js
import { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

const AdminHome = () => {
  const [stats, setStats] = useState({
    todaySales: 0,
    todayRevenue: 0,
    lowStockItems: 0,
    totalProducts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const { sales, products } = useSelector(state => state.user);

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
      color: 'text-primary',
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
      <ScrollView className="flex-1 bg-background">
        <View className="space-y-4 md:space-y-6 p-4 md:p-6">
          {/* Header Skeleton */}
          <View>
            <View className="h-8 w-48 bg-muted rounded mb-2 animate-pulse" />
            <View className="h-4 w-64 bg-muted rounded animate-pulse" />
          </View>

          {/* Stats Grid Skeleton */}
          <View className="flex-row flex-wrap justify-between gap-4">
            {[1, 2, 3, 4].map((i) => (
              <View key={i} className="bg-card rounded-lg p-4 w-[48%] min-w-[160px]">
                <View className="flex-row justify-between items-center mb-2">
                  <View className="h-4 w-20 bg-muted rounded animate-pulse" />
                  <View className="h-4 w-4 bg-muted rounded animate-pulse" />
                </View>
                <View className="h-6 w-12 bg-muted rounded mb-1 animate-pulse" />
                <View className="h-3 w-24 bg-muted rounded animate-pulse" />
              </View>
            ))}
          </View>

          {/* Content Skeleton */}
          <View className="flex-row flex-wrap justify-between gap-4">
            <View className="bg-card rounded-lg p-4 w-[48%] min-w-[300px]">
              <View className="h-6 w-32 bg-muted rounded mb-1 animate-pulse" />
              <View className="h-4 w-48 bg-muted rounded mb-4 animate-pulse" />
              {[1, 2, 3].map((i) => (
                <View key={i} className="bg-secondary rounded-lg p-3 mb-2">
                  <View className="h-4 w-40 bg-muted rounded mb-1 animate-pulse" />
                  <View className="h-3 w-32 bg-muted rounded animate-pulse" />
                </View>
              ))}
            </View>
            <View className="bg-card rounded-lg p-4 w-[48%] min-w-[300px]">
              <View className="h-6 w-32 bg-muted rounded mb-1 animate-pulse" />
              <View className="h-4 w-48 bg-muted rounded mb-4 animate-pulse" />
              {[1, 2, 3].map((i) => (
                <View key={i} className="bg-secondary rounded-lg p-3 mb-2">
                  <View className="h-4 w-40 bg-muted rounded mb-1 animate-pulse" />
                  <View className="h-3 w-24 bg-muted rounded animate-pulse" />
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="space-y-4 md:space-y-6 p-4 md:p-6">
        {/* Header */}
        <View className="w-full">
          
          <Text className="text-lg md:text-center text-muted-foreground">
            Welcome to your shop management system
          </Text>
        </View>

        {/* Stats Cards */}
        <View className="grid  grid-cols-2 gap-4 w-full">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <View key={stat.title} className="bg-primary rounded-lg p-4 w-full  ">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-sm font-medium text-muted">{stat.title}</Text>
                  <Ionicons name={stat.icon} size={16} className={stat.color} />
                </View>
                <Text className="text-xl md:text-2xl font-bold text-primary-foreground">{stat.value}</Text>
                <Text className="text-xs text-muted-foreground">{stat.description}</Text>
              </View>
            );
          })}
        </View>

        {/* Quick Actions and Recent Activity */}
        <View className="flex-row flex-wrap justify-between gap-4">
          {/* Quick Actions */}
          <View className="bg-card rounded-lg p-4 w-[48%] min-w-[300px]">
            <Text className="text-lg font-bold text-foreground">Quick Actions</Text>
            <Text className="text-sm text-muted-foreground mb-4">
              Common tasks for shop management
            </Text>
            <View className="space-y-2">
              <View className="p-3 bg-secondary rounded-lg">
                <Text className="font-medium text-foreground">View Sales Report</Text>
                <Text className="text-sm text-muted-foreground">Check today's transactions</Text>
              </View>
              <View className="p-3 bg-secondary rounded-lg">
                <Text className="font-medium text-foreground">Manage Inventory</Text>
                <Text className="text-sm text-muted-foreground">Update stock levels</Text>
              </View>
              <View className="p-3 bg-secondary rounded-lg">
                <Text className="font-medium text-foreground">Add Expense</Text>
                <Text className="text-sm text-muted-foreground">Record business expenses</Text>
              </View>
            </View>
          </View>

          {/* Recent Activity */}
          <View className="bg-card rounded-lg p-4 w-[48%] min-w-[300px]">
            <Text className="text-lg font-bold text-foreground">Recent Activity</Text>
            <Text className="text-sm text-muted-foreground mb-4">
              Latest transactions and updates
            </Text>
            <View className="space-y-3">
              <View className="flex-row justify-between items-center p-2 bg-secondary rounded-lg">
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground">Sale completed</Text>
                  <Text className="text-xs text-muted-foreground">2 minutes ago</Text>
                </View>
                <Text className="text-sm font-bold text-accent">$349.99</Text>
              </View>
              <View className="flex-row justify-between items-center p-2 bg-secondary rounded-lg">
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground">Stock updated</Text>
                  <Text className="text-xs text-muted-foreground">15 minutes ago</Text>
                </View>
                <Text className="text-sm font-medium text-foreground">+50 units</Text>
              </View>
              <View className="flex-row justify-between items-center p-2 bg-secondary rounded-lg">
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground">New purchase order</Text>
                  <Text className="text-xs text-muted-foreground">1 hour ago</Text>
                </View>
                <Text className="text-sm font-medium text-foreground">20 items</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default AdminHome;