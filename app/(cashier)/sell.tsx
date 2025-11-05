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
  const [isQuantityModalOpen, setIsQuantityModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState('1');
  const [selectedUnitType, setSelectedUnitType] = useState('single');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCartItem, setEditingCartItem] = useState(null);

  useEffect(() => {
    // Filter products with stock > 0
    const inStockProducts = products.filter(product => product.stock > 0);
    setAvailableProducts(inStockProducts);
  }, [products]);

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setQuantity('1');
    setSelectedUnitType('single');
    setEditingCartItem(null);
    setIsQuantityModalOpen(true);
    setIsProductModalOpen(false);
  };

  const handleQuantityConfirm = () => {
    if (!selectedProduct) return;

    if (!quantity || parseInt(quantity) <= 0) {
      Alert.alert('Error', 'Please enter valid quantity');
      return;
    }

    const qty = parseInt(quantity);
    let price = selectedProduct.price;
    let requiredStock = qty;

    // Adjust for pack sales
    if (selectedUnitType === 'pack') {
      requiredStock = qty * (selectedProduct.packSize || 1);
    }

    if (requiredStock > selectedProduct.stock) {
      Alert.alert('Error', `Only ${selectedProduct.stock} units available in stock`);
      return;
    }

    if (editingCartItem) {
      // Update existing cart item
      setCart(cart.map(item => 
        item.productId === editingCartItem.productId
          ? {
              ...item,
              quantity: qty,
              unitType: selectedUnitType,
              productName: `${selectedProduct.name}${selectedUnitType === 'pack' && selectedProduct.packSize ? ` (Pack of ${selectedProduct.packSize})` : ''}`,
              subtotal: price * qty,
              packSize: selectedUnitType === 'pack' ? selectedProduct.packSize : 1
            }
          : item
      ));
    } else {
      // Add new item to cart
      const cartKey = `${selectedProduct.id}_${selectedUnitType}`;
      const existingItem = cart.find(item => item.productId === cartKey);
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + qty;
        const newRequiredStock = selectedUnitType === 'pack' ? newQuantity * (selectedProduct.packSize || 1) : newQuantity;
        
        if (newRequiredStock > selectedProduct.stock) {
          Alert.alert('Error', `Cannot add more. Only ${selectedProduct.stock} units available`);
          return;
        }
        
        setCart(cart.map(item =>
          item.productId === cartKey
            ? { ...item, quantity: newQuantity, subtotal: price * newQuantity }
            : item
        ));
      } else {
        const packInfo = selectedUnitType === 'pack' && selectedProduct.packSize ? ` (Pack of ${selectedProduct.packSize})` : '';
        const newItem = {
          productId: cartKey,
          productName: `${selectedProduct.name}${packInfo}`,
          quantity: qty,
          price,
          subtotal: price * qty,
          unitType: selectedUnitType,
          originalProductId: selectedProduct.id,
          packSize: selectedUnitType === 'pack' ? selectedProduct.packSize : 1
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

  const handleCartItemPress = (item) => {
    const product = products.find(p => p.id === item.originalProductId);
    if (product) {
      setSelectedProduct(product);
      setQuantity(item.quantity.toString());
      setSelectedUnitType(item.unitType);
      setEditingCartItem(item);
      setIsQuantityModalOpen(true);
    }
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
    </TouchableOpacity>
  );

  const renderCartItem = ({ item }) => (
    <TouchableOpacity 
      className="bg-secondary rounded-lg p-3 mb-2"
      onPress={() => handleCartItemPress(item)}
    >
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-1">
          <Text className="font-semibold text-foreground text-sm">{item.productName}</Text>
          <Text className="text-muted-foreground text-xs">
            ${item.price.toFixed(2)} each • {item.unitType}{" × "}
            {item.quantity}
        
          </Text>
        </View>
        
        <View className="bg-accent rounded-lg px-3 py-1">
          <Text className="font-bold text-accent-foreground text-base">
            ${item.subtotal.toFixed(2)}
          </Text>
        </View>
       <View>
         
          <TouchableOpacity 
          onPress={() => removeFromCart(item.productId)}
          className="p-1"
        >
          <Ionicons name="trash-outline" size={20} className="text-destructive" />
        </TouchableOpacity>
         
       </View>
      </View>
      

    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="bg-card p-4 border-b border-border">
        <View className="flex-row justify-between items-center">
          <View className="text-center w-[45%] p-4 bg-accent rounded-md">
            <Text className="text-xs text-accent-foreground text-center">Total Items</Text>
            <Text className="text-2xl font-bold text-center text-accent-foreground">{totalItems}</Text>
          </View>
          
          <View className="w-[45%] p-4 bg-primary rounded-md">
            <Text className="text-xs text-primary-foreground text-center">Total Amount</Text>
            <Text className="text-2xl font-bold text-primary-foreground w-full flex-row text-center items-center">
              {"$ "}{total.toFixed(2)}
            </Text>
          </View>
        </View>
        <View className="flex flex-row w-full justify-between gap-4 mt-4 items-center">
          
         <TouchableOpacity
          onPress={handleCheckout}
          className={`rounded-lg py-2 px-6 items-center w-[48%] ${
            cart.length === 0 ? 'bg-gray-400' : 'bg-green-600'
          }`}
          disabled={cart.length === 0}
        >
          <Text className="text-white text-lg font-bold">
            Check Out
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="border-2 border-dashed border-input rounded-lg py-2 px-6 items-center w-[48%]"
          onPress={() => setIsProductModalOpen(true)}
        >
          <Text className="text-lg font-medium text-foreground">{"+ "}Add Item</Text>
        </TouchableOpacity>
        </View>
        
                  {/* Payment Method Section */}
          <View className="bg-card rounded-lg mt-4 mx-4">
            <Text className="text-sm font-medium text-foreground mb-2">Payment Method</Text>
            <View className="border border-input rounded-lg bg-background">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row px-2 py-1 gap-5 justify-between items-center">
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

      {/* Main Content */}
      <ScrollView className="flex-1">
        <View className="p-4 space-y-4">


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

      {/* Quantity & Unit Type Modal */}
      <Modal
        visible={isQuantityModalOpen}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setIsQuantityModalOpen(false)}
      >
        <View className="flex-1 bg-background pt-4">
          <View className="flex-row justify-between items-center px-4 pb-4 border-b border-border">
            <Text className="text-xl font-bold text-foreground">
              {editingCartItem ? 'Edit Item' : 'Add to Cart'}
            </Text>
            <TouchableOpacity onPress={() => setIsQuantityModalOpen(false)}>
              <Ionicons name="close" size={24} className="text-foreground" />
            </TouchableOpacity>
          </View>

          <View className="p-4">
            <Text className="text-lg text-foreground mb-2 text-center">
              {selectedProduct?.name}
            </Text>
            <Text className="text-muted-foreground text-center mb-6">
              ${selectedProduct?.price?.toFixed(2)} each
            </Text>

            {/* Unit Type Selection */}
            <Text className="text-sm font-medium text-foreground mb-3">Unit Type</Text>
            <View className="flex-row space-x-3 mb-6">
              <TouchableOpacity
                className={`flex-1 border-2 rounded-lg p-4 items-center ${
                  selectedUnitType === 'single' 
                    ? 'border-accent bg-accent/10' 
                    : 'border-input'
                }`}
                onPress={() => setSelectedUnitType('single')}
              >
                <Text className={`font-bold mb-1 ${
                  selectedUnitType === 'single' ? 'text-accent' : 'text-foreground'
                }`}>
                  Single Unit
                </Text>
                <Text className="text-muted-foreground text-xs text-center">
                  ${selectedProduct?.price?.toFixed(2)} each
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
                <Text className={`font-bold mb-1 ${
                  selectedUnitType === 'pack' ? 'text-accent' : 'text-foreground'
                }`}>
                  Pack
                </Text>
                <Text className="text-muted-foreground text-xs text-center">
                  {selectedProduct?.packSize} units • ${selectedProduct?.price?.toFixed(2)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quantity Input */}
            <Text className="text-sm font-medium text-foreground mb-3">Quantity</Text>
            <View className="flex-row items-center justify-center space-x-4 mb-6">
              <TouchableOpacity
                onPress={() => setQuantity(Math.max(1, parseInt(quantity || 1) - 1).toString())}
                className="w-12 h-12 bg-border rounded-full items-center justify-center"
              >
                <Ionicons name="remove" size={20} className="text-foreground" />
              </TouchableOpacity>
              
              <TextInput
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                className="bg-background border border-input rounded-lg px-4 py-3 text-foreground text-center text-xl font-bold w-20"
                placeholderTextColor="#6B7280"
              />
              
              <TouchableOpacity
                onPress={() => setQuantity((parseInt(quantity || 1) + 1).toString())}
                className="w-12 h-12 bg-border rounded-full items-center justify-center"
              >
                <Ionicons name="add" size={20} className="text-foreground" />
              </TouchableOpacity>
            </View>

            {/* Summary */}
            <View className="bg-secondary rounded-lg p-4 mb-6">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-foreground">Unit Price:</Text>
                <Text className="text-foreground">${selectedProduct?.price?.toFixed(2)}</Text>
              </View>
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-foreground">Quantity:</Text>
                <Text className="text-foreground">{quantity} {selectedUnitType === 'pack' ? 'packs' : 'units'}</Text>
              </View>
              <View className="flex-row justify-between items-center border-t border-border pt-2">
                <Text className="text-foreground font-bold">Subtotal:</Text>
                <Text className="text-foreground font-bold">
                  ${(selectedProduct?.price * parseInt(quantity || 1)).toFixed(2)}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              className="bg-accent rounded-lg py-4"
              onPress={handleQuantityConfirm}
            >
              <Text className="text-accent-foreground text-center font-bold text-lg">
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
          <View className="flex-1 bg-background pt-4">
            <View className="flex-row justify-between items-center px-4 pb-4 border-b border-border">
              <Text className="text-xl font-bold text-foreground">Checkout Receipt</Text>
              <TouchableOpacity onPress={() => setShowReceipt(false)}>
                <Ionicons name="close" size={24} className="text-foreground" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-4">
              {/* Business Header */}
              <View className="items-center mb-6">
                <Text className="text-2xl font-bold text-foreground mb-1">KC Investments</Text>
                <Text className="text-muted-foreground text-center mb-1">
                  123 Business Street, City
                </Text>
                <Text className="text-muted-foreground text-center">
                  Contact: +1 (555) 123-4567
                </Text>
              </View>

              {/* Receipt Info */}
              <View className="bg-card rounded-lg p-4 mb-4">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-muted-foreground">Receipt #:</Text>
                  <Text className="font-bold text-foreground">{lastSale.receiptNumber}</Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-muted-foreground">Cashier:</Text>
                  <Text className="font-bold text-foreground">{lastSale.cashier}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">Date & Time:</Text>
                  <Text className="font-bold text-foreground text-right">
                    {lastSale.date.toLocaleDateString()}\n{lastSale.date.toLocaleTimeString()}
                  </Text>
                </View>
              </View>

              {/* Items List */}
              <View className="mb-4">
                <View className="flex-row justify-between items-center pb-2 border-b border-border mb-2">
                  <Text className="font-bold text-foreground flex-2">Item</Text>
                  <Text className="font-bold text-foreground text-center flex-1">Qty/Type</Text>
                  <Text className="font-bold text-foreground text-right flex-1">Amount</Text>
                </View>
                
                {lastSale.items.map((item, index) => (
                  <View key={index} className="flex-row justify-between items-center py-2 border-b border-border/50">
                    <View className="flex-2">
                      <Text className="font-medium text-foreground text-sm">{item.productName}</Text>
                    </View>
                    <View className="flex-1 items-center">
                      <Text className="text-muted-foreground text-sm">
                        {item.quantity} {item.unitType}
                      </Text>
                    </View>
                    <Text className="font-bold text-foreground text-right flex-1">
                      ${item.subtotal.toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Total Section */}
              <View className="bg-primary rounded-lg p-4 mb-6">
                <View className="flex-row justify-between items-center">
                  <Text className="text-primary-foreground text-lg font-bold">Total Amount:</Text>
                  <Text className="text-primary-foreground text-lg font-bold">
                    ${lastSale.total.toFixed(2)}
                  </Text>
                </View>
                <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-primary-foreground/20">
                  <Text className="text-primary-foreground">Payment Method:</Text>
                  <Text className="text-primary-foreground capitalize">{lastSale.paymentMethod}</Text>
                </View>
              </View>

              {/* Thank You Message */}
              <View className="items-center mt-4">
                <Text className="text-muted-foreground text-center text-lg font-medium mb-2">
                  Thank you for your purchase!
                </Text>
                <Text className="text-muted-foreground text-center text-sm">
                  We appreciate your business and look forward to serving you again.
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