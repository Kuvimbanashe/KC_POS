// app/(cashier)/sell.js
import { useEffect, useState } from 'react';
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
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { addSale, updateProductStock } from '../../store/slices/userSlice';

const CashierSell = () => {
  const { products, sales } = useSelector(state => state.user);
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  
  const [cart, setCart] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isUnitTypeModalOpen, setIsUnitTypeModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState('1');
  const [selectedUnitType, setSelectedUnitType] = useState('single');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Filter products with stock > 0
    const inStockProducts = products.filter(product => product.stock > 0);
    setAvailableProducts(inStockProducts);
  }, [products]);

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    if (product.unitType === 'both') {
      setIsUnitTypeModalOpen(true);
    } else {
      setSelectedUnitType(product.unitType === 'pack' ? 'pack' : 'single');
      addToCart(product, product.unitType === 'pack' ? 'pack' : 'single');
    }
  };

  const handleUnitTypeConfirm = () => {
    if (selectedProduct) {
      addToCart(selectedProduct, selectedUnitType);
      setIsUnitTypeModalOpen(false);
      setSelectedProduct(null);
    }
  };

  const addToCart = (product, unitType) => {
    if (!quantity || parseInt(quantity) <= 0) {
      Alert.alert('Error', 'Please enter valid quantity');
      return;
    }

    const qty = parseInt(quantity);
    let price = product.price;
    let requiredStock = qty;

    // Adjust for pack sales
    if (unitType === 'pack') {
      price = product.price; // Pack price (assuming pack price is stored in product.price)
      requiredStock = qty * (product.packSize || 1);
    }

    if (requiredStock > product.stock) {
      Alert.alert('Error', `Only ${product.stock} units available in stock`);
      return;
    }

    const cartKey = `${product.id}_${unitType}`;
    const existingItem = cart.find(item => item.productId === cartKey);
    
    if (existingItem) {
      const newQuantity = existingItem.quantity + qty;
      const newRequiredStock = unitType === 'pack' ? newQuantity * (product.packSize || 1) : newQuantity;
      
      if (newRequiredStock > product.stock) {
        Alert.alert('Error', `Cannot add more. Only ${product.stock} units available`);
        return;
      }
      
      setCart(cart.map(item =>
        item.productId === cartKey
          ? { ...item, quantity: newQuantity, subtotal: price * newQuantity }
          : item
      ));
    } else {
      const packInfo = unitType === 'pack' && product.packSize ? ` (Pack of ${product.packSize})` : '';
      const newItem = {
        productId: cartKey,
        productName: `${product.name}${packInfo}`,
        quantity: qty,
        price,
        subtotal: price * qty,
        unitType: unitType,
        originalProductId: product.id,
        packSize: unitType === 'pack' ? product.packSize : 1
      };
      setCart([...cart, newItem]);
    }

    setQuantity('1');
    setIsProductModalOpen(false);
  };

  const updateQuantity = (cartKey, change) => {
    const item = cart.find(i => i.productId === cartKey);
    if (!item) return;

    const [productId, unitType] = cartKey.split('_');
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const newQuantity = item.quantity + change;
    if (newQuantity <= 0) {
      removeFromCart(cartKey);
      return;
    }

    const requiredStock = unitType === 'pack' ? newQuantity * (product.packSize || 1) : newQuantity;
    if (requiredStock > product.stock) {
      Alert.alert('Error', `Only ${product.stock} units available`);
      return;
    }

    setCart(cart.map(cartItem => {
      if (cartItem.productId === cartKey) {
        return {
          ...cartItem,
          quantity: newQuantity,
          subtotal: cartItem.price * newQuantity,
        };
      }
      return cartItem;
    }));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId));
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
      
      // Create sale record with all items
      const saleId = sales.length > 0 ? Math.max(...sales.map(s => s.id)) + 1 : 1;
      const sale = {
        id: saleId,
        items: cart.map(item => ({
          productId: item.originalProductId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
          unitType: item.unitType,
          packSize: item.packSize
        })),
        total: total,
        date: new Date().toISOString(),
        cashier: user.name,
        paymentMethod: paymentMethod,
      };

      dispatch(addSale(sale));

      // Update product stock for each item
      cart.forEach(item => {
        const [productId, unitType] = item.productId.split('_');
        const stockReduction = unitType === 'pack' ? 
          item.quantity * (products.find(p => p.id === productId)?.packSize || 1) : 
          item.quantity;
        
        dispatch(updateProductStock({
          productId: productId,
          quantity: stockReduction
        }));
      });

      // Show receipt
      setLastSale({
        receiptNumber: `INV${saleId.toString().padStart(4, '0')}`,
        items: cart,
        total: total,
        date: new Date(),
        paymentMethod: paymentMethod,
        cashier: user.name,
      });
      setShowReceipt(true);

      setCart([]);
      setAvailableProducts(products.filter(product => product.stock > 0));
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

  const renderProductItem = ({ item }) => (
    <TouchableOpacity 
      className="border-b border-border py-3 px-4 bg-card active:bg-muted"
      onPress={() => handleProductSelect(item)}
    >
      <View className="flex-row justify-between items-start mb-1">
        <Text className="font-semibold text-foreground text-base flex-1">{item.name}</Text>
        <Text className="font-bold text-accent">${item.price.toFixed(2)}</Text>
      </View>
      
      <View className="flex-row justify-between items-center">
        <Text className="text-muted-foreground text-sm">
          {item.category}
        </Text>
        <Text className="text-muted-foreground text-sm">
          Stock: {item.stock}
        </Text>
      </View>
      
      {item.unitType === 'both' && (
        <Text className="text-xs text-muted-foreground mt-1">
          Available as single or pack of {item.packSize}
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderCartItem = ({ item }) => (
    <View className="bg-secondary rounded-lg p-3 mb-2">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="font-semibold text-foreground text-sm">{item.productName}</Text>
          <Text className="text-muted-foreground text-xs">
            ${item.price.toFixed(2)} each • {item.unitType}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={() => removeFromCart(item.productId)}
          className="p-1"
        >
          <Ionicons name="trash-outline" size={20} className="text-destructive" />
        </TouchableOpacity>
      </View>
      
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center space-x-3">
          <TouchableOpacity
            onPress={() => updateQuantity(item.productId, -1)}
            className="w-8 h-8 bg-border rounded-full items-center justify-center"
          >
            <Ionicons name="remove" size={16} className="text-foreground" />
          </TouchableOpacity>
          
          <Text className="font-bold text-foreground text-lg w-12 text-center">
            {item.quantity}
          </Text>
          
          <TouchableOpacity
            onPress={() => updateQuantity(item.productId, 1)}
            className="w-8 h-8 bg-border rounded-full items-center justify-center"
          >
            <Ionicons name="add" size={16} className="text-foreground" />
          </TouchableOpacity>
        </View>
        
        <View className="bg-accent rounded-lg px-3 py-1">
          <Text className="font-bold text-accent-foreground text-base">
            ${item.subtotal.toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="bg-card p-4 border- border-border">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-xs text-muted-foreground">Total Items</Text>
            <Text className="text-lg font-bold text-foreground">{totalItems}</Text>
          </View>
          
          <View className="items-end">
            <Text className="text-xs text-muted-foreground">Total Amount</Text>
            <Text className="text-2xl font-bold text-accent flex-row items-center">
              <Ionicons name="dollar" size={24} className="text-accent mr-1" />
              {total.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView className="flex-1">
        <View className="p-4 space-y-4">
          {/* Add Product Section */}
          <View className="bg-card rounded-lg p-4 space-y-3">
            <TouchableOpacity
              className="border-2 border-dashed border-input rounded-lg p-4 items-center"
              onPress={() => setIsProductModalOpen(true)}
            >
              <Ionicons name="search" size={24} className="text-muted-foreground mb-2" />
              <Text className="text-lg font-medium text-foreground">Search Product</Text>
              <Text className="text-muted-foreground text-sm">Tap to browse products</Text>
            </TouchableOpacity>

            <View className="flex-row space-x-3">
              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground mb-1">Quantity</Text>
                <TextInput
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="1"
                  keyboardType="numeric"
                  className="bg-background border border-input rounded-lg px-4 py-3 text-foreground text-center text-lg font-bold"
                  placeholderTextColor="#6B7280"
                />
              </View>
              
              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground mb-1">Payment</Text>
                <View className="border border-input rounded-lg bg-background">
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row px-2 py-1">
                      {[
                        { value: 'cash', label: '💵 Cash', icon: 'cash' },
                        { value: 'card', label: '💳 Card', icon: 'card' },
                        { value: 'mobile', label: '📱 Mobile', icon: 'phone-portrait' },
                      ].map((method) => (
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
          </View>

          {/* Cart Items */}
          <View className="bg-card rounded-lg p-4">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <Ionicons name="cart" size={20} className="text-foreground mr-2" />
                <Text className="text-lg font-bold text-foreground">
                  Cart ({cart.length} items)
                </Text>
              </View>
              
              {cart.length > 0 && (
                <TouchableOpacity 
                  onPress={clearCart}
                  className="bg-destructive rounded-lg px-3 py-1"
                >
                  <Text className="text-destructive-foreground text-sm font-medium">
                    Clear
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {cart.length === 0 ? (
              <View className="items-center py-8">
                <Ionicons name="cart-outline" size={48} className="text-muted-foreground mb-3" />
                <Text className="text-muted-foreground">Cart is empty</Text>
                <Text className="text-muted-foreground text-sm mt-1">
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

      {/* Fixed Bottom Section */}
      <View className="border-t bg-card p-4 ">
        
        
        <TouchableOpacity
          onPress={handleCheckout}
          className={`rounded-lg py-4 items-center ${
            cart.length === 0 ? 'bg-gray-400' : 'bg-accent'
          }`}
          disabled={cart.length === 0}
        >
          <Text className="text-accent-foreground text-lg font-bold">
            Complete Sale
          </Text>
        </TouchableOpacity>
      </View>

      {/* Product Search Modal */}
      <Modal
        visible={isProductModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsProductModalOpen(false)}
      >
        <View className="flex-1 bg-background pt-4">
          <View className="flex-row justify-between items-center px-4 pb-4 border-b border-border">
            <Text className="text-xl font-bold text-foreground">Select Product</Text>
            <TouchableOpacity onPress={() => setIsProductModalOpen(false)}>
              <Ionicons name="close" size={24} className="text-foreground" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View className="p-4 border-b border-border">
            <View className="relative">
              <Ionicons 
                name="search" 
                size={20} 
                className="absolute left-3 top-3 text-muted-foreground" 
              />
              <TextInput
                placeholder="Search products..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="bg-background border border-input rounded-lg pl-10 pr-4 py-3 text-foreground"
                placeholderTextColor="#6B7280"
              />
            </View>
          </View>

          {/* Products List */}
          {filteredProducts.length === 0 ? (
            <View className="flex-1 items-center justify-center p-8">
              <Ionicons name="search-outline" size={48} className="text-muted-foreground mb-3" />
              <Text className="text-lg font-medium text-foreground mb-2">No products found</Text>
              <Text className="text-muted-foreground text-center">
                {searchQuery ? 'Try a different search term' : 'No products available'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredProducts}
              renderItem={renderProductItem}
              keyExtractor={(item) => item.id.toString()}
              className="flex-1"
            />
          )}
        </View>
      </Modal>

      {/* Unit Type Modal */}
      <Modal
        visible={isUnitTypeModalOpen}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setIsUnitTypeModalOpen(false)}
      >
        <View className="flex-1 bg-background pt-4">
          <View className="flex-row justify-between items-center px-4 pb-4 border-b border-border">
            <Text className="text-xl font-bold text-foreground">Select Unit Type</Text>
            <TouchableOpacity onPress={() => setIsUnitTypeModalOpen(false)}>
              <Ionicons name="close" size={24} className="text-foreground" />
            </TouchableOpacity>
          </View>

          <View className="p-4">
            <Text className="text-lg text-foreground mb-2 text-center">
              How do you want to sell {selectedProduct?.name}?
            </Text>

            <View className="space-y-3 mt-6">
              <TouchableOpacity
                className={`border-2 rounded-lg p-6 items-center ${
                  selectedUnitType === 'single' 
                    ? 'border-accent bg-accent/10' 
                    : 'border-input'
                }`}
                onPress={() => setSelectedUnitType('single')}
              >
                <Text className={`text-xl font-bold mb-1 ${
                  selectedUnitType === 'single' ? 'text-accent' : 'text-foreground'
                }`}>
                  Single Unit
                </Text>
                <Text className="text-muted-foreground">
                  ${selectedProduct?.price?.toFixed(2)} each
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`border-2 rounded-lg p-6 items-center ${
                  selectedUnitType === 'pack' 
                    ? 'border-accent bg-accent/10' 
                    : 'border-input'
                }`}
                onPress={() => setSelectedUnitType('pack')}
              >
                <Text className={`text-xl font-bold mb-1 ${
                  selectedUnitType === 'pack' ? 'text-accent' : 'text-foreground'
                }`}>
                  Pack
                </Text>
                <Text className="text-muted-foreground text-center">
                  {selectedProduct?.packSize} units per pack
                </Text>
                <Text className="text-muted-foreground">
                  ${selectedProduct?.price?.toFixed(2)} per pack
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              className="bg-accent rounded-lg py-4 mt-8"
              onPress={handleUnitTypeConfirm}
            >
              <Text className="text-accent-foreground text-center font-bold text-lg">
                Add to Cart
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Receipt Modal */}
      <Modal
        visible={showReceipt}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowReceipt(false)}
      >
        {lastSale && (
          <View className="flex-1 bg-background pt-4">
            <View className="flex-row justify-between items-center px-4 pb-4 border-b border-border">
              <Text className="text-xl font-bold text-foreground">Sale Completed</Text>
              <TouchableOpacity onPress={() => setShowReceipt(false)}>
                <Ionicons name="close" size={24} className="text-foreground" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-4">
              <View className="bg-card rounded-lg p-4 mb-4">
                <Text className="text-lg font-bold text-foreground text-center mb-2">
                  RECEIPT #{lastSale.receiptNumber}
                </Text>
                <Text className="text-muted-foreground text-center">
                  {lastSale.date.toLocaleDateString()} • {lastSale.date.toLocaleTimeString()}
                </Text>
              </View>

              <View className="space-y-2 mb-4">
                {lastSale.items.map((item, index) => (
                  <View key={index} className="flex-row justify-between items-center py-2 border-b border-border">
                    <View className="flex-1">
                      <Text className="font-medium text-foreground">{item.productName}</Text>
                      <Text className="text-muted-foreground text-sm">
                        {item.quantity} × ${item.price.toFixed(2)} ({item.unitType})
                      </Text>
                    </View>
                    <Text className="font-bold text-foreground">
                      ${item.subtotal.toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>

              <View className="bg-primary rounded-lg p-4">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-primary-foreground">Subtotal</Text>
                  <Text className="text-primary-foreground">${lastSale.total.toFixed(2)}</Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-primary-foreground">Payment Method</Text>
                  <Text className="text-primary-foreground capitalize">{lastSale.paymentMethod}</Text>
                </View>
                <View className="flex-row justify-between border-t border-primary-foreground/20 pt-2">
                  <Text className="text-primary-foreground font-bold text-lg">Total</Text>
                  <Text className="text-primary-foreground font-bold text-lg">
                    ${lastSale.total.toFixed(2)}
                  </Text>
                </View>
              </View>

              <View className="items-center mt-6">
                <Text className="text-muted-foreground text-center">
                  Thank you for your purchase!
                </Text>
                <Text className="text-muted-foreground text-center text-sm mt-1">
                  Served by: {lastSale.cashier}
                </Text>
              </View>

              <TouchableOpacity
                className="bg-accent rounded-lg py-4 mt-6"
                onPress={() => setShowReceipt(false)}
              >
                <Text className="text-accent-foreground text-center font-bold text-lg">
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

export default CashierSell;