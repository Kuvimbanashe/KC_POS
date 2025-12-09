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
import { StyleSheet } from 'react-native';
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
      style={styles.s_1}
      onPress={() => setSelectedPurchase(item)}
    >
      <View style={styles.s_2}>
        <View style={styles.s_3}>
          <Text style={styles.s_4}>{item.productName}</Text>
          <Text style={styles.s_5}>{item.supplier}</Text>
        </View>
        <Text style={styles.s_6}>
          ${item.total.toFixed(2)}
        </Text>
      </View>
      
      <View style={styles.s_7}>
        <View style={styles.s_8}>
          <Text style={styles.s_9}>
            {item.quantity} units
          </Text>
          <Text style={styles.s_9}>
            ${item.unitCost.toFixed(2)}/unit
          </Text>
        </View>
        <Text style={styles.s_9}>
          {new Date(item.date).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity 
      style={styles.s_1}
      onPress={() => handleProductSelect(item)}
    >
      <View style={styles.s_10}>
        <Text style={styles.s_11}>{item.name}</Text>
        <Text style={styles.s_5}>${item.price.toFixed(2)}</Text>
      </View>
      
      <View style={styles.s_7}>
        <Text style={styles.s_9}>
          Stock: {item.stock} units
        </Text>
        <Text style={styles.s_9}>
          {item.category}
        </Text>
      </View>
      
      {item.supplier && (
        <Text style={styles.s_12}>
          Supplier: {item.supplier}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <ScrollView style={styles.s_13}>
        <View style={styles.s_14}>
          {/* Header Skeleton */}
          <View style={styles.s_7}>
            <View>
              <View style={styles.s_15} />
              <View style={styles.s_16} />
            </View>
            <View style={styles.s_17} />
          </View>

          {/* Stats Grid Skeleton */}
          <View style={styles.s_18}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.s_19}>
                <View style={styles.s_20} />
                <View style={styles.s_21} />
              </View>
            ))}
          </View>

          {/* Search Skeleton */}
          <View style={styles.s_22}>
            <View style={styles.s_23} />
            <View style={styles.s_24} />
            <View style={styles.s_25} />
          </View>

          {/* Table Skeleton */}
          <View style={styles.s_22}>
            {[1, 2, 3, 4, 5].map((i) => (
              <View key={i} style={styles.s_26} />
            ))}
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.s_13}>
      <ScrollView style={styles.s_3}>
        <View style={styles.s_14}>


          {/* Stats Cards */}
          <View style={styles.s_18}>
            <View style={styles.s_27}>
              <Text style={styles.s_28}>
                Total Purchases
              </Text>
              <Text style={styles.s_29}>
                {purchases.length}
              </Text>
            </View>
            <View className="bg-primary rounded-lg p-4 w-full ">
              <Text style={styles.s_28}>
                Total Investment
              </Text>
              <Text style={styles.s_29}>
                ${totalCost.toFixed(2)}
              </Text>
            </View>
            <View style={styles.s_19}>
              <Text style={styles.s_30}>
                Total Units
              </Text>
              <Text style={styles.s_31}>
                {totalQuantity}
              </Text>
            </View>
          </View>
          
          <View style={styles.s_32}>
            
          <TouchableOpacity
              style={styles.s_33}
              onPress={() => setIsProductModalOpen(true)}
            >
              <Ionicons name="add" size={20} style={styles.s_34} />
              <Text style={styles.s_35}>New Purchase</Text>
            </TouchableOpacity>
            
            
          </View>

          {/* Search */}
          <View style={styles.s_36}>
            <Text style={styles.s_37}>
              Purchase History
            </Text>
            <Text style={styles.s_38}>
              All inventory purchase orders
            </Text>
            
            <View style={styles.s_39}>
              <Ionicons 
                name="search" 
                size={20} 
                style={styles.s_40} 
              />
              <TextInput
                placeholder="Search by product, supplier, or ID..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.s_41}
                placeholderTextColor="#6B7280"
              />
            </View>
          </View>

          {/* Purchases List */}
          <View style={styles.s_42}>
            {filteredPurchases.length === 0 ? (
              <View style={styles.s_43}>
                <Ionicons name="cart-outline" size={48} style={styles.s_44} />
                <Text style={styles.s_45}>
                  No purchases found
                </Text>
                <Text style={styles.s_46}>
                  {searchQuery 
                    ? 'Try adjusting your search criteria'
                    : 'Get started by creating your first purchase order'
                  }
                </Text>
                {searchQuery && (
                  <TouchableOpacity
                    style={styles.s_47}
                    onPress={() => setSearchQuery('')}
                  >
                    <Text style={styles.s_48}>
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
                style={styles.s_49}
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
        <View style={styles.s_50}>
          <View style={styles.s_51}>
            <Text style={styles.s_52}>Select Product for Purchase</Text>
            <TouchableOpacity onPress={() => setIsProductModalOpen(false)}>
              <Ionicons name="close" size={24} style={styles.s_53} />
            </TouchableOpacity>
          </View>

          <View style={styles.s_54}>
            <View style={styles.s_39}>
              <Ionicons 
                name="search" 
                size={20} 
                style={styles.s_40} 
              />
              <TextInput
                placeholder="Search products..."
                style={styles.s_41}
                placeholderTextColor="#6B7280"
              />
            </View>
          </View>

          <FlatList
            data={products}
            renderItem={renderProductItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.s_3}
          />
        </View>
      </Modal>

      {/* Create Purchase Modal */}
      <Modal
        visible={isDialogOpen}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.s_50}>
          <View style={styles.s_51}>
            <Text style={styles.s_52}>Create Purchase Order</Text>
            <TouchableOpacity onPress={() => setIsDialogOpen(false)}>
              <Ionicons name="close" size={24} style={styles.s_53} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.s_55}>
            {selectedProduct && (
              <View style={styles.s_56}>
                <Text style={styles.s_57}>Selected Product</Text>
                <Text style={styles.s_4}>{selectedProduct.name}</Text>
                <Text style={styles.s_9}>
                  Current stock: {selectedProduct.stock} units • ${selectedProduct.price.toFixed(2)} selling price
                </Text>
              </View>
            )}

            <View style={styles.s_58}>
              {/* Supplier */}
              <View>
                <Text style={styles.s_59}>Supplier</Text>
                <TextInput
                  value={formData.supplier}
                  onChangeText={(text) => setFormData({ ...formData, supplier: text })}
                  placeholder="Enter supplier name"
                  style={styles.s_60}
                  placeholderTextColor="#6B7280"
                />
              </View>

              {/* Unit Type (if product supports packs) */}
              {selectedProduct && (selectedProduct.unitType === 'both' || selectedProduct.unitType === 'pack') && (
                <View>
                  <Text style={styles.s_59}>Purchase Unit Type</Text>
                  <View style={styles.s_61}>
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
                <Text style={styles.s_59}>
                  Quantity {formData.unitType === 'pack' && selectedProduct?.packSize && 
                    `(${selectedProduct.packSize} units/pack)`}
                </Text>
                <TextInput
                  value={formData.quantity}
                  onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                  placeholder="Enter quantity"
                  keyboardType="numeric"
                  style={styles.s_60}
                  placeholderTextColor="#6B7280"
                />
              </View>

              {/* Unit Cost */}
              <View>
                <Text style={styles.s_59}>
                  {formData.unitType === 'pack' ? 'Cost per Pack' : 'Cost per Unit'}
                </Text>
                <TextInput
                  value={formData.unitCost}
                  onChangeText={(text) => setFormData({ ...formData, unitCost: text })}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  style={styles.s_60}
                  placeholderTextColor="#6B7280"
                />
              </View>

              {/* Profit Margin */}
              <View>
                <Text style={styles.s_59}>Profit Margin (%)</Text>
                <TextInput
                  value={formData.profitMargin}
                  onChangeText={(text) => setFormData({ ...formData, profitMargin: text })}
                  placeholder="30"
                  keyboardType="numeric"
                  style={styles.s_60}
                  placeholderTextColor="#6B7280"
                />
              </View>

              {/* Calculation Summary */}
              {formData.quantity && formData.unitCost && (
                <View style={styles.s_62}>
                  <Text style={styles.s_63}>Order Summary</Text>
                  
                  <View style={styles.s_64}>
                    <Text style={styles.s_65}>Total Cost</Text>
                    <Text style={styles.s_66}>
                      ${totalFormCost.toFixed(2)}
                    </Text>
                  </View>
                  
                  <View style={styles.s_64}>
                    <Text style={styles.s_65}>Suggested Selling Price</Text>
                    <Text style={styles.s_67}>
                      ${suggestedPrice.toFixed(2)}
                    </Text>
                  </View>
                  
                  {formData.unitType === 'pack' && selectedProduct?.packSize && (
                    <View style={styles.s_68}>
                      <Text style={styles.s_65}>Total Units to Stock</Text>
                      <Text style={styles.s_66}>
                        {parseInt(formData.quantity) * (selectedProduct.packSize || 1)} units
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.s_69}
              onPress={handleSubmit}
            >
              <Text style={styles.s_70}>
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
          <View style={styles.s_50}>
            <View style={styles.s_51}>
              <Text style={styles.s_52}>
                Purchase Details - #{selectedPurchase.id}
              </Text>
              <TouchableOpacity onPress={() => setSelectedPurchase(null)}>
                <Ionicons name="close" size={24} style={styles.s_53} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.s_55}>
              <View style={styles.s_71}>
                <View style={styles.s_72}>
                  <View style={styles.s_73}>
                    <Text style={styles.s_57}>Product</Text>
                    <Text style={styles.s_74}>{selectedPurchase.productName}</Text>
                  </View>
                  <View style={styles.s_73}>
                    <Text style={styles.s_57}>Supplier</Text>
                    <Text style={styles.s_74}>{selectedPurchase.supplier}</Text>
                  </View>
                  <View style={styles.s_73}>
                    <Text style={styles.s_57}>Quantity</Text>
                    <Text style={styles.s_74}>{selectedPurchase.quantity} units</Text>
                  </View>
                  <View style={styles.s_73}>
                    <Text style={styles.s_57}>Unit Cost</Text>
                    <Text style={styles.s_74}>
                      ${selectedPurchase.unitCost.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.s_73}>
                    <Text style={styles.s_57}>Total Cost</Text>
                    <Text style={styles.s_6}>
                      ${selectedPurchase.total.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.s_73}>
                    <Text style={styles.s_57}>Purchase Date</Text>
                    <Text style={styles.s_74}>
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



const styles = StyleSheet.create({
  s_1: {
  borderColor: "#e6edf3",
  paddingVertical: 12,
  paddingHorizontal: 16,
  backgroundColor: "#ffffff"
},

  s_2: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: 8
},

  s_3: {
  flex: 1
},

  s_4: {
  color: "#0f172a"
},

  s_5: {
  color: "#6b7280",
  fontSize: 14
},

  s_6: {
  fontWeight: "700",
  color: "#f97316",
  fontSize: 18
},

  s_7: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center"
},

  s_8: {
  flexDirection: "row",
  alignItems: "center"
},

  s_9: {
  fontSize: 12,
  color: "#6b7280"
},

  s_10: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start"
},

  s_11: {
  color: "#0f172a",
  flex: 1
},

  s_12: {
  fontSize: 12,
  color: "#6b7280"
},

  s_13: {
  flex: 1,
  backgroundColor: "#ffffff"
},

  s_14: {
  padding: 16
},

  s_15: {
  borderRadius: 6,
  marginBottom: 8
},

  s_16: {
  borderRadius: 6
},

  s_17: {
  borderRadius: 6
},

  s_18: {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 16
},

  s_19: {
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

  s_20: {
  borderRadius: 6,
  marginBottom: 8
},

  s_21: {
  borderRadius: 6
},

  s_22: {
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

  s_23: {
  borderRadius: 6,
  marginBottom: 8
},

  s_24: {
  borderRadius: 6,
  marginBottom: 16
},

  s_25: {
  borderRadius: 6
},

  s_26: {
  borderRadius: 6,
  marginBottom: 8
},

  s_27: {
  backgroundColor: "#0f172a",
  borderRadius: 12,
  padding: 16,
  width: "100%"
},

  s_28: {
  fontSize: 14,
  fontWeight: "600",
  color: "#ffffff"
},

  s_29: {
  fontSize: 20,
  fontWeight: "700",
  color: "#f97316"
},

  s_30: {
  fontSize: 14,
  fontWeight: "600",
  color: "#6b7280"
},

  s_31: {
  fontSize: 20,
  fontWeight: "700",
  color: "#0f172a"
},

  s_32: {
  width: "100%"
},

  s_33: {
  backgroundColor: "#f97316",
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 12,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  width: "100%"
},

  s_34: {},

  s_35: {},

  s_36: {
  backgroundColor: "#ffffff",
  borderRadius: 12,
  padding: 16,
  borderWidth: 1
},

  s_37: {
  fontSize: 18,
  fontWeight: "700",
  color: "#0f172a"
},

  s_38: {
  fontSize: 14,
  color: "#6b7280",
  marginBottom: 16
},

  s_39: {},

  s_40: {
  color: "#6b7280"
},

  s_41: {
  backgroundColor: "#ffffff",
  borderWidth: 1,
  borderColor: "#e6edf3",
  borderRadius: 12,
  paddingRight: 16,
  paddingVertical: 12,
  color: "#0f172a"
},

  s_42: {
  backgroundColor: "#ffffff",
  borderRadius: 12
},

  s_43: {
  alignItems: "center"
},

  s_44: {
  color: "#6b7280",
  marginBottom: 16
},

  s_45: {
  fontSize: 18,
  fontWeight: "600",
  color: "#0f172a",
  marginBottom: 8
},

  s_46: {
  color: "#6b7280",
  marginBottom: 16
},

  s_47: {
  backgroundColor: "#f97316",
  borderRadius: 12,
  paddingHorizontal: 16
},

  s_48: {},

  s_49: {},

  s_50: {
  flex: 1,
  backgroundColor: "#ffffff",
  paddingTop: 16
},

  s_51: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingHorizontal: 16,
  paddingBottom: 16,
  borderColor: "#e6edf3"
},

  s_52: {
  fontSize: 20,
  fontWeight: "700",
  color: "#0f172a"
},

  s_53: {
  color: "#0f172a"
},

  s_54: {
  padding: 16,
  borderColor: "#e6edf3"
},

  s_55: {
  flex: 1,
  padding: 16
},

  s_56: {
  marginBottom: 16,
  padding: 12,
  backgroundColor: "#f3f4f6",
  borderRadius: 12
},

  s_57: {
  fontSize: 14,
  color: "#6b7280"
},

  s_58: {},

  s_59: {
  fontSize: 14,
  fontWeight: "600",
  color: "#0f172a",
  marginBottom: 8
},

  s_60: {
  backgroundColor: "#ffffff",
  borderWidth: 1,
  borderColor: "#e6edf3",
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 12,
  color: "#0f172a"
},

  s_61: {
  flexDirection: "row"
},

  s_62: {
  padding: 16,
  backgroundColor: "#f3f4f6",
  borderRadius: 12
},

  s_63: {
  fontWeight: "600",
  color: "#0f172a",
  marginBottom: 8
},

  s_64: {
  flexDirection: "row",
  justifyContent: "space-between"
},

  s_65: {
  color: "#6b7280"
},

  s_66: {
  fontWeight: "700",
  color: "#0f172a"
},

  s_67: {
  fontWeight: "700",
  color: "#f97316"
},

  s_68: {
  flexDirection: "row",
  justifyContent: "space-between",
  borderColor: "#e6edf3"
},

  s_69: {
  backgroundColor: "#f97316",
  borderRadius: 12
},

  s_70: {
  fontSize: 18
},

  s_71: {},

  s_72: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between",
  gap: 16
},

  s_73: {
  width: "48%"
},

  s_74: {
  fontWeight: "600",
  color: "#0f172a"
}
});
export default AdminPurchases;




