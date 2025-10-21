// app/(admin)/index.js - Update with accounting metrics
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';

export default function AdminDashboard() {
  const { user } = useSelector(state => state.auth);
  const { products, sales, purchases, expenses } = useSelector(state => state.user);
  const { financialReports } = useSelector(state => state.accounting);

  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalPurchases = purchases.reduce((sum, purchase) => sum + purchase.total, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const lowStockProducts = products.filter(p => p.stock < 10);
  const inventoryValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

  // Key Performance Indicators
  const kpis = [
    {
      title: 'Gross Profit Margin',
      value: `${((financialReports.incomeStatement.gross_profit / financialReports.incomeStatement.revenue) * 100).toFixed(1)}%`,
      trend: '+2.5%',
      color: 'text-green-600',
    },
    {
      title: 'Current Ratio',
      value: (financialReports.balanceSheet.assets.current_assets / financialReports.balanceSheet.liabilities.current_liabilities).toFixed(2),
      trend: 'Stable',
      color: 'text-blue-600',
    },
    {
      title: 'Inventory Turnover',
      value: (totalSales / inventoryValue).toFixed(2),
      trend: '+0.3',
      color: 'text-purple-600',
    },
    {
      title: 'ROI',
      value: `${((financialReports.incomeStatement.net_income / financialReports.balanceSheet.total_assets) * 100).toFixed(1)}%`,
      trend: '+1.2%',
      color: 'text-orange-600',
    },
  ];

  return (
    <ScrollView className="flex-1 bg-primary-white p-4">
      <Text className="text-2xl font-bold text-primary-navy-dark mb-2">
        Admin Dashboard
      </Text>
      <Text className="text-gray-600 mb-6">Welcome back, {user?.name}!</Text>

      <View className="space-y-6">
        {/* Financial Overview */}
        <View className="bg-primary-navy-dark p-4 rounded-lg">
          <Text className="text-primary-white text-lg font-semibold mb-4">
            Financial Overview
          </Text>
          <View className="flex-row flex-wrap justify-between">
            <View className="mb-4">
              <Text className="text-primary-orange-400 text-sm">Revenue</Text>
              <Text className="text-primary-white text-xl font-bold">
                ${financialReports.incomeStatement.revenue.toLocaleString()}
              </Text>
            </View>
            <View className="mb-4">
              <Text className="text-primary-orange-400 text-sm">Net Income</Text>
              <Text className="text-primary-white text-xl font-bold">
                ${financialReports.incomeStatement.net_income.toLocaleString()}
              </Text>
            </View>
            <View className="mb-4">
              <Text className="text-primary-orange-400 text-sm">Cash Flow</Text>
              <Text className="text-primary-white text-xl font-bold">
                ${financialReports.cashFlow.net_cash_flow.toLocaleString()}
              </Text>
            </View>
            <View className="mb-4">
              <Text className="text-primary-orange-400 text-sm">Assets</Text>
              <Text className="text-primary-white text-xl font-bold">
                ${financialReports.balanceSheet.total_assets}
              </Text>
            </View>
          </View>
        </View>

        {/* Key Performance Indicators */}
        <View>
          <Text className="text-xl font-semibold text-primary-navy-dark mb-4">
            Key Performance Indicators
          </Text>
          <View className="flex-row flex-wrap justify-between">
            {kpis.map((kpi, index) => (
              <View key={index} className="bg-gray-50 p-4 rounded-lg w-48 mb-4">
                <Text className="text-primary-navy-dark font-semibold text-sm">
                  {kpi.title}
                </Text>
                <Text className="text-2xl font-bold text-primary-navy-dark my-1">
                  {kpi.value}
                </Text>
                <Text className={`text-xs ${kpi.color}`}>
                  {kpi.trend} from last month
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Stats */}
        <View className="flex-row flex-wrap justify-between">
          <View className="bg-primary-orange-400 p-4 rounded-lg w-48 mb-4">
            <Text className="text-primary-white text-lg font-semibold">Today's Sales</Text>
            <Text className="text-primary-white text-2xl font-bold">
              ${sales
                .filter(s => new Date(s.date).toDateString() === new Date().toDateString())
                .reduce((sum, sale) => sum + sale.total, 0)
                .toLocaleString()}
            </Text>
          </View>
          
          <View className="bg-primary-navy-dark p-4 rounded-lg w-48 mb-4">
            <Text className="text-primary-white text-lg font-semibold">Low Stock Items</Text>
            <Text className="text-primary-white text-2xl font-bold">
              {lowStockProducts.length}
            </Text>
          </View>
          
          <View className="bg-primary-orange-400 p-4 rounded-lg w-48 mb-4">
            <Text className="text-primary-white text-lg font-semibold">Pending Orders</Text>
            <Text className="text-primary-white text-2xl font-bold">12</Text>
          </View>
          
          <View className="bg-primary-navy-dark p-4 rounded-lg w-48 mb-4">
            <Text className="text-primary-white text-lg font-semibold">Customer Satisfaction</Text>
            <Text className="text-primary-white text-2xl font-bold">94%</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View>
          <Text className="text-xl font-semibold text-primary-navy-dark mb-4">
            Quick Actions
          </Text>
          <View className="flex-row flex-wrap justify-between">
            <TouchableOpacity className="bg-primary-orange-400 p-4 rounded-lg w-48 mb-4">
              <Text className="text-primary-white text-center font-semibold">
                View Reports
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="bg-primary-navy-dark p-4 rounded-lg w-48 mb-4">
              <Text className="text-primary-white text-center font-semibold">
                Manage Inventory
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="bg-primary-orange-400 p-4 rounded-lg w-48 mb-4">
              <Text className="text-primary-white text-center font-semibold">
                Accounting
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="bg-primary-navy-dark p-4 rounded-lg w-48 mb-4">
              <Text className="text-primary-white text-center font-semibold">
                Tax Filing
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}