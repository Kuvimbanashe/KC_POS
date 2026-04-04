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
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { StyleSheet } from 'react-native';
import type { ListRenderItem } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { addSale, updateProductStock } from '../../store/slices/userSlice';
import { fetchOperationalData } from '../../store/slices/userSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { PaymentMethod, Product, SaleItem, UnitType } from '../../store/types';
import { apiClient } from '../../services/api';
import {
  getPrinterPreferenceScope,
  getPrinterPreferences,
} from '../../services/printerPreferences';
import { isSilentPrintFailure, printReceiptDocument } from '../../services/receiptPrinter';
import {
  ADMIN_BUTTON_CONTENT,
  ADMIN_BUTTON_TEXT,
  ADMIN_COLORS,
  ADMIN_DETAIL_LABEL,
  ADMIN_DETAIL_ROW,
  ADMIN_DETAIL_VALUE,
  ADMIN_INPUT_FIELD,
  ADMIN_INPUT_SURFACE,
  ADMIN_LIST_CARD,
  ADMIN_MODAL_HEADER,
  ADMIN_MODAL_SECTION,
  ADMIN_PRIMARY_BUTTON,
  ADMIN_PRIMARY_BUTTON_DISABLED,
  ADMIN_SECONDARY_BUTTON,
  ADMIN_SECONDARY_BUTTON_TEXT,
  ADMIN_SECTION_CARD,
  ADMIN_SECTION_SUBTITLE,
  ADMIN_SECTION_TITLE,
  ADMIN_STAT_CARD,
} from '../../theme/adminUi';

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

const formatBusinessContactDetails = (store: {
  phone?: string;
  email?: string;
}) => {
  return [store.phone, store.email].filter((value) => Boolean(value && value.trim())).join('  •  ');
};

const getUnitPrice = (product: Product, unitType: UnitType): number => {
  if (unitType === 'pack') {
    return product.packPrice ?? product.price;
  }
  return product.singlePrice ?? product.price;
};

const getRequiredStock = (quantity: number, unitType: UnitType, packSize?: number): number =>
  unitType === 'pack' ? quantity * (packSize ?? 1) : quantity;

const mergeReferenceProducts = (referenceProducts: Product[], extraProduct?: Product | null) => {
  if (!extraProduct || referenceProducts.some((product) => product.id === extraProduct.id)) {
    return referenceProducts;
  }
  return [...referenceProducts, extraProduct];
};

const buildCartItem = (product: Product, quantity: number, unitType: UnitType): CartItem => {
  const unitPrice = getUnitPrice(product, unitType);
  const packInfo = unitType === 'pack' && product.packSize ? ` (Pack of ${product.packSize})` : '';

  return {
    productId: `${product.id}_${unitType}`,
    productName: `${product.name}${packInfo}`,
    quantity,
    price: unitPrice,
    subtotal: unitPrice * quantity,
    unitType,
    originalProductId: product.id,
    packSize: unitType === 'pack' ? (product.packSize ?? 1) : 1,
  };
};

const validateCartStock = (cartItems: CartItem[], referenceProducts: Product[]) => {
  const productsById = new Map(referenceProducts.map((product) => [product.id, product]));
  const requiredByProduct = new Map<number, { name: string; required: number; available: number }>();

  for (const item of cartItems) {
    const product = productsById.get(item.originalProductId);
    if (!product) {
      return {
        isValid: false,
        message: `${item.productName} is no longer available. Refresh products and try again.`,
      };
    }

    const requiredStock = getRequiredStock(item.quantity, item.unitType, item.packSize ?? product.packSize);
    const current = requiredByProduct.get(product.id);

    requiredByProduct.set(product.id, {
      name: product.name,
      required: (current?.required ?? 0) + requiredStock,
      available: product.stock,
    });
  }

  for (const { name, required, available } of requiredByProduct.values()) {
    if (required > available) {
      return {
        isValid: false,
        message: `${name} only has ${available} units available, but your cart needs ${required}.`,
      };
    }
  }

  return { isValid: true };
};

