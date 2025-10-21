// app/(cashier)/sell.js
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { addSale, updateProductStock } from '../../store/slices/userSlice';

export default function SellScreen() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState('1');
  const { products } = useSelector(state => state.user);
  const dispatch = useDispatch();

  const handleSell = () => {
    if (!selectedProduct || !quantity || quantity <= 0) {
      Alert.alert('Error', 'Please select a product and enter valid quantity');
      return;
    }

    if (selectedProduct.stock < quantity) {
      Alert.alert('Error', 'Insufficient stock');
      return;
    }

    const sale = {
      id: Date.now(),
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity: parseInt(quantity),
      price: selectedProduct.price,
      total: selectedProduct.price * parseInt(quantity),
      date: new Date().toISOString(),
      cashier: 'Current User',
    };

    dispatch(addSale(sale));
    dispatch(updateProductStock({
      productId: selectedProduct.id,
      quantity: parseInt(quantity)
    }));

    Alert.alert('Success', 'Sale completed successfully');
    setSelectedProduct(null);
    setQuantity('1');
  };

  return (
    <View className="flex-1 bg-primary-white p-4">
      <Text className="text-2xl font-bold text-primary-navy-dark mb-6">
        New Sale
      </Text>

      <View className="space-y-4">
        <TextInput
          className="border border-gray-300 rounded-lg p-4 text-primary-navy-dark"
          placeholder="Search products..."
        />

        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              className={`p-4 border-b border-gray-200 ${
                selectedProduct?.id === item.id ? 'bg-primary-orange-400' : ''
              }`}
              onPress={() => setSelectedProduct(item)}
            >
              <Text className={`font-semibold ${
                selectedProduct?.id === item.id ? 'text-primary-white' : 'text-primary-navy-dark'
              }`}>
                {item.name}
              </Text>
              <Text className={selectedProduct?.id === item.id ? 'text-primary-white' : 'text-gray-600'}>
                ${item.price} • Stock: {item.stock}
              </Text>
            </TouchableOpacity>
          )}
          className="max-h-64"
        />

        {selectedProduct && (
          <View className="bg-gray-100 p-4 rounded-lg">
            <Text className="text-lg font-semibold text-primary-navy-dark mb-2">
              Selected: {selectedProduct.name}
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-4 bg-primary-white text-primary-navy-dark mb-2"
              placeholder="Quantity"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
            />
            <Text className="text-primary-navy-dark mb-2">
              Total: ${selectedProduct.price * (parseInt(quantity) || 0)}
            </Text>
            <TouchableOpacity
              className="bg-primary-orange-400 py-3 rounded-lg"
              onPress={handleSell}
            >
              <Text className="text-primary-white text-center font-semibold">
                Complete Sale
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}