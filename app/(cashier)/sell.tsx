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
} from 'react-native';
import { StyleSheet } from 'react-native';
import type { ListRenderItem } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addSale, updateProductStock } from '../../store/slices/userSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { PaymentMethod, Product, SaleItem, UnitType } from '../../store/types';

// Types
type PaymentMethodOption = 'cash' | 'card' | 'mobile';

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
  unitType: UnitType;
  originalProductId: number;
  packSize?: number;
}

interface ReceiptDetails {
  receiptNumber: string;
  items: CartItem[];
  total: number;
  date: Date;
  paymentMethod: PaymentMethod;
  cashier: string;
}

interface PaymentMethodConfig {
  value: PaymentMethodOption;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

interface UnitTypeOption {
  value: UnitType;
  label: string;
  description: string;
}

const CashierSell = () => {
  const dispatch = useAppDispatch();
  const { products, sales } = useAppSelector((state) => state.user);
  const { user } = useAppSelector((state) => state.auth);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isQuantityModalOpen, setIsQuantityModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [selectedUnitType, setSelectedUnitType] = useState<UnitType>('single');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodOption>('cash');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<ReceiptDetails | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);

  // Payment method configuration
  const paymentMethodConfig: PaymentMethodConfig[] = useMemo(
    () => [
      { value: 'cash', label: 'Cash', icon: 'cash', color: '#10B981' },
      { value: 'card', label: 'Card', icon: 'card', color: '#3B82F6' },
      { value: 'mobile', label: 'Mobile', icon: 'phone-portrait', color: '#8B5CF6' },
    ],
    []
  );

  // Unit type options
  const unitTypeOptions: UnitTypeOption[] = useMemo(
    () => [
      { value: 'single', label: 'Single Unit', description: 'Sell individual items' },
      { value: 'pack', label: 'Pack', description: 'Sell in packs' },
    ],
    []
  );

  // Filter available products
  useEffect(() => {
    const inStockProducts = products.filter(product => product.stock > 0);
    setAvailableProducts(inStockProducts);
  }, [products]);

  // Calculations
  const totalAmount = useMemo(() => 
    cart.reduce((sum, item) => sum + item.subtotal, 0), 
    [cart]
  );
  
  const totalItems = useMemo(() => 
    cart.reduce((sum, item) => sum + item.quantity, 0), 
    [cart]
  );

  // Filter products based on search
  const filteredProducts = useMemo(() => 
    availableProducts.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [availableProducts, searchQuery]
  );

