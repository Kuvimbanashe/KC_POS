import { useEffect, useMemo, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Modal,
  FlatList,
  Alert,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addProduct, updateProduct } from '../../store/slices/userSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { Product, UnitType } from '../../store/types';

interface ProductFormData {
  name: string;
  category: string;
  price: string;
  stock: string;
  sku: string;
  supplier: string;
  unitType: UnitType;
  packSize: string;
  packPrice: string;
  singlePrice: string;
  minStockLevel: string;
}

interface StatCard {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
}

const AdminStock = () => {
  const { products } = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();
  
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    category: '',
    price: '',
    stock: '',
    sku: '',
    supplier: '',
    unitType: 'single',
    packSize: '',
    packPrice: '',
    singlePrice: '',
    minStockLevel: '10',
  });

  // Colors from your tailwind config
  const COLORS = {
    primary: '#0f172a', // hsl(220 90% 15%)
    primaryLight: '#1e293b',
    accent: '#f97316', // hsl(25 95% 53%)
    accentLight: '#fb923c',
    background: '#ffffff',
    card: '#ffffff',
    border: '#e2e8f0', // hsl(220 20% 90%)
    input: '#e2e8f0',
    destructive: '#ef4444',
    muted: '#64748b', // hsl(220 30% 45%)
    mutedLight: '#f1f5f9', // hsl(220 20% 95%)
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#dc2626',
  };

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setFilteredProducts(products);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Filter products
  useEffect(() => {
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchQuery, products]);

  // Calculate statistics
  const lowStockProducts = useMemo(() => 
    products.filter(p => p.stock < (p.minStockLevel || 10)), 
    [products]
  );
  
  const outOfStockProducts = useMemo(() => 
    products.filter(p => p.stock === 0), 
    [products]
  );
  
  const totalValue = useMemo(() => 
    products.reduce((sum, p) => sum + (p.price * p.stock), 0), 
    [products]
  );

  // Stat cards configuration using your color scheme
  const statCards: StatCard[] = [
    {
      title: "Total Products",
      value: products.length.toString(),
      icon: "cube-outline",
      color: COLORS.primary,
      bgColor: COLORS.mutedLight,
    },
    {
      title: "Low Stock",
      value: lowStockProducts.length.toString(),
      icon: "warning-outline",
      color: COLORS.warning,
      bgColor: '#fef3c7',
    },
    {
      title: "Out of Stock",
      value: outOfStockProducts.length.toString(),
      icon: "close-circle-outline",
      color: COLORS.danger,
      bgColor: '#fee2e2',
    },
    {
      title: "Total Value",
      value: `$${totalValue.toFixed(2)}`,
      icon: "cash-outline",
      color: COLORS.success,
      bgColor: '#d1fae5',
    },
  ];

  // Category options
  const categoryOptions = [
    'Electronics',
    'Clothing',
    'Food',
    'Home',
    'Beauty',
    'Sports',
    'Books',
    'Other'
  ];

  // Supplier options
  const supplierOptions = [
    'TechSuppliers Inc.',
    'Fashion Distributors',
    'Food Importers Ltd.',
    'Home Essentials Co.',
    'Beauty World',
    'Global Suppliers',
  ];

  // Get stock badge styling
  const getStockBadge = (stock: number, minStockLevel = 10) => {
    if (stock === 0) {
      return (
        <View style={[styles.stockBadge, { backgroundColor: '#fee2e2' }]}>
          <Text style={[styles.stockBadgeText, { color: COLORS.danger }]}>
            Out of Stock
          </Text>
        </View>
      );
    }
    if (stock < minStockLevel) {
      return (
        <View style={[styles.stockBadge, { backgroundColor: '#fef3c7' }]}>
          <Text style={[styles.stockBadgeText, { color: COLORS.warning }]}>
            Low Stock
          </Text>
        </View>
      );
    }
    return (
      <View style={[styles.stockBadge, { backgroundColor: '#d1fae5' }]}>
        <Text style={[styles.stockBadgeText, { color: COLORS.success }]}>
          In Stock
        </Text>
      </View>
    );
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!formData.name || !formData.category || !formData.price || !formData.stock || !formData.sku || !formData.supplier) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.unitType === 'pack' && (!formData.packSize || !formData.packPrice)) {
      Alert.alert('Error', 'Pack size and pack price are required');
      return;
    }

    if (formData.unitType === 'both' && (!formData.packSize || !formData.packPrice || !formData.singlePrice)) {
      Alert.alert('Error', 'All prices are required for both unit types');
      return;
    }

    try {
      const productData = {
        name: formData.name,
        category: formData.category,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        sku: formData.sku,
        supplier: formData.supplier,
        unitType: formData.unitType,
        packSize: formData.packSize ? parseInt(formData.packSize) : undefined,
        packPrice: formData.packPrice ? parseFloat(formData.packPrice) : undefined,
        singlePrice: formData.singlePrice ? parseFloat(formData.singlePrice) : undefined,
        minStockLevel: parseInt(formData.minStockLevel),
      };

      if (isEditMode && selectedProduct) {
        dispatch(updateProduct({ id: selectedProduct.id, ...productData }));
        Alert.alert('Success', `Product "${formData.name}" updated`);
      } else {
        dispatch(addProduct(productData));
        Alert.alert('Success', `Product "${formData.name}" added`);
      }

      setIsProductModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert('Error', 'Failed to save product');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      price: '',
      stock: '',
      sku: '',
      supplier: '',
      unitType: 'single',
      packSize: '',
      packPrice: '',
      singlePrice: '',
      minStockLevel: '10',
    });
    setSelectedProduct(null);
    setIsEditMode(false);
  };

  // Handle edit product
  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsEditMode(true);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      stock: product.stock.toString(),
      sku: product.sku,
      supplier: product.supplier || '',
      unitType: product.unitType || 'single',
      packSize: product.packSize ? product.packSize.toString() : '',
      packPrice: product.packPrice ? product.packPrice.toString() : '',
      singlePrice: product.singlePrice ? product.singlePrice.toString() : '',
      minStockLevel: product.minStockLevel ? product.minStockLevel.toString() : '10',
    });
    setIsProductModalOpen(true);
  };

  // Render product item
  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity 
      style={[styles.productCard, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}
      onPress={() => setSelectedProduct(item)}
      onLongPress={() => handleEditProduct(item)}
      activeOpacity={0.7}
    >
      <View style={styles.productHeader}>
        <View style={styles.productInfo}>
          <Text style={[styles.productName, { color: COLORS.primary }]}>{item.name}</Text>
          <Text style={[styles.productSku, { color: COLORS.muted }]}>{item.sku}</Text>
        </View>
        <Text style={[styles.productPrice, { color: COLORS.accent }]}>${item.price.toFixed(2)}</Text>
      </View>
      
      <View style={styles.productDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="cube-outline" size={14} color={COLORS.muted} />
            <Text style={[styles.detailText, { color: COLORS.muted }]}>Stock: {item.stock}</Text>
          </View>
          {getStockBadge(item.stock, item.minStockLevel || 10)}
        </View>
        
        <View style={styles.detailRow}>
          <Text style={[styles.productCategory, { color: COLORS.muted }]}>{item.category}</Text>
          {item.supplier && (
            <Text style={[styles.productSupplier, { color: COLORS.primary, opacity: 0.8 }]}>{item.supplier}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: COLORS.background }]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={[styles.loadingText, { color: COLORS.muted }]}>Loading inventory...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: COLORS.primary }]}>Inventory</Text>
          <Text style={[styles.subtitle, { color: COLORS.muted }]}>Manage your product stock</Text>
        </View>

        {/* Stats Grid */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.statsScroll}
          contentContainerStyle={styles.statsContent}
        >
          {statCards.map((stat, index) => (
            <View 
              key={index} 
              style={[
                styles.statCard, 
                { 
                  backgroundColor: stat.bgColor,
                  borderColor: COLORS.border 
                }
              ]}
            >
              <View style={[styles.statIcon, { backgroundColor: `${stat.color}20` }]}>
                <Ionicons name={stat.icon} size={20} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: COLORS.primary }]}>{stat.value}</Text>
              <Text style={[styles.statTitle, { color: COLORS.muted }]}>{stat.title}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Search Section */}
        <View style={[styles.searchCard, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}>
          <View style={styles.searchHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: COLORS.primary }]}>All Products</Text>
              <Text style={[styles.sectionSubtitle, { color: COLORS.muted }]}>
                {filteredProducts.length} products found
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: COLORS.accent }]}
              onPress={() => {
                resetForm();
                setIsProductModalOpen(true);
              }}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add Product</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <View style={[styles.searchBar, { backgroundColor: COLORS.input }]}>
              <Ionicons name="search" size={18} color={COLORS.muted} />
              <TextInput
                placeholder="Search products..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={[styles.searchInput, { color: COLORS.primary }]}
                placeholderTextColor={COLORS.muted}
              />
              {searchQuery && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={COLORS.muted} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Products List */}
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color={COLORS.border} />
            <Text style={[styles.emptyTitle, { color: COLORS.primary }]}>No products found</Text>
            <Text style={[styles.emptyText, { color: COLORS.muted }]}>
              {searchQuery 
                ? 'Try adjusting your search'
                : 'Start by adding your first product'
              }
            </Text>
            {searchQuery ? (
              <TouchableOpacity
                style={[styles.clearButton, { backgroundColor: COLORS.destructive }]}
                onPress={() => setSearchQuery('')}
              >
                <Text style={styles.clearButtonText}>Clear Search</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.addButtonSmall, { backgroundColor: COLORS.accent }]}
                onPress={() => {
                  resetForm();
                  setIsProductModalOpen(true);
                }}
              >
                <Text style={styles.addButtonText}>Add First Product</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            renderItem={renderProductItem}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            style={styles.productsList}
            contentContainerStyle={styles.productsContent}
          />
        )}
      </ScrollView>

      {/* Add/Edit Product Modal */}
      <Modal
        visible={isProductModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setIsProductModalOpen(false);
          resetForm();
        }}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: COLORS.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: COLORS.border }]}>
            <Text style={[styles.modalTitle, { color: COLORS.primary }]}>
              {isEditMode ? 'Edit Product' : 'New Product'}
            </Text>
            <TouchableOpacity onPress={() => {
              setIsProductModalOpen(false);
              resetForm();
            }}>
              <Ionicons name="close" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll}>
            <View style={styles.formContainer}>
              {/* Basic Info */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: COLORS.primary }]}>Product Name *</Text>
                <TextInput
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Enter product name"
                  style={[styles.formInput, { 
                    backgroundColor: COLORS.input,
                    borderColor: COLORS.border,
                    color: COLORS.primary 
                  }]}
                  placeholderTextColor={COLORS.muted}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: COLORS.primary }]}>SKU *</Text>
                <TextInput
                  value={formData.sku}
                  onChangeText={(text) => setFormData({ ...formData, sku: text })}
                  placeholder="Enter SKU code"
                  style={[styles.formInput, { 
                    backgroundColor: COLORS.input,
                    borderColor: COLORS.border,
                    color: COLORS.primary 
                  }]}
                  placeholderTextColor={COLORS.muted}
                />
              </View>

              {/* Category */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: COLORS.primary }]}>Category *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.tagContainer}>
                    {categoryOptions.map((category) => (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.tag,
                          { 
                            backgroundColor: formData.category === category ? COLORS.accent : COLORS.input,
                            borderColor: formData.category === category ? COLORS.accent : COLORS.border
                          }
                        ]}
                        onPress={() => setFormData({ ...formData, category })}
                      >
                        <Text style={[
                          styles.tagText,
                          { 
                            color: formData.category === category ? '#FFFFFF' : COLORS.primary 
                          }
                        ]}>
                          {category}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Supplier */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: COLORS.primary }]}>Supplier *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.tagContainer}>
                    {supplierOptions.map((supplier) => (
                      <TouchableOpacity
                        key={supplier}
                        style={[
                          styles.tag,
                          { 
                            backgroundColor: formData.supplier === supplier ? COLORS.primary : COLORS.input,
                            borderColor: formData.supplier === supplier ? COLORS.primary : COLORS.border
                          }
                        ]}
                        onPress={() => setFormData({ ...formData, supplier })}
                      >
                        <Text style={[
                          styles.tagText,
                          { 
                            color: formData.supplier === supplier ? '#FFFFFF' : COLORS.primary 
                          }
                        ]}>
                          {supplier}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Unit Type */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: COLORS.primary }]}>Unit Type *</Text>
                <View style={styles.unitTypeContainer}>
                  {(['single', 'pack', 'both'] as const).map((unitType) => (
                    <TouchableOpacity
                      key={unitType}
                      style={[
                        styles.unitTypeButton,
                        { 
                          backgroundColor: formData.unitType === unitType ? COLORS.accent : COLORS.input,
                          borderColor: formData.unitType === unitType ? COLORS.accent : COLORS.border
                        }
                      ]}
                      onPress={() => setFormData({ ...formData, unitType })}
                    >
                      <Text style={[
                        styles.unitTypeText,
                        { 
                          color: formData.unitType === unitType ? '#FFFFFF' : COLORS.primary 
                        }
                      ]}>
                        {unitType === 'both' ? 'Both' : unitType.charAt(0).toUpperCase() + unitType.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Stock and Price */}
              <View style={styles.formRow}>
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={[styles.formLabel, { color: COLORS.primary }]}>Stock *</Text>
                  <TextInput
                    value={formData.stock}
                    onChangeText={(text) => setFormData({ ...formData, stock: text })}
                    placeholder="0"
                    keyboardType="numeric"
                    style={[styles.formInput, { 
                      backgroundColor: COLORS.input,
                      borderColor: COLORS.border,
                      color: COLORS.primary 
                    }]}
                    placeholderTextColor={COLORS.muted}
                  />
                </View>
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={[styles.formLabel, { color: COLORS.primary }]}>Price *</Text>
                  <TextInput
                    value={formData.price}
                    onChangeText={(text) => setFormData({ ...formData, price: text })}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    style={[styles.formInput, { 
                      backgroundColor: COLORS.input,
                      borderColor: COLORS.border,
                      color: COLORS.primary 
                    }]}
                    placeholderTextColor={COLORS.muted}
                  />
                </View>
              </View>

              {/* Pack Configuration */}
              {(formData.unitType === 'pack' || formData.unitType === 'both') && (
                <View style={styles.formRow}>
                  <View style={[styles.formGroup, styles.formGroupHalf]}>
                    <Text style={[styles.formLabel, { color: COLORS.primary }]}>Pack Size *</Text>
                    <TextInput
                      value={formData.packSize}
                      onChangeText={(text) => setFormData({ ...formData, packSize: text })}
                      placeholder="Units per pack"
                      keyboardType="numeric"
                      style={[styles.formInput, { 
                        backgroundColor: COLORS.input,
                        borderColor: COLORS.border,
                        color: COLORS.primary 
                      }]}
                      placeholderTextColor={COLORS.muted}
                    />
                  </View>
                  <View style={[styles.formGroup, styles.formGroupHalf]}>
                    <Text style={[styles.formLabel, { color: COLORS.primary }]}>Pack Price *</Text>
                    <TextInput
                      value={formData.packPrice}
                      onChangeText={(text) => setFormData({ ...formData, packPrice: text })}
                      placeholder="0.00"
                      keyboardType="decimal-pad"
                      style={[styles.formInput, { 
                        backgroundColor: COLORS.input,
                        borderColor: COLORS.border,
                        color: COLORS.primary 
                      }]}
                      placeholderTextColor={COLORS.muted}
                    />
                  </View>
                </View>
              )}

              {/* Single Price for Both */}
              {formData.unitType === 'both' && (
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: COLORS.primary }]}>Single Unit Price *</Text>
                  <TextInput
                    value={formData.singlePrice}
                    onChangeText={(text) => setFormData({ ...formData, singlePrice: text })}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    style={[styles.formInput, { 
                      backgroundColor: COLORS.input,
                      borderColor: COLORS.border,
                      color: COLORS.primary 
                    }]}
                    placeholderTextColor={COLORS.muted}
                  />
                </View>
              )}

              {/* Minimum Stock Level */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: COLORS.primary }]}>Min Stock Level</Text>
                <TextInput
                  value={formData.minStockLevel}
                  onChangeText={(text) => setFormData({ ...formData, minStockLevel: text })}
                  placeholder="10"
                  keyboardType="numeric"
                  style={[styles.formInput, { 
                    backgroundColor: COLORS.input,
                    borderColor: COLORS.border,
                    color: COLORS.primary 
                  }]}
                  placeholderTextColor={COLORS.muted}
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: COLORS.accent }]}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>
                {isEditMode ? 'Update Product' : 'Add Product'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Product Details Modal */}
      <Modal
        visible={!!selectedProduct}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedProduct(null)}
      >
        {selectedProduct && (
          <SafeAreaView style={[styles.modalContainer, { backgroundColor: COLORS.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: COLORS.border }]}>
              <Text style={[styles.modalTitle, { color: COLORS.primary }]}>Product Details</Text>
              <TouchableOpacity onPress={() => setSelectedProduct(null)}>
                <Ionicons name="close" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.detailsContainer}>
                {/* Product Info */}
                <View style={styles.detailsSection}>
                  <Text style={[styles.detailLabel, { color: COLORS.muted }]}>Name</Text>
                  <Text style={[styles.detailValue, { color: COLORS.primary }]}>{selectedProduct.name}</Text>
                </View>

                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}>
                    <Text style={[styles.detailLabel, { color: COLORS.muted }]}>SKU</Text>
                    <Text style={[styles.detailValue, { color: COLORS.primary }]}>{selectedProduct.sku}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={[styles.detailLabel, { color: COLORS.muted }]}>Category</Text>
                    <Text style={[styles.detailValue, { color: COLORS.primary }]}>{selectedProduct.category}</Text>
                  </View>
                </View>

                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}>
                    <Text style={[styles.detailLabel, { color: COLORS.muted }]}>Price</Text>
                    <Text style={[styles.detailPrice, { color: COLORS.accent }]}>${selectedProduct.price.toFixed(2)}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={[styles.detailLabel, { color: COLORS.muted }]}>Stock</Text>
                    <View style={styles.stockContainer}>
                      <Text style={[styles.detailStock, { color: COLORS.primary }]}>{selectedProduct.stock}</Text>
                      {getStockBadge(selectedProduct.stock, selectedProduct.minStockLevel || 10)}
                    </View>
                  </View>
                </View>

                <View style={styles.detailsSection}>
                  <Text style={[styles.detailLabel, { color: COLORS.muted }]}>Supplier</Text>
                  <Text style={[styles.detailValue, { color: COLORS.primary }]}>
                    {selectedProduct.supplier || 'Not specified'}
                  </Text>
                </View>

                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}>
                    <Text style={[styles.detailLabel, { color: COLORS.muted }]}>Unit Type</Text>
                    <Text style={[styles.detailValue, { color: COLORS.primary }]}>
                      {selectedProduct.unitType?.charAt(0).toUpperCase() + selectedProduct.unitType?.slice(1) || 'Single'}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={[styles.detailLabel, { color: COLORS.muted }]}>Min Stock</Text>
                    <Text style={[styles.detailValue, { color: COLORS.primary }]}>
                      {selectedProduct.minStockLevel || 10}
                    </Text>
                  </View>
                </View>

                {/* Pack Info if available */}
                {(selectedProduct.packSize || selectedProduct.packPrice) && (
                  <View style={styles.detailsSection}>
                    <Text style={[styles.sectionTitle, { color: COLORS.primary }]}>Pack Information</Text>
                    <View style={styles.detailsGrid}>
                      {selectedProduct.packSize && (
                        <View style={styles.detailItem}>
                          <Text style={[styles.detailLabel, { color: COLORS.muted }]}>Pack Size</Text>
                          <Text style={[styles.detailValue, { color: COLORS.primary }]}>
                            {selectedProduct.packSize} units
                          </Text>
                        </View>
                      )}
                      {selectedProduct.packPrice && (
                        <View style={styles.detailItem}>
                          <Text style={[styles.detailLabel, { color: COLORS.muted }]}>Pack Price</Text>
                          <Text style={[styles.detailPrice, { color: COLORS.accent }]}>
                            ${selectedProduct.packPrice.toFixed(2)}
                          </Text>
                        </View>
                      )}
                      {selectedProduct.singlePrice && (
                        <View style={styles.detailItem}>
                          <Text style={[styles.detailLabel, { color: COLORS.muted }]}>Single Price</Text>
                          <Text style={[styles.detailPrice, { color: COLORS.accent }]}>
                            ${selectedProduct.singlePrice.toFixed(2)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* Action Button */}
                <TouchableOpacity
                  style={[styles.editButton, { backgroundColor: COLORS.accent }]}
                  onPress={() => {
                    handleEditProduct(selectedProduct);
                    setSelectedProduct(null);
                  }}
                >
                  <Text style={styles.editButtonText}>Edit Product</Text>
                </TouchableOpacity>
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
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
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 120,
    borderWidth: 1,
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
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
  },

  // Search Section
  searchCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  searchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  sectionSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  addButton: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  addButtonSmall: {
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },

  // Search
  searchContainer: {
    marginBottom: 4,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
    marginRight: 8,
  },

  // Products List
  productsList: {
    marginHorizontal: 20,
  },
  productsContent: {
    paddingBottom: 40,
  },
  productCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  productSku: {
    fontSize: 13,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: "700",
  },
  productDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    fontSize: 13,
    marginLeft: 4,
  },
  productCategory: {
    fontSize: 13,
  },
  productSupplier: {
    fontSize: 13,
    fontWeight: "500",
  },

  // Stock Badges
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stockBadgeText: {
    fontSize: 12,
    fontWeight: "600",
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
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  clearButton: {
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
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  modalScroll: {
    flex: 1,
    padding: 20,
  },

  // Form
  formContainer: {
    gap: 20,
  },
  formGroup: {
    gap: 8,
  },
  formRow: {
    flexDirection: "row",
    gap: 16,
  },
  formGroupHalf: {
    flex: 1,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },

  // Tags
  tagContainer: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
  },

  // Unit Type
  unitTypeContainer: {
    flexDirection: "row",
    gap: 12,
  },
  unitTypeButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  unitTypeText: {
    fontSize: 14,
    fontWeight: "500",
  },

  // Submit Button
  submitButton: {
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
    gap: 24,
  },
  detailsSection: {
    gap: 8,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
 
  detailLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  detailPrice: {
    fontSize: 16,
    fontWeight: "700",
  },
  stockContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailStock: {
    fontSize: 16,
    fontWeight: "700",
  },

  // Edit Button
  editButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  editButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default AdminStock;