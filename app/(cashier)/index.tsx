// app/(cashier)/index.js
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Ionicons as IoniconsType } from '@expo/vector-icons';
import { useAppSelector } from '../../store/hooks';
import type { SaleRecord } from '../../store/types';

// Correct Ionicon type
type IoniconName = keyof typeof Ionicons.glyphMap;

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: IoniconName;
  variant: 'dark' | 'accent';
}

const CashierHome = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { sales, products } = useAppSelector((state) => state.user);

  const today = new Date().toDateString();

  // Filter today's sales by cashier
  const todaySales = sales.filter(
    (sale) => sale.cashier === user?.name && new Date(sale.date).toDateString() === today
  );

  // Stats
  const todayReceiptsCount = todaySales.length;
  const todaySalesAmount = todaySales.reduce((sum, sale) => sum + sale.total, 0);

  // Low stock products
  const lowStockProducts = products.filter((p) => p.stock < 10);

  // Quick Actions
  const quickActions = [
    { title: 'New Sale', description: 'Start a new transaction', icon: 'cart', screen: 'sell' },
    { title: 'View Products', description: 'Check product availability', icon: 'cube', screen: 'products' }
  ];

  const StatCard = ({ title, value, description, icon, variant }: StatCardProps) => {
    const isDark = variant === 'dark';
    const isAccent = variant === 'accent';

    return (
      <View
        style={[
          styles.statCard,
        ]}
      >
        <View style={styles.statCardHeader}>
          <Text style={[styles.statTitle]}>
            {title}
          </Text>

          <Ionicons
            name={icon as IoniconName}
            size={20}
            color={'#6b7280'}
          />
        </View>

        <Text style={[styles.statValue,]}>
          {value}
        </Text>

        <Text
          style={[
            styles.statDescription,

          ]}
        >
          {description}
        </Text>
      </View>
    );
  };

  const renderSaleItem = (sale: SaleRecord) => {
    const item = sale.items?.[0];
    const qty = sale.quantity ?? item?.quantity ?? 0;
    const name = sale.productName ?? item?.productName ?? 'Item';
    const price = sale.price ?? item?.price ?? 0;
    const subtotal = item?.subtotal ?? qty * price;

    return (
      <View key={sale.id} style={styles.saleItem}>
        <View style={styles.saleHeader}>
          <View>
            <Text style={styles.receiptId}>Receipt #{sale.id}</Text>
            <Text style={styles.receiptTime}>
              {new Date(sale.date).toLocaleTimeString()}
            </Text>
          </View>

          <View style={styles.paymentBadge}>
            <Text style={styles.paymentBadgeText}>{sale.paymentMethod}</Text>
          </View>

          <Text style={styles.saleTotal}>${sale.total.toFixed(2)}</Text>
        </View>

        <View style={styles.productRow}>
          <Text style={styles.productText}>{qty}x {name}</Text>
          <Text style={styles.productSubtotal}>${subtotal.toFixed(2)}</Text>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${sale.total.toFixed(2)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>



        {/* Quick Stats */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            marginTop: 16,
            marginBottom: 16,
            gap: 10,
            
          }}
        >
          <StatCard
            title="Receipts Today"
            value={String(todayReceiptsCount)}
            description="Total transactions"
            icon="receipt"
            variant="accent"
          />

          <StatCard
            title="Sales Amount"
            value={`$${todaySalesAmount.toFixed(2)}`}
            description="Total revenue today"
            icon="cash"
            variant="dark"
          />
        </ScrollView>


        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          {quickActions.map((action, i) => (
            <TouchableOpacity key={i} style={styles.quickActionCard}>

              <Text style={styles.quickActionTitle}>{action.description}</Text>
              {/* <Text style={styles.quickActionDescription}>{action.description}</Text> */}
              <Ionicons name='chevron-forward-outline' size={24} style={{
                 color: '#0f172a',
              }}/>
            </TouchableOpacity>
          ))}
        </View>

        {/* Low Stock */}
        {lowStockProducts.length > 0 && (
          <View style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <Ionicons name="warning" size={20} color="#f97316" />
              <Text style={styles.alertTitle}>Low Stock Alert</Text>
            </View>
            <Text style={styles.alertText}>
              {lowStockProducts.length} product{lowStockProducts.length > 1 && 's'} running low
            </Text>
          </View>
        )}

        {/* Today's Tickets */}
        <View style={styles.ticketsCard}>
          <Text style={styles.ticketsTitle}>Today's Tickets</Text>

          {todaySales.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyTitle}>No sales yet today.</Text>
              <Text style={styles.emptySubtitle}>Start selling to see your transactions here!</Text>

              <TouchableOpacity style={styles.startSaleButton}>
                <Text style={styles.startSaleButtonText}>Start New Sale</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ maxHeight: 400 }}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {todaySales.map(renderSaleItem)}
              </ScrollView>
            </View>
          )}
        </View>

        

        {/* Recent Activity */}
        <View style={styles.recentCard}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>

          {todaySales.length > 0 ? (
            todaySales.slice(0, 3).map((sale) => (
              <View key={sale.id} style={styles.recentItem}>
                <View style={styles.recentIcon}>
                  <Ionicons name="cart" size={16} color="#fff" />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.recentSaleId}>Sale #{sale.id}</Text>
                  <Text style={styles.recentMeta}>
                    {new Date(sale.date).toLocaleTimeString()} • {sale.paymentMethod}
                  </Text>
                </View>

                <Text style={styles.recentTotal}>${sale.total.toFixed(2)}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyRecent}>
              <Ionicons name="time-outline" size={32} color="#9ca3af" />
              <Text style={styles.emptyTitle}>No recent activity</Text>
            </View>
          )}
        </View>

      </ScrollView>
    </View>
  );
};

