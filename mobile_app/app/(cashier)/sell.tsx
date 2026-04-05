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
  Platform,
  Share,
  ActivityIndicator,
} from 'react-native';
import { StyleSheet } from 'react-native';
import type { ListRenderItem } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addSale, updateProductStock } from '../../store/slices/userSlice';
import { fetchOperationalData } from '../../store/slices/userSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { PaymentMethod, Product, SaleItem, UnitType } from '../../store/types';
import { apiClient } from '../../services/api';
import {
  discoverPrinters,
  getDefaultPrinterId,
  getSavedPrinters,
  printWithDefaultPrinter,
  removePrinter,
  savePrinter,
  setDefaultPrinterId,
  type SavedPrinter,
} from '../../services/printer';

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

const getUnitPrice = (product: Product, unitType: UnitType): number => {
  if (unitType === 'pack') {
    return product.packPrice ?? product.price;
  }
  return product.singlePrice ?? product.price;
};

const CashierSell = () => {
  const dispatch = useAppDispatch();
  const { products } = useAppSelector((state) => state.user);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!user?.businessId) return;
    dispatch(fetchOperationalData(user.businessId));
  }, [dispatch, user?.businessId]);

  useEffect(() => {
    refreshSavedPrinters().catch(() => {
      // ignore silent startup errors
    });
  }, []);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isQuantityModalOpen, setIsQuantityModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [selectedUnitType, setSelectedUnitType] = useState<UnitType>('single');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodOption>('cash');
  const [showReceipt, setShowReceipt] = useState(false);

  const buildReceiptText = (receipt: ReceiptDetails) => {
    const lines = [
      `Receipt ${receipt.receiptNumber}`,
      `Cashier: ${receipt.cashier}`,
      `Date: ${receipt.date.toLocaleString()}`,
      `Payment: ${receipt.paymentMethod}`,
      '',
      'Items:'
    ];
    receipt.items.forEach((item) => {
      lines.push(`- ${item.productName}: ${item.quantity} ${item.unitType} - $${item.subtotal.toFixed(2)}`);
    });
    lines.push('', `Total: $${receipt.total.toFixed(2)}`);
    return lines.join('\n');
  };

  const refreshSavedPrinters = async () => {
    const [saved, defaultId] = await Promise.all([getSavedPrinters(), getDefaultPrinterId()]);
    setSavedPrinters(saved);
    setDefaultPrinterIdState(defaultId);
  };

  const handleOpenPrinterModal = async () => {
    try {
      setIsPrinterModalOpen(true);
      setIsLoadingPrinters(true);
      const discovered = await discoverPrinters();
      setDiscoveredPrinters(discovered);
      await refreshSavedPrinters();
    } catch (error) {
      console.error('Failed loading printers', error);
      Alert.alert('Printers', 'Unable to scan printers on this device.');
    } finally {
      setIsLoadingPrinters(false);
    }
  };

  const handleSavePrinter = async (printer: SavedPrinter) => {
    await savePrinter(printer);
    await refreshSavedPrinters();
  };

  const handleSetDefaultPrinter = async (printerId: string) => {
    await setDefaultPrinterId(printerId);
    setDefaultPrinterIdState(printerId);
  };

  const handleRemovePrinter = async (printerId: string) => {
    await removePrinter(printerId);
    await refreshSavedPrinters();
  };

  const printReceipt = async (receipt: ReceiptDetails) => {
    try {
      const text = buildReceiptText(receipt);
      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        printWindow.document.write(`<pre style="font-family: monospace; white-space: pre-wrap;">${text}</pre>`);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        return;
      }

      const printedDirectly = await printWithDefaultPrinter(text);
      if (printedDirectly) {
        Alert.alert('Printed', 'Receipt sent to default printer.');
        return;
      }

      await Share.share({ title: receipt.receiptNumber, message: text });
    } catch (error) {
      console.error('Print/share failed', error);
      Alert.alert('Print Error', 'Unable to open printer/share dialog on this device.');
    }
  };
  const [lastSale, setLastSale] = useState<ReceiptDetails | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);

  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
  const [savedPrinters, setSavedPrinters] = useState<SavedPrinter[]>([]);
  const [discoveredPrinters, setDiscoveredPrinters] = useState<SavedPrinter[]>([]);
  const [defaultPrinterId, setDefaultPrinterIdState] = useState<string | null>(null);
  const [isLoadingPrinters, setIsLoadingPrinters] = useState(false);

  // Payment method configuration
  const paymentMethodConfig: PaymentMethodConfig[] = useMemo(
    () => [
      { value: 'cash', label: 'Cash', icon: 'cash', color: '#FB923C' },
      { value: 'card', label: 'Card', icon: 'card', color: '#FB923C' },
      { value: 'mobile', label: 'Mobile', icon: 'phone-portrait', color: '#FB923C' },
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
      product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.barcode ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [availableProducts, searchQuery]
  );

  // Selected product calculations
  const selectedProductPrice = selectedProduct
    ? getUnitPrice(selectedProduct, selectedUnitType).toFixed(2)
    : '0.00';
  const quantityValue = Number.parseInt(quantity, 10) || 1;
  const selectedProductSubtotal = selectedProduct
    ? (getUnitPrice(selectedProduct, selectedUnitType) * quantityValue).toFixed(2)
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
    const unitPrice = getUnitPrice(selectedProduct, selectedUnitType);
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
                price: unitPrice,
                subtotal: unitPrice * qty,
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
                  price: unitPrice,
                  subtotal: unitPrice * newQuantity 
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
          price: unitPrice,
          subtotal: unitPrice * qty,
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


  const handleScanPress = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Camera Permission Needed', 'Allow camera access to scan product barcodes.');
        return;
      }
    }

    setScanned(false);
    setScannerOpen(true);
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setScannerOpen(false);

    const localProduct = products.find((product) => product.barcode === data || product.sku === data);
    if (localProduct) {
      handleProductSelect(localProduct);
      return;
    }

    try {
      const apiProduct = await apiClient.lookupProductByBarcode(data, user?.businessId);
      if (apiProduct) {
        handleProductSelect(apiProduct);
      } else {
        Alert.alert('Not Found', `No product found for barcode: ${data}`);
      }
    } catch (error) {
      console.error('Barcode lookup failed', error);
      Alert.alert('Lookup Failed', 'Could not lookup barcode on backend.');
    }
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
      
      const receiptSuffix = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const paymentMethodLabel = paymentMethodConfig.find(m => m.value === paymentMethod)?.label || 'Cash';

      // Dispatch sales and update stock
      dispatch(
        addSale({
          items: saleItems,
          total,
          cashier: user.name,
          paymentMethod: paymentMethodLabel as PaymentMethod,
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

      if (!user.businessId) {
        console.warn('Backend sale sync skipped: missing business id');
      } else {
        try {
          await apiClient.createSale({
            cashier: user.name,
            total,
            paymentMethod: paymentMethodLabel as PaymentMethod,
            invoiceNumber: `INV-${receiptSuffix}`,
            items: saleItems,
            businessId: user.businessId,
          });
        } catch (apiError) {
          console.warn('Backend sale sync failed', apiError);
        }
      }

      const completedSale: ReceiptDetails = {
        receiptNumber: `INV-${receiptSuffix}`,
        items: cart,
        total,
        date: new Date(),
        paymentMethod: paymentMethodLabel as PaymentMethod,
        cashier: user.name,
      };
      setLastSale(completedSale);
      setShowReceipt(true);
      setCart([]);
      await printReceipt(completedSale);
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
            style={styles.addItemButton}
            onPress={() => setIsProductModalOpen(true)}
          >
            <Ionicons name="add-circle" size={20} color="#FB923C" />
            <Text style={styles.addItemButtonText}>Add Item</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addItemButton}
            onPress={handleScanPress}
          >
            <Ionicons name="barcode" size={20} color="#FB923C" />
            <Text style={styles.addItemButtonText}>Scan Barcode</Text>
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

      <View style={styles.bottomCheckoutBar}>
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
      </View>


      <Modal
        visible={scannerOpen}
        animationType="slide"
        onRequestClose={() => setScannerOpen(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Scan Barcode</Text>
            <TouchableOpacity onPress={() => setScannerOpen(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1, borderRadius: 12, overflow: 'hidden', margin: 16 }}>
            <CameraView
              style={{ flex: 1 }}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'] }}
              onBarcodeScanned={handleBarcodeScanned}
            />
          </View>
          <Text style={{ textAlign: 'center', color: '#6B7280', marginBottom: 16 }}>
            Align the barcode inside the camera frame.
          </Text>
        </SafeAreaView>
      </Modal>

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
                style={styles.printReceiptButton}
                onPress={() => printReceipt(lastSale)}
              >
                <Text style={styles.printReceiptButtonText}>
                  Print Receipt
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.managePrintersButton}
                onPress={handleOpenPrinterModal}
              >
                <Text style={styles.managePrintersButtonText}>
                  Manage Printers
                </Text>
              </TouchableOpacity>

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

      <Modal
        visible={isPrinterModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsPrinterModalOpen(false)}
      >
        <View style={styles.printerBackdrop}>
          <View style={styles.printerModal}>
            <View style={styles.printerHeader}>
              <Text style={styles.printerTitle}>Saved Printers</Text>
              <TouchableOpacity onPress={() => setIsPrinterModalOpen(false)}>
                <Ionicons name="close" size={22} color="#0f172a" />
              </TouchableOpacity>
            </View>

            {isLoadingPrinters ? (
              <View style={styles.printerLoading}>
                <ActivityIndicator color="#f97316" />
                <Text style={styles.printerHint}>Scanning for printers...</Text>
              </View>
            ) : (
              <ScrollView style={styles.printerList}>
                {savedPrinters.length === 0 && (
                  <Text style={styles.printerHint}>No saved printers yet.</Text>
                )}
                {savedPrinters.map((printer) => (
                  <View key={`saved-${printer.id}`} style={styles.printerCard}>
                    <View style={styles.printerInfo}>
                      <Text style={styles.printerName}>{printer.name}</Text>
                      <Text style={styles.printerMeta}>{printer.type.toUpperCase()} • {printer.id}</Text>
                    </View>
                    <View style={styles.printerActions}>
                      <TouchableOpacity onPress={() => handleSetDefaultPrinter(printer.id)}>
                        <Text style={styles.setDefaultText}>
                          {defaultPrinterId === printer.id ? 'Default' : 'Set Default'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleRemovePrinter(printer.id)}>
                        <Text style={styles.removePrinterText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                <Text style={styles.printerSectionTitle}>Discovered Printers</Text>
                {discoveredPrinters.length === 0 && (
                  <Text style={styles.printerHint}>No printers discovered.</Text>
                )}
                {discoveredPrinters.map((printer) => (
                  <View key={`scan-${printer.id}`} style={styles.printerCard}>
                    <View style={styles.printerInfo}>
                      <Text style={styles.printerName}>{printer.name}</Text>
                      <Text style={styles.printerMeta}>{printer.type.toUpperCase()} • {printer.id}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleSavePrinter(printer)}>
                      <Text style={styles.savePrinterText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity style={styles.scanAgainButton} onPress={handleOpenPrinterModal}>
              <Text style={styles.scanAgainButtonText}>Scan Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#0F172A',
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
    gap: 8,
  },
  checkoutButton: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: '#FFF7ED',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FB923C',
  },
  addItemButtonText: {
    color: '#FB923C',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Main Content
  mainContent: {
    flex: 1,
  },
  bottomCheckoutBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
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
  printReceiptButton: {
    marginTop: 12,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  printReceiptButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  managePrintersButton: {
    marginTop: 12,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  managePrintersButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  printerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  printerModal: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    maxHeight: '85%',
    padding: 16,
  },
  printerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  printerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  printerLoading: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  printerList: {
    maxHeight: 420,
  },
  printerHint: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 10,
  },
  printerSectionTitle: {
    marginTop: 12,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  printerCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  printerInfo: {
    flex: 1,
  },
  printerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  printerMeta: {
    marginTop: 2,
    fontSize: 12,
    color: '#64748b',
  },
  printerActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  setDefaultText: {
    color: '#f97316',
    fontWeight: '700',
    fontSize: 12,
  },
  removePrinterText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 12,
  },
  savePrinterText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 12,
  },
  scanAgainButton: {
    marginTop: 12,
    backgroundColor: '#f97316',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 12,
  },
  scanAgainButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});

export default CashierSell;
