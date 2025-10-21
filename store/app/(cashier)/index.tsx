// app/(cashier)/index.js
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';

export default function CashierHome() {
  const { user } = useSelector(state => state.auth);
  const { products, sales } = useSelector(state => state.user);

  const lowStockProducts = products.filter(p => p.stock < 10);
  const todaySales = sales.filter(s => {
    const saleDate = new Date(s.date);
    const today = new Date();
    return saleDate.toDateString() === today.toDateString();
  });

  return (
    <ScrollView className="flex-1 bg-background p-4">
      <Text className="text-2xl font-bold text-primary mb-6 text-center">
        Welcome, {user?.name}!
      </Text>

      <View className="space-y-6">
        {/* Stats Cards */}
        <View className="flex-row justify-between">
          <View className="bg-primary p-4 rounded-lg flex-1 mr-2 items-center justify-center">
            <Text className="text-muted text-lg font-semibold">
              Today's Sales
            </Text>
            <Text className="text-orange-400 text-2xl font-bold">
              ${todaySales.reduce((sum, sale) => sum + sale.total, 0)}
            </Text>
          </View>
          
          <View className="bg-primary p-4 rounded-lg flex-1 mr-2 items-center justify-center">
            <Text className="text-muted text-lg font-semibold">
              Low Stock
            </Text>
            <Text className="text-orange-400 text-2xl font-bold">
              {lowStockProducts.length}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View>
          <Text className="text-xl font-semibold text-primary-navy-dark mb-4">
            Quick Actions
          </Text>
          <View className="flex flex-row  gap-4 w-full ">
            <TouchableOpacity className="border bg-white border-muted-foreground p-3 rounded-lg w-1/2  ">
              <Text className="text-muted-foreground text-center font-semibold text-lg">
                New Sale
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="border w-1/2 bg-white border-muted-foreground p-3 rounded-lg">
              <Text className="text-muted-foreground text-lg text-center font-semibold">
                View Products
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Sales */}
        <View>
          <Text className="text-xl font-semibold text-primary-navy-dark mb-4">
            Recent Sales
          </Text>
          {todaySales.slice(0, 5).map((sale) => (
            <View key={sale.id} className="bg-secondary p-4 rounded-lg mb-2">
              <Text className="text-primary-navy-dark font-semibold">
                {sale.productName}
              </Text>
              <Text className="text-primary-orange-400">
                ${sale.total} • {new Date(sale.date).toLocaleTimeString()}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}