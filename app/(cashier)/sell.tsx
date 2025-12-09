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
import type { ListRenderItem } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addSale, updateProductStock } from '../../store/slices/userSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { PaymentMethod, Product, SaleItem, UnitType } from '../../store/types';

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

  const paymentMethodLabels = useMemo<Record<PaymentMethodOption, PaymentMethod>>(
    () => ({
      cash: 'Cash',
      card: 'Card',
      mobile: 'Mobile Payment',
    }),
    [],
  );

  const availablePaymentMethods = useMemo(
    () =>
      [
        { value: 'cash' as PaymentMethodOption, label: '💵 Cash', icon: 'cash' },
        { value: 'card' as PaymentMethodOption, label: '💳 Card', icon: 'card' },
        {
          value: 'mobile' as PaymentMethodOption,
          label: '📱 Mobile',
          icon: 'phone-portrait',
        },
      ],
    [],
  );

  useEffect(() => {
    // Filter products with stock > 0
    const inStockProducts = products.filter(product => product.stock > 0);
    setAvailableProducts(inStockProducts);
  }, [products]);

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
      Alert.alert('Error', 'Please enter valid quantity');
      return;
    }

    const qty = parsedQuantity;
    let price = selectedProduct.price;
    let requiredStock = qty;

    // Adjust for pack sales
    if (selectedUnitType === 'pack') {
      requiredStock = qty * (selectedProduct.packSize ?? 1);
    }

    if (requiredStock > selectedProduct.stock) {
      Alert.alert('Error', `Only ${selectedProduct.stock} units available in stock`);
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
                subtotal: price * qty,
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
          Alert.alert('Error', `Cannot add more. Only ${selectedProduct.stock} units available`);
          return;
        }
        
        setCart(
          cart.map((item) =>
            item.productId === cartKey
              ? { ...item, quantity: newQuantity, subtotal: price * newQuantity }
              : item,
          ),
        );
      } else {
        const packInfo =
          selectedUnitType === 'pack' && selectedProduct.packSize
            ? ` (Pack of ${selectedProduct.packSize})`
            : '';
        const newItem = {
          productId: cartKey,
          productName: `${selectedProduct.name}${packInfo}`,
          quantity: qty,
          price,
          subtotal: price * qty,
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

  const handleCartItemPress = (item: CartItem) => {
    const product = products.find((p) => p.id === item.originalProductId);
    if (product) {
      setSelectedProduct(product);
      setQuantity(item.quantity.toString());
      setSelectedUnitType(item.unitType);
      setEditingCartItem(item);
      setIsQuantityModalOpen(true);
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
      Alert.alert('Error', `Only ${product.stock} units available`);
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
    setCart([]);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      Alert.alert('Error', 'Cart is empty');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not found');
      return;
    }

    try {
      const total = cart.reduce((sum, item) => sum + item.subtotal, 0);
      const saleItems: SaleItem[] = cart.map((item) => ({
        productId: item.originalProductId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
        unitType: item.unitType,
        packSize: item.packSize,
      }));
      const formattedPaymentMethod = paymentMethodLabels[paymentMethod];
      const receiptSuffix = (1000 + sales.length).toString().padStart(4, '0');

      dispatch(
        addSale({
          items: saleItems,
          total,
          cashier: user.name,
          paymentMethod: formattedPaymentMethod,
        }),
      );
      
      cart.forEach((item) => {
        const [rawProductId, unitType] = item.productId.split('_');
        const numericProductId = Number.parseInt(rawProductId, 10);
        const packSize = products.find((p) => p.id === numericProductId)?.packSize ?? 1;
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
        paymentMethod: formattedPaymentMethod,
        cashier: user.name,
      });
      setShowReceipt(true);

      setCart([]);
    } catch (error) {
      console.error('Error completing sale:', error);
      Alert.alert('Error', 'Failed to complete sale');
    }
  };

  const total = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const filteredProducts = availableProducts.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const quantityValue = Number.parseInt(quantity, 10) || 1;
  const selectedProductPrice = selectedProduct ? selectedProduct.price.toFixed(2) : '0.00';
  const selectedProductSubtotal = selectedProduct
    ? (selectedProduct.price * quantityValue).toFixed(2)
    : '0.00';

  const renderProductItem: ListRenderItem<Product> = ({ item }) => (
    <TouchableOpacity 
      style={styles.s_1}
      onPress={() => handleProductSelect(item)}
    >
      <View style={styles.s_2}>
        <Text style={styles.s_3}>{item.name}</Text>
        <Text style={styles.s_4}>${item.price.toFixed(2)}</Text>
      </View>
      
      <View style={styles.s_5}>
        <Text style={styles.s_6}>
          {item.category}
        </Text>
        <Text style={styles.s_6}>
          Stock: {item.stock}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderCartItem: ListRenderItem<CartItem> = ({ item }) => (
    <TouchableOpacity 
      style={styles.s_7}
      onPress={() => handleCartItemPress(item)}
    >
      <View style={styles.s_8}>
        <View style={styles.s_9}>
          <Text style={styles.s_10}>{item.productName}</Text>
          <Text style={styles.s_11}>
            ${item.price.toFixed(2)} each • {item.unitType}{" × "}
            {item.quantity}
        
          </Text>
        </View>
        
        <View style={styles.s_12}>
          <Text style={styles.s_13}>
            ${item.subtotal.toFixed(2)}
          </Text>
        </View>
       <View>
         
          <TouchableOpacity 
          onPress={() => removeFromCart(item.productId)}
          style={styles.s_14}
        >
          <Ionicons name="trash-outline" size={20} style={styles.s_15} />
        </TouchableOpacity>
         
       </View>
      </View>
      

    </TouchableOpacity>
  );

  return (
    <View style={styles.s_16}>
      {/* Header */}
      <View style={styles.s_17}>
        <View style={styles.s_5}>
          <View style={styles.s_18}>
            <Text style={styles.s_19}>Total Items</Text>
            <Text style={styles.s_20}>{totalItems}</Text>
          </View>
          
          <View style={styles.s_21}>
            <Text style={styles.s_22}>Total Amount</Text>
            <Text style={styles.s_23}>
              {"$ "}{total.toFixed(2)}
            </Text>
          </View>
        </View>
        <View style={styles.s_24}>
          
         <TouchableOpacity
          onPress={handleCheckout}
          className={`rounded-lg py-2 px-6 items-center w-[48%] ${
            cart.length === 0 ? 'bg-gray-400' : 'bg-green-600'
          }`}
          disabled={cart.length === 0}
        >
          <Text style={styles.s_25}>
            Check Out
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.s_26}
          onPress={() => setIsProductModalOpen(true)}
        >
          <Text style={styles.s_27}>{"+ "}Add Item</Text>
        </TouchableOpacity>
        </View>
        
                  {/* Payment Method Section */}
          <View style={styles.s_28}>
            <Text style={styles.s_29}>Payment Method</Text>
            <View style={styles.s_30}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.s_31}>
                  {availablePaymentMethods.map((method) => (
                    <TouchableOpacity
                      key={method.value}
                      className={`px-3 py-2 rounded mx-1 flex-row items-center ${
                        paymentMethod === method.value 
                          ? 'bg-accent' 
                          : 'bg-transparent'
                      }`}
                      onPress={() => setPaymentMethod(method.value)}
                    >
                      <Text className={
                        paymentMethod === method.value 
                          ? 'text-accent-foreground text-xs font-medium'
                          : 'text-muted-foreground text-xs'
                      }>
                        {method.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
          
      </View>

      {/* Main Content */}
      <ScrollView style={styles.s_9}>
        <View style={styles.s_32}>


          {/* Cart Items */}
          <View style={styles.s_33}>
            <View style={styles.s_34}>
              <View style={styles.s_35}>
                <Ionicons name="cart" size={20} style={styles.s_36} />
                <Text style={styles.s_37}>
                  Cart ({cart.length} items)
                </Text>
              </View>
              
              {cart.length > 0 && (
                <TouchableOpacity 
                  onPress={clearCart}
                  style={styles.s_38}
                >
                  <Text style={styles.s_39}>
                    Clear
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {cart.length === 0 ? (
              <View style={styles.s_40}>
                <Ionicons name="cart-outline" size={48} style={styles.s_41} />
                <Text style={styles.s_42}>Cart is empty</Text>
                <Text style={styles.s_43}>
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
        </View>
      </ScrollView>

      {/* Product Search Modal */}
      <Modal
        visible={isProductModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsProductModalOpen(false)}
      >
        <View style={styles.s_44}>
          <View style={styles.s_45}>
            <Text style={styles.s_46}>Select Product</Text>
            <TouchableOpacity onPress={() => setIsProductModalOpen(false)}>
              <Ionicons name="close" size={24} style={styles.s_47} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.s_48}>
            <View style={styles.s_49}>
              <Ionicons 
                name="search" 
                size={20} 
                style={styles.s_50} 
              />
              <TextInput
                placeholder="Search products..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.s_51}
                placeholderTextColor="#6B7280"
              />
            </View>
          </View>

          {/* Products List */}
          {filteredProducts.length === 0 ? (
            <View style={styles.s_52}>
              <Ionicons name="search-outline" size={48} style={styles.s_41} />
              <Text style={styles.s_53}>No products found</Text>
              <Text style={styles.s_54}>
                {searchQuery ? 'Try a different search term' : 'No products available'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredProducts}
              renderItem={renderProductItem}
              keyExtractor={(item) => item.id.toString()}
              style={styles.s_9}
            />
          )}
        </View>
      </Modal>

      {/* Quantity & Unit Type Modal */}
      <Modal
        visible={isQuantityModalOpen}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setIsQuantityModalOpen(false)}
      >
        <View style={styles.s_44}>
          <View style={styles.s_45}>
            <Text style={styles.s_46}>
              {editingCartItem ? 'Edit Item' : 'Add to Cart'}
            </Text>
            <TouchableOpacity onPress={() => setIsQuantityModalOpen(false)}>
              <Ionicons name="close" size={24} style={styles.s_47} />
            </TouchableOpacity>
          </View>

          <View style={styles.s_55}>
            <Text style={styles.s_56}>
              {selectedProduct?.name}
            </Text>
            <Text style={styles.s_57}>
              ${selectedProductPrice} each
            </Text>

            {/* Unit Type Selection */}
            <Text style={styles.s_58}>Unit Type</Text>
            <View style={styles.s_59}>
              <TouchableOpacity
                className={`flex-1 border-2 rounded-lg p-4 items-center ${
                  selectedUnitType === 'single' 
                    ? 'border-accent bg-accent/10' 
                    : 'border-input'
                }`}
                onPress={() => setSelectedUnitType('single')}
              >
                <Text
                  className={`font-bold mb-1 ${
                    selectedUnitType === 'single' ? 'text-accent' : 'text-foreground'
                  }`}
                >
                  Single Unit
                </Text>
                <Text style={styles.s_60}>
                  ${selectedProductPrice} each
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-1 border-2 rounded-lg p-4 items-center ${
                  selectedUnitType === 'pack' 
                    ? 'border-accent bg-accent/10' 
                    : 'border-input'
                }`}
                onPress={() => setSelectedUnitType('pack')}
              >
                <Text
                  className={`font-bold mb-1 ${
                    selectedUnitType === 'pack' ? 'text-accent' : 'text-foreground'
                  }`}
                >
                  Pack
                </Text>
                <Text style={styles.s_60}>
                  {selectedProduct?.packSize ?? 1} units • ${selectedProductPrice}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quantity Input */}
            <Text style={styles.s_58}>Quantity</Text>
            <View style={styles.s_61}>
              <TouchableOpacity
                onPress={() => setQuantity(Math.max(1, Number.parseInt(quantity, 10) - 1).toString())}
                style={styles.s_62}
              >
                <Ionicons name="remove" size={20} style={styles.s_47} />
              </TouchableOpacity>
              
              <TextInput
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                style={styles.s_63}
                placeholderTextColor="#6B7280"
              />
              
              <TouchableOpacity
                onPress={() => setQuantity((Number.parseInt(quantity, 10) + 1).toString())}
                style={styles.s_62}
              >
                <Ionicons name="add" size={20} style={styles.s_47} />
              </TouchableOpacity>
            </View>

            {/* Summary */}
            <View style={styles.s_64}>
              <View style={styles.s_8}>
                <Text style={styles.s_47}>Unit Price:</Text>
                <Text style={styles.s_47}>${selectedProductPrice}</Text>
              </View>
              <View style={styles.s_8}>
                <Text style={styles.s_47}>Quantity:</Text>
                <Text style={styles.s_47}>{quantity} {selectedUnitType === 'pack' ? 'packs' : 'units'}</Text>
              </View>
              <View style={styles.s_65}>
                <Text style={styles.s_66}>Subtotal:</Text>
                <Text style={styles.s_66}>
                  ${selectedProductSubtotal}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.s_67}
              onPress={handleQuantityConfirm}
            >
              <Text style={styles.s_68}>
                {editingCartItem ? 'Update Cart' : 'Add to Cart'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Checkout Receipt Modal */}
      <Modal
        visible={showReceipt}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowReceipt(false)}
      >
        {lastSale && (
          <View style={styles.s_44}>
            <View style={styles.s_45}>
              <Text style={styles.s_46}>Checkout Receipt</Text>
              <TouchableOpacity onPress={() => setShowReceipt(false)}>
                <Ionicons name="close" size={24} style={styles.s_47} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.s_69}>
              {/* Business Header */}
              <View style={styles.s_70}>
                <Text style={styles.s_71}>KC Investments</Text>
                <Text style={styles.s_72}>
                  123 Business Street, City
                </Text>
                <Text style={styles.s_54}>
                  Contact: +1 (555) 123-4567
                </Text>
              </View>

              {/* Receipt Info */}
              <View style={styles.s_73}>
                <View style={styles.s_74}>
                  <Text style={styles.s_42}>Receipt #:</Text>
                  <Text style={styles.s_75}>{lastSale.receiptNumber}</Text>
                </View>
                <View style={styles.s_74}>
                  <Text style={styles.s_42}>Cashier:</Text>
                  <Text style={styles.s_75}>{lastSale.cashier}</Text>
                </View>
                <View style={styles.s_76}>
                  <Text style={styles.s_42}>Date & Time:</Text>
                  <Text style={styles.s_77}>
                    {`${lastSale.date.toLocaleDateString()} ${lastSale.date.toLocaleTimeString()}`}
                  </Text>
                </View>
              </View>

              {/* Items List */}
              <View style={styles.s_78}>
                <View style={styles.s_79}>
                  <Text style={styles.s_80}>Item</Text>
                  <Text style={styles.s_81}>Qty/Type</Text>
                  <Text style={styles.s_82}>Amount</Text>
                </View>
                
                {lastSale.items.map((item, index) => (
                  <View key={index} style={styles.s_83}>
                    <View style={styles.s_9}>
                      <Text style={styles.s_84}>{item.productName}</Text>
                    </View>
                    <View style={styles.s_85}>
                      <Text style={styles.s_6}>
                        {item.quantity} {item.unitType}
                      </Text>
                    </View>
                    <Text style={styles.s_82}>
                      ${item.subtotal.toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Total Section */}
              <View style={styles.s_86}>
                <View style={styles.s_5}>
                  <Text style={styles.s_87}>Total Amount:</Text>
                  <Text style={styles.s_87}>
                    ${lastSale.total.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.s_88}>
                  <Text style={styles.s_89}>Payment Method:</Text>
                  <Text style={styles.s_90}>{lastSale.paymentMethod}</Text>
                </View>
              </View>

              {/* Thank You Message */}
              <View style={styles.s_91}>
                <Text style={styles.s_92}>
                  Thank you for your purchase!
                </Text>
                <Text style={styles.s_93}>
                  We appreciate your business and look forward to serving you again.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.s_94}
                onPress={() => setShowReceipt(false)}
              >
                <Text style={styles.s_68}>
                  New Sale
                </Text>
              </TouchableOpacity>
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
  alignItems: "flex-start"
},

  s_3: {
  color: "#0f172a",
  flex: 1
},

  s_4: {
  fontWeight: "700",
  color: "#f97316"
},

  s_5: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center"
},

  s_6: {
  color: "#6b7280",
  fontSize: 14
},

  s_7: {
  backgroundColor: "#f3f4f6",
  borderRadius: 12,
  padding: 12,
  marginBottom: 8
},

  s_8: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 8
},

  s_9: {
  flex: 1
},

  s_10: {
  color: "#0f172a",
  fontSize: 14
},

  s_11: {
  color: "#6b7280",
  fontSize: 12
},

  s_12: {
  backgroundColor: "#f97316",
  borderRadius: 12
},

  s_13: {
  fontWeight: "700"
},

  s_14: {},

  s_15: {},

  s_16: {
  flex: 1,
  backgroundColor: "#ffffff"
},

  s_17: {
  backgroundColor: "#ffffff",
  padding: 16,
  borderColor: "#e6edf3"
},

  s_18: {
  width: "45%",
  padding: 16,
  backgroundColor: "#f97316"
},

  s_19: {
  fontSize: 12
},

  s_20: {
  fontSize: 24,
  fontWeight: "700"
},

  s_21: {
  width: "45%",
  padding: 16,
  backgroundColor: "#0f172a"
},

  s_22: {
  fontSize: 12,
  color: "#ffffff"
},

  s_23: {
  fontSize: 24,
  fontWeight: "700",
  color: "#ffffff",
  width: "100%",
  flexDirection: "row",
  alignItems: "center"
},

  s_24: {
  display: "flex",
  flexDirection: "row",
  width: "100%",
  justifyContent: "space-between",
  gap: 16,
  marginTop: 16,
  alignItems: "center"
},

  s_25: {
  fontSize: 18,
  fontWeight: "700"
},

  s_26: {
  borderColor: "#e6edf3",
  borderRadius: 12,
  alignItems: "center",
  width: "48%"
},

  s_27: {
  fontSize: 18,
  fontWeight: "600",
  color: "#0f172a"
},

  s_28: {
  backgroundColor: "#ffffff",
  borderRadius: 12,
  marginTop: 16,
  marginHorizontal: 16
},

  s_29: {
  fontSize: 14,
  fontWeight: "600",
  color: "#0f172a",
  marginBottom: 8
},

  s_30: {
  borderWidth: 1,
  borderColor: "#e6edf3",
  borderRadius: 12,
  backgroundColor: "#ffffff"
},

  s_31: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center"
},

  s_32: {
  padding: 16
},

  s_33: {
  backgroundColor: "#ffffff",
  borderRadius: 12,
  padding: 16
},

  s_34: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 16
},

  s_35: {
  flexDirection: "row",
  alignItems: "center"
},

  s_36: {
  color: "#0f172a"
},

  s_37: {
  fontSize: 18,
  fontWeight: "700",
  color: "#0f172a"
},

  s_38: {
  borderRadius: 12
},

  s_39: {
  fontSize: 14,
  fontWeight: "600"
},

  s_40: {
  alignItems: "center"
},

  s_41: {
  color: "#6b7280",
  marginBottom: 12
},

  s_42: {
  color: "#6b7280"
},

  s_43: {
  color: "#6b7280",
  fontSize: 14
},

  s_44: {
  flex: 1,
  backgroundColor: "#ffffff",
  paddingTop: 16
},

  s_45: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingHorizontal: 16,
  paddingBottom: 16,
  borderColor: "#e6edf3"
},

  s_46: {
  fontSize: 20,
  fontWeight: "700",
  color: "#0f172a"
},

  s_47: {
  color: "#0f172a"
},

  s_48: {
  padding: 16,
  borderColor: "#e6edf3"
},

  s_49: {},

  s_50: {
  color: "#6b7280"
},

  s_51: {
  backgroundColor: "#ffffff",
  borderWidth: 1,
  borderColor: "#e6edf3",
  borderRadius: 12,
  paddingRight: 16,
  paddingVertical: 12,
  color: "#0f172a"
},

  s_52: {
  flex: 1,
  alignItems: "center",
  justifyContent: "center"
},

  s_53: {
  fontSize: 18,
  fontWeight: "600",
  color: "#0f172a",
  marginBottom: 8
},

  s_54: {
  color: "#6b7280"
},

  s_55: {
  padding: 16
},

  s_56: {
  fontSize: 18,
  color: "#0f172a",
  marginBottom: 8
},

  s_57: {
  color: "#6b7280"
},

  s_58: {
  fontSize: 14,
  fontWeight: "600",
  color: "#0f172a",
  marginBottom: 12
},

  s_59: {
  flexDirection: "row"
},

  s_60: {
  color: "#6b7280",
  fontSize: 12
},

  s_61: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center"
},

  s_62: {
  alignItems: "center",
  justifyContent: "center"
},

  s_63: {
  backgroundColor: "#ffffff",
  borderWidth: 1,
  borderColor: "#e6edf3",
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 12,
  color: "#0f172a",
  fontSize: 20,
  fontWeight: "700"
},

  s_64: {
  backgroundColor: "#f3f4f6",
  borderRadius: 12,
  padding: 16
},

  s_65: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  borderColor: "#e6edf3"
},

  s_66: {
  color: "#0f172a",
  fontWeight: "700"
},

  s_67: {
  backgroundColor: "#f97316",
  borderRadius: 12
},

  s_68: {
  fontWeight: "700",
  fontSize: 18
},

  s_69: {
  flex: 1,
  padding: 16
},

  s_70: {
  alignItems: "center"
},

  s_71: {
  fontSize: 24,
  fontWeight: "700",
  color: "#0f172a"
},

  s_72: {
  color: "#6b7280"
},

  s_73: {
  backgroundColor: "#ffffff",
  borderRadius: 12,
  padding: 16,
  marginBottom: 16
},

  s_74: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginBottom: 8
},

  s_75: {
  fontWeight: "700",
  color: "#0f172a"
},

  s_76: {
  flexDirection: "row",
  justifyContent: "space-between"
},

  s_77: {
  fontWeight: "700",
  color: "#0f172a"
},

  s_78: {
  marginBottom: 16
},

  s_79: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  borderColor: "#e6edf3",
  marginBottom: 8
},

  s_80: {
  fontWeight: "700",
  color: "#0f172a",
  flex: 1
},

  s_81: {
  fontWeight: "700",
  color: "#0f172a",
  flex: 1
},

  s_82: {
  fontWeight: "700",
  color: "#0f172a",
  flex: 1
},

  s_83: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center"
},

  s_84: {
  fontWeight: "600",
  color: "#0f172a",
  fontSize: 14
},

  s_85: {
  flex: 1,
  alignItems: "center"
},

  s_86: {
  backgroundColor: "#0f172a",
  borderRadius: 12,
  padding: 16
},

  s_87: {
  color: "#ffffff",
  fontSize: 18,
  fontWeight: "700"
},

  s_88: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center"
},

  s_89: {
  color: "#ffffff"
},

  s_90: {
  color: "#ffffff"
},

  s_91: {
  alignItems: "center",
  marginTop: 16
},

  s_92: {
  color: "#6b7280",
  fontSize: 18,
  fontWeight: "600",
  marginBottom: 8
},

  s_93: {
  color: "#6b7280",
  fontSize: 14
},

  s_94: {
  backgroundColor: "#f97316",
  borderRadius: 12
}
});
export default CashierSell;