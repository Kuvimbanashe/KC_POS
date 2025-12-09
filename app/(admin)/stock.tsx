import { useEffect, useMemo, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Modal,
  FlatList,
  Alert
} from 'react-native';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addProduct, updateProduct } from '../../store/slices/userSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { Product, UnitType } from '../../store/types';
import type { ListRenderItem } from 'react-native';

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
  description?: string;
}

const AdminStock = () => {
  const { products } = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();
  
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
      setFilteredProducts(products);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchQuery, products]);

  const handleSubmit = () => {
    if (!formData.name || !formData.category || !formData.price || !formData.stock || !formData.sku || !formData.supplier) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.unitType === 'pack' && (!formData.packSize || !formData.packPrice)) {
      Alert.alert('Error', 'Pack size and pack price are required for pack products');
      return;
    }

    if (formData.unitType === 'both' && (!formData.packSize || !formData.packPrice || !formData.singlePrice)) {
      Alert.alert('Error', 'Pack size, pack price and single price are required');
      return;
    }

    try {
      if (isEditMode && selectedProduct) {
        // Update existing product
        dispatch(updateProduct({
          id: selectedProduct.id,
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
        }));
        Alert.alert('Success', `Product ${formData.name} updated successfully`);
      } else {
        // Add new product
        dispatch(addProduct({
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
        }));
        Alert.alert('Success', `Product ${formData.name} added successfully`);
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert('Error', 'Failed to save product');
    }
  };

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
    setIsDialogOpen(true);
  };

  const lowStockProducts = products.filter(p => p.stock < (p.minStockLevel || 10));
  const outOfStockProducts = products.filter(p => p.stock === 0);
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

  const getStockBadge = (stock: number, minStockLevel = 10) => {
    if (stock === 0) {
      return (
        <View style={styles.s_1}>
          <Text style={styles.s_2}>Out of Stock</Text>
        </View>
      );
    }
    if (stock < minStockLevel) {
      return (
        <View style={styles.s_3}>
          <Text style={styles.s_4}>Low Stock</Text>
        </View>
      );
    }
    return (
      <View style={styles.s_5}>
        <Text style={styles.s_6}>In Stock</Text>
      </View>
    );
  };

  const categoryOptions = [
    'Electronics',
    'Clothing',
    'Food & Beverages',
    'Home & Kitchen',
    'Beauty & Personal Care',
    'Sports & Outdoors',
    'Books & Media',
    'Other'
  ];

  const supplierOptions = [
    'TechSuppliers Inc.',
    'Fashion Distributors',
    'Food Importers Ltd.',
    'Home Essentials Co.',
    'Beauty World',
    'Global Suppliers',
    'Local Wholesaler'
  ];

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity 
      style={styles.s_7}
      onPress={() => setSelectedProduct(item)}
      onLongPress={() => handleEditProduct(item)}
    >
      <View style={styles.s_8}>
        <View style={styles.s_9}>
          <Text style={styles.s_10}>{item.name}</Text>
          <Text style={styles.s_11}>{item.sku}</Text>
        </View>
        <Text style={styles.s_12}>
          ${item.price?.toFixed(2) ?? '0.00'}
        </Text>
      </View>
      
      <View style={styles.s_13}>
        <View style={styles.s_14}>
          <Text style={styles.s_15}>
            Stock: {item.stock ?? 0}
          </Text>
          {getStockBadge(item.stock ?? 0, item.minStockLevel ?? 10)}
        </View>
        <Text style={styles.s_15}>
          {item.category ?? ''}
        </Text>
      </View>
      
      {item.supplier && (
        <Text style={styles.s_16}>
          Supplier: {item.supplier ?? ''}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.s_17}>
        <ScrollView style={styles.s_18}>
          {/* Header Skeleton */}
          <View style={styles.s_13}>
            <View>
              <View style={styles.s_19} />
              <View style={styles.s_20} />
            </View>
            <View style={styles.s_21} />
          </View>

          {/* Stats Grid Skeleton */}
          <View style={styles.s_22}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={styles.s_23}>
                <View style={styles.s_24} />
                <View style={styles.s_25} />
              </View>
            ))}
          </View>

          {/* Search Skeleton */}
          <View style={styles.s_26}>
            <View style={styles.s_27} />
            <View style={styles.s_28} />
            <View style={styles.s_29} />
          </View>

          {/* Table Skeleton */}
          <View style={styles.s_26}>
            {[1, 2, 3, 4, 5].map((i) => (
              <View key={i} style={styles.s_30} />
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.s_17}>
      <ScrollView style={styles.s_9}>
        <View style={styles.s_31}>


          {/* Stats Cards */}
          <View style={styles.s_32}>
            <View style={styles.s_33}>
              <Text style={styles.s_34}>
                Total Products
              </Text>
              <Text style={styles.s_35}>
                {products.length}
              </Text>
            </View>
            <View className=" rounded-lg p-4 bg-primary w-full">
              <Text style={styles.s_34}>
                Low Stock
              </Text>
              <Text style={styles.s_35}>
                {lowStockProducts.length}
              </Text>
            </View>
            <View className="bg-primary  rounded-lg p-4 text-center w-full ">
              <Text style={styles.s_34}>
                Out of Stock
              </Text>
              <Text style={styles.s_38}>
                {outOfStockProducts.length}
              </Text>
            </View>
            <View style={styles.s_33}>
              <Text style={styles.s_34}>
                Total Value
              </Text>
              <Text style={styles.s_39}>
                ${totalValue.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Search */}
          <View style={styles.s_26}>
            <Text style={styles.s_40}>
              Product Inventory
            </Text>
            <Text style={styles.s_41}>
              All products and stock levels
            </Text>
            
            <View style={styles.s_42}>
              <Ionicons 
                name="search" 
                size={20} 
                style={styles.s_43} 
              />
              <TextInput
                placeholder="Search by name, SKU, or category..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.s_44}
                placeholderTextColor="#6B7280"
              />
            </View>
          </View>

          {/* Products List */}
          <View style={styles.s_45}>
            {filteredProducts.length === 0 ? (
              <View style={styles.s_46}>
                <Ionicons name="cube-outline" size={48} style={styles.s_47} />
                <Text style={styles.s_48}>
                  No products found
                </Text>
                <Text style={styles.s_49}>
                  {searchQuery 
                    ? 'Try adjusting your search criteria'
                    : 'Get started by adding your first product'
                  }
                </Text>
                {searchQuery ? (
                  <TouchableOpacity
                    style={styles.s_50}
                    onPress={() => setSearchQuery('')}
                  >
                    <Text style={styles.s_51}>
                      Clear Search
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.s_50}
                    onPress={() => {
                      resetForm();
                      setIsDialogOpen(true);
                    }}
                  >
                    <Text style={styles.s_51}>
                      Add First Product
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <FlatList
                data={filteredProducts}
                renderItem={renderProductItem}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={true}
                style={styles.s_52}
              />
            )}
          </View>
        </View>
      </ScrollView>

      {/* Add/Edit Product Modal */}
      <Modal
        visible={isDialogOpen}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.s_53}>
          <View style={styles.s_54}>
            <Text style={styles.s_55}>
              {isEditMode ? 'Edit Product' : 'Add New Product'}
            </Text>
            <TouchableOpacity onPress={() => {
              setIsDialogOpen(false);
              resetForm();
            }}>
              <Ionicons name="close" size={24} style={styles.s_56} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.s_57}>
            <View style={styles.s_58}>
              {/* Basic Information */}
              <View style={styles.s_22}>
                <View style={styles.s_59}>
                  <Text style={styles.s_60}>Product Name *</Text>
                  <TextInput
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                    placeholder="Enter product name"
                    style={styles.s_61}
                    placeholderTextColor="#6B7280"
                  />
                </View>
                <View style={styles.s_59}>
                  <Text style={styles.s_60}>SKU *</Text>
                  <TextInput
                    value={formData.sku}
                    onChangeText={(text) => setFormData({ ...formData, sku: text })}
                    placeholder="Enter SKU"
                    style={styles.s_61}
                    placeholderTextColor="#6B7280"
                  />
                </View>
              </View>

              {/* Category and Supplier */}
              <View style={styles.s_22}>
                <View style={styles.s_59}>
                  <Text style={styles.s_60}>Category *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.s_62}>
                      {categoryOptions.map((category) => (
                        <TouchableOpacity
                          key={category}
                          className={`px-3 py-2 rounded-lg border ${
                            formData.category === category
                              ? 'bg-accent border-accent'
                              : 'bg-background border-input'
                          }`}
                          onPress={() => setFormData({ ...formData, category })}
                        >
                          <Text className={
                            formData.category === category
                              ? 'text-accent-foreground font-medium text-xs'
                              : 'text-foreground text-xs'
                          }>
                            {category}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
                <View style={styles.s_59}>
                  <Text style={styles.s_60}>Supplier *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.s_62}>
                      {supplierOptions.map((supplier) => (
                        <TouchableOpacity
                          key={supplier}
                          className={`px-3 py-2 rounded-lg border ${
                            formData.supplier === supplier
                              ? 'bg-accent border-accent'
                              : 'bg-background border-input'
                          }`}
                          onPress={() => setFormData({ ...formData, supplier })}
                        >
                          <Text className={
                            formData.supplier === supplier
                              ? 'text-accent-foreground font-medium text-xs'
                              : 'text-foreground text-xs'
                          }>
                            {supplier}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>

              {/* Unit Type */}
              <View>
                <Text style={styles.s_60}>Unit Type *</Text>
                <View style={styles.s_62}>
                  {['single', 'pack', 'both'].map((unitType) => (
                    <TouchableOpacity
                      key={unitType}
                      className={`flex-1 px-3 py-3 rounded-lg border ${
                        formData.unitType === unitType
                          ? 'bg-accent border-accent'
                          : 'bg-background border-input'
                      }`}
                      onPress={() => setFormData({ ...formData, unitType: unitType as UnitType })}
                    >
                      <Text className={
                        formData.unitType === unitType
                          ? 'text-accent-foreground font-medium text-center text-xs capitalize'
                          : 'text-foreground text-center text-xs capitalize'
                      }>
                        {unitType === 'both' ? 'Single & Pack' : unitType}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Stock and Price */}
              <View style={styles.s_22}>
                <View style={styles.s_59}>
                  <Text style={styles.s_60}>Initial Stock *</Text>
                  <TextInput  
                    value={formData.stock}
                    onChangeText={(text) => setFormData({ ...formData, stock: text })}
                    placeholder="0"
                    keyboardType="numeric"
                    style={styles.s_61}
                    placeholderTextColor="#6B7280"
                  />
                </View>
                <View style={styles.s_59}>
                  <Text style={styles.s_60}>Price *</Text>
                  <TextInput
                    value={formData.price}
                    onChangeText={(text) => setFormData({ ...formData, price: text })}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    style={styles.s_61}
                    placeholderTextColor="#6B7280"
                  />
                </View>
              </View>

              {/* Pack Configuration */}
              {(formData.unitType === 'pack' || formData.unitType === 'both') && (
                <View style={styles.s_22}>
                  <View style={styles.s_59}>
                    <Text style={styles.s_60}>Pack Size *</Text>
                    <TextInput
                      value={formData.packSize}
                      onChangeText={(text) => setFormData({ ...formData, packSize: text })}
                      placeholder="Units per pack"
                      keyboardType="numeric"
                      style={styles.s_61}
                      placeholderTextColor="#6B7280"
                    />
                  </View>
                  <View style={styles.s_59}>
                    <Text style={styles.s_60}>Pack Price *</Text>
                    <TextInput
                      value={formData.packPrice}
                      onChangeText={(text) => setFormData({ ...formData, packPrice: text })}
                      placeholder="0.00"
                      keyboardType="decimal-pad"
                      style={styles.s_61}
                      placeholderTextColor="#6B7280"
                    />
                  </View>
                </View>
              )}

              {/* Single Price for Both */}
              {formData.unitType === 'both' && (
                <View>
                  <Text style={styles.s_60}>Single Unit Price *</Text>
                  <TextInput
                    value={formData.singlePrice}
                    onChangeText={(text) => setFormData({ ...formData, singlePrice: text })}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    style={styles.s_61}
                    placeholderTextColor="#6B7280"
                  />
                </View>
              )}

              {/* Minimum Stock Level */}
              <View>
                <Text style={styles.s_60}>Minimum Stock Level</Text>
                <TextInput
                  value={formData.minStockLevel}
                  onChangeText={(text) => setFormData({ ...formData, minStockLevel: text })}
                  placeholder="10"
                  keyboardType="numeric"
                  style={styles.s_61}
                  placeholderTextColor="#6B7280"
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.s_63}
              onPress={handleSubmit}
            >
              <Text style={styles.s_64}>
                {isEditMode ? 'Update Product' : 'Add Product'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Product Detail Modal */}
      <Modal
        visible={!!selectedProduct}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedProduct(null)}
      >
        {selectedProduct && (
          <View style={styles.s_53}>
            <View style={styles.s_54}>
              <Text style={styles.s_55}>
                Product Details - {selectedProduct.sku ?? ''}
              </Text>
              <TouchableOpacity onPress={() => setSelectedProduct(null)}>
                <Ionicons name="close" size={24} style={styles.s_56} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.s_57}>
              <View style={styles.s_65}>
                <View style={styles.s_22}>
                  <View style={styles.s_59}>
                    <Text style={styles.s_66}>Name</Text>
                    <Text style={styles.s_67}>{selectedProduct.name ?? ''}</Text>
                  </View>
                  <View style={styles.s_59}>
                    <Text style={styles.s_66}>Category</Text>
                    <Text style={styles.s_67}>{selectedProduct.category ?? ''}</Text>
                  </View>
                  <View style={styles.s_59}>
                    <Text style={styles.s_66}>SKU</Text>
                    <Text style={styles.s_67}>{selectedProduct.sku ?? ''}</Text>
                  </View>
                  <View style={styles.s_59}>
                    <Text style={styles.s_66}>Supplier</Text>
                    <Text style={styles.s_67}>{selectedProduct.supplier ?? ''}</Text>
                  </View>
                  <View style={styles.s_59}>
                    <Text style={styles.s_66}>Price</Text>
                    <Text style={styles.s_12}>${selectedProduct.price?.toFixed(2) ?? '0.00'}</Text>
                  </View>
                  <View style={styles.s_59}>
                    <Text style={styles.s_66}>Stock</Text>
                    <View style={styles.s_68}>
                      <Text style={styles.s_69}>{selectedProduct.stock ?? 0}</Text>
                      {getStockBadge(selectedProduct.stock ?? 0, selectedProduct.minStockLevel ?? 10)}
                    </View>
                  </View>
                  <View style={styles.s_59}>
                    <Text style={styles.s_66}>Unit Type</Text>
                    <Text style={styles.s_70}>{selectedProduct.unitType ?? ''}</Text>
                  </View>
                  {selectedProduct.packSize && (
                    <View style={styles.s_59}>
                      <Text style={styles.s_66}>Pack Size</Text>
                      <Text style={styles.s_67}>{selectedProduct.packSize ?? 0} units</Text>
                    </View>
                  )}
                  {selectedProduct.packPrice && (
                    <View style={styles.s_59}>
                      <Text style={styles.s_66}>Pack Price</Text>
                      <Text style={styles.s_67}>${selectedProduct.packPrice.toFixed(2)}</Text>
                    </View>
                  )}
                  {selectedProduct.singlePrice && (
                    <View style={styles.s_59}>
                      <Text style={styles.s_66}>Single Price</Text>
                      <Text style={styles.s_67}>${selectedProduct.singlePrice.toFixed(2)}</Text>
                    </View>
                  )}
                  <View style={styles.s_59}>
                    <Text style={styles.s_66}>Min Stock Level</Text>
                    <Text style={styles.s_67}>{selectedProduct.minStockLevel || 10}</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.s_71}>
                  <TouchableOpacity 
                    style={styles.s_72}
                    onPress={() => {
                      handleEditProduct(selectedProduct);
                      setSelectedProduct(null);
                    }}
                  >
                    <Text style={styles.s_73}>
                      Edit Product
                    </Text>
                  </TouchableOpacity>
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
  s_1: {},

  s_2: {
  fontSize: 12,
  fontWeight: "600"
},

  s_3: {},

  s_4: {
  fontSize: 12,
  fontWeight: "600"
},

  s_5: {},

  s_6: {
  fontSize: 12,
  fontWeight: "600"
},

  s_7: {
  borderColor: "#e6edf3",
  paddingVertical: 12,
  paddingHorizontal: 16,
  backgroundColor: "#ffffff"
},

  s_8: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: 8
},

  s_9: {
  flex: 1
},

  s_10: {
  color: "#0f172a"
},

  s_11: {
  color: "#6b7280",
  fontSize: 14
},

  s_12: {
  fontWeight: "700",
  color: "#f97316",
  fontSize: 18
},

  s_13: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center"
},

  s_14: {
  flexDirection: "row",
  alignItems: "center"
},

  s_15: {
  fontSize: 12,
  color: "#6b7280"
},

  s_16: {
  fontSize: 12,
  color: "#6b7280"
},

  s_17: {
  flex: 1,
  backgroundColor: "#ffffff"
},

  s_18: {
  flex: 1,
  padding: 16
},

  s_19: {
  borderRadius: 6,
  marginBottom: 8
},

  s_20: {
  borderRadius: 6
},

  s_21: {
  borderRadius: 6
},

  s_22: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between",
  gap: 16
},

  s_23: {
  backgroundColor: "#ffffff",
  borderRadius: 12,
  padding: 16,
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 1
  },
  shadowOpacity: 0.06,
  shadowRadius: 4,
  elevation: 1,
  width: "48%"
},

  s_24: {
  borderRadius: 6,
  marginBottom: 8
},

  s_25: {
  borderRadius: 6
},

  s_26: {
  backgroundColor: "#ffffff",
  borderRadius: 12,
  padding: 16,
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 1
  },
  shadowOpacity: 0.06,
  shadowRadius: 4,
  elevation: 1
},

  s_27: {
  borderRadius: 6,
  marginBottom: 8
},

  s_28: {
  borderRadius: 6,
  marginBottom: 16
},

  s_29: {
  borderRadius: 6
},

  s_30: {
  borderRadius: 6,
  marginBottom: 8
},

  s_31: {
  padding: 16
},

  s_32: {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 16
},

  s_33: {
  backgroundColor: "#0f172a",
  borderRadius: 12,
  padding: 16,
  width: "100%"
},

  s_34: {
  fontSize: 14,
  fontWeight: "600",
  color: "#ffffff"
},

  s_35: {
  fontSize: 20,
  fontWeight: "700",
  color: "#f97316"
},

  s_36: {
  borderRadius: 12,
  padding: 16,
  backgroundColor: "#0f172a",
  width: "100%"
},

  s_37: {
  backgroundColor: "#0f172a",
  borderRadius: 12,
  padding: 16,
  width: "100%"
},

  s_38: {
  fontSize: 20,
  fontWeight: "700"
},

  s_39: {
  fontSize: 20,
  fontWeight: "700",
  color: "#f97316"
},

  s_40: {
  fontSize: 18,
  fontWeight: "700",
  color: "#0f172a"
},

  s_41: {
  fontSize: 14,
  color: "#6b7280",
  marginBottom: 16
},

  s_42: {},

  s_43: {
  color: "#6b7280"
},

  s_44: {
  backgroundColor: "#ffffff",
  borderWidth: 1,
  borderColor: "#e6edf3",
  borderRadius: 12,
  paddingRight: 16,
  paddingVertical: 12,
  color: "#0f172a"
},

  s_45: {
  backgroundColor: "#ffffff",
  borderRadius: 12,
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 1
  },
  shadowOpacity: 0.06,
  shadowRadius: 4,
  elevation: 1
},

  s_46: {
  alignItems: "center"
},

  s_47: {
  color: "#6b7280",
  marginBottom: 16
},

  s_48: {
  fontSize: 18,
  fontWeight: "600",
  color: "#0f172a",
  marginBottom: 8
},

  s_49: {
  color: "#6b7280",
  marginBottom: 16
},

  s_50: {
  backgroundColor: "#f97316",
  borderRadius: 12,
  paddingHorizontal: 16
},

  s_51: {},

  s_52: {},

  s_53: {
  flex: 1,
  backgroundColor: "#ffffff",
  paddingTop: 16
},

  s_54: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingHorizontal: 16,
  paddingBottom: 16,
  borderColor: "#e6edf3"
},

  s_55: {
  fontSize: 20,
  fontWeight: "700",
  color: "#0f172a"
},

  s_56: {
  color: "#0f172a"
},

  s_57: {
  flex: 1,
  padding: 16
},

  s_58: {},

  s_59: {
  width: "48%"
},

  s_60: {
  fontSize: 14,
  fontWeight: "600",
  color: "#0f172a",
  marginBottom: 8
},

  s_61: {
  backgroundColor: "#ffffff",
  borderWidth: 1,
  borderColor: "#e6edf3",
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 12,
  color: "#0f172a"
},

  s_62: {
  flexDirection: "row"
},

  s_63: {
  backgroundColor: "#f97316",
  borderRadius: 12
},

  s_64: {
  fontSize: 18
},

  s_65: {},

  s_66: {
  fontSize: 14,
  color: "#6b7280"
},

  s_67: {
  fontWeight: "600",
  color: "#0f172a"
},

  s_68: {
  flexDirection: "row",
  alignItems: "center"
},

  s_69: {
  fontWeight: "700",
  color: "#0f172a",
  fontSize: 18
},

  s_70: {
  fontWeight: "600",
  color: "#0f172a"
},

  s_71: {
  flexDirection: "row",
  paddingTop: 16
},

  s_72: {
  flex: 1,
  backgroundColor: "#f97316",
  borderRadius: 12,
  paddingVertical: 12
},

  s_73: {}
});
export default AdminStock;