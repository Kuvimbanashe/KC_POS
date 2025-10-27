// app/(cashier)/index.js
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

const CashierHome = () => {
  const { user } = useSelector(state => state.auth);
  const { sales, products } = useSelector(state => state.user);

  // Filter today's sales for current cashier
  const today = new Date().toDateString();
  const todaySales = sales.filter(sale => 
    sale.cashier === user?.name && new Date(sale.date).toDateString() === today
  );

  // Calculate stats
  const todayReceiptsCount = todaySales.length;
  const todaySalesAmount = todaySales.reduce((sum, sale) => sum + sale.total, 0);
  
  // Get low stock products
  const lowStockProducts = products.filter(product => product.stock < 10);

  // Quick actions
  const quickActions = [
    {
      title: 'New Sale',
      description: 'Start a new transaction',
      icon: 'cart',
      screen: 'sell',
      color: 'bg-secondary',
    },
    {
      title: 'View Products',
      description: 'Check product availability',
      icon: 'cube',
      screen: 'products',
      color: 'bg-secondary',
    },

  ];

  const StatCard = ({ title, value, description, icon, color = 'text-muted' }) => (
    <View className={`rounded-lg p-4  ${color}`}>
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-sm font-medium text-muted -foreground">
          {title}
        </Text>
        <Ionicons name={icon} size={20} className={color} />
      </View>
      <Text className="text-2xl font-bold text-muted mb-1">
        {value}
      </Text>
      <Text className="text-xs text-muted">
        {description}
      </Text>
    </View>
  );

  const renderSaleItem = (sale) => (
    <View key={sale.id} className="border border-border rounded-lg p-4 mb-3">
      <View className="flex-row justify-between items-start mb-3">
        <View>
          <Text className="font-semibold text-foreground text-base">
            Receipt #{sale.id}
          </Text>
          <Text className="text-muted-foreground text-sm">
            {new Date(sale.date).toLocaleTimeString()}
          </Text>
        </View>
        <View className="bg-blue-100 px-2 py-1 rounded-full">
          <Text className="text-blue-800 text-xs font-medium capitalize">
            {sale.paymentMethod}
          </Text>
        </View>
      </View>
      
      {/* Product details */}
      <View className="mb-2">
        <View className="flex-row justify-between">
          <Text className="text-muted-foreground text-sm">
            {sale.quantity}x {sale.productName}
          </Text>
          <Text className="text-foreground text-sm">
            ${(sale.quantity * sale.price).toFixed(2)}
          </Text>
        </View>
      </View>
      
      <View className="flex-row justify-between font-semibold pt-2 border-t border-border">
        <Text className="text-foreground">Total</Text>
        <Text className="text-accent text-lg">${sale.total.toFixed(2)}</Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1">
        <View className="p-4 md:p-6 space-y-6">
          {/* Header */}
          <View className="hidden">
            <Text className="text-2xl md:text-3xl font-bold text-foreground">
              Welcome, {user?.name}!
            </Text>
            <Text className="text-sm md:text-base text-muted-foreground">
              Today's Activity
            </Text>
          </View>

          {/* Quick Stats */}
          <View className="flex-row flex-row justify-between gap-4">
            <View className="w-[48%]">
              <StatCard
                title="Receipts Today"
                value={todayReceiptsCount}
                description="Total transactions"
                icon="receipt"
                color="text-muted bg-accent"
              />
            </View>
            <View className="w-[48%]">
              <StatCard
                title="Sales Amount"
                value={`$${todaySalesAmount.toFixed(2)}`}
                description="Total revenue today"
                icon="cash"
                color="text-muted bg-primary"
              />
            </View>
          </View>

          {/* Quick Actions */}
          <View>
            <Text className="text-lg font-bold text-foreground mb-3">
              Quick Actions
            </Text>
            <View className="flex-row flex-wrap justify-between gap-3">
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  className={`${action.color} rounded-lg p-4 w-[48%]  active:opacity-80`}
                >
                  <View className="items-start">
                    <Ionicons 
                      name={action.icon} 
                      size={32} 
                      className="text-secondary-foreground mb-2 hidden" 
                    />
                    <Text className="text-secondary-foreground font-semibold text-start text-sm">
                      {action.title}
                    </Text>
                    <Text className="text-secondary-foreground text-xs text-start mt-1">
                      {action.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Alerts */}
          {lowStockProducts.length < 10 && (
            <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <View className="flex-row items-center mb-2">
                <Ionicons name="warning" size={20} className="text-yellow-600 mr-2" />
                <Text className="text-yellow-800 font-semibold">
                  Low Stock Alert
                </Text>
              </View>
              <Text className="text-yellow-700 text-sm">
                {lowStockProducts.length} product{lowStockProducts.length > 1 ? 's' : ''} running low on stock
              </Text>
            </View>
          )}

          {/* Today's Tickets */}
          <View className="bg-card rounded-lg p-4 border border-border">
            <Text className="text-lg font-bold text-foreground mb-4">
              Today's Tickets
            </Text>
            
            {todaySales.length === 0 ? (
              <View className="items-center py-8">
                <Ionicons name="receipt-outline" size={48} className="text-muted-foreground mb-3" />
                <Text className="text-muted-foreground text-center mb-2">
                  No sales yet today.
                </Text>
                <Text className="text-muted-foreground text-center">
                  Start selling to see your transactions here!
                </Text>
                <TouchableOpacity className="bg-accent rounded-lg px-6 py-3 mt-4">
                  <Text className="text-accent-foreground font-semibold">
                    Start New Sale
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="max-h-80">
                <ScrollView 
                  showsVerticalScrollIndicator={false}
                  className="pr-2"
                >
                  {todaySales.map(renderSaleItem)}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Performance Summary */}
          <View className="bg-primary rounded-lg p-4">
            <Text className="text-lg font-semibold text-primary-foreground mb-3">
              Today's Performance
            </Text>
            <View className="space-y-3">
              <View className="flex-row justify-between">
                <Text className="text-primary-foreground">Transactions</Text>
                <Text className="text-primary-foreground font-bold">
                  {todayReceiptsCount}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-primary-foreground">Total Revenue</Text>
                <Text className="text-primary-foreground font-bold">
                  ${todaySalesAmount.toFixed(2)}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-primary-foreground">Average Sale</Text>
                <Text className="text-primary-foreground font-bold">
                  ${todayReceiptsCount > 0 ? (todaySalesAmount / todayReceiptsCount).toFixed(2) : '0.00'}
                </Text>
              </View>
              <View className="flex-row justify-between border-t border-primary-foreground/20 pt-2">
                <Text className="text-primary-foreground font-bold">Performance</Text>
                <Text className={`font-bold text-lg ${
                  todaySalesAmount > 500 ? 'text-green-300' : 
                  todaySalesAmount > 200 ? 'text-yellow-300' : 'text-red-300'
                }`}>
                  {todaySalesAmount > 500 ? 'Excellent' : 
                   todaySalesAmount > 200 ? 'Good' : 'Getting Started'}
                </Text>
              </View>
            </View>
          </View>

          {/* Recent Activity */}
          <View className="bg-card rounded-lg p-4 shadow-sm">
            <Text className="text-lg font-bold text-foreground mb-3">
              Recent Activity
            </Text>
            <View className="space-y-3">
              {todaySales.slice(0, 3).map((sale, index) => (
                <View key={sale.id} className="flex-row items-center p-3 bg-secondary rounded-lg">
                  <View className="bg-accent rounded-full p-2 mr-3">
                    <Ionicons name="cart" size={16} className="text-accent-foreground" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-medium text-foreground">
                      Sale #{sale.id}
                    </Text>
                    <Text className="text-muted-foreground text-xs">
                      {new Date(sale.date).toLocaleTimeString()} • {sale.paymentMethod}
                    </Text>
                  </View>
                  <Text className="font-bold text-accent">
                    ${sale.total.toFixed(2)}
                  </Text>
                </View>
              ))}
              
              {todaySales.length === 0 && (
                <View className="items-center py-4">
                  <Ionicons name="time-outline" size={32} className="text-muted-foreground mb-2" />
                  <Text className="text-muted-foreground text-center">
                    No recent activity
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default CashierHome;