const CashierSell = () => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { products, currentStore } = useAppSelector((state) => state.user);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!user?.businessId) return;
    dispatch(fetchOperationalData(user.businessId));
  }, [dispatch, user?.businessId]);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isQuantityModalOpen, setIsQuantityModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [selectedUnitType, setSelectedUnitType] = useState<UnitType>('single');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodOption>('cash');
  const [showReceipt, setShowReceipt] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isPrintingReceipt, setIsPrintingReceipt] = useState(false);
  const printerScope = getPrinterPreferenceScope(user?.businessId, user?.id);
  const businessName = currentStore?.name || user?.businessName || 'KC POS';
  const businessAddress = currentStore?.address?.trim() || '';
  const businessContactDetails = formatBusinessContactDetails({
    phone: currentStore?.phone,
    email: currentStore?.email,
  });

  const printReceipt = async (
    receipt: ReceiptDetails,
    preferences?: Awaited<ReturnType<typeof getPrinterPreferences>>,
  ) => {
    setIsPrintingReceipt(true);
    try {
      await printReceiptDocument(
        {
          receiptNumber: receipt.receiptNumber,
          date: receipt.date,
          cashier: receipt.cashier,
          paymentMethod: receipt.paymentMethod,
          total: receipt.total,
          items: receipt.items.map((item) => ({
            name: item.productName,
            quantity: item.quantity,
            amount: item.subtotal,
            unitType: item.unitType,
            packSize: item.packSize,
          })),
          business: {
            name: currentStore?.name || user?.businessName || 'KC POS',
            address: currentStore?.address,
            phone: currentStore?.phone,
            email: currentStore?.email,
          },
        },
        {
          preferenceScope: printerScope,
          preferences,
        },
      );
    } catch (error) {
      if (!isSilentPrintFailure(error)) {
        const message = error instanceof Error ? error.message : 'Failed to print receipt';
        Alert.alert('Printing Error', message);
      }
    } finally {
      setIsPrintingReceipt(false);
    }
  };
  const [lastSale, setLastSale] = useState<ReceiptDetails | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);

  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

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

  const handleRefresh = async () => {
    if (!user?.businessId) return;
    setIsRefreshing(true);
    try {
      await dispatch(fetchOperationalData(user.businessId));
    } finally {
      setIsRefreshing(false);
    }
  };

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
    const nextItem = buildCartItem(selectedProduct, qty, selectedUnitType);
    const referenceProducts = mergeReferenceProducts(products, selectedProduct);

    if (editingCartItem) {
      const cartWithoutEditingItem = cart.filter((item) => item.productId !== editingCartItem.productId);
      const existingTargetItem = cartWithoutEditingItem.find((item) => item.productId === nextItem.productId);

      const nextCart = existingTargetItem
        ? cartWithoutEditingItem.map((item) =>
            item.productId === nextItem.productId
              ? {
                  ...nextItem,
                  quantity: existingTargetItem.quantity + nextItem.quantity,
                  subtotal: nextItem.price * (existingTargetItem.quantity + nextItem.quantity),
                }
              : item,
          )
        : [...cartWithoutEditingItem, nextItem];

      const validation = validateCartStock(nextCart, referenceProducts);
      if (!validation.isValid) {
        Alert.alert('Insufficient Stock', validation.message);
        return;
      }

      setCart(nextCart);
    } else {
      const existingItem = cart.find((item) => item.productId === nextItem.productId);
      const nextCart = existingItem
        ? cart.map((item) =>
            item.productId === nextItem.productId
              ? {
                  ...nextItem,
                  quantity: existingItem.quantity + nextItem.quantity,
                  subtotal: nextItem.price * (existingItem.quantity + nextItem.quantity),
                }
              : item,
          )
        : [...cart, nextItem];

      const validation = validateCartStock(nextCart, referenceProducts);
      if (!validation.isValid) {
        Alert.alert('Insufficient Stock', validation.message);
        return;
      }

      setCart(nextCart);
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

    setIsCheckingOut(true);
    try {
      let referenceProducts = products;
      if (user.businessId) {
        try {
          const latestProducts = await apiClient.fetchProducts(user.businessId);
          referenceProducts = latestProducts;
        } catch (refreshError) {
          console.warn('Could not refresh products before checkout', refreshError);
        }
      }

      const validation = validateCartStock(cart, referenceProducts);
      if (!validation.isValid) {
        if (user.businessId) {
          await dispatch(fetchOperationalData(user.businessId));
        }
        Alert.alert('Insufficient Stock', validation.message);
        return;
      }
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

      if (!user.businessId) {
        dispatch(
          addSale({
            items: saleItems,
            total,
            cashier: user.name,
            paymentMethod: paymentMethodLabel as PaymentMethod,
          }),
        );

        cart.forEach((item) => {
          const stockReduction = getRequiredStock(item.quantity, item.unitType, item.packSize);
          dispatch(
            updateProductStock({
              productId: item.originalProductId,
              quantity: stockReduction,
            }),
          );
        });
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
          await dispatch(fetchOperationalData(user.businessId));
        } catch (apiError) {
          console.warn('Backend sale sync failed', apiError);
          await dispatch(fetchOperationalData(user.businessId));

          const errorMessage = apiError instanceof Error ? apiError.message : 'Failed to save sale to backend.';
          if (errorMessage.includes('Insufficient stock')) {
            Alert.alert(
              'Stock Changed',
              'Stock changed on the backend before checkout completed. Products were refreshed. Please review the cart and try again.',
            );
          } else {
            Alert.alert('Checkout Failed', 'Could not save the sale to the backend. Please try again.');
          }
          return;
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
      const printerPreferences = await getPrinterPreferences(printerScope);
      if (printerPreferences.autoPrintReceipts) {
        await printReceipt(completedSale, printerPreferences);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      Alert.alert('Checkout Failed', 'An error occurred during checkout');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const updateQuantity = (cartKey: string, change: number) => {
    const item = cart.find((i) => i.productId === cartKey);
    if (!item) return;

    const product = products.find((p) => p.id === item.originalProductId);
    if (!product) return;

    const newQuantity = item.quantity + change;
    if (newQuantity <= 0) {
      removeFromCart(cartKey);
      return;
    }

    const nextCart = cart.map((cartItem) => {
      if (cartItem.productId === cartKey) {
        return {
          ...cartItem,
          quantity: newQuantity,
          subtotal: cartItem.price * newQuantity,
        };
      }
      return cartItem;
    });

    const validation = validateCartStock(nextCart, mergeReferenceProducts(products, product));
    if (!validation.isValid) {
      Alert.alert('Insufficient Stock', validation.message);
      return;
    }

    setCart(nextCart);
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
    <View style={styles.container}>
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
      <ScrollView
        style={styles.mainContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#f97316" />
        }
      >
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
            (cart.length === 0 || isCheckingOut) && styles.checkoutButtonDisabled,
          ]}
          disabled={cart.length === 0 || isCheckingOut}
        >
          <View style={styles.buttonContent}>
            {isCheckingOut ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            )}
            <Text style={styles.checkoutButtonText}>{isCheckingOut ? 'Processing...' : 'Checkout'}</Text>
          </View>
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
            <View style={styles.productHeaderCard}>
              <View style={styles.detailLine}>
                <Text style={styles.detailLineLabel}>Product</Text>
                <Text style={styles.detailLineValue}>{selectedProduct?.name}</Text>
              </View>
              <View style={[styles.detailLine, styles.detailLineLast]}>
                <Text style={styles.detailLineLabel}>Unit Price</Text>
                <Text style={[styles.detailLineValue, styles.detailLineAccent]}>${selectedProductPrice} each</Text>
              </View>
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
                <Text style={styles.summaryLabel}>Unit Price</Text>
                <Text style={styles.summaryValue}>${selectedProductPrice}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Quantity</Text>
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
          <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Receipt</Text>
              <TouchableOpacity 
                onPress={() => setShowReceipt(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.receiptScroll}
              contentContainerStyle={[
                styles.receiptContent,
                { paddingBottom: 24 + insets.bottom },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {/* Business Info */}
              <View style={styles.businessHeader}>
                <Text style={styles.businessName}>{businessName}</Text>
                {businessAddress ? (
                  <Text style={styles.businessAddress}>{businessAddress}</Text>
                ) : null}
                {businessContactDetails ? (
                  <Text style={styles.businessContact}>{businessContactDetails}</Text>
                ) : null}
              </View>

              {/* Receipt Info */}
              <View style={styles.receiptInfo}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Receipt #</Text>
                  <Text style={styles.receiptValue}>{lastSale.receiptNumber}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Cashier</Text>
                  <Text style={styles.receiptValue}>{lastSale.cashier}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Date & Time</Text>
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
                  <Text style={styles.receiptTotalLabel}>Total Amount</Text>
                  <Text style={styles.receiptTotalValue}>
                    ${lastSale.total.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.receiptTotalLabel}>Payment Method</Text>
                  <Text style={styles.receiptTotalValue}>{lastSale.paymentMethod}</Text>
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
                style={[styles.printReceiptButton, isPrintingReceipt && styles.printReceiptButtonDisabled]}
                onPress={() => printReceipt(lastSale)}
                disabled={isPrintingReceipt}
              >
                <View style={styles.buttonContent}>
                  {isPrintingReceipt && <ActivityIndicator size="small" color="#FFFFFF" />}
                  <Text style={styles.printReceiptButtonText}>
                    {isPrintingReceipt ? 'Printing...' : 'Print Receipt'}
                  </Text>
                </View>
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
    </View>
  );
};

const styles = StyleSheet.create({
  // Main Container
  container: {
    flex: 1,
    backgroundColor: ADMIN_COLORS.background,
  },

  // Header
  header: {
    ...ADMIN_SECTION_CARD,
    margin: 16,
    marginBottom: 0,
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  statCard: {
    ...ADMIN_STAT_CARD,
    flex: 1,
    padding: 16,
  },
  totalCard: {
    backgroundColor: ADMIN_COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: ADMIN_COLORS.secondaryText,
    marginBottom: 4,
  },
  totalLabel: {
    color: '#D1D5DB',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: ADMIN_COLORS.text,
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
    ...ADMIN_SECTION_TITLE,
    fontSize: 14,
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
    borderColor: ADMIN_COLORS.border,
    backgroundColor: ADMIN_COLORS.surface,
  },
  paymentOptionActive: {
    backgroundColor: ADMIN_COLORS.primary,
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
    ...ADMIN_PRIMARY_BUTTON,
    width: '100%',
  },
  checkoutButtonDisabled: {
    ...ADMIN_PRIMARY_BUTTON_DISABLED,
  },
  checkoutButtonText: {
    ...ADMIN_BUTTON_TEXT,
  },
  addItemButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: ADMIN_COLORS.surfaceTint,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ADMIN_COLORS.accent,
  },
  addItemButtonText: {
    color: ADMIN_COLORS.accent,
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
    backgroundColor: ADMIN_COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: ADMIN_COLORS.border,
  },
  cartSection: {
    ...ADMIN_SECTION_CARD,
    margin: 16,
    padding: 16,
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
    ...ADMIN_SECTION_TITLE,
    fontSize: 18,
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
    ...ADMIN_LIST_CARD,
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
    color: ADMIN_COLORS.text,
    marginBottom: 4,
  },
  cartItemDetails: {
    fontSize: 12,
    color: ADMIN_COLORS.secondaryText,
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartItemSubtotal: {
    fontSize: 16,
    fontWeight: '700',
    color: ADMIN_COLORS.success,
    marginRight: 12,
  },
  removeButton: {
    padding: 6,
  },

  // Modals
  modalContainer: {
    flex: 1,
    backgroundColor: ADMIN_COLORS.background,
  },
  modalHeader: {
    ...ADMIN_MODAL_HEADER,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ADMIN_COLORS.text,
  },
  closeButton: {
    padding: 4,
  },

  // Product Search Modal
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: ADMIN_COLORS.border,
  },
  searchBar: {
    ...ADMIN_INPUT_SURFACE,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: ADMIN_COLORS.text,
    marginLeft: 8,
  },
  productList: {
    flex: 1,
  },
  productItem: {
    ...ADMIN_LIST_CARD,
    marginHorizontal: 16,
    marginBottom: 10,
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
    color: ADMIN_COLORS.text,
    flex: 1,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: ADMIN_COLORS.success,
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productCategory: {
    fontSize: 14,
    color: ADMIN_COLORS.secondaryText,
  },
  productStock: {
    fontSize: 14,
    color: ADMIN_COLORS.secondaryText,
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
    gap: 16,
  },
  productHeaderCard: {
    ...ADMIN_MODAL_SECTION,
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
    borderColor: ADMIN_COLORS.border,
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 4,
    backgroundColor: ADMIN_COLORS.surfaceMuted,
  },
  unitTypeOptionActive: {
    borderColor: ADMIN_COLORS.primary,
    backgroundColor: '#eff6ff',
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
    backgroundColor: ADMIN_COLORS.surfaceMuted,
  },
  quantityInput: {
    width: 80,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    color: ADMIN_COLORS.text,
    marginHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: ADMIN_COLORS.border,
    borderRadius: 8,
    backgroundColor: ADMIN_COLORS.surface,
  },
  summaryContainer: {
    ...ADMIN_MODAL_SECTION,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: ADMIN_COLORS.secondaryText,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: ADMIN_COLORS.text,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: ADMIN_COLORS.line,
    marginVertical: 8,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: ADMIN_COLORS.text,
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: ADMIN_COLORS.success,
  },
  confirmButton: {
    ...ADMIN_PRIMARY_BUTTON,
  },
  confirmButtonText: {
    ...ADMIN_BUTTON_TEXT,
  },

  // Receipt Modal
  receiptScroll: {
    flex: 1,
  },
  receiptContent: {
    padding: 20,
    paddingTop: 18,
    gap: 16,
  },
  businessHeader: {
    ...ADMIN_MODAL_SECTION,
    alignItems: 'center',
    padding: 20,
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
    textAlign: 'center',
  },
  receiptInfo: {
    ...ADMIN_MODAL_SECTION,
    padding: 16,
  },
  receiptRow: {
    ...ADMIN_DETAIL_ROW,
  },
  receiptLabel: {
    ...ADMIN_DETAIL_LABEL,
  },
  receiptValue: {
    ...ADMIN_DETAIL_VALUE,
  },
  itemsSection: {
    ...ADMIN_MODAL_SECTION,
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
    color: ADMIN_COLORS.text,
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
    color: ADMIN_COLORS.text,
  },
  itemQuantity: {
    flex: 1,
    fontSize: 14,
    color: ADMIN_COLORS.secondaryText,
    textAlign: 'center',
  },
  itemAmount: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: ADMIN_COLORS.text,
    textAlign: 'right',
  },
  totalSection: {
    ...ADMIN_MODAL_SECTION,
    padding: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  receiptTotalLabel: {
    ...ADMIN_DETAIL_LABEL,
  },
  receiptTotalValue: {
    ...ADMIN_DETAIL_VALUE,
    color: ADMIN_COLORS.text,
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
    ...ADMIN_PRIMARY_BUTTON,
  },
  printReceiptButtonDisabled: {
    ...ADMIN_PRIMARY_BUTTON_DISABLED,
  },
  printReceiptButtonText: {
    ...ADMIN_BUTTON_TEXT,
  },
  buttonContent: {
    ...ADMIN_BUTTON_CONTENT,
  },
  detailLine: {
    ...ADMIN_DETAIL_ROW,
  },
  detailLineLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  detailLineLabel: {
    ...ADMIN_DETAIL_LABEL,
  },
  detailLineValue: {
    ...ADMIN_DETAIL_VALUE,
  },
  detailLineAccent: {
    color: ADMIN_COLORS.accent,
  },
});

export default CashierSell;