/* ------------------- CLEAN STYLES ------------------- */
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff'
  },

  scrollContainer: {
    padding: 16
  },

  /* -------- Header -------- */
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a'
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4
  },

  /* -------- Stats -------- */
  statsRow: {
    marginTop: 16,
    marginBottom: 16,
    gap: 10,
    flex: 1
  },

  statCard: {
    width: 280,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e6edf3'
  },


  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },

  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280'
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6b7280',
    marginBottom: 4
  },
  statDescription: {
    fontSize: 12,
    color: '#6b7280'
  },

  statTextLight: {
    color: '#ffffff'
  },
  statDescriptionLight: {
    color: '#ffffff',
    opacity: 0.9
  },

  /* -------- Section Titles -------- */
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12
  },

  /* -------- Quick Actions -------- */
  quickActionsRow: {

  },
  quickActionCard: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    borderColor: '#e6edf3',
    marginBottom: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 8
  },
  quickActionDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2
  },

  /* -------- Alerts -------- */
  alertCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    borderColor: '#f97316',
    marginTop: 16
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 6,
    color: '#0f172a'
  },
  alertText: {
    fontSize: 14,
    color: '#6b7280'
  },

  /* -------- Tickets -------- */
  ticketsCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e6edf3',
    marginTop: 16
  },
  ticketsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: '#0f172a'
  },

  saleItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb'
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center'
  },
  receiptId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a'
  },
  receiptTime: {
    fontSize: 14,
    color: '#6b7280'
  },
  paymentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#eef2ff',
    borderRadius: 6
  },
  paymentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a'
  },
  saleTotal: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f97316'
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  productText: {
    fontSize: 14,
    color: '#6b7280'
  },
  productSubtotal: {
    fontSize: 14,
    color: '#0f172a'
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  totalLabel: {
    color: '#0f172a'
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f97316'
  },

  /* -------- Empty State -------- */
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 8
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4
  },
  startSaleButton: {
    marginTop: 16,
    backgroundColor: '#f97316',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24
  },
  startSaleButtonText: {
    color: '#fff',
    fontWeight: '600'
  },

  /* -------- Performance -------- */
  performanceCard: {
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 12,
    marginTop: 16
  },
  performanceTitle: {
    color: '#ffffff',
    fontSize: 18,
    marginBottom: 12
  },
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  performanceLabel: {
    color: '#ffffff'
  },
  performanceValue: {
    color: '#ffffff',
    fontWeight: '700'
  },
  performanceBadge: {
    fontWeight: '700',
    fontSize: 18
  },
  perfExcellent: {
    color: '#86efac'
  },
  perfGood: {
    color: '#fde047'
  },
  perfLow: {
    color: '#fca5a5'
  },

  /* -------- Recent -------- */
  recentCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e6edf3',
    marginTop: 16
  },

  recentItem: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  recentIcon: {
    backgroundColor: '#f97316',
    padding: 8,
    borderRadius: 50,
    marginRight: 10
  },
  recentSaleId: {
    color: '#0f172a',
    fontWeight: '600'
  },
  recentMeta: {
    fontSize: 12,
    color: '#6b7280'
  },
  recentTotal: {
    fontWeight: '700',
    color: '#f97316'
  },

  emptyRecent: {
    alignItems: 'center',
    paddingVertical: 20
  }
});

export default CashierHome;
