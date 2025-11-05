// app/(admin)/sales.js
import { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Modal,
  FlatList
} from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

const AdminSales = () => {
  const { sales } = useSelector(state => state.user);
  
  const [filteredSales, setFilteredSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [selectedSale, setSelectedSale] = useState(null);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
      setFilteredSales(sales);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let filtered = sales;

    if (searchQuery) {
      filtered = filtered.filter(sale =>
        sale.id.toString().includes(searchQuery.toLowerCase()) ||
        sale.cashier.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (paymentFilter !== 'all') {
      filtered = filtered.filter(sale => sale.paymentMethod === paymentFilter);
    }

    setFilteredSales(filtered);
  }, [searchQuery, paymentFilter, sales]);

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const averageSale = sales.length > 0 ? totalRevenue / sales.length : 0;

  const getPaymentBadge = (method) => {
    const colorMap = {
      'Cash': 'bg-blue-100 text-blue-800',
      'Card': 'bg-green-100 text-green-800',
      'Mobile Payment': 'bg-purple-100 text-purple-800',
    };
    
    return (
      <View className={`px-2 py-1 rounded-full ${colorMap[method] || 'bg-gray-100'}`}>
        <Text className="text-xs font-medium capitalize">
          {method}
        </Text>
      </View>
    );
  };

  const paymentOptions = [
    { value: 'all', label: 'All Methods' },
    { value: 'Cash', label: 'Cash' },
    { value: 'Card', label: 'Card' },
    { value: 'Mobile Payment', label: 'Mobile' },
  ];

  const renderSaleItem = ({ item }) => (
    <TouchableOpacity 
      className="border-b border-border py-3 px-4 bg-card active:bg-muted"
      onPress={() => setSelectedSale(item)}
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="font-semibold text-foreground text-base">#{item.id}</Text>
          <Text className="text-muted-foreground text-sm">{item.cashier}</Text>
        </View>
        <Text className="font-bold text-accent text-lg">
          ${item.total.toFixed(2)}
        </Text>
      </View>
      
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center space-x-3">
          <Text className="text-xs text-muted-foreground">
            {item.quantity} items
          </Text>
          {getPaymentBadge(item.paymentMethod)}
        </View>
        <Text className="text-xs text-muted-foreground">
          {new Date(item.date).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        <ScrollView className="flex-1 p-4 md:p-6 space-y-6">


          {/* Stats Grid Skeleton */}
          <View className="flex flex-row  justify-between gap-4">
            {[1, 2].map((i) => (
              <View key={i} className="bg-card rounded-lg p-4 shadow-sm w-[48%] min-w-[160px]">
                <View className="h-4 w-20 bg-muted rounded mb-2 animate-pulse" />
                <View className="h-6 w-16 bg-muted rounded animate-pulse" />
              </View>
            ))}
          </View>

          {/* Search and Filter Skeleton */}
          <View className="bg-card rounded-lg p-4 shadow-sm">
            <View className="h-6 w-40 bg-muted rounded mb-2 animate-pulse" />
            <View className="h-4 w-56 bg-muted rounded mb-4 animate-pulse" />
            <View className="flex-row gap-4">
              <View className="flex-1 h-10 bg-muted rounded animate-pulse" />
              <View className="w-32 h-10 bg-muted rounded animate-pulse" />
            </View>
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
          <View className="w-full grid grid-cols-2 gap-4">
            <View className="bg-primary rounded-lg p-4 shadow-sm w-full">
              <Text className="text-sm font-medium text-primary-foreground text-center mb-1">
                Total Sales
              </Text>
              <Text className="text-xl md:text-2xl text-center font-bold text-primary-foreground">
                {sales.length}
              </Text>
            </View>
            <View className="bg-primary rounded-lg p-4 shadow-sm w-full">
              <Text className="text-sm font-medium text-primary-foreground text-center mb-1">
                Total Revenue
              </Text>
              <Text className="text-xl md:text-2xl font-bold text-accent text-center">
                ${totalRevenue.toFixed(2)}
              </Text>
            </View>
            <View className="bg-card rounded-lg p-4 shadow-sm w-[48%] min-w-[160px] hidden">
              <Text className="text-sm font-medium text-muted-foreground mb-1">
                Average Sale
              </Text>
              <Text className="text-xl md:text-2xl font-bold text-foreground">
                ${averageSale.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Search and Filter */}
          <View className="bg-card rounded-lg p-4 shadow-sm">
            <Text className="text-lg font-bold text-foreground mb-1">
              All Transactions
            </Text>
            <Text className="text-sm text-muted-foreground mb-4">
              Complete sales history
            </Text>
            
            <View className="flex-row gap-4">
              {/* Search Input */}
              <View className="flex-1">
                <View className="relative">
                  <Ionicons 
                    name="search" 
                    size={20} 
                    className="absolute left-3 top-3 text-muted-foreground" 
                  />
                  <TextInput
                    placeholder="Search by ID or cashier..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    className="bg-background border border-input rounded-lg pl-10 pr-4 py-3 text-foreground"
                    placeholderTextColor="#6B7280"
                  />
                </View>
              </View>

              {/* Payment Filter */}
              <View className="border border-input rounded-lg bg-background min-w-[140px]">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row px-2 py-1">
                    {paymentOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        className={`px-3 py-2 rounded mx-1 ${
                          paymentFilter === option.value 
                            ? 'bg-accent' 
                            : 'bg-transparent'
                        }`}
                        onPress={() => setPaymentFilter(option.value)}
                      >
                        <Text className={
                          paymentFilter === option.value 
                            ? 'text-accent-foreground text-xs font-medium'
                            : 'text-muted-foreground text-xs'
                        }>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          </View>

          {/* Sales List */}
          <View className="bg-card rounded-lg shadow-sm overflow-hidden">
            {filteredSales.length === 0 ? (
              <View className="p-8 items-center">
                <Ionicons name="receipt-outline" size={48} className="text-muted-foreground mb-4" />
                <Text className="text-lg font-medium text-foreground mb-2">
                  No sales found
                </Text>
                <Text className="text-muted-foreground text-center mb-4">
                  {searchQuery || paymentFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'No sales transactions recorded yet'
                  }
                </Text>
                {(searchQuery || paymentFilter !== 'all') && (
                  <TouchableOpacity
                    className="bg-accent rounded-lg px-4 py-2"
                    onPress={() => {
                      setSearchQuery('');
                      setPaymentFilter('all');
                    }}
                  >
                    <Text className="text-accent-foreground font-semibold">
                      Clear Filters
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <FlatList
                data={filteredSales}
                renderItem={renderSaleItem}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
                className="max-h-96"
              />
            )}
          </View>
        </View>
      </ScrollView>

      {/* Sale Detail Modal */}
      <Modal
        visible={!!selectedSale}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedSale(null)}
      >
        {selectedSale && (
          <View className="flex-1 bg-background pt-4">
            <View className="flex-row justify-between items-center px-4 pb-4 border-b border-border">
              <Text className="text-xl font-bold text-foreground">
                Sale Details - #{selectedSale.id}
              </Text>
              <TouchableOpacity onPress={() => setSelectedSale(null)}>
                <Ionicons name="close" size={24} className="text-foreground" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-4">
              <View className="space-y-6">
                {/* Sale Info */}
                <View className="flex-row flex-wrap justify-between gap-4">
                  <View className="w-[48%]">
                    <Text className="text-sm text-muted-foreground mb-1">Cashier</Text>
                    <Text className="font-medium text-foreground text-base">{selectedSale.cashier}</Text>
                  </View>
                  <View className="w-[48%]">
                    <Text className="text-sm text-muted-foreground mb-1">Payment Method</Text>
                    {getPaymentBadge(selectedSale.paymentMethod)}
                  </View>
                  <View className="w-[48%]">
                    <Text className="text-sm text-muted-foreground mb-1">Date</Text>
                    <Text className="font-medium text-foreground text-base">
                      {new Date(selectedSale.date).toLocaleDateString()}
                    </Text>
                  </View>
                  <View className="w-[48%]">
                    <Text className="text-sm text-muted-foreground mb-1">Total Amount</Text>
                    <Text className="font-bold text-accent text-lg">
                      ${selectedSale.total.toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Products List */}
                <View>
                  <Text className="text-lg font-semibold text-foreground mb-3">
                    Products ({selectedSale.quantity} items)
                  </Text>
                  
                  {/* Since our sales data structure is simplified, we'll show the main product */}
                  <View className="bg-secondary rounded-lg p-4 mb-3">
                    <View className="flex-row justify-between items-start mb-2">
                      <Text className="font-medium text-foreground text-base flex-1">
                        {selectedSale.productName}
                      </Text>
                      <Text className="font-bold text-accent">
                        ${selectedSale.total.toFixed(2)}
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-muted-foreground text-sm">
                        Qty: {selectedSale.quantity} × ${selectedSale.price.toFixed(2)}
                      </Text>
                      <Text className="text-muted-foreground text-sm">
                        Subtotal: ${(selectedSale.quantity * selectedSale.price).toFixed(2)}
                      </Text>
                    </View>
                  </View>

                  {/* Additional product info */}
                  <View className="space-y-2">
                    <View className="flex-row justify-between p-2">
                      <Text className="text-muted-foreground">Product ID</Text>
                      <Text className="font-medium">{selectedSale.productId}</Text>
                    </View>
                    <View className="flex-row justify-between p-2">
                      <Text className="text-muted-foreground">Invoice Number</Text>
                      <Text className="font-medium">INV{selectedSale.id.toString().padStart(4, '0')}</Text>
                    </View>
                    <View className="flex-row justify-between p-2">
                      <Text className="text-muted-foreground">Customer</Text>
                      <Text className="font-medium">Walk-in Customer</Text>
                    </View>
                  </View>
                </View>

                {/* Summary */}
                <View className="bg-primary rounded-lg p-4">
                  <Text className="text-lg font-semibold text-primary-foreground mb-3">
                    Transaction Summary
                  </Text>
                  <View className="space-y-2">
                    <View className="flex-row justify-between">
                      <Text className="text-primary-foreground">Subtotal</Text>
                      <Text className="text-primary-foreground font-medium">
                        ${selectedSale.total.toFixed(2)}
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-primary-foreground">Tax</Text>
                      <Text className="text-primary-foreground font-medium">
                        $0.00
                      </Text>
                    </View>
                    <View className="flex-row justify-between border-t border-primary-foreground/20 pt-2">
                      <Text className="text-primary-foreground font-bold">Total</Text>
                      <Text className="text-primary-foreground font-bold text-lg">
                        ${selectedSale.total.toFixed(2)}
                      </Text>
                    </View>
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

export default AdminSales;