  // Selected product calculations
  const selectedProductPrice = selectedProduct ? selectedProduct.price.toFixed(2) : '0.00';
  const quantityValue = Number.parseInt(quantity, 10) || 1;
  const selectedProductSubtotal = selectedProduct
    ? (selectedProduct.price * quantityValue).toFixed(2)
    : '0.00';

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setQuantity('1');
    setSelectedUnitType('single');
    setEditingCartItem(null);
    setIsQuantityModalOpen(true);
    setIsProductModalOpen(false);
  };

  const handleQuantityConfirm = () => {
    if (!selectedProduct) return;

    const parsedQuantity = Number.parseInt(quantity, 10);

    if (!quantity || Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity');
      return;
    }

    const qty = parsedQuantity;
    let requiredStock = qty;

    // Adjust for pack sales
    if (selectedUnitType === 'pack') {
      requiredStock = qty * (selectedProduct.packSize ?? 1);
    }

    if (requiredStock > selectedProduct.stock) {
      Alert.alert('Insufficient Stock', `Only ${selectedProduct.stock} units available`);
      return;
    }

    if (editingCartItem) {
      // Update existing cart item
      setCart(
        cart.map((item) =>
          item.productId === editingCartItem.productId
            ? {
                ...item,
                quantity: qty,
                unitType: selectedUnitType,
                productName: `${selectedProduct.name}${
                  selectedUnitType === 'pack' && selectedProduct.packSize
                    ? ` (Pack of ${selectedProduct.packSize})`
                    : ''
                }`,
                subtotal: selectedProduct.price * qty,
                packSize: selectedUnitType === 'pack' ? selectedProduct.packSize : 1,
              }
            : item,
        ),
      );
    } else {
      // Add new item to cart
      const cartKey = `${selectedProduct.id}_${selectedUnitType}`;
      const existingItem = cart.find((item) => item.productId === cartKey);
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + qty;
        const newRequiredStock =
          selectedUnitType === 'pack'
            ? newQuantity * (selectedProduct.packSize ?? 1)
            : newQuantity;
        
        if (newRequiredStock > selectedProduct.stock) {
          Alert.alert('Insufficient Stock', `Cannot add more. Only ${selectedProduct.stock} units available`);
          return;
        }
        
        setCart(
          cart.map((item) =>
            item.productId === cartKey
              ? { 
                  ...item, 
                  quantity: newQuantity, 
                  subtotal: selectedProduct.price * newQuantity 
                }
              : item,
          ),
        );
      } else {
        const packInfo =
          selectedUnitType === 'pack' && selectedProduct.packSize
            ? ` (Pack of ${selectedProduct.packSize})`
            : '';
        const newItem: CartItem = {
          productId: cartKey,
          productName: `${selectedProduct.name}${packInfo}`,
          quantity: qty,
          price: selectedProduct.price,
          subtotal: selectedProduct.price * qty,
          unitType: selectedUnitType,
          originalProductId: selectedProduct.id,
          packSize: selectedUnitType === 'pack' ? selectedProduct.packSize : 1,
        };
        setCart([...cart, newItem]);
      }
    }

    setQuantity('1');
    setSelectedUnitType('single');
    setSelectedProduct(null);
    setEditingCartItem(null);
    setIsQuantityModalOpen(false);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Add items to cart before checkout');
      return;
    }

    if (!user) {
      Alert.alert('Authentication Error', 'User not found');
      return;
    }

    try {
      const total = totalAmount;
      const saleItems: SaleItem[] = cart.map((item) => ({
        productId: item.originalProductId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
        unitType: item.unitType,
        packSize: item.packSize,
      }));
      
      const receiptSuffix = (1000 + sales.length).toString().padStart(4, '0');
      const paymentMethodLabel = paymentMethodConfig.find(m => m.value === paymentMethod)?.label || 'Cash';

      // Dispatch sales and update stock
      dispatch(
        addSale({
          items: saleItems,
          total,
          cashier: user.name,
          paymentMethod: "cash",
        }),
      );
      
      cart.forEach((item) => {
        const [rawProductId, unitType] = item.productId.split('_');
        const numericProductId = Number.parseInt(rawProductId, 10);
        const product = products.find((p) => p.id === numericProductId);
        const packSize = product?.packSize ?? 1;
        const stockReduction = unitType === 'pack' ? item.quantity * packSize : item.quantity;

        dispatch(
          updateProductStock({
            productId: numericProductId,
            quantity: stockReduction,
          }),
        );
      });

      setLastSale({
        receiptNumber: `INV${receiptSuffix}`,
        items: cart,
        total,
        date: new Date(),
        paymentMethod: paymentMethodLabel,
        cashier: user.name,
      });
      setShowReceipt(true);
      setCart([]);
    } catch (error) {
      console.error('Checkout error:', error);
      Alert.alert('Checkout Failed', 'An error occurred during checkout');
    }
  };

  const updateQuantity = (cartKey: string, change: number) => {
    const item = cart.find((i) => i.productId === cartKey);
    if (!item) return;

    const [rawProductId, unitType] = cartKey.split('_');
    const numericProductId = Number.parseInt(rawProductId, 10);
    const product = products.find((p) => p.id === numericProductId);
    if (!product) return;

    const newQuantity = item.quantity + change;
    if (newQuantity <= 0) {
      removeFromCart(cartKey);
      return;
    }

    const requiredStock =
      unitType === 'pack' ? newQuantity * (product.packSize ?? 1) : newQuantity;
    
    if (requiredStock > product.stock) {
      Alert.alert('Insufficient Stock', `Only ${product.stock} units available`);
      return;
    }

    setCart(
      cart.map((cartItem) => {
        if (cartItem.productId === cartKey) {
          return {
            ...cartItem,
            quantity: newQuantity,
            subtotal: cartItem.price * newQuantity,
          };
        }
        return cartItem;
      }),
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to clear all items from the cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => setCart([]) },
      ]
    );
  };

  // Render functions
  const renderProductItem: ListRenderItem<Product> = ({ item }) => (
    <TouchableOpacity 
      style={styles.productItem}
      onPress={() => handleProductSelect(item)}
    >
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
      </View>
      <View style={styles.productDetails}>
        <Text style={styles.productCategory}>{item.category}</Text>
        <Text style={styles.productStock}>Stock: {item.stock}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderCartItem: ListRenderItem<CartItem> = ({ item }) => (
    <View style={styles.cartItem}>
      <TouchableOpacity 
        style={styles.cartItemContent}
        onPress={() => {
          const product = products.find((p) => p.id === item.originalProductId);
          if (product) {
            setSelectedProduct(product);
            setQuantity(item.quantity.toString());
            setSelectedUnitType(item.unitType);
            setEditingCartItem(item);
            setIsQuantityModalOpen(true);
          }
        }}
      >
        <View style={styles.cartItemMain}>
          <Text style={styles.cartItemName}>{item.productName}</Text>
          <Text style={styles.cartItemDetails}>
            ${item.price.toFixed(2)} each • {item.unitType} × {item.quantity}
          </Text>
        </View>
        <View style={styles.cartItemActions}>
          <Text style={styles.cartItemSubtotal}>${item.subtotal.toFixed(2)}</Text>
          <TouchableOpacity 
            onPress={() => removeFromCart(item.productId)}
            style={styles.removeButton}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Items</Text>
            <Text style={styles.statValue}>{totalItems}</Text>
          </View>
          <View style={[styles.statCard, styles.totalCard]}>
            <Text style={[styles.statLabel, styles.totalLabel]}>Total Amount</Text>
            <Text style={styles.totalValue}>${totalAmount.toFixed(2)}</Text>
          </View>
        </View>
        
        {/* Payment Method */}
        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.paymentOptions}>
              {paymentMethodConfig.map((method) => (
                <TouchableOpacity
                  key={method.value}
                  style={[
                    styles.paymentOption,
                    paymentMethod === method.value && 
                    [styles.paymentOptionActive, { borderColor: method.color }]
                  ]}
                  onPress={() => setPaymentMethod(method.value)}
                >
                  <Ionicons 
                    name={method.icon} 
                    size={16} 
                    color={paymentMethod === method.value ? '#FFFFFF' : method.color} 
                  />
                  <Text style={[
                    styles.paymentOptionText,
                    paymentMethod === method.value && styles.paymentOptionTextActive
                  ]}>
                    {method.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            onPress={handleCheckout}
            style={[
              styles.checkoutButton,
              cart.length === 0 && styles.checkoutButtonDisabled,
            ]}
            disabled={cart.length === 0}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.checkoutButtonText}>Checkout</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.addItemButton}
            onPress={() => setIsProductModalOpen(true)}
          >
            <Ionicons name="add-circle" size={20} color="#3B82F6" />
            <Text style={styles.addItemButtonText}>Add Item</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Cart Section */}
      <ScrollView style={styles.mainContent}>
        <View style={styles.cartSection}>
          <View style={styles.cartHeader}>
            <View style={styles.cartTitle}>
              <Ionicons name="cart" size={20} color="#1F2937" />
              <Text style={styles.cartTitleText}>
                Cart ({cart.length} items)
              </Text>
            </View>
            {cart.length > 0 && (
              <TouchableOpacity 
                onPress={clearCart}
                style={styles.clearCartButton}
              >
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                <Text style={styles.clearCartText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {cart.length === 0 ? (
            <View style={styles.emptyCart}>
              <Ionicons name="cart-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
              <Text style={styles.emptyCartSubtitle}>
                Add products to get started
              </Text>
            </View>
          ) : (
            <FlatList
              data={cart}
              renderItem={renderCartItem}
              keyExtractor={(item) => item.productId}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>

      {/* Product Search Modal */}
      <Modal
        visible={isProductModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsProductModalOpen(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Product</Text>
            <TouchableOpacity 
              onPress={() => setIsProductModalOpen(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#6B7280" />
              <TextInput
                placeholder="Search products..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {filteredProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyStateTitle}>No products found</Text>
              <Text style={styles.emptyStateSubtitle}>
                {searchQuery ? 'Try a different search term' : 'No products available'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredProducts}
              renderItem={renderProductItem}
              keyExtractor={(item) => item.id.toString()}
              style={styles.productList}
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* Quantity & Unit Type Modal */}
      <Modal
        visible={isQuantityModalOpen}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setIsQuantityModalOpen(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingCartItem ? 'Edit Item' : 'Add to Cart'}
            </Text>
            <TouchableOpacity 
              onPress={() => setIsQuantityModalOpen(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.quantityModalContent}>
            <View style={styles.productHeader}>
              <Text style={styles.productModalName}>{selectedProduct?.name}</Text>
              <Text style={styles.productModalPrice}>
                ${selectedProductPrice} each
              </Text>
            </View>

            {/* Unit Type Selection */}
            <Text style={styles.sectionLabel}>Unit Type</Text>
            <View style={styles.unitTypeContainer}>
              {unitTypeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.unitTypeOption,
                    selectedUnitType === option.value && styles.unitTypeOptionActive,
                  ]}
                  onPress={() => setSelectedUnitType(option.value)}
                >
                  <Text style={[
                    styles.unitTypeLabel,
                    selectedUnitType === option.value && styles.unitTypeLabelActive,
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={styles.unitTypeDescription}>
                    {option.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Quantity Input */}
            <Text style={styles.sectionLabel}>Quantity</Text>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                onPress={() => setQuantity(Math.max(1, quantityValue - 1).toString())}
                style={styles.quantityButton}
              >
                <Ionicons name="remove" size={24} color="#3B82F6" />
              </TouchableOpacity>
              
              <TextInput
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                style={styles.quantityInput}
                placeholderTextColor="#6B7280"
              />
              
              <TouchableOpacity
                onPress={() => setQuantity((quantityValue + 1).toString())}
                style={styles.quantityButton}
              >
                <Ionicons name="add" size={24} color="#3B82F6" />
              </TouchableOpacity>
            </View>

            {/* Summary */}
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Unit Price:</Text>
                <Text style={styles.summaryValue}>${selectedProductPrice}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Quantity:</Text>
                <Text style={styles.summaryValue}>
                  {quantity} {selectedUnitType === 'pack' ? 'packs' : 'units'}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryTotalLabel}>Subtotal:</Text>
                <Text style={styles.summaryTotalValue}>${selectedProductSubtotal}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleQuantityConfirm}
            >
              <Text style={styles.confirmButtonText}>
                {editingCartItem ? 'Update Item' : 'Add to Cart'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Receipt Modal */}
      {lastSale && (
        <Modal
          visible={showReceipt}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowReceipt(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Receipt</Text>
              <TouchableOpacity 
                onPress={() => setShowReceipt(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.receiptContent}>
              {/* Business Info */}
              <View style={styles.businessHeader}>
                <Text style={styles.businessName}>KC Investments</Text>
                <Text style={styles.businessAddress}>
                  123 Business Street, City
                </Text>
                <Text style={styles.businessContact}>
                  Contact: +1 (555) 123-4567
                </Text>
              </View>

              {/* Receipt Info */}
              <View style={styles.receiptInfo}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Receipt #:</Text>
                  <Text style={styles.receiptValue}>{lastSale.receiptNumber}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Cashier:</Text>
                  <Text style={styles.receiptValue}>{lastSale.cashier}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Date & Time:</Text>
                  <Text style={styles.receiptValue}>
                    {lastSale.date.toLocaleDateString()} {lastSale.date.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                </View>
              </View>

              {/* Items List */}
              <View style={styles.itemsSection}>
                <View style={styles.itemsHeader}>
                  <Text style={styles.itemsHeaderText}>Item</Text>
                  <Text style={styles.itemsHeaderText}>Qty</Text>
                  <Text style={styles.itemsHeaderText}>Amount</Text>
                </View>
                
                {lastSale.items.map((item, index) => (
                  <View key={index} style={styles.itemRow}>
                    <View style={styles.itemNameContainer}>
                      <Text style={styles.itemName}>{item.productName}</Text>
                    </View>
                    <Text style={styles.itemQuantity}>
                      {item.quantity} {item.unitType}
                    </Text>
                    <Text style={styles.itemAmount}>
                      ${item.subtotal.toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Total Section */}
              <View style={styles.totalSection}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Amount:</Text>
                  <Text style={styles.totalValue}>
                    ${lastSale.total.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Payment Method:</Text>
                  <Text style={styles.totalValue}>{lastSale.paymentMethod}</Text>
                </View>
              </View>

              {/* Thank You Message */}
              <View style={styles.thankYouSection}>
                <Text style={styles.thankYouTitle}>
                  Thank you for your purchase!
                </Text>
                <Text style={styles.thankYouMessage}>
                  We appreciate your business and look forward to serving you again.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.newSaleButton}
                onPress={() => setShowReceipt(false)}
              >
                <Text style={styles.newSaleButtonText}>
                  Start New Sale
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Main Container
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  // Header
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  totalCard: {
    backgroundColor: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  totalLabel: {
    color: '#D1D5DB',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Payment Section
  paymentSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  paymentOptions: {
    flexDirection: 'row',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  paymentOptionActive: {
    backgroundColor: '#3B82F6',
    borderWidth: 1,
  },
  paymentOptionText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
    color: '#374151',
  },
  paymentOptionTextActive: {
    color: '#FFFFFF',
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  checkoutButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkoutButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  addItemButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  addItemButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Main Content
  mainContent: {
    flex: 1,
  },
  cartSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cartTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 8,
  },
  clearCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  clearCartText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },

  // Empty States
  emptyCart: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyCartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyCartSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },

  // Cart Items
  cartItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  cartItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  cartItemMain: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  cartItemDetails: {
    fontSize: 12,
    color: '#6B7280',
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartItemSubtotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
    marginRight: 12,
  },
  removeButton: {
    padding: 6,
  },

  // Modals
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },

  // Product Search Modal
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 8,
  },
  productList: {
    flex: 1,
  },
  productItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  productInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productCategory: {
    fontSize: 14,
    color: '#6B7280',
  },
  productStock: {
    fontSize: 14,
    color: '#6B7280',
  },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },

  // Quantity Modal
  quantityModalContent: {
    flex: 1,
    padding: 16,
  },
  productHeader: {
    marginBottom: 24,
  },
  productModalName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  productModalPrice: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  unitTypeContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  unitTypeOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 4,
    backgroundColor: '#F9FAFB',
  },
  unitTypeOptionActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  unitTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  unitTypeLabelActive: {
    color: '#3B82F6',
  },
  unitTypeDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  quantityButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  quantityInput: {
    width: 80,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1F2937',
    marginHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  summaryContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  confirmButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Receipt Modal
  receiptContent: {
    flex: 1,
    padding: 16,
  },
  businessHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  businessName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  businessAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  businessContact: {
    fontSize: 14,
    color: '#6B7280',
  },
  receiptInfo: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  receiptLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  receiptValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  itemsSection: {
    marginBottom: 24,
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
    marginBottom: 12,
  },
  itemsHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemNameContainer: {
    flex: 2,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  itemQuantity: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  itemAmount: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'right',
  },
  totalSection: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  thankYouSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  thankYouTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  thankYouMessage: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  newSaleButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  newSaleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default CashierSell;