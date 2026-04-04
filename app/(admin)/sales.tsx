import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  Share,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import type { SaleRecord } from "../../store/types";
import type { PaymentMethod } from "../../store/types";
import { fetchOperationalData } from "../../store/slices/userSlice";
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
  ADMIN_PRIMARY_BUTTON,
  ADMIN_PRIMARY_BUTTON_DISABLED,
  ADMIN_PAGE_TITLE,
  ADMIN_SECTION_CARD,
  ADMIN_SECTION_SUBTITLE,
  ADMIN_SECTION_TITLE,
  ADMIN_STAT_CARD,
} from "../../theme/adminUi";

const DEBOUNCE_MS = 300;

interface StatMetric {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
}

interface PaymentOption {
  value: string;
  label: string;
  color: string;
  bgColor: string;
}

const AdminSales: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { sales = [] } = useAppSelector((state) => state.user);

  useEffect(() => {
    if (!user?.businessId) return;
    dispatch(fetchOperationalData(user.businessId));
  }, [dispatch, user?.businessId]);

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(searchQuery.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Simulate loading
  useEffect(() => {
    const timeout = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timeout);
  }, []);

  const handleRefresh = async () => {
    if (!user?.businessId) return;
    setIsRefreshing(true);
    try {
      await dispatch(fetchOperationalData(user.businessId));
    } finally {
      setIsRefreshing(false);
    }
  };

  // Payment options configuration
  const paymentOptions: PaymentOption[] = [
    { value: "all", label: "All", color: "#374151", bgColor: "#F3F4F6" },
    { value: "Cash", label: "Cash", color: "#059669", bgColor: "#D1FAE5" },
    { value: "Card", label: "Card", color: "#2563EB", bgColor: "#DBEAFE" },
    { value: "Mobile Payment", label: "Mobile", color: "#7C3AED", bgColor: "#EDE9FE" },
  ];

  // Calculate metrics
  const totalRevenue = useMemo(() =>
    sales.reduce((sum, sale) => sum + (sale.total || 0), 0),
    [sales]
  );

  const averageSale = useMemo(() =>
    sales.length > 0 ? totalRevenue / sales.length : 0,
    [sales.length, totalRevenue]
  );

  const todaySales = useMemo(() => {
    const today = new Date().toDateString();
    return sales.filter(sale => new Date(sale.date).toDateString() === today);
  }, [sales]);

  // Metrics cards configuration
  const metrics: StatMetric[] = [
    {
      label: "Total Sales",
      value: sales.length.toString(),
      icon: "cart-outline",
      color: "#2563EB",
      bgColor: "#DBEAFE",
    },
    {
      label: "Total Revenue",
      value: `$${totalRevenue.toFixed(2)}`,
      icon: "cash-outline",
      color: "#059669",
      bgColor: "#D1FAE5",
    },
    {
      label: "Avg Sale",
      value: `$${averageSale.toFixed(2)}`,
      icon: "stats-chart-outline",
      color: "#7C3AED",
      bgColor: "#EDE9FE",
    },
    {
      label: "Today's Sales",
      value: todaySales.length.toString(),
      icon: "today-outline",
      color: "#DC2626",
      bgColor: "#FEE2E2",
    },
  ];

  // Filter sales based on search and payment filter
  const filteredSales = useMemo(() => {
    let filtered = [...sales];

    // Apply search filter
    if (debouncedQuery) {
      const query = debouncedQuery.toLowerCase();
      filtered = filtered.filter(sale => {
        const id = (sale.id || "").toString().toLowerCase();
        const invoice = (sale.invoiceNumber || "").toLowerCase();
        const cashier = (sale.cashier || "").toLowerCase();
        const productNames = (sale.items ?? []).map((line) => line.productName.toLowerCase()).join(" ");
        const productName = (sale.productName || "").toLowerCase();
        return id.includes(query) || invoice.includes(query) || cashier.includes(query) || productName.includes(query) || productNames.includes(query);
      });
    }

    // Apply payment filter
    if (paymentFilter !== "all") {
      filtered = filtered.filter(sale => sale.paymentMethod === paymentFilter);
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [sales, debouncedQuery, paymentFilter]);

  // Render metric card
  const renderMetricCard = (metric: StatMetric) => (
    <View style={styles.metricCard}>
      <View style={styles.metricContent}>

        <View style={[styles.metricIcon, { backgroundColor: metric.bgColor }]}>
          <Ionicons name={metric.icon} size={20} color={metric.color} />
        </View>

        <Text style={styles.metricValue}>
          {metric.value}
        </Text>
        <Text style={styles.metricLabel}>{metric.label}</Text>
      </View>

    </View>
  );

  // Get payment badge styling
  const getPaymentBadge = (method?: PaymentMethod | string) => {
    const option = paymentOptions.find(opt => opt.value === method) || paymentOptions[0];
    return (
      <View style={[styles.paymentBadge, { backgroundColor: option.bgColor }]}>
        <Text style={[styles.paymentBadgeText, { color: option.color }]}>
          {method || "Unknown"}
        </Text>
      </View>
    );
  };

  // Render sale item
  const renderSaleItem = ({ item }: { item: SaleRecord }) => {
    const date = new Date(item.date);
    const dateStr = date.toLocaleDateString();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const itemCount = (item.items ?? []).reduce((sum, line) => sum + Number(line.quantity ?? 0), 0) || item.quantity || 0;

    return (
      <TouchableOpacity
        style={styles.saleCard}
        onPress={() => setSelectedSale(item)}
        activeOpacity={0.7}
      >
        <View style={styles.saleHeader}>
          <View style={styles.saleInfo}>
            <Text style={styles.saleId}>{item.invoiceNumber || `INV-${item.id}`}</Text>
            <Text style={styles.saleCashier}>{item.cashier || "Unknown"}</Text>
          </View>
          <Text style={styles.saleAmount}>${(item.total || 0).toFixed(2)}</Text>
        </View>

        <View style={styles.saleFooter}>
          <View style={styles.saleDetails}>
            <View style={styles.saleDetail}>
              <Ionicons name="calendar-outline" size={14} color="#6B7280" />
              <Text style={styles.saleDetailText}>{dateStr}</Text>
            </View>
            <View style={styles.saleDetail}>
              <Ionicons name="time-outline" size={14} color="#6B7280" />
              <Text style={styles.saleDetailText}>{timeStr}</Text>
            </View>
            <View style={styles.saleDetail}>
              <Ionicons name="cube-outline" size={14} color="#6B7280" />
              <Text style={styles.saleDetailText}>{itemCount} items</Text>
            </View>
          </View>
          {getPaymentBadge(item.paymentMethod)}
        </View>
      </TouchableOpacity>
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setPaymentFilter("all");
  };

  const handlePrintSale = async (sale: SaleRecord) => {
    setIsPrinting(true);
    try {
    const lines = sale.items?.length
      ? sale.items
      : [{
        productId: sale.productId ?? 0,
        productName: sale.productName ?? 'Item',
        quantity: sale.quantity ?? 0,
        price: sale.price ?? 0,
        subtotal: sale.total ?? 0,
        unitType: 'single' as const,
        packSize: undefined,
      }];
    const rows = lines
      .map((line) => `<tr><td>${line.productName}</td><td style="text-align:center;">${line.quantity}</td><td style="text-align:right;">$${(line.subtotal || 0).toFixed(2)}</td></tr>`)
      .join("");
    if (Platform.OS === "web") {
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;
      const html = `
        <html><body style="font-family: Arial, sans-serif; padding: 16px;">
        <h2>${sale.invoiceNumber || `INV-${sale.id}`}</h2>
        <p>Date: ${new Date(sale.date).toLocaleString()}</p>
        <p>Cashier: ${sale.cashier}</p>
        <p>Payment: ${sale.paymentMethod}</p>
        <table style="width: 100%; border-collapse: collapse;">
          <thead><tr><th align=\"left\">Item</th><th>Qty</th><th align=\"right\">Amount</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <h3 style="text-align:right;">Total: $${sale.total.toFixed(2)}</h3>
        </body></html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      return;
    }
    const text = lines
      .map((line) => `${line.productName} x${line.quantity} - $${(line.subtotal || 0).toFixed(2)}`)
      .join("\n");
    await Share.share({
      title: sale.invoiceNumber || `INV-${sale.id}`,
      message: `${sale.invoiceNumber || `INV-${sale.id}`}\n${new Date(sale.date).toLocaleString()}\n${text}\nTotal: $${sale.total.toFixed(2)}`,
    });
    } finally {
      setIsPrinting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading sales...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with metrics */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#f97316" />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Sales Overview</Text>
          <Text style={styles.subtitle}>Manage and track all transactions</Text>
        </View>

        {/* Metrics grid */}
        <View style={styles.metricsGrid}>
          {metrics.map((metric, index) => (
            <View key={index} style={styles.metricWrapper}>
              {renderMetricCard(metric)}
            </View>
          ))}
        </View>

        {/* Filters section */}
        <View style={styles.filtersCard}>
          <View style={styles.filterHeader}>
            <View>
              <Text style={styles.filterTitle}>Transactions</Text>
              <Text style={styles.filterSubtitle}>
                {filteredSales.length} {filteredSales.length === 1 ? 'sale' : 'sales'} found
              </Text>
            </View>
            {(searchQuery || paymentFilter !== "all") && (
              <TouchableOpacity onPress={clearFilters} style={styles.clearButton}>
                <Ionicons name="close-circle" size={16} color="#DC2626" />
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Search bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color="#6B7280" />
              <TextInput
                placeholder="Search sales..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Payment filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.paymentScroll}
            contentContainerStyle={styles.paymentContent}
          >
            {paymentOptions.map((option) => {
              const isActive = paymentFilter === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setPaymentFilter(option.value)}
                  style={[
                    styles.paymentFilter,
                    isActive && { backgroundColor: option.color }
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.paymentFilterText,
                    isActive && styles.paymentFilterTextActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Sales list */}
        {filteredSales.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No sales found</Text>
            <Text style={styles.emptyText}>
              {searchQuery || paymentFilter !== "all"
                ? "Try adjusting your filters"
                : "No sales recorded yet"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredSales}
            renderItem={renderSaleItem}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            style={styles.salesList}
            contentContainerStyle={styles.salesListContent}
          />
        )}
      </ScrollView>

      {/* Sale details modal */}
      <Modal
        visible={!!selectedSale}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedSale(null)}
      >
        {selectedSale && (
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sale Details</Text>
              <TouchableOpacity onPress={() => setSelectedSale(null)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
              {/* Basic info */}
              <View style={styles.modalSection}>
                <View style={styles.detailLine}>
                  <Text style={styles.detailLineLabel}>Invoice #</Text>
                  <Text style={styles.detailLineValue}>{selectedSale.invoiceNumber || `INV-${selectedSale.id}`}</Text>
                </View>
                <View style={styles.detailLine}>
                  <Text style={styles.detailLineLabel}>Date</Text>
                  <Text style={styles.detailLineValue}>{new Date(selectedSale.date).toLocaleDateString()}</Text>
                </View>
                <View style={styles.detailLine}>
                  <Text style={styles.detailLineLabel}>Cashier</Text>
                  <Text style={styles.detailLineValue}>{selectedSale.cashier}</Text>
                </View>
                <View style={[styles.detailLine, styles.detailLineLast]}>
                  <Text style={styles.detailLineLabel}>Payment</Text>
                  {getPaymentBadge(selectedSale.paymentMethod)}
                </View>
              </View>

              {/* Product details */}
              <View style={styles.modalSection}>
                <Text style={styles.sectionTitle}>Product Details</Text>
                {(selectedSale.items?.length ? selectedSale.items : [{
                  productId: selectedSale.productId ?? 0,
                  productName: selectedSale.productName ?? 'Item',
                  quantity: selectedSale.quantity ?? 0,
                  price: selectedSale.price ?? 0,
                  subtotal: selectedSale.total ?? 0,
                  unitType: 'single' as const,
                  packSize: undefined,
                }]).map((line, index) => (
                  <View key={`${line.productId}-${index}`} style={styles.productCard}>
                    <View style={styles.productHeader}>
                      <Text style={styles.productName}>{line.productName}</Text>
                      <Text style={styles.productPrice}>${(line.subtotal || 0).toFixed(2)}</Text>
                    </View>
                    <View style={styles.productDetails}>
                      <View style={styles.productDetailRow}>
                        <Text style={styles.productDetailLabel}>Quantity</Text>
                        <Text style={styles.productDetailValue}>{line.quantity || 0}</Text>
                      </View>
                      <View style={styles.productDetailRow}>
                        <Text style={styles.productDetailLabel}>Unit Price</Text>
                        <Text style={styles.productDetailValue}>${(line.price || 0).toFixed(2)}</Text>
                      </View>
                      <View style={[styles.productDetailRow, styles.productDetailRowLast]}>
                        <Text style={styles.productDetailLabel}>Product ID</Text>
                        <Text style={styles.productDetailValue}>{line.productId || '-'}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              {/* Summary */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Transaction Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>
                    ${(selectedSale.total || 0).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tax</Text>
                  <Text style={styles.summaryValue}>$0.00</Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>
                    ${(selectedSale.total || 0).toFixed(2)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.printButton, isPrinting && styles.printButtonDisabled]}
                  onPress={() => handlePrintSale(selectedSale)}
                  disabled={isPrinting}
                >
                  <View style={styles.buttonContent}>
                    {isPrinting && <ActivityIndicator size="small" color="#FFFFFF" />}
                    <Text style={styles.printButtonText}>{isPrinting ? 'Preparing...' : 'Print Receipt'}</Text>
                  </View>
                </TouchableOpacity>
              </View>

            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
    backgroundColor: ADMIN_COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },

  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    paddingBottom: 16,
  },
  title: {
    ...ADMIN_PAGE_TITLE,
    marginBottom: 4,
  },
  subtitle: {
    ...ADMIN_PAGE_SUBTITLE,
  },

  // Metrics section
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  metricWrapper: {
    width: "48%",
  },
  metricCard: {
    ...ADMIN_STAT_CARD,
    width: "100%",
    minHeight: 126,
    padding: 16,
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 18,
  },
  metricContent: {
    width: "100%",
      flexDirection: "column",
      alignItems: "center",
      gap: 8,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: ADMIN_COLORS.secondaryText,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "700",
    color: ADMIN_COLORS.text,
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  // Filters section
  filtersCard: {
    ...ADMIN_SECTION_CARD,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  filterTitle: {
    ...ADMIN_SECTION_TITLE,
  },
  filterSubtitle: {
    ...ADMIN_SECTION_SUBTITLE,
    marginTop: 2,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#DC2626",
    marginLeft: 4,
  },

  // Search bar
  searchContainer: {
    marginBottom: 16,
  },
  searchBar: {
    ...ADMIN_INPUT_SURFACE,
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: ADMIN_COLORS.text,
    marginLeft: 8,
  },

  // Payment filters
  paymentScroll: {
    marginHorizontal: -4,
  },
  paymentContent: {
    paddingHorizontal: 4,
  },
  paymentFilter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: ADMIN_COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
  },
  paymentFilterText: {
    fontSize: 13,
    fontWeight: "600",
    color: ADMIN_COLORS.text,
  },
  paymentFilterTextActive: {
    color: "#FFFFFF",
  },

  // Payment badge
  paymentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paymentBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Sales list
  salesList: {
    marginHorizontal: 20,
  },
  salesListContent: {
    paddingBottom: 40,
  },
  saleCard: {
    ...ADMIN_LIST_CARD,
    marginBottom: 12,
  },
  saleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  saleInfo: {
    flex: 1,
  },
  saleId: {
    fontSize: 16,
    fontWeight: "700",
    color: ADMIN_COLORS.text,
    marginBottom: 4,
  },
  saleCashier: {
    fontSize: 13,
    color: ADMIN_COLORS.secondaryText,
  },
  saleAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: ADMIN_COLORS.success,
  },
  saleFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  saleDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    flex: 1,
  },
  saleDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  saleDetailText: {
    fontSize: 12,
    color: ADMIN_COLORS.secondaryText,
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: ADMIN_COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: ADMIN_COLORS.secondaryText,
    textAlign: "center",
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: ADMIN_COLORS.background,
  },
  modalHeader: {
    ...ADMIN_MODAL_HEADER,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: ADMIN_COLORS.text,
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    padding: 20,
    gap: 16,
  },
  modalSection: {
    ...ADMIN_MODAL_SECTION,
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
  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  modalInfo: {
    flex: 1,
  },
  modalLabel: {
    fontSize: 13,
    color: ADMIN_COLORS.secondaryText,
    marginBottom: 4,
  },
  modalValue: {
    fontSize: 15,
    fontWeight: "600",
    color: ADMIN_COLORS.text,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: ADMIN_COLORS.text,
    marginBottom: 12,
  },
  productCard: {
    ...ADMIN_LIST_CARD,
    backgroundColor: ADMIN_COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: ADMIN_COLORS.text,
    flex: 1,
    marginRight: 16,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: ADMIN_COLORS.success,
  },
  productDetails: {
    gap: 0,
  },
  productDetailRow: {
    ...ADMIN_DETAIL_ROW,
    paddingVertical: 10,
  },
  productDetailRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  productDetailLabel: {
    ...ADMIN_DETAIL_LABEL,
  },
  productDetailValue: {
    ...ADMIN_DETAIL_VALUE,
  },
  summaryCard: {
    ...ADMIN_SECTION_CARD,
    padding: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: ADMIN_COLORS.text,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  totalRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: ADMIN_COLORS.line,
  },
  summaryLabel: {
    fontSize: 14,
    color: ADMIN_COLORS.secondaryText,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: ADMIN_COLORS.text,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: ADMIN_COLORS.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "700",
    color: ADMIN_COLORS.accent,
  },
  printButton: {
    marginTop: 12,
    ...ADMIN_PRIMARY_BUTTON,
  },
  printButtonDisabled: {
    ...ADMIN_PRIMARY_BUTTON_DISABLED,
  },
  buttonContent: {
    ...ADMIN_BUTTON_CONTENT,
  },
  printButtonText: {
    ...ADMIN_BUTTON_TEXT,
  },
});

export default AdminSales;
