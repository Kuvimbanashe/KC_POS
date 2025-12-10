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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppSelector } from "../../store/hooks";
import type { SaleRecord } from "../../store/types";
import type { PaymentMethod } from "../../store/types";

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
  const { sales = [] } = useAppSelector((state) => state.user);

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        const cashier = (sale.cashier || "").toLowerCase();
        const productName = (sale.productName || "").toLowerCase();
        return id.includes(query) || cashier.includes(query) || productName.includes(query);
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
    <View style={[styles.metricCard, { backgroundColor: metric.bgColor }]}>
      <View style={styles.metricContent}>
        <Text style={styles.metricLabel}>{metric.label}</Text>
        <Text style={[styles.metricValue, { color: metric.color }]}>
          {metric.value}
        </Text>
      </View>
      <View style={[styles.metricIcon, { backgroundColor: metric.color }]}>
        <Ionicons name={metric.icon} size={20} color="#FFFFFF" />
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
    
    return (
      <TouchableOpacity
        style={styles.saleCard}
        onPress={() => setSelectedSale(item)}
        activeOpacity={0.7}
      >
        <View style={styles.saleHeader}>
          <View style={styles.saleInfo}>
            <Text style={styles.saleId}>#{item.id}</Text>
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
              <Text style={styles.saleDetailText}>{item.quantity || 0} items</Text>
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

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading sales...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with metrics */}
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Sales Overview</Text>
          <Text style={styles.subtitle}>Manage and track all transactions</Text>
        </View>

        {/* Metrics grid */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.metricsScroll}
          contentContainerStyle={styles.metricsContent}
        >
          {metrics.map((metric, index) => (
            <View key={index} style={styles.metricWrapper}>
              {renderMetricCard(metric)}
            </View>
          ))}
        </ScrollView>

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

            <ScrollView style={styles.modalScroll}>
              <View style={styles.modalContent}>
                {/* Basic info */}
                <View style={styles.modalSection}>
                  <View style={styles.modalRow}>
                    <View style={styles.modalInfo}>
                      <Text style={styles.modalLabel}>Invoice #</Text>
                      <Text style={styles.modalValue}>INV{selectedSale.id.toString().padStart(4, '0')}</Text>
                    </View>
                    <View style={styles.modalInfo}>
                      <Text style={styles.modalLabel}>Date</Text>
                      <Text style={styles.modalValue}>
                        {new Date(selectedSale.date).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.modalRow}>
                    <View style={styles.modalInfo}>
                      <Text style={styles.modalLabel}>Cashier</Text>
                      <Text style={styles.modalValue}>{selectedSale.cashier}</Text>
                    </View>
                    <View style={styles.modalInfo}>
                      <Text style={styles.modalLabel}>Payment Method</Text>
                      {getPaymentBadge(selectedSale.paymentMethod)}
                    </View>
                  </View>
                </View>

                {/* Product details */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Product Details</Text>
                  <View style={styles.productCard}>
                    <View style={styles.productHeader}>
                      <Text style={styles.productName}>{selectedSale.productName}</Text>
                      <Text style={styles.productPrice}>
                        ${(selectedSale.total || 0).toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.productDetails}>
                      <Text style={styles.productDetail}>
                        Quantity: {selectedSale.quantity || 0}
                      </Text>
                      <Text style={styles.productDetail}>
                        Unit Price: ${(selectedSale.price || 0).toFixed(2)}
                      </Text>
                      <Text style={styles.productDetail}>
                        Product ID: {selectedSale.productId}
                      </Text>
                    </View>
                  </View>
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
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollView: {
    flex: 1,
  },

  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
  },

  // Metrics section
  metricsScroll: {
    marginBottom: 24,
  },
  metricsContent: {
    paddingHorizontal: 20,
    paddingRight: 40,
  },
  metricWrapper: {
    marginRight: 12,
  },
  metricCard: {
    width: 140,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metricContent: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "700",
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
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  filterSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
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
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  paymentFilterText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
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
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
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
    color: "#111827",
    marginBottom: 4,
  },
  saleCashier: {
    fontSize: 13,
    color: "#6B7280",
  },
  saleAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#059669",
  },
  saleFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  saleDetails: {
    flexDirection: "row",
    gap: 16,
  },
  saleDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  saleDetailText: {
    fontSize: 12,
    color: "#6B7280",
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
    color: "#111827",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalInfo: {
    flex: 1,
    marginRight: 16,
  },
  modalLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 4,
  },
  modalValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  productCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
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
    color: "#111827",
    flex: 1,
    marginRight: 16,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#059669",
  },
  productDetails: {
    gap: 8,
  },
  productDetail: {
    fontSize: 14,
    color: "#6B7280",
  },
  summaryCard: {
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
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
    borderTopColor: "#374151",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#D1D5DB",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

export default AdminSales;