// app/(admin)/purchases.tsx
import { View, Text, ScrollView, FlatList } from 'react-native';
import { useSelector } from 'react-redux';

export default function SalesScreen() {
  const { sales } = useSelector(state => state.user);

  return (
    <View className="flex-1 bg-primary-white p-4">
      <Text className="text-2xl font-bold text-primary-navy-dark mb-6">
        Sales History
      </Text>
      
      <FlatList
        data={sales}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View className="bg-gray-100 p-4 rounded-lg mb-2">
            <View className="flex-row justify-between">
              <Text className="text-primary-navy-dark font-semibold">
                {item.productName}
              </Text>
              <Text className="text-primary-orange-400 font-bold">
                ${item.total}
              </Text>
            </View>
            <Text className="text-gray-600">
              Quantity: {item.quantity} • {new Date(item.date).toLocaleDateString()}
            </Text>
            <Text className="text-gray-600">Cashier: {item.cashier}</Text>
          </View>
        )}
      />
    </View>
  );
}