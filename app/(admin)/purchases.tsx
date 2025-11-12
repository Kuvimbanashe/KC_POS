// app/(admin)/purchases.js
import { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  Modal,
  FlatList
} from 'react-native';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { Ionicons } from '@expo/vector-icons';
import { addPurchase, updateProduct } from '../../store/slices/userSlice';
import type { PurchaseRecord } from '../../store/types';
import type { Product } from '../../store/types';
const AdminPurchases = () => {
  const { purchases, products } = useAppSelector(state => state.user);
  const dispatch = useAppDispatch();
  
  const [filteredPurchases, setFilteredPurchases] = useState<PurchaseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseRecord | null>(null);
  
  const [formData, setFormData] = useState({
    quantity: '',
    unitCost: '',
    unitType: 'single',
    profitMargin: '30',
    supplier: '',
  });

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
      setFilteredPurchases(purchases);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const filtered = purchases.filter(purchase =>
      purchase.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.id.toString().includes(searchQuery.toLowerCase())
    );
    setFilteredPurchases(filtered);
  }, [searchQuery, purchases]);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(false);
    setIsDialogOpen(true);
    // Pre-fill supplier if available
    if (product.supplier) {
      setFormData(prev => ({ ...prev, supplier: product.supplier as string }));
    }
  };

  const calculateSellingPrice = (unitCost: number, margin: number) => {
    return unitCost * (1 + margin / 100);
  };

  const handleSubmit = () => {
    if (!selectedProduct || !formData.quantity || !formData.unitCost || !formData.supplier) {
      Alert.alert('Error', 'Please fill in all fields');
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
        `Purchase order created successfully!\n\n` +
        `Suggested selling price: $${sellingPrice.toFixed(2)} (${margin}% margin)\n` +
        `${actualQuantity} units added to stock`
      );
      
      setIsDialogOpen(false);
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

  const totalCost = purchases.reduce((sum, purchase) => sum + purchase.total, 0);
  const totalQuantity = purchases.reduce((sum, purchase) => sum + purchase.quantity, 0);

  const unitCost = formData.unitCost ? parseFloat(formData.unitCost) : 0;
  const margin = formData.profitMargin ? parseFloat(formData.profitMargin) : 0;
  const suggestedPrice = unitCost > 0 ? calculateSellingPrice(unitCost, margin) : 0;
  const totalFormCost = formData.quantity && formData.unitCost ? 
    parseFloat(formData.quantity) * parseFloat(formData.unitCost) : 0;

  const renderPurchaseItem = ({ item }: { item: PurchaseRecord }) => (
    <TouchableOpacity 
      className="border-b border-border py-3 px-4 bg-card active:bg-muted"
      onPress={() => setSelectedPurchase(item)}
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="font-semibold text-foreground text-base">{item.productName}</Text>
          <Text className="text-muted-foreground text-sm">{item.supplier}</Text>
        </View>
        <Text className="font-bold text-accent text-lg">
          ${item.total.toFixed(2)}
        </Text>
      </View>
      
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center space-x-3">
          <Text className="text-xs text-muted-foreground">
            {item.quantity} units
          </Text>
          <Text className="text-xs text-muted-foreground">
            ${item.unitCost.toFixed(2)}/unit
          </Text>
        </View>
        <Text className="text-xs text-muted-foreground">
          {new Date(item.date).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity 
      className="border-b border-border py-3 px-4 bg-card active:bg-muted"
      onPress={() => handleProductSelect(item)}
    >
      <View className="flex-row justify-between items-start mb-1">
        <Text className="font-semibold text-foreground text-base flex-1">{item.name}</Text>
        <Text className="text-muted-foreground text-sm">${item.price.toFixed(2)}</Text>
      </View>
      
      <View className="flex-row justify-between items-center">
        <Text className="text-xs text-muted-foreground">
          Stock: {item.stock} units
        </Text>
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
      <ScrollView className="flex-1 bg-background">
        <View className="p-4 md:p-6 space-y-6">
          {/* Header Skeleton */}
          <View className="flex-row justify-between items-center">
            <View>
              <View className="h-8 w-32 bg-muted rounded mb-2 animate-pulse" />
              <View className="h-4 w-48 bg-muted rounded animate-pulse" />
            </View>
            <View className="h-10 w-32 bg-muted rounded animate-pulse" />
          </View>

          {/* Stats Grid Skeleton */}
          <View className="grid grid-cols-2 gap-4">
            {[1, 2, 3].map((i) => (
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
        </View>
      </ScrollView>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1">
        <View className="p-4 md:p-6 space-y-6">


          {/* Stats Cards */}
          <View className="grid grid-cols-2 gap-4">
            <View className="bg-primary rounded-lg p-4 w-full">
              <Text className="text-sm font-medium text-primary-foreground mb-1 text-center">
                Total Purchases
              </Text>
              <Text className="text-xl md:text-2xl font-bold text-accent text-center">
                {purchases.length}
              </Text>
            </View>
            <View className="bg-primary rounded-lg p-4 w-full ">
              <Text className="text-sm font-medium text-primary-foreground mb-1 text-center">
                Total Investment
              </Text>
              <Text className="text-xl md:text-2xl font-bold text-accent text-center">
                ${totalCost.toFixed(2)}
              </Text>
            </View>
            <View className="bg-card rounded-lg hidden p-4 shadow-sm w-[48%] min-w-[160px]">
              <Text className="text-sm font-medium text-muted-foreground mb-1">
                Total Units
              </Text>
              <Text className="text-xl md:text-2xl font-bold text-foreground">
                {totalQuantity}
              </Text>
            </View>
          </View>
          
          <View className="w-full">
            
          <TouchableOpacity
              className="bg-accent rounded-lg px-4 py-3 flex-row items-center justify-center w-full"
              onPress={() => setIsProductModalOpen(true)}
            >
              <Ionicons name="add" size={20} className="text-accent-foreground mr-2" />
              <Text className="text-accent-foreground font-semibold text-center">New Purchase</Text>
            </TouchableOpacity>
            
            
          </View>

          {/* Search */}
          <View className="bg-card rounded-lg p-4 border border-muted">
            <Text className="text-lg font-bold text-foreground mb-1">
              Purchase History
            </Text>
            <Text className="text-sm text-muted-foreground mb-4">
              All inventory purchase orders
            </Text>
            
            <View className="relative">
              <Ionicons 
                name="search" 
                size={20} 
                className="absolute left-3 top-3 text-muted-foreground" 
              />
              <TextInput
                placeholder="Search by product, supplier, or ID..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="bg-background border border-input rounded-lg pl-10 pr-4 py-3 text-foreground"
                placeholderTextColor="#6B7280"
              />
            </View>
          </View>

          {/* Purchases List */}
          <View className="bg-card rounded-lg border-[1.5px] border-muted overflow-hidden">
            {filteredPurchases.length === 0 ? (
              <View className="p-8 items-center">
                <Ionicons name="cart-outline" size={48} className="text-muted-foreground mb-4" />
                <Text className="text-lg font-medium text-foreground mb-2">
                  No purchases found
                </Text>
                <Text className="text-muted-foreground text-center mb-4">
                  {searchQuery 
                    ? 'Try adjusting your search criteria'
                    : 'Get started by creating your first purchase order'
                  }
                </Text>
                {searchQuery && (
                  <TouchableOpacity
                    className="bg-accent rounded-lg px-4 py-2"
                    onPress={() => setSearchQuery('')}
                  >
                    <Text className="text-accent-foreground font-semibold">
                      Clear Search
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <FlatList
                data={filteredPurchases}
                renderItem={renderPurchaseItem}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={true}
                className="max-h-96"
              />
            )}
          </View>
        </View>
      </ScrollView>

      {/* Product Selection Modal */}
      <Modal
        visible={isProductModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-background pt-4">
          <View className="flex-row justify-between items-center px-4 pb-4 border-b border-border">
            <Text className="text-xl font-bold text-foreground">Select Product for Purchase</Text>
            <TouchableOpacity onPress={() => setIsProductModalOpen(false)}>
              <Ionicons name="close" size={24} className="text-foreground" />
            </TouchableOpacity>
          </View>

          <View className="p-4 border-b border-border">
            <View className="relative">
              <Ionicons 
                name="search" 
                size={20} 
                className="absolute left-3 top-3 text-muted-foreground" 
              />
              <TextInput
                placeholder="Search products..."
                className="bg-background border border-input rounded-lg pl-10 pr-4 py-3 text-foreground"
                placeholderTextColor="#6B7280"
              />
            </View>
          </View>

          <FlatList
            data={products}
            renderItem={renderProductItem}
            keyExtractor={(item) => item.id.toString()}
            className="flex-1"
          />
        </View>
      </Modal>

      {/* Create Purchase Modal */}
      <Modal
        visible={isDialogOpen}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-background pt-4">
          <View className="flex-row justify-between items-center px-4 pb-4 border-b border-border">
            <Text className="text-xl font-bold text-foreground">Create Purchase Order</Text>
            <TouchableOpacity onPress={() => setIsDialogOpen(false)}>
              <Ionicons name="close" size={24} className="text-foreground" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-4">
            {selectedProduct && (
              <View className="mb-4 p-3 bg-secondary rounded-lg">
                <Text className="text-sm text-muted-foreground mb-1">Selected Product</Text>
                <Text className="font-semibold text-foreground text-base">{selectedProduct.name}</Text>
                <Text className="text-xs text-muted-foreground">
                  Current stock: {selectedProduct.stock} units • ${selectedProduct.price.toFixed(2)} selling price
                </Text>
              </View>
            )}

            <View className="space-y-4">
              {/* Supplier */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Supplier</Text>
                <TextInput
                  value={formData.supplier}
                  onChangeText={(text) => setFormData({ ...formData, supplier: text })}
                  placeholder="Enter supplier name"
                  className="bg-background border border-input rounded-lg px-4 py-3 text-foreground"
                  placeholderTextColor="#6B7280"
                />
              </View>

              {/* Unit Type (if product supports packs) */}
              {selectedProduct && (selectedProduct.unitType === 'both' || selectedProduct.unitType === 'pack') && (
                <View>
                  <Text className="text-sm font-medium text-foreground mb-2">Purchase Unit Type</Text>
                  <View className="flex-row space-x-2">
                    {['single', 'pack'].map((unitType) => (
                      <TouchableOpacity
                        key={unitType}
                        className={`flex-1 px-4 py-3 rounded-lg border ${
                          formData.unitType === unitType
                            ? 'bg-accent border-accent'
                            : 'bg-background border-input'
                        }`}
                        onPress={() => setFormData({ ...formData, unitType })}
                      >
                        <Text className={
                          formData.unitType === unitType
                            ? 'text-accent-foreground font-medium text-center capitalize'
                            : 'text-foreground text-center capitalize'
                        }>
                          {unitType === 'pack' 
                            ? `Packs (${selectedProduct.packSize || 1} units)` 
                            : 'Single Units'
                          }
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Quantity */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">
                  Quantity {formData.unitType === 'pack' && selectedProduct?.packSize && 
                    `(${selectedProduct.packSize} units/pack)`}
                </Text>
                <TextInput
                  value={formData.quantity}
                  onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                  placeholder="Enter quantity"
                  keyboardType="numeric"
                  className="bg-background border border-input rounded-lg px-4 py-3 text-foreground"
                  placeholderTextColor="#6B7280"
                />
              </View>

              {/* Unit Cost */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">
                  {formData.unitType === 'pack' ? 'Cost per Pack' : 'Cost per Unit'}
                </Text>
                <TextInput
                  value={formData.unitCost}
                  onChangeText={(text) => setFormData({ ...formData, unitCost: text })}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  className="bg-background border border-input rounded-lg px-4 py-3 text-foreground"
                  placeholderTextColor="#6B7280"
                />
              </View>

              {/* Profit Margin */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Profit Margin (%)</Text>
                <TextInput
                  value={formData.profitMargin}
                  onChangeText={(text) => setFormData({ ...formData, profitMargin: text })}
                  placeholder="30"
                  keyboardType="numeric"
                  className="bg-background border border-input rounded-lg px-4 py-3 text-foreground"
                  placeholderTextColor="#6B7280"
                />
              </View>

              {/* Calculation Summary */}
              {formData.quantity && formData.unitCost && (
                <View className="p-4 bg-secondary rounded-lg space-y-3">
                  <Text className="font-medium text-foreground mb-2">Order Summary</Text>
                  
                  <View className="flex-row justify-between">
                    <Text className="text-muted-foreground">Total Cost</Text>
                    <Text className="font-bold text-foreground">
                      ${totalFormCost.toFixed(2)}
                    </Text>
                  </View>
                  
                  <View className="flex-row justify-between">
                    <Text className="text-muted-foreground">Suggested Selling Price</Text>
                    <Text className="font-bold text-accent">
                      ${suggestedPrice.toFixed(2)}
                    </Text>
                  </View>
                  
                  {formData.unitType === 'pack' && selectedProduct?.packSize && (
                    <View className="flex-row justify-between pt-2 border-t border-border">
                      <Text className="text-muted-foreground">Total Units to Stock</Text>
                      <Text className="font-bold text-foreground">
                        {parseInt(formData.quantity) * (selectedProduct.packSize || 1)} units
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              className="bg-accent rounded-lg py-4 mt-6"
              onPress={handleSubmit}
            >
              <Text className="text-accent-foreground text-center font-semibold text-lg">
                Create Purchase
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Purchase Detail Modal */}
      <Modal
        visible={!!selectedPurchase}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedPurchase(null)}
      >
        {selectedPurchase && (
          <View className="flex-1 bg-background pt-4">
            <View className="flex-row justify-between items-center px-4 pb-4 border-b border-border">
              <Text className="text-xl font-bold text-foreground">
                Purchase Details - #{selectedPurchase.id}
              </Text>
              <TouchableOpacity onPress={() => setSelectedPurchase(null)}>
                <Ionicons name="close" size={24} className="text-foreground" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-4">
              <View className="space-y-6">
                <View className="flex-row flex-wrap justify-between gap-4">
                  <View className="w-[48%]">
                    <Text className="text-sm text-muted-foreground mb-1">Product</Text>
                    <Text className="font-medium text-foreground text-base">{selectedPurchase.productName}</Text>
                  </View>
                  <View className="w-[48%]">
                    <Text className="text-sm text-muted-foreground mb-1">Supplier</Text>
                    <Text className="font-medium text-foreground text-base">{selectedPurchase.supplier}</Text>
                  </View>
                  <View className="w-[48%]">
                    <Text className="text-sm text-muted-foreground mb-1">Quantity</Text>
                    <Text className="font-medium text-foreground text-base">{selectedPurchase.quantity} units</Text>
                  </View>
                  <View className="w-[48%]">
                    <Text className="text-sm text-muted-foreground mb-1">Unit Cost</Text>
                    <Text className="font-medium text-foreground text-base">
                      ${selectedPurchase.unitCost.toFixed(2)}
                    </Text>
                  </View>
                  <View className="w-[48%]">
                    <Text className="text-sm text-muted-foreground mb-1">Total Cost</Text>
                    <Text className="font-bold text-accent text-lg">
                      ${selectedPurchase.total.toFixed(2)}
                    </Text>
                  </View>
                  <View className="w-[48%]">
                    <Text className="text-sm text-muted-foreground mb-1">Purchase Date</Text>
                    <Text className="font-medium text-foreground text-base">
                      {new Date(selectedPurchase.date).toLocaleDateString()}
                    </Text>
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

export default AdminPurchases;




