// app/(cashier)/index.js
import { useEffect, useMemo, useState } from 'react';
import { Alert, View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, RefreshControl, ActivityIndicator, FlatList, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { Product, SaleRecord } from '../../store/types';
import { fetchOperationalData } from '../../store/slices/userSlice';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  buildPrintableReceiptFromSale,
  isSilentPrintFailure,
  printReceiptDocument,
} from '../../services/receiptPrinter';
import { getPrinterPreferenceScope } from '../../services/printerPreferences';
import {
  ADMIN_BUTTON_CONTENT,
  ADMIN_BUTTON_TEXT,
  ADMIN_COLORS,
  ADMIN_DETAIL_LABEL,
  ADMIN_DETAIL_ROW,
  ADMIN_DETAIL_VALUE,
  ADMIN_INPUT_SURFACE,
  ADMIN_LIST_CARD,
  ADMIN_MODAL_HEADER,
  ADMIN_MODAL_SECTION,
  ADMIN_PAGE_SUBTITLE,
  ADMIN_PAGE_TITLE,
  ADMIN_PRIMARY_BUTTON,
  ADMIN_PRIMARY_BUTTON_DISABLED,
  ADMIN_SECONDARY_BUTTON,
  ADMIN_SECONDARY_BUTTON_TEXT,
  ADMIN_SECTION_CARD,
  ADMIN_SECTION_SUBTITLE,
  ADMIN_SECTION_TITLE,
  ADMIN_STAT_CARD,
} from '../../theme/adminUi';

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
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const { sales, products, currentStore } = useAppSelector((state) => state.user);
  const [selectedReceipt, setSelectedReceipt] = useState<SaleRecord | null>(null);
  const [isProductsModalOpen, setIsProductsModalOpen] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPrintingReceipt, setIsPrintingReceipt] = useState(false);

  useEffect(() => {
    if (!user?.businessId) return;
    dispatch(fetchOperationalData(user.businessId));
  }, [dispatch, user?.businessId]);

  const handleRefresh = async () => {
    if (!user?.businessId) return;
    setIsRefreshing(true);
    try {
      await dispatch(fetchOperationalData(user.businessId));
    } finally {
      setIsRefreshing(false);
    }
  };

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

  const filteredProducts = useMemo(() => {
    const query = productSearchQuery.trim().toLowerCase();
    if (!query) return products;

    return products.filter((product) => {
      const searchableValues = [
        product.name,
        product.category,
        product.sku,
        product.barcode ?? '',
        product.supplier ?? '',
      ];

      return searchableValues.some((value) => value.toLowerCase().includes(query));
    });
  }, [productSearchQuery, products]);

  const openProductsModal = () => {
    setProductSearchQuery('');
    setIsProductsModalOpen(true);
  };

  // Quick Actions
  const quickActions = [
    {
      title: 'New Sale',
      description: 'Start a new transaction',
      icon: 'cart',
      action: () => router.push('/(cashier)/sell'),
    },
    {
      title: 'View Products',
      description: 'Search and review available products',
      icon: 'cube',
      action: openProductsModal,
    },
  ];

  const StatCard = ({ title, value, description, icon, variant }: StatCardProps) => {
    return (
      <View
        style={[
          styles.statCard,
          { backgroundColor: variant === 'accent' ? '#fff7ed' : '#f8fafc' },
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
    const qty = Number(sale.quantity ?? item?.quantity ?? 0);
    const name = sale.productName ?? item?.productName ?? 'Item';
    const price = Number(sale.price ?? item?.price ?? 0);
    const subtotal = Number(item?.subtotal ?? qty * price);

    return (
      <TouchableOpacity key={sale.id} onPress={() => setSelectedReceipt(sale)}>

        <View style={styles.saleItem}>
          <View style={styles.saleHeader}>
            <View>
              <Text style={styles.receiptId}>{sale.invoiceNumber || `Receipt #${sale.id}`}</Text>
              <Text style={styles.receiptTime}>
                {new Date(sale.date).toLocaleTimeString()}
              </Text>
            </View>

            <View style={styles.paymentBadge}>
              <Text style={styles.paymentBadgeText}>{sale.paymentMethod}</Text>
            </View>


          </View>

          <View style={styles.productRow}>
            <Text style={styles.productText}>{qty}x Items</Text>
            <Text style={styles.totalValue}>${sale.total.toFixed(2)}</Text>
          </View>
        </View>


      </TouchableOpacity>
    );
  };

  const handlePrintReceipt = async (sale: SaleRecord) => {
    setIsPrintingReceipt(true);
    try {
      await printReceiptDocument(
        buildPrintableReceiptFromSale(sale, {
          fallbackCashier: user?.name,
          business: {
            name: currentStore?.name || user?.businessName || 'KC POS',
            address: currentStore?.address,
            phone: currentStore?.phone,
            email: currentStore?.email,
          },
        }),
        {
          preferenceScope: getPrinterPreferenceScope(user?.businessId, user?.id),
        },
      );
    } catch (error) {
      if (!isSilentPrintFailure(error)) {
        const message = error instanceof Error ? error.message : 'Failed to print receipt';
        Alert.alert('Printing Error', message);
      }
    } finally {
      setIsPrintingReceipt(false);
    }
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    const isOutOfStock = item.stock <= 0;
    const isLowStock = !isOutOfStock && item.stock < (item.minStockLevel || 10);
    const badgeStyle = isOutOfStock
      ? styles.outOfStockBadge
      : isLowStock
        ? styles.lowStockBadge
        : styles.inStockBadge;
    const badgeTextStyle = isOutOfStock
      ? styles.outOfStockBadgeText
      : isLowStock
        ? styles.lowStockBadgeText
        : styles.inStockBadgeText;
    const badgeLabel = isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock';

    return (
      <View style={styles.catalogCard}>
        <View style={styles.catalogCardHeader}>
          <View style={styles.catalogTitleBlock}>
            <Text style={styles.catalogProductName}>{item.name}</Text>
            <Text style={styles.catalogProductMeta}>
              {item.category} • {item.sku}
            </Text>
          </View>
          <Text style={styles.catalogProductPrice}>${item.price.toFixed(2)}</Text>
        </View>

        <View style={styles.catalogCardFooter}>
          <View style={styles.catalogInfoStack}>
            <Text style={styles.catalogDetailText}>Supplier: {item.supplier || 'Not specified'}</Text>
            <Text style={styles.catalogDetailText}>
              Stock: {item.stock}
              {item.barcode ? ` • Barcode: ${item.barcode}` : ''}
            </Text>
          </View>
          <View style={[styles.catalogStockBadge, badgeStyle]}>
            <Text style={[styles.catalogStockBadgeText, badgeTextStyle]}>{badgeLabel}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#f97316" />
        }
      >
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>Cashier Dashboard</Text>
          <Text style={styles.headerSubtitle}>Track your day, review receipts, and jump back into selling fast.</Text>
        </View>

        <View style={styles.statsGrid}>
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
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <Text style={styles.sectionSubtitle}>Use the cashier tools you reach for most.</Text>
          <View style={styles.quickActionsRow}>
            {quickActions.map((action, i) => (
              <TouchableOpacity key={i} style={styles.quickActionCard} onPress={action.action}>
                <View style={styles.quickActionCopy}>
                  <Text style={styles.quickActionTitle}>{action.title}</Text>
                  <Text style={styles.quickActionDescription}>{action.description}</Text>
                </View>
                <Ionicons name='chevron-forward-outline' size={22} color={ADMIN_COLORS.tertiaryText} />
              </TouchableOpacity>
            ))}
          </View>
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
          <Text style={styles.ticketsTitle}>Today&apos;s Tickets</Text>
          <Text style={styles.sectionSubtitle}>Tap a receipt to review its details or print it again.</Text>

          {todaySales.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyTitle}>No sales yet today.</Text>
              <Text style={styles.emptySubtitle}>Start selling to see your transactions here!</Text>

              <TouchableOpacity style={styles.startSaleButton} onPress={() => router.push('/(cashier)/sell')}>
                <Text style={styles.startSaleButtonText}>Start New Sale</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View >
              <ScrollView showsVerticalScrollIndicator={false}>
                {todaySales.map(renderSaleItem)}
              </ScrollView>
            </View>
          )}
        </View>



        {/* Recent Activity */}
        <View style={styles.recentCard}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Text style={styles.sectionSubtitle}>Your latest sales from today&apos;s shift.</Text>

          {todaySales.length > 0 ? (
            todaySales.slice(0, 3).map((sale) => (
              <View key={sale.id} style={styles.recentItem}>
                <View style={styles.recentIcon}>
                  <Ionicons name="cart" size={16} color="#fff" />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.recentSaleId}>{sale.invoiceNumber || `Sale #${sale.id}`}</Text>
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

      <Modal
        visible={Boolean(selectedReceipt)}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedReceipt(null)}
      >
        <SafeAreaView style={styles.receiptModalPage} edges={['top', 'bottom']}>
          <View style={styles.receiptModalHeader}>
            <Text style={styles.ticketsTitle}>Receipt Details</Text>
            <TouchableOpacity style={styles.closeIconButton} onPress={() => setSelectedReceipt(null)}>
              <Ionicons name="close" size={24} color={ADMIN_COLORS.text} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.receiptModalContent}>
            {selectedReceipt && (
              <>
                <View style={styles.receiptDetailsCard}>
                  <View style={styles.detailLine}>
                    <Text style={styles.detailLineLabel}>Invoice</Text>
                    <Text style={styles.detailLineValue}>{selectedReceipt.invoiceNumber || selectedReceipt.id}</Text>
                  </View>
                  <View style={styles.detailLine}>
                    <Text style={styles.detailLineLabel}>Date</Text>
                    <Text style={styles.detailLineValue}>{new Date(selectedReceipt.date).toLocaleString()}</Text>
                  </View>
                  <View style={styles.detailLine}>
                    <Text style={styles.detailLineLabel}>Cashier</Text>
                    <Text style={styles.detailLineValue}>{selectedReceipt.cashier}</Text>
                  </View>
                  <View style={styles.detailLine}>
                    <Text style={styles.detailLineLabel}>Payment</Text>
                    <Text style={styles.detailLineValue}>{selectedReceipt.paymentMethod}</Text>
                  </View>
                  <View style={[styles.detailLine, styles.detailLineLast]}>
                    <Text style={styles.detailLineLabel}>Total</Text>
                    <Text style={[styles.detailLineValue, styles.detailLineAccent]}>${selectedReceipt.total.toFixed(2)}</Text>
                  </View>
                </View>
                <View style={styles.itemsWrapper}>
                  <Text style={styles.itemsTitle}>Items</Text>
                  {(selectedReceipt.items?.length ? selectedReceipt.items : [{
                    productId: selectedReceipt.productId ?? 0,
                    productName: selectedReceipt.productName ?? 'Item',
                    quantity: selectedReceipt.quantity ?? 0,
                    price: selectedReceipt.price ?? 0,
                    subtotal: selectedReceipt.total ?? 0,
                    unitType: 'single' as const,
                    packSize: undefined,
                  }]).map((line, index) => (
                    <View key={`${line.productId}-${index}`} style={styles.modalItemRow}>
                      <View style={styles.detailLine}>
                        <Text style={styles.detailLineLabel}>{line.productName}</Text>
                        <Text style={styles.detailLineValue}>${(line.subtotal ?? line.quantity * line.price).toFixed(2)}</Text>
                      </View>
                      <View style={[styles.detailLine, styles.detailLineLast]}>
                        <Text style={styles.detailLineLabel}>Qty x Price</Text>
                        <Text style={styles.detailLineValue}>{line.quantity} x ${line.price.toFixed(2)}</Text>
                      </View>
                    </View>
                  ))}
                </View>
                <TouchableOpacity
                  style={[styles.printBtn, isPrintingReceipt && styles.printBtnDisabled]}
                  onPress={() => handlePrintReceipt(selectedReceipt)}
                  disabled={isPrintingReceipt}
                >
                  <View style={styles.buttonContent}>
                    {isPrintingReceipt && <ActivityIndicator size="small" color="#FFFFFF" />}
                    <Text style={styles.printBtnText}>{isPrintingReceipt ? 'Printing...' : 'Print Receipt'}</Text>
                  </View>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedReceipt(null)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={isProductsModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsProductsModalOpen(false)}
      >
        <SafeAreaView style={styles.receiptModalPage} edges={['top', 'bottom']}>
          <View style={styles.receiptModalHeader}>
            <Text style={styles.ticketsTitle}>Products</Text>
            <TouchableOpacity style={styles.closeIconButton} onPress={() => setIsProductsModalOpen(false)}>
              <Ionicons name="close" size={24} color={ADMIN_COLORS.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.productsModalBody}>
            <View style={styles.productsSearchCard}>
              <Text style={styles.sectionTitle}>Search Products</Text>
              <Text style={styles.sectionSubtitle}>Browse the current catalog and search by name, SKU, barcode, category, or supplier.</Text>

              <View style={styles.productsSearchBar}>
                <Ionicons name="search" size={18} color={ADMIN_COLORS.secondaryText} />
                <TextInput
                  value={productSearchQuery}
                  onChangeText={setProductSearchQuery}
                  placeholder="Search products"
                  placeholderTextColor={ADMIN_COLORS.secondaryText}
                  style={styles.productsSearchInput}
                />
                {productSearchQuery ? (
                  <TouchableOpacity onPress={() => setProductSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color={ADMIN_COLORS.secondaryText} />
                  </TouchableOpacity>
                ) : null}
              </View>

              <Text style={styles.productsResultsText}>
                {filteredProducts.length} product{filteredProducts.length === 1 ? '' : 's'} found
              </Text>
            </View>

            {filteredProducts.length === 0 ? (
              <View style={styles.productsEmptyState}>
                <Ionicons name="cube-outline" size={52} color={ADMIN_COLORS.tertiaryText} />
                <Text style={styles.emptyTitle}>No matching products</Text>
                <Text style={styles.emptySubtitle}>Try a different search term to find products in the catalog.</Text>
              </View>
            ) : (
              <FlatList
                data={filteredProducts}
                renderItem={renderProductItem}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.catalogListContent}
              />
            )}

            <TouchableOpacity style={styles.closeBtn} onPress={() => setIsProductsModalOpen(false)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

/* ------------------- CLEAN STYLES ------------------- */
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: ADMIN_COLORS.background,
  },

  scrollContainer: {
    padding: 16,
    gap: 16,
  },

  /* -------- Header -------- */
  headerCard: {
    ...ADMIN_SECTION_CARD,
  },
  headerTitle: {
    ...ADMIN_PAGE_TITLE,
  },
  headerSubtitle: {
    ...ADMIN_PAGE_SUBTITLE,
    marginTop: 4,
  },

  /* -------- Stats -------- */
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },

  statCard: {
    ...ADMIN_STAT_CARD,
    flex: 1,
    padding: 16,
    minHeight: 134,
  },

  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: ADMIN_COLORS.secondaryText,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: ADMIN_COLORS.text,
    marginBottom: 4,
  },
  statDescription: {
    fontSize: 12,
    color: ADMIN_COLORS.secondaryText,
  },

  /* -------- Section Titles -------- */
  sectionTitle: {
    ...ADMIN_SECTION_TITLE,
    marginBottom: 4,
  },
  sectionSubtitle: {
    ...ADMIN_SECTION_SUBTITLE,
    marginBottom: 12,
  },

  /* -------- Quick Actions -------- */
  sectionCard: {
    ...ADMIN_SECTION_CARD,
  },
  quickActionsRow: {
    gap: 10,
  },
  quickActionCard: {
    ...ADMIN_LIST_CARD,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickActionCopy: { flex: 1 },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: ADMIN_COLORS.text,
  },
  quickActionDescription: {
    fontSize: 12,
    color: ADMIN_COLORS.secondaryText,
    marginTop: 4,
  },

  /* -------- Alerts -------- */
  alertCard: {
    ...ADMIN_SECTION_CARD,
    padding: 16,
    borderColor: '#f97316',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 6,
    color: ADMIN_COLORS.text,
  },
  alertText: {
    fontSize: 14,
    color: ADMIN_COLORS.secondaryText,
  },

  /* -------- Tickets -------- */
  ticketsCard: {
    ...ADMIN_SECTION_CARD,
    padding: 16,
  },
  ticketsTitle: {
    ...ADMIN_SECTION_TITLE,
    marginBottom: 16,
  },

  saleItem: {
    ...ADMIN_LIST_CARD,
    paddingVertical: 14,
    marginBottom: 10,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center',
  },
  receiptId: {
    fontSize: 16,
    fontWeight: '600',
    color: ADMIN_COLORS.text,
  },
  receiptTime: {
    fontSize: 14,
    color: ADMIN_COLORS.secondaryText,
  },
  paymentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#eef2ff',
    borderRadius: 999,
  },
  paymentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: ADMIN_COLORS.text,
  },
  saleTotal: {
    fontSize: 20,
    fontWeight: '700',
    color: ADMIN_COLORS.accent,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  productText: {
    fontSize: 14,
    color: ADMIN_COLORS.secondaryText,
  },
  productSubtotal: {
    fontSize: 14,
    color: ADMIN_COLORS.text,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  totalLabel: {
    color: ADMIN_COLORS.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: ADMIN_COLORS.accent,
  },

  /* -------- Empty State -------- */
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: ADMIN_COLORS.secondaryText,
    marginTop: 8
  },
  emptySubtitle: {
    fontSize: 14,
    color: ADMIN_COLORS.secondaryText,
    textAlign: 'center',
    marginTop: 4
  },
  startSaleButton: {
    marginTop: 16,
    ...ADMIN_PRIMARY_BUTTON,
    backgroundColor: ADMIN_COLORS.accent,
    paddingHorizontal: 24,
  },
  startSaleButtonText: {
    ...ADMIN_BUTTON_TEXT,
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
    ...ADMIN_SECTION_CARD,
    padding: 16,
  },

  recentItem: {
    ...ADMIN_LIST_CARD,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  recentIcon: {
    backgroundColor: '#f97316',
    padding: 8,
    borderRadius: 50,
    marginRight: 10
  },
  recentSaleId: {
    color: ADMIN_COLORS.text,
    fontWeight: '600',
  },
  recentMeta: {
    fontSize: 12,
    color: ADMIN_COLORS.secondaryText,
  },
  recentTotal: {
    fontWeight: '700',
    color: ADMIN_COLORS.accent,
  },

  emptyRecent: {
    alignItems: 'center',
    paddingVertical: 20
  },
  receiptModalPage: {
    flex: 1,
    backgroundColor: ADMIN_COLORS.background,
  },
  receiptModalHeader: {
    ...ADMIN_MODAL_HEADER,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  closeIconButton: {
    padding: 4,
  },
  receiptModalContent: {
    padding: 20,
    gap: 16,
  },
  receiptDetailsCard: {
    ...ADMIN_MODAL_SECTION,
  },
  itemsWrapper: {
    ...ADMIN_MODAL_SECTION,
  },
  itemsTitle: {
    ...ADMIN_SECTION_TITLE,
    fontSize: 16,
  },
  modalItemRow: {
    ...ADMIN_LIST_CARD,
    paddingVertical: 10,
    marginBottom: 8,
  },
  detailLine: {
    ...ADMIN_DETAIL_ROW,
  },
  detailLineLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  detailLineLabel: {
    ...ADMIN_DETAIL_LABEL,
  },
  detailLineValue: {
    ...ADMIN_DETAIL_VALUE,
  },
  detailLineAccent: {
    color: ADMIN_COLORS.accent,
  },
  printBtn: {
    ...ADMIN_PRIMARY_BUTTON,
    backgroundColor: ADMIN_COLORS.primary,
  },
  printBtnDisabled: {
    ...ADMIN_PRIMARY_BUTTON_DISABLED,
  },
  buttonContent: {
    ...ADMIN_BUTTON_CONTENT,
  },
  printBtnText: {
    ...ADMIN_BUTTON_TEXT,
  },
  closeBtn: {
    ...ADMIN_SECONDARY_BUTTON,
  },
  closeBtnText: {
    ...ADMIN_SECONDARY_BUTTON_TEXT,
  },
  productsModalBody: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  productsSearchCard: {
    ...ADMIN_MODAL_SECTION,
  },
  productsSearchBar: {
    ...ADMIN_INPUT_SURFACE,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  productsSearchInput: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    fontSize: 14,
    color: ADMIN_COLORS.text,
  },
  productsResultsText: {
    fontSize: 13,
    color: ADMIN_COLORS.secondaryText,
    marginTop: 10,
  },
  productsEmptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  catalogListContent: {
    paddingBottom: 12,
    gap: 10,
  },
  catalogCard: {
    ...ADMIN_LIST_CARD,
  },
  catalogCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  catalogTitleBlock: {
    flex: 1,
  },
  catalogProductName: {
    fontSize: 15,
    fontWeight: '700',
    color: ADMIN_COLORS.text,
    marginBottom: 4,
  },
  catalogProductMeta: {
    fontSize: 12,
    color: ADMIN_COLORS.secondaryText,
  },
  catalogProductPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: ADMIN_COLORS.accent,
  },
  catalogCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
  },
  catalogInfoStack: {
    flex: 1,
    gap: 4,
  },
  catalogDetailText: {
    fontSize: 13,
    color: ADMIN_COLORS.secondaryText,
  },
  catalogStockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  catalogStockBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  inStockBadge: {
    backgroundColor: '#dcfce7',
  },
  inStockBadgeText: {
    color: ADMIN_COLORS.success,
  },
  lowStockBadge: {
    backgroundColor: '#fef3c7',
  },
  lowStockBadgeText: {
    color: '#b45309',
  },
  outOfStockBadge: {
    backgroundColor: '#fee2e2',
  },
  outOfStockBadgeText: {
    color: ADMIN_COLORS.danger,
  },
});

export default CashierHome;
