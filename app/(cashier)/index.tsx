// app/(cashier)/index.js
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../../store/hooks';
import type { SaleRecord } from '../../store/types';

const CashierHome = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { sales, products } = useAppSelector((state) => state.user);

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

  const StatCard = ({ title, value, description, icon, color = 'text-muted' }: { title: string, value: string, description: string, icon: string, color: string }) => (
    <View className={`rounded-lg p-4  ${color}`}>
      <View style={styles.s_1}>
        <Text style={styles.s_2}>{title}</Text>
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} className={color} />
      </View>
      <Text style={styles.s_3}>{value}</Text>
      <Text style={styles.s_4}>{description}</Text>
    </View>
  );

  const renderSaleItem = (sale: SaleRecord) => {
    const primaryItem = sale.items?.[0];
    const itemQuantity = sale.quantity ?? primaryItem?.quantity ?? 0;
    const itemName = sale.productName ?? primaryItem?.productName ?? 'Item';
    const itemPrice = sale.price ?? primaryItem?.price ?? 0;
    const itemSubtotal = primaryItem?.subtotal ?? itemQuantity * itemPrice;

    return (
      <View key={sale.id} style={styles.s_5}>
        <View className="flex-row justify-between items-center ">
          <View>
            <Text style={styles.s_7}>
              Receipt  #{sale.id}
            </Text>
            <Text style={styles.s_8}>
              {new Date(sale.date).toLocaleTimeString()}
            </Text>
          </View>
          <View style={styles.s_9}>
            <Text style={styles.s_10}>
              {sale.paymentMethod}
            </Text>
          </View>
      
        <View>
           <Text style={styles.s_11}>${sale.total.toFixed(2)}</Text>
        </View>
        </View>
      
        {/* Product details */}
        <View style={styles.s_12}>
          <View style={styles.s_13}>
            <Text style={styles.s_8}>
              {itemQuantity}x {itemName}
            </Text>
            <Text style={styles.s_14}>
              ${itemSubtotal.toFixed(2)}
            </Text>
          </View>
        </View>
      
        <View style={styles.s_15}>
          <Text style={styles.s_16}>Total</Text>
          <Text style={styles.s_17}>${sale.total.toFixed(2)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.s_18}>
      <ScrollView style={styles.s_19}>
        <View style={styles.s_20}>
          {/* Header */}
          <View>
            <Text style={styles.s_21}>
              Welcome, {user?.name}!
            </Text>
            <Text style={styles.s_22}>
              Today's Activity
            </Text>
          </View>

          {/* Quick Stats */}
          <View style={styles.s_23}>
            <View style={styles.s_24}>
              <StatCard
                title="Receipts Today"
                value={todayReceiptsCount.toString()}
                description="Total transactions"
                icon="receipt"
                color="text-muted bg-accent"
              />
            </View>
            <View style={styles.s_24}>
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
            <Text style={styles.s_25}>
              Quick Actions
            </Text>
            <View style={styles.s_26}>
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  className={`${action.color} rounded-lg p-4 w-[48%]  active:opacity-80`}
                >
                  <View style={styles.s_27}>
                    <Ionicons 
                      name={action.icon as keyof typeof Ionicons.glyphMap} 
                      size={32} 
                      style={styles.s_28} 
                    />
                    <Text style={styles.s_29}>
                      {action.title}
                    </Text>
                    <Text style={styles.s_30}>
                      {action.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Alerts */}
          {lowStockProducts.length < 10 && (
            <View style={styles.s_31}>
              <View style={styles.s_32}>
                <Ionicons name="warning" size={20} style={styles.s_33} />
                <Text style={styles.s_34}>
                  Low Stock Alert
                </Text>
              </View>
              <Text style={styles.s_35}>
                {lowStockProducts.length} product{lowStockProducts.length > 1 ? 's' : ''} running low on stock
              </Text>
            </View>
          )}

          {/* Today's Tickets */}
          <View className="bg-card p-4 rounded-lg border border-border divide-y divide-border ">
            <Text className="text-lg font-bold text-foreground mb-4 ">
              Today's Tickets
            </Text>
            
            {todaySales.length === 0 ? (
              <View style={styles.s_38}>
                <Ionicons name="receipt-outline" size={48} style={styles.s_39} />
                <Text style={styles.s_40}>
                  No sales yet today.
                </Text>
                <Text style={styles.s_41}>
                  Start selling to see your transactions here!
                </Text>
                <TouchableOpacity style={styles.s_42}>
                  <Text style={styles.s_43}>
                    Start New Sale
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.s_44}>
                <ScrollView 
                  showsVerticalScrollIndicator={false}
                  className="divide-y divide-border border-0 "
                >
                  {todaySales.map(renderSaleItem)}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Performance Summary */}
          <View style={styles.s_46}>
            <Text style={styles.s_47}>
              Today's Performance
            </Text>
            <View style={styles.s_48}>
              <View style={styles.s_13}>
                <Text style={styles.s_49}>Transactions</Text>
                <Text style={styles.s_50}>
                  {todayReceiptsCount}
                </Text>
              </View>
              <View style={styles.s_13}>
                <Text style={styles.s_49}>Total Revenue</Text>
                <Text style={styles.s_50}>
                  ${todaySalesAmount.toFixed(2)}
                </Text>
              </View>
              <View style={styles.s_13}>
                <Text style={styles.s_49}>Average Sale</Text>
                <Text style={styles.s_50}>
                  ${todayReceiptsCount > 0 ? (todaySalesAmount / todayReceiptsCount).toFixed(2) : '0.00'}
                </Text>
              </View>
              <View style={styles.s_51}>
                <Text style={styles.s_50}>Performance</Text>
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
          <View style={styles.s_52}>
            <Text style={styles.s_25}>
              Recent Activity
            </Text>
            <View style={styles.s_48}>
              {todaySales.slice(0, 3).map((sale, index) => (
                <View key={sale.id} style={styles.s_53}>
                  <View style={styles.s_54}>
                    <Ionicons name="cart" size={16} style={styles.s_55} />
                  </View>
                  <View style={styles.s_19}>
                    <Text style={styles.s_56}>
                      Sale #{sale.id}
                    </Text>
                    <Text style={styles.s_57}>
                      {new Date(sale.date).toLocaleTimeString()} • {sale.paymentMethod}
                    </Text>
                  </View>
                  <Text style={styles.s_58}>
                    ${sale.total.toFixed(2)}
                  </Text>
                </View>
              ))}
              
              {todaySales.length === 0 && (
                <View style={styles.s_59}>
                  <Ionicons name="time-outline" size={32} style={styles.s_60} />
                  <Text style={styles.s_41}>
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



const styles = StyleSheet.create({
  s_1: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 8
},

  s_2: {
  fontSize: 14,
  fontWeight: "600",
  color: "#6b7280"
},

  s_3: {
  fontSize: 24,
  fontWeight: "700",
  color: "#6b7280"
},

  s_4: {
  fontSize: 12
},

  s_5: {
  padding: 16,
  borderColor: "#e6edf3"
},

  s_6: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center"
},

  s_7: {
  color: "#0f172a"
},

  s_8: {
  color: "#6b7280",
  fontSize: 14
},

  s_9: {},

  s_10: {
  fontSize: 12,
  fontWeight: "600"
},

  s_11: {
  fontSize: 20,
  fontWeight: "700"
},

  s_12: {
  marginBottom: 8
},

  s_13: {
  flexDirection: "row",
  justifyContent: "space-between"
},

  s_14: {
  color: "#0f172a",
  fontSize: 14
},

  s_15: {
  flexDirection: "row",
  justifyContent: "space-between",
  borderColor: "#e6edf3"
},

  s_16: {
  color: "#0f172a"
},

  s_17: {
  color: "#f97316",
  fontSize: 18
},

  s_18: {
  flex: 1,
  backgroundColor: "#ffffff"
},

  s_19: {
  flex: 1
},

  s_20: {
  padding: 16
},

  s_21: {
  fontSize: 24,
  fontWeight: "700",
  color: "#0f172a"
},

  s_22: {
  fontSize: 14,
  color: "#6b7280"
},

  s_23: {
  flexDirection: "row",
  justifyContent: "space-between",
  gap: 16
},

  s_24: {
  width: "48%"
},

  s_25: {
  fontSize: 18,
  fontWeight: "700",
  color: "#0f172a",
  marginBottom: 12
},

  s_26: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between"
},

  s_27: {
  alignItems: "flex-start"
},

  s_28: {
  marginBottom: 8,
  display: "none"
},

  s_29: {
  fontSize: 14
},

  s_30: {
  color: "#6b7280",
  fontSize: 12
},

  s_31: {
  borderWidth: 1,
  borderRadius: 12,
  padding: 16
},

  s_32: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 8
},

  s_33: {},

  s_34: {},

  s_35: {
  fontSize: 14
},

  s_36: {
  backgroundColor: "#ffffff",
  padding: 16,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: "#e6edf3"
},

  s_37: {
  fontSize: 18,
  fontWeight: "700",
  color: "#0f172a",
  marginBottom: 16
},

  s_38: {
  alignItems: "center"
},

  s_39: {
  color: "#6b7280",
  marginBottom: 12
},

  s_40: {
  color: "#6b7280",
  marginBottom: 8
},

  s_41: {
  color: "#6b7280"
},

  s_42: {
  backgroundColor: "#f97316",
  borderRadius: 12,
  paddingVertical: 12,
  marginTop: 16
},

  s_43: {},

  s_44: {},

  s_45: {},

  s_46: {
  backgroundColor: "#0f172a",
  borderRadius: 12,
  padding: 16
},

  s_47: {
  fontSize: 18,
  color: "#ffffff",
  marginBottom: 12
},

  s_48: {},

  s_49: {
  color: "#ffffff"
},

  s_50: {
  color: "#ffffff",
  fontWeight: "700"
},

  s_51: {
  flexDirection: "row",
  justifyContent: "space-between"
},

  s_52: {
  backgroundColor: "#ffffff",
  borderRadius: 12,
  padding: 16,
  borderWidth: 1,
  borderColor: "#e6edf3"
},

  s_53: {
  flexDirection: "row",
  alignItems: "center",
  padding: 12,
  backgroundColor: "#f3f4f6",
  borderRadius: 12
},

  s_54: {
  backgroundColor: "#f97316",
  padding: 8
},

  s_55: {},

  s_56: {
  fontWeight: "600",
  color: "#0f172a"
},

  s_57: {
  color: "#6b7280",
  fontSize: 12
},

  s_58: {
  fontWeight: "700",
  color: "#f97316"
},

  s_59: {
  alignItems: "center"
},

  s_60: {
  color: "#6b7280",
  marginBottom: 8
}
});
export default CashierHome;