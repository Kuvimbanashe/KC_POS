// app/(admin)/sales.tsx
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
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppSelector } from "../../store/hooks";
import type { SaleRecord } from "../../store/types";
import type { PaymentMethod } from "../../store/types";

/**
 * AdminSales
 * - Debounced search
 * - Payment filter
 * - Stats cards (scroll horizontal)
 * - FlatList optimized rendering
 * - Modal for sale details
 */

const DEBOUNCE_MS = 300;

const AdminSales: React.FC = () => {
  const { sales = [] } = useAppSelector((state) => state.user);

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Debounce searchQuery -> debouncedQuery
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery?.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Simulated loading (you can remove if you fetch real data)
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  // Derived values with memoization for performance
  const filteredSales = useMemo(() => {
    if (!Array.isArray(sales)) return [];
    let list = sales;

    if (debouncedQuery) {
      const q = debouncedQuery.toLowerCase();
      list = list.filter((sale) => {
        const idStr = (sale.id ?? "").toString().toLowerCase();
        const cashierStr = (sale.cashier ?? "").toString().toLowerCase();
        const productName = (sale.productName ?? "").toString().toLowerCase();
        return idStr.includes(q) || cashierStr.includes(q) || productName.includes(q);
      });
    }

    if (paymentFilter !== "all") {
      list = list.filter((sale) => sale.paymentMethod === paymentFilter);
    }

    // Sort newest first by date (if available)
    list = list.slice().sort((a, b) => {
      const da = new Date(a.date ?? 0).valueOf();
      const db = new Date(b.date ?? 0).valueOf();
      return db - da;
    });

    return list;
  }, [sales, debouncedQuery, paymentFilter]);

  const totalRevenue = useMemo(
    () => (Array.isArray(sales) ? sales.reduce((s, r) => s + (r.total ?? 0), 0) : 0),
    [sales],
  );

  const averageSale = useMemo(() => {
    return sales.length > 0 ? totalRevenue / sales.length : 0;
  }, [sales.length, totalRevenue]);

  const paymentOptions = [
    { value: "all", label: "All Methods" },
    { value: "Cash", label: "Cash" },
    { value: "Card", label: "Card" },
    { value: "Mobile Payment", label: "Mobile" },
  ];

  const getPaymentBadge = (method?: PaymentMethod | string | undefined) => {
    const text = method ?? "Unknown";
    const base = [styles.badge, styles.badgeDefault];
    if (text === "Cash") base.push(styles.badgeCash);
    else if (text === "Card") base.push(styles.badgeCard);
    else if (text === "Mobile Payment") base.push(styles.badgeMobile);
    return (
      <View style={base}>
        <Text numberOfLines={1} style={styles.badgeText}>
          {text}
        </Text>
      </View>
    );
  };

  const renderSaleItem = ({ item }: { item: SaleRecord }) => {
    const dateStr =
      item.date ? new Date(item.date).toLocaleDateString() : "—";
    const price = typeof item.total === "number" ? item.total : 0;
    return (
      <TouchableOpacity
        style={styles.saleItem}
        onPress={() => setSelectedSale(item)}
        activeOpacity={0.7}
        accessibilityRole="button"
      >
        <View style={styles.rowBetweenStart}>
          <View style={styles.flex1}>
            <Text style={styles.idText}>#{item.id}</Text>
            <Text style={styles.mutedText} numberOfLines={1}>
              {item.cashier ?? "Unknown cashier"}
            </Text>
          </View>

          <Text style={styles.accentPrice}>${price.toFixed(2)}</Text>
        </View>

        <View style={styles.rowBetweenCenter}>
          <View style={styles.rowCenter}>
            <Text style={styles.textXsMuted}>{item.quantity ?? 0} items</Text>
            <View style={{ width: 8 }} />
            {getPaymentBadge(item.paymentMethod)}
          </View>

          <Text style={styles.textXsMuted}>{dateStr}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // FlatList helpers
  const keyExtractor = (item: SaleRecord) => (item.id ?? Math.random()).toString();
  const getItemLayout = (_: any, index: number) => ({
    length: 84, // approximate item height (adjust if you change saleItem padding)
    offset: 84 * index,
    index,
  });

  // Small helper to clear filters
  const clearFilters = () => {
    setSearchQuery("");
    setPaymentFilter("all");


  };
  interface IMetric {
    label: string;
    value: string;
    icon: keyof typeof Ionicons.glyphMap;
  }
  const metrics: IMetric[] = [
    {
      label: "Total Sales",
      value: sales.length.toString(),
      icon: "cart-outline",
    },
    {
      label: "Total Revenue",
      value: `$${totalRevenue.toFixed(2)}`,
      icon: "cash-outline",


    },
    {
      label: "Average Sale",
      value: `$${averageSale.toFixed(2)}`,
      icon: "stats-chart-outline",

    }
  ]
  const renderMetricCard = (metric: IMetric) => {
    return (
      <View style={styles.statCard}>
        <View style={{ gap: 6, alignItems: 'center' }}>
          <Text style={styles.statLabel}>{metric.label}</Text>
          <Text style={styles.statValue}>{metric.value}</Text>
        </View>
        <Ionicons name={metric.icon} size={32} color="#f97316" />
      </View>
    );
  };

  // UI
  if (isLoading) {
    return (
      <View style={styles.page}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 12, color: "#6b7280" }}>Loading sales…</Text>
        </View>

      </View>
    );
  }

  return (
    <View style={styles.page}>
      
        <View style={styles.contentPadding} >

          <ScrollView
            
            showsHorizontalScrollIndicator={false}
            style={{
              flexDirection: "row",
              marginHorizontal: 15,
              gap: 12,
              height: 120

            }}
          >

            {metrics.map((metric, idx) => (
              <View key={idx}>
                {renderMetricCard(metric)}
              </View>
            ))}

          </ScrollView>




          {/* Search & Filters */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>All Transactions</Text>
            <Text style={styles.sectionSubtitle}>Complete sales history</Text>

            <View style={{ marginTop: 12 }}>
              <View style={styles.inputRow}>
                <View style={styles.inputWrapper}>
                  <Ionicons name="search" size={18} style={styles.iconColor} />
                  <TextInput
                    placeholder="Search by ID, cashier, or product..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#9ca3af"
                    style={styles.input}
                    returnKeyType="search"
                    accessibilityLabel="Search sales"
                  />
                </View>

                <TouchableOpacity
                  onPress={clearFilters}
                  style={styles.clearFilterBtn}
                  accessibilityRole="button"
                >
                  <Ionicons name="refresh-outline" size={20} color="#0f172a" />
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                <View style={styles.filterRow}>
                  {paymentOptions.map((opt) => {
                    const active = paymentFilter === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        onPress={() => setPaymentFilter(opt.value)}
                        style={[styles.filterChip, active && styles.filterChipActive]}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </View>

          {/* Sales list or empty state */}
          <View style={{ marginTop: 12 }}>
            {filteredSales.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={56} style={styles.iconMuted} />
                <Text style={styles.emptyStateTitle}>No sales found</Text>
                <Text style={styles.emptyStateText}>
                  {searchQuery || paymentFilter !== "all"
                    ? "Try adjusting your search or filters."
                    : "No sales transactions recorded yet."}
                </Text>
                {(searchQuery || paymentFilter !== "all") && (
                  <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                    <Text style={styles.clearButtonText}>Clear Filters</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (

              <FlatList
                data={filteredSales}
                renderItem={renderSaleItem}
                keyExtractor={keyExtractor}
                showsVerticalScrollIndicator={false}


                scrollEnabled={true}
              />


            )}
          </View>
        </View>
     

      {/* Modal */}
      <Modal
        visible={!!selectedSale}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedSale(null)}
      >
        {selectedSale && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sale Details — #{selectedSale.id}</Text>
              <TouchableOpacity onPress={() => setSelectedSale(null)} accessibilityRole="button">
                <Ionicons name="close" size={22} style={styles.closeIcon} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} contentContainerStyle={{ paddingBottom: 48 }}>
              <View style={styles.modalContent}>
                <View style={styles.infoRowWrap}>
                  <View style={styles.halfWidth}>
                    <Text style={styles.labelMuted}>Cashier</Text>
                    <Text style={styles.labelValue}>{selectedSale.cashier ?? "—"}</Text>
                  </View>

                  <View style={styles.halfWidth}>
                    <Text style={styles.labelMuted}>Payment Method</Text>
                    <View style={{ marginTop: 6 }}>{getPaymentBadge(selectedSale.paymentMethod)}</View>
                  </View>

                  <View style={styles.halfWidth}>
                    <Text style={styles.labelMuted}>Date</Text>
                    <Text style={styles.labelValue}>
                      {selectedSale.date ? new Date(selectedSale.date).toLocaleString() : "—"}
                    </Text>
                  </View>

                  <View style={styles.halfWidth}>
                    <Text style={styles.labelMuted}>Total Amount</Text>
                    <Text style={[styles.accentPrice, { marginTop: 6 }]}>
                      ${((selectedSale.total as number) ?? 0).toFixed(2)}
                    </Text>
                  </View>
                </View>

                <View style={{ marginTop: 16 }}>
                  <Text style={styles.productsTitle}>Products ({selectedSale.quantity ?? 0} items)</Text>

                  <View style={styles.productCard}>
                    <View style={styles.rowBetweenStart}>
                      <Text style={styles.productName}>{selectedSale.productName ?? "Product"}</Text>
                      <Text style={styles.productPrice}>${((selectedSale.total as number) ?? 0).toFixed(2)}</Text>
                    </View>

                    <View style={styles.rowBetweenCenter}>
                      <Text style={styles.mutedText}>
                        Qty: {selectedSale.quantity ?? 0} × ${((selectedSale.price as number) ?? 0).toFixed(2)}
                      </Text>
                      <Text style={styles.mutedText}>
                        Subtotal: ${((selectedSale.quantity ?? 0) * ((selectedSale.price ?? 0) as number)).toFixed(2)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.sectionGroup}>
                    <View style={styles.infoRow}>
                      <Text style={styles.mutedLabelShort}>Product ID</Text>
                      <Text style={styles.strongText}>{selectedSale.productId ?? "—"}</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={styles.mutedLabelShort}>Invoice Number</Text>
                      <Text style={styles.strongText}>
                        INV{selectedSale.id?.toString().padStart(4, "0") ?? "0000"}
                      </Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={styles.mutedLabelShort}>Customer</Text>
                      <Text style={styles.strongText}>Walk-in Customer</Text>
                    </View>
                  </View>
                </View>

                <View style={[styles.statCardDark, { marginTop: 12 }]}>
                  <Text style={styles.statHeading}>Transaction Summary</Text>
                  <View style={{ gap: 8 }}>
                    <View style={styles.rowBetweenCenter}>
                      <Text style={styles.whiteText}>Subtotal</Text>
                      <Text style={styles.whiteStrong}>${((selectedSale.total as number) ?? 0).toFixed(2)}</Text>
                    </View>

                    <View style={styles.rowBetweenCenter}>
                      <Text style={styles.whiteText}>Tax</Text>
                      <Text style={styles.whiteStrong}>$0.00</Text>
                    </View>

                    <View style={styles.rowBetween}>
                      <Text style={styles.whiteStrongLarge}>Total</Text>
                      <Text style={styles.whiteStrongLargeFont}>${((selectedSale.total as number) ?? 0).toFixed(2)}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  /* Page layout */
  page: { flex: 1, backgroundColor: "#f8fafc" },
  contentPadding: { padding: 16, paddingBottom: 16 },
  flex1: { flex: 1 },

  /* Loading */
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  /* Cards & stats */

  statCard: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    minWidth: "48%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flex: 1,
    gap: 10,
    marginRight: 16,
    height: 300
  },
  statLabel: { color: "#ffffff", fontSize: 13, fontWeight: "600", marginBottom: 6 },
  statValue: { color: "#f97316", fontSize: 20, fontWeight: "700" },

  /* Card container */
  card: {
    backgroundColor: "transparent",
    borderRadius: 12,
    padding: 14,


  },

  /* Search */
  inputRow: { flexDirection: "row", alignItems: "center" },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e6edf3",
  },
  iconColor: { color: "#6b7280", marginRight: 8 },
  input: { flex: 1, fontSize: 14, color: "#0f172a" },
  clearFilterBtn: {
    marginLeft: 10,
    backgroundColor: "#eef2ff",
    padding: 10,
    borderRadius: 10,
  },

  /* Filters */
  filterRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e6edf3",
    backgroundColor: "transparent",
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: "#f97316", borderColor: "#f97316" },
  filterChipText: { color: "#6b7280", fontSize: 12, fontWeight: "500" },
  filterChipTextActive: { color: "#fff" },

  /* Sale list */
  listStyle: {
    marginBottom: 50,
    borderRadius: 16
  },
  saleItem: {
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderColor: "#edf2f7",
    borderBottomWidth: 2,

  },
  rowBetweenStart: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  rowBetweenCenter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowCenter: { flexDirection: "row", alignItems: "center" },
  row: { flexDirection: "row" },


  /* Text */
  idText: { color: "#0f172a", fontSize: 15, fontWeight: "600" },
  mutedText: { color: "#6b7280", fontSize: 13, marginTop: 2 },
  accentPrice: { fontWeight: "700", color: "#f97316", fontSize: 16 },
  textXsMuted: { fontSize: 12, color: "#6b7280" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  sectionSubtitle: { fontSize: 13, color: "#6b7280", marginTop: 4 },

  /* Empty state */
  emptyState: { alignItems: "center", padding: 24 },
  iconMuted: { color: "#9ca3af", marginBottom: 12 },
  emptyStateTitle: { fontSize: 18, fontWeight: "600", color: "#0f172a", marginBottom: 6 },
  emptyStateText: { color: "#6b7280", marginBottom: 12, textAlign: "center" },
  clearButton: { backgroundColor: "#f97316", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  clearButtonText: { color: "#fff", fontWeight: "700" },

  /* Modal */
  modalContainer: { flex: 1, backgroundColor: "#fff", paddingTop: 18 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: "#eef2f7",
    marginBottom: 6,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  closeIcon: { color: "#0f172a" },
  modalScroll: { flex: 1, paddingHorizontal: 16 },
  modalContent: { paddingTop: 6 },

  /* Info rows inside modal */
  infoRowWrap: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12 },
  halfWidth: { width: "48%", marginBottom: 10 },
  labelMuted: { fontSize: 13, color: "#6b7280" },
  labelValue: { fontSize: 14, fontWeight: "700", color: "#0f172a", marginTop: 4 },

  /* Products */
  productsTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a", marginBottom: 8 },
  productCard: { backgroundColor: "#f8fafc", borderRadius: 12, padding: 12, marginBottom: 12 },
  productName: { fontWeight: "700", color: "#0f172a", flex: 1 },
  productPrice: { fontWeight: "700", color: "#f97316" },

  sectionGroup: { marginTop: 6 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 0, alignItems: "center" },
  mutedLabelShort: { color: "#6b7280", fontSize: 13 },
  strongText: { fontWeight: "700", color: "#0f172a", fontSize: 13 },

  /* Dark stat card used in modal */
  statCardDark: {
    backgroundColor: "#0f172a",
    padding: 12,
    borderRadius: 12,
  },
  statHeading: { color: "#fff", fontSize: 15, marginBottom: 8 },
  whiteText: { color: "#fff" },
  whiteStrong: { color: "#fff", fontWeight: "700" },
  whiteStrongLarge: { color: "#fff", fontWeight: "800" },
  whiteStrongLargeFont: { color: "#fff", fontWeight: "800", fontSize: 18 },

  /* Badges */
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  badgeText: { fontSize: 12, fontWeight: "700" },
  badgeDefault: { backgroundColor: "#eef2f7" },
  badgeCash: { backgroundColor: "#dbeafe" },
  badgeCard: { backgroundColor: "#dcfce7" },
  badgeMobile: { backgroundColor: "#f5f3ff" },

  /* small helpers */
  mutedLabelSmall: { color: "#6b7280", fontSize: 12 },
});

export default AdminSales;
