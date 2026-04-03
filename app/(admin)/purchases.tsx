import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { StyleSheet } from 'react-native';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { Ionicons } from '@expo/vector-icons';
import { addPurchase, fetchOperationalData, updateProduct } from '../../store/slices/userSlice';
import type { PurchaseRecord, Product } from '../../store/types';
import { apiClient } from '../../services/api';
import {
  ADMIN_BUTTON_CONTENT,
  ADMIN_BUTTON_TEXT,
  ADMIN_COLORS,
  ADMIN_DETAIL_LABEL,
  ADMIN_DETAIL_ROW,
  ADMIN_DETAIL_VALUE,
  ADMIN_INPUT_FIELD,
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
} from '../../theme/adminUi';

interface PurchaseFormData {
  quantity: string;
  unitCost: string;
  unitType: 'single' | 'pack';
  profitMargin: string;
  supplier: string;
}

interface StatCard {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const AdminPurchases = () => {
  const { purchases, products } = useAppSelector(state => state.user);
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!user?.businessId) return;
    dispatch(fetchOperationalData(user.businessId));
  }, [dispatch, user?.businessId]);

  const [filteredPurchases, setFilteredPurchases] = useState<PurchaseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseRecord | null>(null);
  const [isSubmittingPurchase, setIsSubmittingPurchase] = useState(false);

  const [formData, setFormData] = useState<PurchaseFormData>({
    quantity: '',
    unitCost: '',
    unitType: 'single',
    profitMargin: '30',
    supplier: '',
  });

  // Initialize purchases and simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setFilteredPurchases(purchases);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Filter purchases based on search
  useEffect(() => {
    const filtered = purchases.filter(purchase =>
      purchase.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.supplier?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.id.toString().includes(searchQuery.toLowerCase())
    );
    setFilteredPurchases(filtered);
  }, [searchQuery, purchases]);

  const handleRefresh = async () => {
    if (!user?.businessId) return;
    setIsRefreshing(true);
    try {
      await dispatch(fetchOperationalData(user.businessId));
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle product selection for purchase
  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(false);
    setIsPurchaseModalOpen(true);

    // Pre-fill supplier if available
    if (product.supplier) {
      setFormData(prev => ({ ...prev, supplier: product.supplier as string }));
    }
  };

  // Calculate selling price with profit margin
  const calculateSellingPrice = (unitCost: number, margin: number) => {
    return unitCost * (1 + margin / 100);
  };

  // Handle purchase submission
  const handlePurchaseSubmit = async () => {
    if (!selectedProduct || !formData.quantity || !formData.unitCost || !formData.supplier) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    if (!user?.businessId) {
      Alert.alert('Error', 'Business context missing. Please sign in again.');
      return;
    }

    setIsSubmittingPurchase(true);
    try {
      const quantity = parseInt(formData.quantity);
      const unitCost = parseFloat(formData.unitCost);
      const margin = parseFloat(formData.profitMargin);
      const sellingPrice = calculateSellingPrice(unitCost, margin);

      const actualQuantity = formData.unitType === 'pack' && selectedProduct.packSize
        ? quantity * selectedProduct.packSize
        : quantity;

      const totalCost = quantity * unitCost;

      await apiClient.createPurchase({
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        quantity: actualQuantity,
        unitCost,
        total: totalCost,
        supplier: formData.supplier,
        businessId: user.businessId,
      });

      // Keep local state in sync immediately
      dispatch(addPurchase({
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        quantity: actualQuantity,
        unitCost,
        total: totalCost,
        supplier: formData.supplier,
      }));

      dispatch(updateProduct({
        id: selectedProduct.id,
        stock: selectedProduct.stock + actualQuantity,
        cost: unitCost,
        supplier: selectedProduct.supplier || formData.supplier,
      }));
      dispatch(fetchOperationalData(user.businessId));

      Alert.alert('Success', `Purchase saved to backend.\n\nSuggested price: $${sellingPrice.toFixed(2)}\n${actualQuantity} units added to stock`);

      // Reset form
      setIsPurchaseModalOpen(false);
      setSelectedProduct(null);
      setFormData({
        quantity: '',
        unitCost: '',
        unitType: 'single',
        profitMargin: '30',
        supplier: ''
      });
    } catch (error) {
      console.error('Error creating purchase:', error);
      Alert.alert('Error', 'Failed to create purchase');
    } finally {
      setIsSubmittingPurchase(false);
    }
  };

  // Statistics
  const totalCost = purchases.reduce((sum, purchase) => sum + purchase.total, 0);
  const totalQuantity = purchases.reduce((sum, purchase) => sum + purchase.quantity, 0);

  // Form calculations
  const unitCost = formData.unitCost ? parseFloat(formData.unitCost) : 0;
  const margin = formData.profitMargin ? parseFloat(formData.profitMargin) : 0;
  const suggestedPrice = unitCost > 0 ? calculateSellingPrice(unitCost, margin) : 0;
  const totalFormCost = formData.quantity && formData.unitCost
    ? parseFloat(formData.quantity) * parseFloat(formData.unitCost)
    : 0;

  // Stat cards configuration
  const statCards: StatCard[] = [
    {
      title: "Total Orders",
      value: purchases.length.toString(),
      icon: "receipt-outline",
      color: "#2563EB",
    },
    {
      title: "Total Cost",
      value: `$${totalCost}`,
      icon: "cash-outline",
      color: "#059669",
    },
    {
      title: "Total Units",
      value: totalQuantity.toString(),
      icon: "cube-outline",
      color: "#7C3AED",
    },
  ];

  // Render purchase item
  const renderPurchaseItem = ({ item }: { item: PurchaseRecord }) => (
    <TouchableOpacity
      style={styles.purchaseCard}
      onPress={() => setSelectedPurchase(item)}
      activeOpacity={0.7}
    >
      <View style={styles.purchaseHeader}>
        <Text style={styles.productName}>{item.productName}</Text>
        <Text style={styles.purchaseAmount}>${item.total}</Text>
      </View>

      <View style={styles.purchaseDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="business-outline" size={14} color="#6B7280" />
            <Text style={styles.detailText}>{item.supplier}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="cube-outline" size={14} color="#6B7280" />
            <Text style={styles.detailText}>{item.quantity} units</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="pricetag-outline" size={14} color="#6B7280" />
            <Text style={styles.detailText}>${item.unitCost}/unit</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={14} color="#6B7280" />
            <Text style={styles.detailText}>
              {new Date(item.date).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render product item
  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => handleProductSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>${item.price}</Text>
      </View>

      <View style={styles.productDetails}>
        <Text style={styles.productDetail}>Stock: {item.stock}</Text>
        <Text style={styles.productDetail}>{item.category}</Text>
        {item.supplier && (
          <Text style={styles.productSupplier}>Supplier: {item.supplier}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading purchases...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#f97316" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Purchase Orders</Text>
          <Text style={styles.subtitle}>Manage inventory purchases</Text>
        </View>

        {/* Stats Grid */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statsScroll}
          contentContainerStyle={styles.statsContent}
        >
          {statCards.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: `${stat.color}15` }]}>
                <Ionicons name={stat.icon} size={20} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statTitle}>{stat.title}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Actions */}
        {/* <View style={styles.actionsCard}>

        </View> */}

        {/* Search Section */}
        <View style={styles.searchCard}>

         <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical:10 }}>

           <View>
            <Text style={styles.sectionTitle}>Purchase History</Text>
            <Text style={styles.sectionSubtitle}>
              {filteredPurchases.length} purchases found
            </Text>
          </View>
          <TouchableOpacity
            style={styles.newPurchaseButton}
            onPress={() => setIsProductModalOpen(true)}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.newPurchaseText}>Add New </Text>
          </TouchableOpacity>


         </View>


          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color="#6B7280" />
              <TextInput
                placeholder="Search purchases..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
                placeholderTextColor="#9CA3AF"
              />
              {searchQuery && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Purchases List */}
        {filteredPurchases.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cart-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No purchases found</Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Try adjusting your search'
                : 'Start by creating a purchase order'
              }
            </Text>
            {searchQuery && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setSearchQuery('')}
              >
                <Text style={styles.clearButtonText}>Clear Search</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredPurchases}
            renderItem={renderPurchaseItem}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            style={styles.purchasesList}
            contentContainerStyle={styles.purchasesContent}
          />
        )}
      </ScrollView>

      {/* Product Selection Modal */}
      <Modal
        visible={isProductModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsProductModalOpen(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Product</Text>
            <TouchableOpacity onPress={() => setIsProductModalOpen(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color="#6B7280" />
              <TextInput
                placeholder="Search products..."
                style={styles.searchInput}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <FlatList
            data={products}
            renderItem={renderProductItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.productsList}
          />
        </SafeAreaView>
      </Modal>

      {/* Create Purchase Modal */}
      <Modal
        visible={isPurchaseModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsPurchaseModalOpen(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Purchase</Text>
            <TouchableOpacity onPress={() => setIsPurchaseModalOpen(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
            {selectedProduct && (
              <View style={styles.selectedProduct}>
                <View style={styles.detailLine}>
                  <Text style={styles.detailLineLabel}>Product</Text>
                  <Text style={styles.detailLineValue}>{selectedProduct.name}</Text>
                </View>
                <View style={styles.detailLine}>
                  <Text style={styles.detailLineLabel}>Current Stock</Text>
                  <Text style={styles.detailLineValue}>{selectedProduct.stock}</Text>
                </View>
                <View style={[styles.detailLine, styles.detailLineLast]}>
                  <Text style={styles.detailLineLabel}>Current Price</Text>
                  <Text style={styles.detailLineValue}>${selectedProduct.price}</Text>
                </View>
              </View>
            )}

            <View style={styles.formContainer}>
              {/* Supplier */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Supplier</Text>
                <TextInput
                  value={formData.supplier}
                  onChangeText={(text) => setFormData({ ...formData, supplier: text })}
                  placeholder="Enter supplier name"
                  style={styles.formInput}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Unit Type */}
              {selectedProduct?.packSize && (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Purchase Type</Text>
                  <View style={styles.unitTypeContainer}>
                    <TouchableOpacity
                      style={[
                        styles.unitTypeButton,
                        formData.unitType === 'single' && styles.unitTypeButtonActive
                      ]}
                      onPress={() => setFormData({ ...formData, unitType: 'single' })}
                    >
                      <Text style={[
                        styles.unitTypeText,
                        formData.unitType === 'single' && styles.unitTypeTextActive
                      ]}>
                        Single Units
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.unitTypeButton,
                        formData.unitType === 'pack' && styles.unitTypeButtonActive
                      ]}
                      onPress={() => setFormData({ ...formData, unitType: 'pack' })}
                    >
                      <Text style={[
                        styles.unitTypeText,
                        formData.unitType === 'pack' && styles.unitTypeTextActive
                      ]}>
                        Packs ({selectedProduct.packSize} units)
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Quantity */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  Quantity {formData.unitType === 'pack' && `(packs)`}
                </Text>
                <TextInput
                  value={formData.quantity}
                  onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                  placeholder="Enter quantity"
                  keyboardType="numeric"
                  style={styles.formInput}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Unit Cost */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {formData.unitType === 'pack' ? 'Cost per Pack' : 'Cost per Unit'}
                </Text>
                <TextInput
                  value={formData.unitCost}
                  onChangeText={(text) => setFormData({ ...formData, unitCost: text })}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  style={styles.formInput}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Profit Margin */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Profit Margin (%)</Text>
                <TextInput
                  value={formData.profitMargin}
                  onChangeText={(text) => setFormData({ ...formData, profitMargin: text })}
                  placeholder="30"
                  keyboardType="numeric"
                  style={styles.formInput}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Summary */}
              {formData.quantity && formData.unitCost && (
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>Order Summary</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total Cost</Text>
                    <Text style={styles.summaryValue}>${totalFormCost.toFixed(2)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Suggested Price</Text>
                    <Text style={styles.suggestedPrice}>${suggestedPrice.toFixed(2)}</Text>
                  </View>
                  {formData.unitType === 'pack' && selectedProduct?.packSize && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Units Added</Text>
                      <Text style={styles.summaryValue}>
                        {parseInt(formData.quantity) * selectedProduct.packSize}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, isSubmittingPurchase && styles.submitButtonDisabled]}
              onPress={handlePurchaseSubmit}
              disabled={isSubmittingPurchase}
            >
              <View style={styles.buttonContent}>
                {isSubmittingPurchase && <ActivityIndicator size="small" color="#FFFFFF" />}
                <Text style={styles.submitButtonText}>{isSubmittingPurchase ? 'Saving...' : 'Create Purchase'}</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Purchase Details Modal */}
      <Modal
        visible={!!selectedPurchase}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedPurchase(null)}
      >
        {selectedPurchase && (
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order #{selectedPurchase.id}</Text>
              <TouchableOpacity onPress={() => setSelectedPurchase(null)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
              <View style={styles.detailsContainer}>
                <View style={styles.detailLine}>
                  <Text style={styles.detailLineLabel}>Product</Text>
                  <Text style={styles.detailLineValue}>{selectedPurchase.productName}</Text>
                </View>
                <View style={styles.detailLine}>
                  <Text style={styles.detailLineLabel}>Supplier</Text>
                  <Text style={styles.detailLineValue}>{selectedPurchase.supplier}</Text>
                </View>
                <View style={styles.detailLine}>
                  <Text style={styles.detailLineLabel}>Quantity</Text>
                  <Text style={styles.detailLineValue}>{selectedPurchase.quantity} units</Text>
                </View>
                <View style={styles.detailLine}>
                  <Text style={styles.detailLineLabel}>Unit Cost</Text>
                  <Text style={styles.detailLineValue}>${selectedPurchase.unitCost}</Text>
                </View>
                <View style={styles.detailLine}>
                  <Text style={styles.detailLineLabel}>Date</Text>
                  <Text style={styles.detailLineValue}>{new Date(selectedPurchase.date).toLocaleDateString()}</Text>
                </View>
                <View style={[styles.detailLine, styles.detailLineLast]}>
                  <Text style={styles.detailLineLabel}>Total Cost</Text>
                  <Text style={[styles.detailLineValue, styles.totalCost]}>${selectedPurchase.total}</Text>
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
    backgroundColor: ADMIN_COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },

  // Loading
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

  // Stats
  statsScroll: {
    marginBottom: 20,
  },
  statsContent: {
    paddingHorizontal: 20,
    paddingRight: 40,
  },
  statCard: {
    ...ADMIN_STAT_CARD,
    padding: 16,
    marginRight: 12,
    width: 120,
    flexDirection: "column",
    alignItems: "center",
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: ADMIN_COLORS.text,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: ADMIN_COLORS.secondaryText,
  },

  // Actions
  actionsCard: {
    ...ADMIN_SECTION_CARD,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  newPurchaseButton: {
    backgroundColor: ADMIN_COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal:16,
  },
  newPurchaseText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },

  // Search Section
  searchCard: {
    ...ADMIN_SECTION_CARD,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    ...ADMIN_SECTION_TITLE,
    marginBottom: 4,
  },
  sectionSubtitle: {
    ...ADMIN_SECTION_SUBTITLE,
    marginBottom: 16,
  },
  searchContainer: {
    marginBottom: 4,
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

  // Purchases List
  purchasesList: {
    marginHorizontal: 20,
  },
  purchasesContent: {
    paddingBottom: 40,
  },
  purchaseCard: {
    ...ADMIN_LIST_CARD,
    marginBottom: 12,
  },
  purchaseHeader: {
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
  },
  purchaseAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: ADMIN_COLORS.success,
  },
  purchaseDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    fontSize: 13,
    color: ADMIN_COLORS.secondaryText,
    marginLeft: 4,
  },

  // Empty State
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
    marginBottom: 16,
  },
  clearButton: {
    backgroundColor: ADMIN_COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  clearButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
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
    padding: 20,
  },
  modalContent: {
    gap: 16,
  },

  // Product Selection Modal
  productsList: {
    flex: 1,
    padding: 20,
  },
  productCard: {
    ...ADMIN_LIST_CARD,
    marginBottom: 12,
  },
  productInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: ADMIN_COLORS.success,
  },
  productDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  productDetail: {
    fontSize: 13,
    color: ADMIN_COLORS.secondaryText,
  },
  productSupplier: {
    fontSize: 13,
    color: ADMIN_COLORS.info,
    fontWeight: "500",
  },

  // Purchase Form Modal
  selectedProduct: {
    ...ADMIN_MODAL_SECTION,
    padding: 16,
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

  // Form
  formContainer: {
    ...ADMIN_MODAL_SECTION,
    gap: 20,
  },
  formGroup: {
    gap: 8,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: ADMIN_COLORS.text,
  },
  formInput: {
    ...ADMIN_INPUT_FIELD,
    borderRadius: 12,
    fontSize: 16,
    color: ADMIN_COLORS.text,
  },
  unitTypeContainer: {
    flexDirection: "row",
    gap: 12,
  },
  unitTypeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: ADMIN_COLORS.surfaceMuted,
  },
  unitTypeButtonActive: {
    backgroundColor: ADMIN_COLORS.primary,
    borderColor: ADMIN_COLORS.primary,
  },
  unitTypeText: {
    fontSize: 14,
    fontWeight: "500",
    color: ADMIN_COLORS.secondaryText,
  },
  unitTypeTextActive: {
    color: "#FFFFFF",
  },

  // Summary
  summaryCard: {
    ...ADMIN_LIST_CARD,
    backgroundColor: ADMIN_COLORS.surfaceMuted,
    padding: 16,
    marginTop: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: ADMIN_COLORS.text,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
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
  suggestedPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: ADMIN_COLORS.success,
  },

  // Submit Button
  submitButton: {
    ...ADMIN_PRIMARY_BUTTON,
  },
  submitButtonDisabled: {
    ...ADMIN_PRIMARY_BUTTON_DISABLED,
  },
  buttonContent: {
    ...ADMIN_BUTTON_CONTENT,
  },
  submitButtonText: {
    ...ADMIN_BUTTON_TEXT,
  },

  // Details Modal
  detailsContainer: {
    ...ADMIN_MODAL_SECTION,
    marginTop: 12,
  },
  detailLabel: {
    fontSize: 13,
    color: ADMIN_COLORS.secondaryText,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
    color: ADMIN_COLORS.text,
  },
  totalCost: {
    color: ADMIN_COLORS.success,
  },
});

export default AdminPurchases;
