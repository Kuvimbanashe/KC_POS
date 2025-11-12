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

  const handleEditProduct = (product) => {
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

  const getStockBadge = (stock, minStockLevel = 10) => {
    if (stock === 0) {
      return (
        <View className="bg-destructive px-2 py-1 rounded-full">
          <Text className="text-destructive-foreground text-xs font-medium">Out of Stock</Text>
        </View>
      );
    }
    if (stock < minStockLevel) {
      return (
        <View className="bg-yellow-100 px-2 py-1 rounded-full">
          <Text className="text-yellow-800 text-xs font-medium">Low Stock</Text>
        </View>
      );
    }
    return (
      <View className="bg-green-100 px-2 py-1 rounded-full">
        <Text className="text-green-800 text-xs font-medium">In Stock</Text>
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

  const renderProductItem = ({ item }) => (
    <TouchableOpacity 
      className="border-b border-border py-3 px-4 bg-card active:bg-muted"
      onPress={() => setSelectedProduct(item)}
      onLongPress={() => handleEditProduct(item)}
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="font-semibold text-foreground text-base">{item.name}</Text>
          <Text className="text-muted-foreground text-sm">{item.sku}</Text>
        </View>
        <Text className="font-bold text-accent text-lg">
          ${item.price.toFixed(2)}
        </Text>
      </View>
      
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center space-x-3">
          <Text className="text-xs text-muted-foreground">
            Stock: {item.stock}
          </Text>
          {getStockBadge(item.stock, item.minStockLevel)}
        </View>
        <Text className="text-xs text-muted-foreground">
          {item.category}
        </Text>
      </View>
      
      {item.supplier && (
        <Text className="text-xs text-muted-foreground mt-1">
          Supplier: {item.supplier}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        <ScrollView className="flex-1 p-4 md:p-6 space-y-6">
          {/* Header Skeleton */}
          <View className="flex-row justify-between items-center">
            <View>
              <View className="h-8 w-48 bg-muted rounded mb-2 animate-pulse" />
              <View className="h-4 w-56 bg-muted rounded animate-pulse" />
            </View>
            <View className="h-10 w-32 bg-muted rounded animate-pulse" />
          </View>

          {/* Stats Grid Skeleton */}
          <View className="flex-row flex-wrap justify-between gap-4">
            {[1, 2, 3, 4].map((i) => (
              <View key={i} className="bg-card rounded-lg p-4 shadow-sm w-[48%] min-w-[160px]">
                <View className="h-4 w-20 bg-muted rounded mb-2 animate-pulse" />
                <View className="h-6 w-16 bg-muted rounded animate-pulse" />
              </View>
            ))}
          </View>

          {/* Search Skeleton */}
          <View className="bg-card rounded-lg p-4 shadow-sm">
            <View className="h-6 w-40 bg-muted rounded mb-2 animate-pulse" />
            <View className="h-4 w-56 bg-muted rounded mb-4 animate-pulse" />
            <View className="h-10 bg-muted rounded animate-pulse" />
          </View>

          {/* Table Skeleton */}
          <View className="bg-card rounded-lg p-4 shadow-sm">
            {[1, 2, 3, 4, 5].map((i) => (
              <View key={i} className="h-16 bg-muted rounded mb-2 animate-pulse" />
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1">
        <View className="p-4 md:p-6 space-y-6">


          {/* Stats Cards */}
          <View className="grid grid-cols-2  gap-4">
            <View className="bg-primary rounded-lg p-4 w-full">
              <Text className="text-sm font-medium text-primary-foreground text-center mb-1">
                Total Products
              </Text>
              <Text className="text-xl md:text-2xl text-center font-bold text-accent">
                {products.length}
              </Text>
            </View>
            <View className=" rounded-lg p-4 bg-primary w-full">
              <Text className="text-sm font-medium text-primary-foreground text-center mb-1">
                Low Stock
              </Text>
              <Text className="text-xl md:text-2xl text-center font-bold text-accent">
                {lowStockProducts.length}
              </Text>
            </View>
            <View className="bg-primary  rounded-lg p-4 text-center w-full ">
              <Text className="text-sm font-medium text-primary-foreground text-center mb-1">
                Out of Stock
              </Text>
              <Text className="text-xl md:text-2xl text-center font-bold text-destructive">
                {outOfStockProducts.length}
              </Text>
            </View>
            <View className="bg-primary rounded-lg p-4 w-full">
              <Text className="text-sm font-medium text-primary-foreground text-center mb-1">
                Total Value
              </Text>
              <Text className="text-xl md:text-2xl font-bold text-accent text-center">
                ${totalValue.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Search */}
          <View className="bg-card rounded-lg p-4 shadow-sm">
            <Text className="text-lg font-bold text-foreground mb-1">
              Product Inventory
            </Text>
            <Text className="text-sm text-muted-foreground mb-4">
              All products and stock levels
            </Text>
            
            <View className="relative">
              <Ionicons 
                name="search" 
                size={20} 
                className="absolute left-3 top-3 text-muted-foreground" 
              />
              <TextInput
                placeholder="Search by name, SKU, or category..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="bg-background border border-input rounded-lg pl-10 pr-4 py-3 text-foreground"
                placeholderTextColor="#6B7280"
              />
            </View>
          </View>

          {/* Products List */}
          <View className="bg-card rounded-lg shadow-sm overflow-hidden">
            {filteredProducts.length === 0 ? (
              <View className="p-8 items-center">
                <Ionicons name="cube-outline" size={48} className="text-muted-foreground mb-4" />
                <Text className="text-lg font-medium text-foreground mb-2">
                  No products found
                </Text>
                <Text className="text-muted-foreground text-center mb-4">
                  {searchQuery 
                    ? 'Try adjusting your search criteria'
                    : 'Get started by adding your first product'
                  }
                </Text>
                {searchQuery ? (
                  <TouchableOpacity
                    className="bg-accent rounded-lg px-4 py-2"
                    onPress={() => setSearchQuery('')}
                  >
                    <Text className="text-accent-foreground font-semibold">
                      Clear Search
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    className="bg-accent rounded-lg px-4 py-2"
                    onPress={() => {
                      resetForm();
                      setIsDialogOpen(true);
                    }}
                  >
                    <Text className="text-accent-foreground font-semibold">
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
                className="max-h-96"
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
        <View className="flex-1 bg-background pt-4">
          <View className="flex-row justify-between items-center px-4 pb-4 border-b border-border">
            <Text className="text-xl font-bold text-foreground">
              {isEditMode ? 'Edit Product' : 'Add New Product'}
            </Text>
            <TouchableOpacity onPress={() => {
              setIsDialogOpen(false);
              resetForm();
            }}>
              <Ionicons name="close" size={24} className="text-foreground" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-4">
            <View className="space-y-4">
              {/* Basic Information */}
              <View className="flex-row flex-wrap justify-between gap-4">
                <View className="w-[48%]">
                  <Text className="text-sm font-medium text-foreground mb-2">Product Name *</Text>
                  <TextInput
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                    placeholder="Enter product name"
                    className="bg-background border border-input rounded-lg px-4 py-3 text-foreground"
                    placeholderTextColor="#6B7280"
                  />
                </View>
                <View className="w-[48%]">
                  <Text className="text-sm font-medium text-foreground mb-2">SKU *</Text>
                  <TextInput
                    value={formData.sku}
                    onChangeText={(text) => setFormData({ ...formData, sku: text })}
                    placeholder="Enter SKU"
                    className="bg-background border border-input rounded-lg px-4 py-3 text-foreground"
                    placeholderTextColor="#6B7280"
                  />
                </View>
              </View>

              {/* Category and Supplier */}
              <View className="flex-row flex-wrap justify-between gap-4">
                <View className="w-[48%]">
                  <Text className="text-sm font-medium text-foreground mb-2">Category *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row space-x-2">
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
                <View className="w-[48%]">
                  <Text className="text-sm font-medium text-foreground mb-2">Supplier *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row space-x-2">
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
                <Text className="text-sm font-medium text-foreground mb-2">Unit Type *</Text>
                <View className="flex-row space-x-2">
                  {['single', 'pack', 'both'].map((unitType) => (
                    <TouchableOpacity
                      key={unitType}
                      className={`flex-1 px-3 py-3 rounded-lg border ${
                        formData.unitType === unitType
                          ? 'bg-accent border-accent'
                          : 'bg-background border-input'
                      }`}
                      onPress={() => setFormData({ ...formData, unitType })}
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
              <View className="flex-row flex-wrap justify-between gap-4">
                <View className="w-[48%]">
                  <Text className="text-sm font-medium text-foreground mb-2">Initial Stock *</Text>
                  <TextInput
                    value={formData.stock}
                    onChangeText={(text) => setFormData({ ...formData, stock: text })}
                    placeholder="0"
                    keyboardType="numeric"
                    className="bg-background border border-input rounded-lg px-4 py-3 text-foreground"
                    placeholderTextColor="#6B7280"
                  />
                </View>
                <View className="w-[48%]">
                  <Text className="text-sm font-medium text-foreground mb-2">Price *</Text>
                  <TextInput
                    value={formData.price}
                    onChangeText={(text) => setFormData({ ...formData, price: text })}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    className="bg-background border border-input rounded-lg px-4 py-3 text-foreground"
                    placeholderTextColor="#6B7280"
                  />
                </View>
              </View>

              {/* Pack Configuration */}
              {(formData.unitType === 'pack' || formData.unitType === 'both') && (
                <View className="flex-row flex-wrap justify-between gap-4">
                  <View className="w-[48%]">
                    <Text className="text-sm font-medium text-foreground mb-2">Pack Size *</Text>
                    <TextInput
                      value={formData.packSize}
                      onChangeText={(text) => setFormData({ ...formData, packSize: text })}
                      placeholder="Units per pack"
                      keyboardType="numeric"
                      className="bg-background border border-input rounded-lg px-4 py-3 text-foreground"
                      placeholderTextColor="#6B7280"
                    />
                  </View>
                  <View className="w-[48%]">
                    <Text className="text-sm font-medium text-foreground mb-2">Pack Price *</Text>
                    <TextInput
                      value={formData.packPrice}
                      onChangeText={(text) => setFormData({ ...formData, packPrice: text })}
                      placeholder="0.00"
                      keyboardType="decimal-pad"
                      className="bg-background border border-input rounded-lg px-4 py-3 text-foreground"
                      placeholderTextColor="#6B7280"
                    />
                  </View>
                </View>
              )}

              {/* Single Price for Both */}
              {formData.unitType === 'both' && (
                <View>
                  <Text className="text-sm font-medium text-foreground mb-2">Single Unit Price *</Text>
                  <TextInput
                    value={formData.singlePrice}
                    onChangeText={(text) => setFormData({ ...formData, singlePrice: text })}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    className="bg-background border border-input rounded-lg px-4 py-3 text-foreground"
                    placeholderTextColor="#6B7280"
                  />
                </View>
              )}

              {/* Minimum Stock Level */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Minimum Stock Level</Text>
                <TextInput
                  value={formData.minStockLevel}
                  onChangeText={(text) => setFormData({ ...formData, minStockLevel: text })}
                  placeholder="10"
                  keyboardType="numeric"
                  className="bg-background border border-input rounded-lg px-4 py-3 text-foreground"
                  placeholderTextColor="#6B7280"
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              className="bg-accent rounded-lg py-4 mt-6"
              onPress={handleSubmit}
            >
              <Text className="text-accent-foreground text-center font-semibold text-lg">
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
          <View className="flex-1 bg-background pt-4">
            <View className="flex-row justify-between items-center px-4 pb-4 border-b border-border">
              <Text className="text-xl font-bold text-foreground">
                Product Details - {selectedProduct.sku}
              </Text>
              <TouchableOpacity onPress={() => setSelectedProduct(null)}>
                <Ionicons name="close" size={24} className="text-foreground" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-4">
              <View className="space-y-6">
                <View className="flex-row flex-wrap justify-between gap-4">
                  <View className="w-[48%]">
                    <Text className="text-sm text-muted-foreground mb-1">Name</Text>
                    <Text className="font-medium text-foreground text-base">{selectedProduct.name}</Text>
                  </View>
                  <View className="w-[48%]">
                    <Text className="text-sm text-muted-foreground mb-1">Category</Text>
                    <Text className="font-medium text-foreground text-base">{selectedProduct.category}</Text>
                  </View>
                  <View className="w-[48%]">
                    <Text className="text-sm text-muted-foreground mb-1">SKU</Text>
                    <Text className="font-medium text-foreground text-base">{selectedProduct.sku}</Text>
                  </View>
                  <View className="w-[48%]">
                    <Text className="text-sm text-muted-foreground mb-1">Supplier</Text>
                    <Text className="font-medium text-foreground text-base">{selectedProduct.supplier}</Text>
                  </View>
                  <View className="w-[48%]">
                    <Text className="text-sm text-muted-foreground mb-1">Price</Text>
                    <Text className="font-bold text-accent text-lg">${selectedProduct.price.toFixed(2)}</Text>
                  </View>
                  <View className="w-[48%]">
                    <Text className="text-sm text-muted-foreground mb-1">Stock</Text>
                    <View className="flex-row items-center gap-2">
                      <Text className="font-bold text-foreground text-lg">{selectedProduct.stock}</Text>
                      {getStockBadge(selectedProduct.stock, selectedProduct.minStockLevel)}
                    </View>
                  </View>
                  <View className="w-[48%]">
                    <Text className="text-sm text-muted-foreground mb-1">Unit Type</Text>
                    <Text className="font-medium text-foreground text-base capitalize">{selectedProduct.unitType}</Text>
                  </View>
                  {selectedProduct.packSize && (
                    <View className="w-[48%]">
                      <Text className="text-sm text-muted-foreground mb-1">Pack Size</Text>
                      <Text className="font-medium text-foreground text-base">{selectedProduct.packSize} units</Text>
                    </View>
                  )}
                  {selectedProduct.packPrice && (
                    <View className="w-[48%]">
                      <Text className="text-sm text-muted-foreground mb-1">Pack Price</Text>
                      <Text className="font-medium text-foreground text-base">${selectedProduct.packPrice.toFixed(2)}</Text>
                    </View>
                  )}
                  {selectedProduct.singlePrice && (
                    <View className="w-[48%]">
                      <Text className="text-sm text-muted-foreground mb-1">Single Price</Text>
                      <Text className="font-medium text-foreground text-base">${selectedProduct.singlePrice.toFixed(2)}</Text>
                    </View>
                  )}
                  <View className="w-[48%]">
                    <Text className="text-sm text-muted-foreground mb-1">Min Stock Level</Text>
                    <Text className="font-medium text-foreground text-base">{selectedProduct.minStockLevel || 10}</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View className="flex-row space-x-3 pt-4">
                  <TouchableOpacity 
                    className="flex-1 bg-accent rounded-lg py-3"
                    onPress={() => {
                      handleEditProduct(selectedProduct);
                      setSelectedProduct(null);
                    }}
                  >
                    <Text className="text-accent-foreground text-center font-semibold">
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

export default AdminStock;