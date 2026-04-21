import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fetchOperationalData } from '../../../store/slices/userSlice';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import type { Product, PurchaseRecord } from '../../../store/types';
import { apiClient } from '../../../services/api';

const MAX_CURRENCY_VALUE = 9_999_999_999.99;
const PURCHASE_STATUS_OPTIONS = ['Completed', 'Pending'] as const;

type PurchaseStatus = typeof PURCHASE_STATUS_OPTIONS[number];
type PurchaseStatusFilter = 'all' | PurchaseStatus;

interface PurchaseFormData {
  quantity: string;
  unitCost: string;
  unitType: 'single' | 'pack';
  profitMargin: string;
  supplier: string;
  status: PurchaseStatus;
}

interface StatCard {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const COLORS = {
  primary: '#0f172a',
  accent: '#f97316',
  background: '#ffffff',
  card: '#ffffff',
  border: '#e2e8f0',
  input: '#f8fafc',
  muted: '#64748b',
  mutedLight: '#f8fafc',
  danger: '#ea580c',
  success: '#0f172a',
  warning: '#f97316',
};

const getPurchaseStatusColor = (status: PurchaseStatus) => {
  if (status === 'Pending') {
    return { background: '#ffedd5', text: COLORS.warning };
  }

  return { background: '#dbeafe', text: COLORS.primary };
};

const calculateSellingPrice = (unitCost: number, margin: number) => unitCost * (1 + margin / 100);

const AdminPurchases = () => {
  const { purchases, products } = useAppSelector((state) => state.user);
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!user?.businessId) return;
    dispatch(fetchOperationalData(user.businessId));
  }, [dispatch, user?.businessId]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingPurchase, setIsSubmittingPurchase] = useState(false);
  const [isDeletingPurchase, setIsDeletingPurchase] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseRecord | null>(null);
  const [editingPurchase, setEditingPurchase] = useState<PurchaseRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PurchaseStatusFilter>('all');

  const [formData, setFormData] = useState<PurchaseFormData>({
    quantity: '',
    unitCost: '',
    unitType: 'single',
    profitMargin: '30',
    supplier: '',
    status: 'Completed',
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, [purchases, products]);

  const filteredPurchases = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return purchases.filter((purchase) => {
      const matchesSearch =
        !query ||
        purchase.productName.toLowerCase().includes(query) ||
        purchase.supplier.toLowerCase().includes(query) ||
        purchase.orderNumber.toLowerCase().includes(query) ||
        purchase.id.toString().includes(query);

      const matchesStatus = statusFilter === 'all' || purchase.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [purchases, searchQuery, statusFilter]);

  const filteredProducts = useMemo(() => {
    const query = productSearchQuery.trim().toLowerCase();

    return products.filter((product) => {
      if (!query) return true;

      return (
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        (product.supplier ?? '').toLowerCase().includes(query)
      );
    });
  }, [productSearchQuery, products]);

  const totalCost = purchases.reduce((sum, purchase) => sum + purchase.total, 0);
  const totalQuantity = purchases.reduce((sum, purchase) => sum + purchase.quantity, 0);
  const pendingPurchases = purchases.filter((purchase) => purchase.status === 'Pending').length;

  const statCards: StatCard[] = [
    {
      title: 'Total Purchases',
      value: purchases.length.toString(),
      icon: 'receipt-outline',
      color: COLORS.primary,
    },
    {
      title: 'Total Cost',
      value: `$${totalCost.toFixed(2)}`,
      icon: 'cash-outline',
      color: COLORS.accent,
    },
    {
      title: 'Units Added',
      value: totalQuantity.toString(),
      icon: 'cube-outline',
      color: COLORS.success,
    },
    {
      title: 'Pending Orders',
      value: pendingPurchases.toString(),
      icon: 'time-outline',
      color: COLORS.warning,
    },
  ];

  const parsedQuantity = Number.parseInt(formData.quantity, 10);
  const parsedUnitCost = Number.parseFloat(formData.unitCost);
  const parsedMargin = Number.parseFloat(formData.profitMargin);
  const unitsAdded =
    formData.unitType === 'pack' && selectedProduct?.packSize
      ? (Number.isInteger(parsedQuantity) ? parsedQuantity : 0) * selectedProduct.packSize
      : Number.isInteger(parsedQuantity)
        ? parsedQuantity
        : 0;
  const effectiveUnitCost =
    formData.unitType === 'pack' && selectedProduct?.packSize && Number.isFinite(parsedUnitCost)
      ? parsedUnitCost / selectedProduct.packSize
      : Number.isFinite(parsedUnitCost)
        ? parsedUnitCost
        : 0;
  const totalFormCost =
    Number.isInteger(parsedQuantity) && Number.isFinite(parsedUnitCost) ? parsedQuantity * parsedUnitCost : 0;
  const suggestedPrice =
    effectiveUnitCost > 0 && Number.isFinite(parsedMargin)
      ? calculateSellingPrice(effectiveUnitCost, parsedMargin)
      : 0;

  const resetForm = () => {
    setFormData({
      quantity: '',
      unitCost: '',
      unitType: 'single',
      profitMargin: '30',
      supplier: '',
      status: 'Completed',
    });
    setSelectedProduct(null);
    setEditingPurchase(null);
    setProductSearchQuery('');
  };

  const openCreatePurchase = () => {
    resetForm();
    setIsProductModalOpen(true);
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(false);
    setIsPurchaseModalOpen(true);
    setFormData((prev) => ({
      ...prev,
      supplier: prev.supplier || product.supplier || '',
      unitType: product.packSize ? prev.unitType : 'single',
    }));
  };

  const handleEditPurchase = (purchase: PurchaseRecord) => {
    const matchingProduct = products.find((product) => product.id === purchase.productId);

    if (!matchingProduct) {
      Alert.alert('Product Not Found', 'This purchase cannot be edited because its product is unavailable.');
      return;
    }

    setSelectedPurchase(null);
    setEditingPurchase(purchase);
    setSelectedProduct(matchingProduct);
    setFormData({
      quantity: purchase.quantity.toString(),
      unitCost: purchase.unitCost.toFixed(2),
      unitType: 'single',
      profitMargin: '30',
      supplier: purchase.supplier,
      status: purchase.status,
    });
    setIsPurchaseModalOpen(true);
  };

  const handlePurchaseSubmit = async () => {
    if (!selectedProduct || !formData.quantity || !formData.unitCost || !formData.supplier.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    if (!user?.businessId) {
      Alert.alert('Error', 'Business context missing. Please sign in again.');
      return;
    }

    const quantity = Number.parseInt(formData.quantity, 10);
    const unitCostInput = Number.parseFloat(formData.unitCost);
    const margin = Number.parseFloat(formData.profitMargin || '0');

    if (!Number.isInteger(quantity) || quantity <= 0) {
      Alert.alert('Error', 'Quantity must be a whole number greater than zero.');
      return;
    }

    if (!Number.isFinite(unitCostInput) || unitCostInput <= 0) {
      Alert.alert('Error', 'Cost must be greater than zero.');
      return;
    }

    if (!Number.isFinite(margin) || margin < 0) {
      Alert.alert('Error', 'Profit margin must be zero or greater.');
      return;
    }

    const actualQuantity =
      formData.unitType === 'pack' && selectedProduct.packSize
        ? quantity * selectedProduct.packSize
        : quantity;
    const unitCost =
      formData.unitType === 'pack' && selectedProduct.packSize
        ? unitCostInput / selectedProduct.packSize
        : unitCostInput;
    const total = quantity * unitCostInput;

    if (unitCost > MAX_CURRENCY_VALUE || total > MAX_CURRENCY_VALUE) {
      Alert.alert('Error', `Values must be below ${MAX_CURRENCY_VALUE.toFixed(2)}.`);
      return;
    }

    setIsSubmittingPurchase(true);
    try {
      const payload = {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        quantity: actualQuantity,
        unitCost: Number(unitCost.toFixed(2)),
        total: Number(total.toFixed(2)),
        supplier: formData.supplier.trim(),
        status: formData.status,
        businessId: user.businessId,
      };

      if (editingPurchase) {
        await apiClient.updatePurchase(editingPurchase.id, payload);
      } else {
        await apiClient.createPurchase(payload);
      }

      dispatch(fetchOperationalData(user.businessId));

      Alert.alert(
        'Success',
        editingPurchase
          ? 'Purchase updated successfully.'
          : `Purchase saved.\n\nSuggested selling price: $${calculateSellingPrice(unitCost, margin).toFixed(2)}`,
      );

      setIsPurchaseModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving purchase:', error);
      const message = error instanceof Error ? error.message : 'Failed to save purchase';
      Alert.alert('Error', message);
    } finally {
      setIsSubmittingPurchase(false);
    }
  };

  const handleDeletePurchase = (purchase: PurchaseRecord) => {
    Alert.alert(
      'Delete Purchase',
      `Are you sure you want to delete ${purchase.orderNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!user?.businessId) {
              Alert.alert('Error', 'Business context missing. Please sign in again.');
              return;
            }

            setIsDeletingPurchase(true);
            try {
              await apiClient.deletePurchase(purchase.id);
              dispatch(fetchOperationalData(user.businessId));
              setSelectedPurchase(null);
              Alert.alert('Success', 'Purchase deleted successfully.');
            } catch (error) {
              console.error('Error deleting purchase:', error);
              const message = error instanceof Error ? error.message : 'Failed to delete purchase';
              Alert.alert('Error', message);
            } finally {
              setIsDeletingPurchase(false);
            }
          },
        },
      ],
    );
  };

  const renderPurchaseItem = ({ item }: { item: PurchaseRecord }) => {
    const statusColor = getPurchaseStatusColor(item.status);

    return (
      <TouchableOpacity
        style={[styles.purchaseCard, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}
        onPress={() => setSelectedPurchase(item)}
        activeOpacity={0.7}
      >
        <View style={styles.purchaseHeader}>
          <View style={styles.purchaseInfo}>
            <Text style={[styles.purchaseName, { color: COLORS.primary }]}>{item.productName}</Text>
            <Text style={[styles.purchaseDate, { color: COLORS.muted }]}>
              {new Date(item.date).toLocaleDateString()}
            </Text>
          </View>
          <Text style={[styles.purchaseAmount, { color: COLORS.accent }]}>${item.total.toFixed(2)}</Text>
        </View>

        <View style={styles.purchaseFooter}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor.background }]}>
            <Text style={[styles.statusText, { color: statusColor.text }]}>{item.status}</Text>
          </View>
          <Text style={[styles.purchaseMeta, { color: COLORS.muted }]}>
            {item.quantity} units • {item.supplier}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={[styles.productCard, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}
      onPress={() => handleProductSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.productRow}>
        <View style={styles.productInfo}>
          <Text style={[styles.purchaseName, { color: COLORS.primary }]}>{item.name}</Text>
          <Text style={[styles.productMetaText, { color: COLORS.muted }]}>
            {item.category} • {item.sku}
          </Text>
        </View>
        <Text style={[styles.productPrice, { color: COLORS.accent }]}>${item.price.toFixed(2)}</Text>
      </View>
      <View style={styles.productFooter}>
        <Text style={[styles.productMetaText, { color: COLORS.muted }]}>Stock: {item.stock}</Text>
        <Text style={[styles.productMetaText, { color: COLORS.muted }]}>
          {item.supplier || 'No supplier'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: COLORS.background }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.loadingText, { color: COLORS.muted }]}>Loading purchases...</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: COLORS.primary }]}>Purchases</Text>
          <Text style={[styles.subtitle, { color: COLORS.muted }]}>Track inventory buying and supplier orders</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statsScroll}
          contentContainerStyle={styles.statsContent}
        >
          {statCards.map((stat) => (
            <View
              key={stat.title}
              style={[styles.statCard, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}
            >
              <View style={[styles.statIcon, { backgroundColor: `${stat.color}15` }]}>
                <Ionicons name={stat.icon} size={20} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: COLORS.primary }]}>{stat.value}</Text>
              <Text style={[styles.statTitle, { color: COLORS.muted }]}>{stat.title}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={[styles.searchCard, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}>
          <View style={styles.searchHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: COLORS.primary }]}>Purchase History</Text>
              <Text style={[styles.sectionSubtitle, { color: COLORS.muted }]}>
                {filteredPurchases.length} purchases found
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: COLORS.primary }]}
              onPress={openCreatePurchase}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add Purchase</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <View style={[styles.searchBar, { backgroundColor: COLORS.input }]}>
              <Ionicons name="search" size={18} color={COLORS.muted} />
              <TextInput
                placeholder="Search purchases..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={[styles.searchInput, { color: COLORS.primary }]}
                placeholderTextColor={COLORS.muted}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={COLORS.muted} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterContainer}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: statusFilter === 'all' ? COLORS.accent : COLORS.input,
                    borderColor: statusFilter === 'all' ? COLORS.accent : COLORS.border,
                  },
                ]}
                onPress={() => setStatusFilter('all')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: statusFilter === 'all' ? '#FFFFFF' : COLORS.primary },
                  ]}
                >
                  All Statuses
                </Text>
              </TouchableOpacity>
              {PURCHASE_STATUS_OPTIONS.map((status) => {
                const isActive = statusFilter === status;
                return (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: isActive ? COLORS.primary : COLORS.input,
                        borderColor: isActive ? COLORS.primary : COLORS.border,
                      },
                    ]}
                    onPress={() => setStatusFilter(status)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        { color: isActive ? '#FFFFFF' : COLORS.primary },
                      ]}
                    >
                      {status}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {filteredPurchases.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cart-outline" size={64} color={COLORS.border} />
            <Text style={[styles.emptyTitle, { color: COLORS.primary }]}>No purchases found</Text>
            <Text style={[styles.emptyText, { color: COLORS.muted }]}>
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search'
                : 'Start by recording your first purchase'}
            </Text>
            {searchQuery || statusFilter !== 'all' ? (
              <TouchableOpacity
                style={[styles.clearButton, { backgroundColor: COLORS.primary }]}
                onPress={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
              >
                <Text style={styles.clearButtonText}>Clear Filters</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: COLORS.primary }]}
                onPress={openCreatePurchase}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Add Purchase</Text>
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

      <Modal
        visible={isProductModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsProductModalOpen(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: COLORS.background }]} edges={['top', 'bottom']}>
          <View style={[styles.modalHeader, { borderBottomColor: COLORS.border }]}>
            <Text style={[styles.modalTitle, { color: COLORS.primary }]}>Select Product</Text>
            <TouchableOpacity onPress={() => setIsProductModalOpen(false)}>
              <Ionicons name="close" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalSearchContainer}>
            <View style={[styles.searchBar, { backgroundColor: COLORS.input }]}>
              <Ionicons name="search" size={18} color={COLORS.muted} />
              <TextInput
                placeholder="Search products..."
                value={productSearchQuery}
                onChangeText={setProductSearchQuery}
                style={[styles.searchInput, { color: COLORS.primary }]}
                placeholderTextColor={COLORS.muted}
              />
              {productSearchQuery ? (
                <TouchableOpacity onPress={() => setProductSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={COLORS.muted} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {filteredProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={56} color={COLORS.border} />
              <Text style={[styles.emptyTitle, { color: COLORS.primary }]}>No products match</Text>
              <Text style={[styles.emptyText, { color: COLORS.muted }]}>Try another search term.</Text>
            </View>
          ) : (
            <FlatList
              data={filteredProducts}
              renderItem={renderProductItem}
              keyExtractor={(item) => item.id.toString()}
              style={styles.productsList}
              contentContainerStyle={styles.productsContent}
            />
          )}
        </SafeAreaView>
      </Modal>

      <Modal
        visible={isPurchaseModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setIsPurchaseModalOpen(false);
          resetForm();
        }}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: COLORS.background }]} edges={['top', 'bottom']}>
          <View style={[styles.modalHeader, { borderBottomColor: COLORS.border }]}>
            <Text style={[styles.modalTitle, { color: COLORS.primary }]}>
              {editingPurchase ? 'Edit Purchase' : 'New Purchase'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setIsPurchaseModalOpen(false);
                resetForm();
              }}
            >
              <Ionicons name="close" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
              {selectedProduct ? (
                <View style={[styles.selectedProductCard, { backgroundColor: COLORS.input, borderColor: COLORS.border }]}>
                  <View style={styles.selectedProductHeader}>
                    <View style={styles.purchaseInfo}>
                      <Text style={[styles.formLabel, { color: COLORS.muted }]}>Product</Text>
                      <Text style={[styles.purchaseName, { color: COLORS.primary }]}>{selectedProduct.name}</Text>
                      <Text style={[styles.productMetaText, { color: COLORS.muted }]}>
                        {selectedProduct.category} • Stock: {selectedProduct.stock}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.changeProductButton, { borderColor: COLORS.border }]}
                      onPress={() => {
                        setIsPurchaseModalOpen(false);
                        setIsProductModalOpen(true);
                      }}
                    >
                      <Text style={[styles.changeProductText, { color: COLORS.primary }]}>Change</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}

              <View style={styles.formContainer}>
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: COLORS.primary }]}>Supplier *</Text>
                  <TextInput
                    value={formData.supplier}
                    onChangeText={(text) => setFormData((prev) => ({ ...prev, supplier: text }))}
                    placeholder="Enter supplier name"
                    style={[styles.formInput, { backgroundColor: COLORS.input, borderColor: COLORS.border, color: COLORS.primary }]}
                    placeholderTextColor={COLORS.muted}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: COLORS.primary }]}>Status</Text>
                  <View style={styles.filterContainer}>
                    {PURCHASE_STATUS_OPTIONS.map((status) => {
                      const isActive = formData.status === status;
                      return (
                        <TouchableOpacity
                          key={status}
                          style={[
                            styles.optionChip,
                            {
                              backgroundColor: isActive ? COLORS.primary : COLORS.input,
                              borderColor: isActive ? COLORS.primary : COLORS.border,
                            },
                          ]}
                          onPress={() => setFormData((prev) => ({ ...prev, status }))}
                        >
                          <Text
                            style={[
                              styles.optionChipText,
                              { color: isActive ? '#FFFFFF' : COLORS.primary },
                            ]}
                          >
                            {status}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {selectedProduct?.packSize ? (
                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: COLORS.primary }]}>Purchase Type</Text>
                    <View style={styles.toggleRow}>
                      <TouchableOpacity
                        style={[
                          styles.toggleButton,
                          {
                            backgroundColor: formData.unitType === 'single' ? COLORS.primary : COLORS.input,
                            borderColor: formData.unitType === 'single' ? COLORS.primary : COLORS.border,
                          },
                        ]}
                        onPress={() => setFormData((prev) => ({ ...prev, unitType: 'single' }))}
                      >
                        <Text
                          style={[
                            styles.toggleButtonText,
                            { color: formData.unitType === 'single' ? '#FFFFFF' : COLORS.primary },
                          ]}
                        >
                          Single Units
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.toggleButton,
                          {
                            backgroundColor: formData.unitType === 'pack' ? COLORS.primary : COLORS.input,
                            borderColor: formData.unitType === 'pack' ? COLORS.primary : COLORS.border,
                          },
                        ]}
                        onPress={() => setFormData((prev) => ({ ...prev, unitType: 'pack' }))}
                      >
                        <Text
                          style={[
                            styles.toggleButtonText,
                            { color: formData.unitType === 'pack' ? '#FFFFFF' : COLORS.primary },
                          ]}
                        >
                          Packs ({selectedProduct.packSize})
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: COLORS.primary }]}>
                    Quantity {formData.unitType === 'pack' ? '(packs)' : '(units)'}
                  </Text>
                  <TextInput
                    value={formData.quantity}
                    onChangeText={(text) => setFormData((prev) => ({ ...prev, quantity: text }))}
                    placeholder="Enter quantity"
                    keyboardType="numeric"
                    style={[styles.formInput, { backgroundColor: COLORS.input, borderColor: COLORS.border, color: COLORS.primary }]}
                    placeholderTextColor={COLORS.muted}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: COLORS.primary }]}>
                    {formData.unitType === 'pack' ? 'Cost per Pack' : 'Cost per Unit'}
                  </Text>
                  <TextInput
                    value={formData.unitCost}
                    onChangeText={(text) => setFormData((prev) => ({ ...prev, unitCost: text }))}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    style={[styles.formInput, { backgroundColor: COLORS.input, borderColor: COLORS.border, color: COLORS.primary }]}
                    placeholderTextColor={COLORS.muted}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: COLORS.primary }]}>Profit Margin (%)</Text>
                  <TextInput
                    value={formData.profitMargin}
                    onChangeText={(text) => setFormData((prev) => ({ ...prev, profitMargin: text }))}
                    placeholder="30"
                    keyboardType="decimal-pad"
                    style={[styles.formInput, { backgroundColor: COLORS.input, borderColor: COLORS.border, color: COLORS.primary }]}
                    placeholderTextColor={COLORS.muted}
                  />
                </View>

                {(formData.quantity || formData.unitCost) && selectedProduct ? (
                  <View style={[styles.summaryCard, { backgroundColor: COLORS.input, borderColor: COLORS.border }]}>
                    <Text style={[styles.summaryTitle, { color: COLORS.primary }]}>Purchase Summary</Text>
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { color: COLORS.muted }]}>Units Added</Text>
                      <Text style={[styles.summaryValue, { color: COLORS.primary }]}>{unitsAdded || 0}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { color: COLORS.muted }]}>Effective Unit Cost</Text>
                      <Text style={[styles.summaryValue, { color: COLORS.primary }]}>${effectiveUnitCost.toFixed(2)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { color: COLORS.muted }]}>Total Cost</Text>
                      <Text style={[styles.summaryValue, { color: COLORS.primary }]}>${totalFormCost.toFixed(2)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { color: COLORS.muted }]}>Suggested Price</Text>
                      <Text style={[styles.summaryAccent, { color: COLORS.accent }]}>${suggestedPrice.toFixed(2)}</Text>
                    </View>
                  </View>
                ) : null}
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: COLORS.primary },
                  isSubmittingPurchase && styles.submitButtonDisabled,
                ]}
                onPress={handlePurchaseSubmit}
                disabled={isSubmittingPurchase}
              >
                <View style={styles.buttonContent}>
                  {isSubmittingPurchase ? <ActivityIndicator size="small" color="#FFFFFF" /> : null}
                  <Text style={styles.submitButtonText}>
                    {isSubmittingPurchase
                      ? editingPurchase
                        ? 'Updating Purchase...'
                        : 'Saving Purchase...'
                      : editingPurchase
                        ? 'Update Purchase'
                        : 'Create Purchase'}
                  </Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={!!selectedPurchase}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedPurchase(null)}
      >
        {selectedPurchase ? (
          <SafeAreaView style={[styles.modalContainer, { backgroundColor: COLORS.background }]} edges={['top', 'bottom']}>
            <View style={[styles.modalHeader, { borderBottomColor: COLORS.border }]}>
              <Text style={[styles.modalTitle, { color: COLORS.primary }]}>Purchase Details</Text>
              <TouchableOpacity onPress={() => setSelectedPurchase(null)}>
                <Ionicons name="close" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.detailScrollContent}>
              <View style={styles.detailStack}>
                <View style={[styles.detailHero, { backgroundColor: COLORS.primary }]}>
                  <Text style={styles.detailHeroValue}>${selectedPurchase.total.toFixed(2)}</Text>
                  <Text style={styles.detailHeroLabel}>{selectedPurchase.productName}</Text>
                </View>

                <View style={[styles.detailCard, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: COLORS.muted }]}>Order Number</Text>
                    <Text style={[styles.detailValue, { color: COLORS.primary }]}>{selectedPurchase.orderNumber}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: COLORS.muted }]}>Supplier</Text>
                    <Text style={[styles.detailValue, { color: COLORS.primary }]}>{selectedPurchase.supplier}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: COLORS.muted }]}>Quantity</Text>
                    <Text style={[styles.detailValue, { color: COLORS.primary }]}>{selectedPurchase.quantity} units</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: COLORS.muted }]}>Unit Cost</Text>
                    <Text style={[styles.detailValue, { color: COLORS.primary }]}>${selectedPurchase.unitCost.toFixed(2)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: COLORS.muted }]}>Date</Text>
                    <Text style={[styles.detailValue, { color: COLORS.primary }]}>
                      {new Date(selectedPurchase.date).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: COLORS.muted }]}>Status</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getPurchaseStatusColor(selectedPurchase.status).background },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: getPurchaseStatusColor(selectedPurchase.status).text },
                        ]}
                      >
                        {selectedPurchase.status}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.secondaryActionButton, { backgroundColor: COLORS.primary }]}
                    onPress={() => handleEditPurchase(selectedPurchase)}
                  >
                    <Text style={styles.secondaryActionText}>Edit Purchase</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.destructiveButton,
                      { backgroundColor: COLORS.danger },
                      isDeletingPurchase && styles.submitButtonDisabled,
                    ]}
                    onPress={() => handleDeletePurchase(selectedPurchase)}
                    disabled={isDeletingPurchase}
                  >
                    {isDeletingPurchase ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                    )}
                    <Text style={styles.destructiveButtonText}>
                      {isDeletingPurchase ? 'Deleting...' : 'Delete Purchase'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        ) : null}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  statsScroll: {
    marginBottom: 20,
  },
  statsContent: {
    paddingHorizontal: 20,
    paddingRight: 36,
  },
  statCard: {
    width: 148,
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
  },
  searchCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  addButton: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
    marginRight: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  purchasesList: {
    marginHorizontal: 20,
  },
  purchasesContent: {
    paddingBottom: 40,
  },
  purchaseCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  purchaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  purchaseInfo: {
    flex: 1,
  },
  purchaseName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  purchaseDate: {
    fontSize: 13,
  },
  purchaseAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  purchaseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  purchaseMeta: {
    fontSize: 13,
    flex: 1,
    textAlign: 'right',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  clearButton: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalSearchContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  modalScroll: {
    flex: 1,
    padding: 20,
  },
  formContainer: {
    gap: 20,
  },
  selectedProductCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  selectedProductHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  changeProductButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  changeProductText: {
    fontSize: 13,
    fontWeight: '600',
  },
  formGroup: {
    gap: 8,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  optionChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryAccent: {
    fontSize: 14,
    fontWeight: '700',
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  productsList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  productCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  productMetaText: {
    fontSize: 13,
  },
  detailScrollContent: {
    paddingBottom: 28,
  },
  detailStack: {
    gap: 20,
  },
  detailHero: {
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailHeroValue: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  detailHeroLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.92,
  },
  detailCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
  actionButtons: {
    gap: 12,
  },
  secondaryActionButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  destructiveButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  destructiveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AdminPurchases;
