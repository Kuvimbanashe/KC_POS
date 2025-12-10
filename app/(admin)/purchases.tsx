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
  ActivityIndicator
} from 'react-native';
import { StyleSheet } from 'react-native';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { Ionicons } from '@expo/vector-icons';
import { addPurchase, updateProduct } from '../../store/slices/userSlice';
import type { PurchaseRecord, Product } from '../../store/types';

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
  const dispatch = useAppDispatch();
  
  const [filteredPurchases, setFilteredPurchases] = useState<PurchaseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseRecord | null>(null);
  
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
      purchase.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.id.toString().includes(searchQuery.toLowerCase())
    );
    setFilteredPurchases(filtered);
  }, [searchQuery, purchases]);

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
  const handlePurchaseSubmit = () => {
    if (!selectedProduct || !formData.quantity || !formData.unitCost || !formData.supplier) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const quantity = parseInt(formData.quantity);
      const unitCost = parseFloat(formData.unitCost);
      const margin = parseFloat(formData.profitMargin);
      const sellingPrice = calculateSellingPrice(unitCost, margin);
      
      const actualQuantity = formData.unitType === 'pack' && selectedProduct.packSize 
        ? quantity * selectedProduct.packSize 
        : quantity;

      const totalCost = quantity * unitCost;

      // Add purchase to Redux store
      dispatch(addPurchase({
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        quantity: actualQuantity,
        unitCost,
        total: totalCost,
        supplier: formData.supplier,
      }));

      // Update product with supplier info if not already set
      if (!selectedProduct.supplier) {
        dispatch(updateProduct({
          id: selectedProduct.id,
          supplier: formData.supplier,
        }));
      }

      Alert.alert(
        'Success',
        `Purchase order created!\n\n` +
        `Suggested price: $${sellingPrice.toFixed(2)}\n` +
        `${actualQuantity} units added to stock`
      );
      
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
      value: `$${totalCost.toFixed(2)}`,
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
        <Text style={styles.purchaseAmount}>${item.total.toFixed(2)}</Text>
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
            <Text style={styles.detailText}>${item.unitCost.toFixed(2)}/unit</Text>
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
        <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
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
      <ScrollView style={styles.scrollView}>
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
        <View style={styles.actionsCard}>
          <TouchableOpacity
            style={styles.newPurchaseButton}
            onPress={() => setIsProductModalOpen(true)}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.newPurchaseText}>New Purchase</Text>
          </TouchableOpacity>
        </View>

        {/* Search Section */}
        <View style={styles.searchCard}>
          <Text style={styles.sectionTitle}>Purchase History</Text>
          <Text style={styles.sectionSubtitle}>
            {filteredPurchases.length} purchases found
          </Text>
          
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

          <ScrollView style={styles.modalScroll}>
            {selectedProduct && (
              <View style={styles.selectedProduct}>
                <Text style={styles.productLabel}>Product</Text>
                <Text style={styles.productName}>{selectedProduct.name}</Text>
                <View style={styles.productInfoRow}>
                  <Text style={styles.productInfoText}>
                    Stock: {selectedProduct.stock} • ${selectedProduct.price.toFixed(2)}
                  </Text>
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
              style={styles.submitButton}
              onPress={handlePurchaseSubmit}
            >
              <Text style={styles.submitButtonText}>Create Purchase</Text>
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

            <ScrollView style={styles.modalScroll}>
              <View style={styles.detailsContainer}>
                <View style={styles.detailsGrid}>
                  <View style={styles.detailItemLarge}>
                    <Text style={styles.detailLabel}>Product</Text>
                    <Text style={styles.detailValue}>{selectedPurchase.productName}</Text>
                  </View>
                  <View style={styles.detailItemLarge}>
                    <Text style={styles.detailLabel}>Supplier</Text>
                    <Text style={styles.detailValue}>{selectedPurchase.supplier}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Quantity</Text>
                    <Text style={styles.detailValue}>{selectedPurchase.quantity} units</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Unit Cost</Text>
                    <Text style={styles.detailValue}>
                      ${selectedPurchase.unitCost.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Total Cost</Text>
                    <Text style={[styles.detailValue, styles.totalCost]}>
                      ${selectedPurchase.total.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Date</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedPurchase.date).toLocaleDateString()}
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

  // Loading
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

  // Stats
  statsScroll: {
    marginBottom: 20,
  },
  statsContent: {
    paddingHorizontal: 20,
    paddingRight: 40,
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 120,
    borderWidth: 1,
    borderColor: "#E5E7EB",
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
    color: "#111827",
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: "#6B7280",
  },

  // Actions
  actionsCard: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  newPurchaseButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  newPurchaseText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },

  // Search Section
  searchCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 16,
  },
  searchContainer: {
    marginBottom: 4,
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

  // Purchases List
  purchasesList: {
    marginHorizontal: 20,
  },
  purchasesContent: {
    paddingBottom: 40,
  },
  purchaseCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
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
    color: "#111827",
    flex: 1,
  },
  purchaseAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#059669",
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
    color: "#6B7280",
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
    color: "#111827",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 16,
  },
  clearButton: {
    backgroundColor: "#2563EB",
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
    padding: 20,
  },

  // Product Selection Modal
  productsList: {
    flex: 1,
    padding: 20,
  },
  productCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
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
    color: "#059669",
  },
  productDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  productDetail: {
    fontSize: 13,
    color: "#6B7280",
  },
  productSupplier: {
    fontSize: 13,
    color: "#2563EB",
    fontWeight: "500",
  },

  // Purchase Form Modal
  selectedProduct: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  productLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 4,
  },
  productInfoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  productInfoText: {
    fontSize: 13,
    color: "#6B7280",
  },

  // Form
  formContainer: {
    gap: 20,
  },
  formGroup: {
    gap: 8,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  formInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
  },
  unitTypeContainer: {
    flexDirection: "row",
    gap: 12,
  },
  unitTypeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  unitTypeButtonActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  unitTypeText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  unitTypeTextActive: {
    color: "#FFFFFF",
  },

  // Summary
  summaryCard: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
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
    color: "#6B7280",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  suggestedPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#059669",
  },

  // Submit Button
  submitButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  // Details Modal
  detailsContainer: {
    marginTop: 12,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
 
  detailItemLarge: {
    width: "100%",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  totalCost: {
    color: "#059669",
  },
});

export default AdminPurchases;