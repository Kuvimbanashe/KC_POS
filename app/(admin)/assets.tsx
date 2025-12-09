// app/(admin)/assets.js
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
import { Ionicons } from '@expo/vector-icons';
import { addAsset, deleteAsset } from '../../store/slices/assetsSlice';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { ListRenderItem } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { AssetRecord } from '../../store/types';

type ConditionFilter = 'all' | AssetRecord['condition'];

interface AssetFormData {
  name: string;
  category: string;
  purchaseValue: string;
  currentValue: string;
  purchaseDate: Date;
  condition: AssetRecord['condition'];
  location: string;
}

const AdminAssets = () => {
  const { assets } = useAppSelector((state) => state.assets);
  const dispatch = useAppDispatch();
  
  const [filteredAssets, setFilteredAssets] = useState<AssetRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [conditionFilter, setConditionFilter] = useState<ConditionFilter>('all');
  const [selectedAsset, setSelectedAsset] = useState<AssetRecord | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [formData, setFormData] = useState<AssetFormData>({
    name: '',
    category: '',
    purchaseValue: '',
    currentValue: '',
    purchaseDate: new Date(),
    condition: 'good',
    location: '',
  });

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
      setFilteredAssets(assets);
    }, 1000);
    return () => clearTimeout(timer);
  }, [assets]);

  useEffect(() => {
    let filtered: AssetRecord[] = assets;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (asset) =>
          asset.name.toLowerCase().includes(query) ||
          asset.category.toLowerCase().includes(query) ||
          asset.location.toLowerCase().includes(query),
      );
    }

    if (conditionFilter !== 'all') {
      filtered = filtered.filter((asset) => asset.condition === conditionFilter);
    }

    setFilteredAssets(filtered);
  }, [searchQuery, conditionFilter, assets]);

  const handleSubmit = () => {
    if (!formData.name || !formData.category || !formData.purchaseValue || !formData.currentValue || !formData.location) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      dispatch(addAsset({
        name: formData.name,
        category: formData.category,
        purchaseValue: parseFloat(formData.purchaseValue),
        currentValue: parseFloat(formData.currentValue),
        purchaseDate: formData.purchaseDate.toISOString().split('T')[0],
        condition: formData.condition,
        location: formData.location,
      }));

      Alert.alert('Success', 'Asset added successfully');
      setIsDialogOpen(false);
      setFormData({
        name: '',
        category: '',
        purchaseValue: '',
        currentValue: '',
        purchaseDate: new Date(),
        condition: 'good',
        location: '',
      });
    } catch (error) {
      console.error('Error creating asset:', error);
      Alert.alert('Error', 'Failed to add asset');
    }
  };

  const totalValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
  const totalPurchaseValue = assets.reduce((sum, asset) => sum + asset.purchaseValue, 0);
  const depreciation = totalPurchaseValue - totalValue;

  const getConditionBadge = (condition: AssetRecord['condition']) => {
    const colorMap: Record<AssetRecord['condition'], string> = {
      excellent: 'bg-green-100 text-green-800',
      good: 'bg-blue-100 text-blue-800',
      fair: 'bg-yellow-100 text-yellow-800',
      poor: 'bg-red-100 text-red-800',
    };
    
    return (
      <View className={`px-2 py-1 rounded-full ${colorMap[condition] || 'bg-gray-100'}`}>
        <Text style={styles.s_1}>
          {condition}
        </Text>
      </View>
    );
  };

  const conditionOptions: Array<{ value: ConditionFilter; label: string }> = [
    { value: 'all', label: 'All Conditions' },
    { value: 'excellent' as const, label: 'Excellent' },
    { value: 'good' as const, label: 'Good' },
    { value: 'fair' as const, label: 'Fair' },
    { value: 'poor' as const, label: 'Poor' },
  ];

  const categoryOptions = [
    'Equipment',
    'Furniture',
    'Vehicle',
    'Electronics',
    'Software',
    'Other'
  ];

  const renderAssetItem: ListRenderItem<AssetRecord> = ({ item }) => (
    <TouchableOpacity 
      style={styles.s_2}
      onPress={() => setSelectedAsset(item)}
    >
      <View className="flex-row justify-between items-start ">
        <View className="">
          <Text style={styles.s_4}>{item.name}</Text>

        </View>
        
        <View>
          {getConditionBadge(item.condition)}
          
        </View>

        <View>
        <Text style={styles.s_5}>
          ${item.currentValue.toFixed(2)}
        </Text>
        </View>
      </View>
      
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <ScrollView style={styles.s_6}>
        <View style={styles.s_7}>
       

          {/* Stats Grid Skeleton */}
          <View style={styles.s_8}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={styles.s_9}>
                <View style={styles.s_10} />
                <View style={styles.s_11} />
              </View>
            ))}
          </View>

          {/* Search and Filter Skeleton */}
          <View style={styles.s_12}>
            <View style={styles.s_13} />
            <View style={styles.s_14} />
            <View style={styles.s_15}>
              <View style={styles.s_16} />
              <View style={styles.s_17} />
            </View>
          </View>

          {/* Table Skeleton */}
          <View style={styles.s_12}>
            {[1, 2, 3, 4, 5].map((i) => (
              <View key={i} style={styles.s_18} />
            ))}
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.s_6}>
      <ScrollView style={styles.s_19}>
        <View style={styles.s_7}>
  

          {/* Stats Cards */}
          <View style={styles.s_20}>
            <View style={styles.s_21}>
              <Text style={styles.s_22}>
                Total Assets
              </Text>
              <Text style={styles.s_23}>
                {assets.length}
              </Text>
            </View>
            <View style={styles.s_21}>
              <Text style={styles.s_22}>
                Current Value
              </Text>
              <Text style={styles.s_23}>
                ${totalValue.toFixed(2)}
              </Text>
            </View>
            <View style={styles.s_21}>
              <Text style={styles.s_22}>
                Purchase Value
              </Text>
              <Text style={styles.s_23}>
                ${totalPurchaseValue.toFixed(2)}
              </Text>
            </View>
            <View style={styles.s_21}>
              <Text style={styles.s_22}>
                Depreciation
              </Text>
              <Text style={styles.s_24}>
                ${depreciation.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Search and Filter */}
          <View style={styles.s_25}>
            <View style={styles.s_26}>
            <View>
            <Text style={styles.s_27}>
              Asset Inventory
            </Text>
            <Text className="text-xs  text-muted-foreground ">
              All business assets and their values
            </Text>
            
            </View>
             <TouchableOpacity
              style={styles.s_29}
              onPress={() => setIsDialogOpen(true)}
            >
              <Ionicons name="add" size={20} style={styles.s_30} />
              <Text style={styles.s_31}>Add Asset</Text>
            </TouchableOpacity>
            </View>
            
            <View style={styles.s_32}>
              {/* Search Input */}
              <View style={styles.s_19}>
                <View style={styles.s_33}>
                  <Ionicons 
                    name="search" 
                    size={20} 
                    style={styles.s_34} 
                  />
                  <TextInput
                    placeholder="Search by name, category, or location..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    style={styles.s_35}
                    placeholderTextColor="#6B7280"
                  />
                </View>
              </View>

              {/* Condition Filter */}
              <View style={styles.s_36}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.s_37}>
                    {conditionOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        className={`px-3 py-2 rounded mx-1 ${
                          conditionFilter === option.value 
                            ? 'bg-accent' 
                            : 'bg-transparent'
                        }`}
                        onPress={() => setConditionFilter(option.value)}
                      >
                        <Text className={
                          conditionFilter === option.value 
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

          {/* Assets List */}
          <View style={styles.s_38}>
            {filteredAssets.length === 0 ? (
              <View style={styles.s_39}>
                <Ionicons name="cube-outline" size={48} style={styles.s_40} />
                <Text style={styles.s_41}>
                  No assets found
                </Text>
                <Text style={styles.s_42}>
                  {searchQuery || conditionFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Get started by adding your first asset'
                  }
                </Text>
                {(searchQuery || conditionFilter !== 'all') && (
                  <TouchableOpacity
                    style={styles.s_43}
                    onPress={() => {
                      setSearchQuery('');
                      setConditionFilter('all');
                    }}
                  >
                    <Text style={styles.s_31}>
                      Clear Filters
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <FlatList
                data={filteredAssets}
                renderItem={renderAssetItem}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={true}
                style={styles.s_44}
              />
            )}
          </View>
        </View>
      </ScrollView>

      {/* Add Asset Modal */}
      <Modal
        visible={isDialogOpen}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.s_45}>
          <View style={styles.s_46}>
            <Text style={styles.s_47}>Add New Asset</Text>
            <TouchableOpacity onPress={() => setIsDialogOpen(false)}>
              <Ionicons name="close" size={24} style={styles.s_48} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.s_49}>
            <View style={styles.s_50}>
              {/* Asset Name */}
              <View>
                <Text style={styles.s_51}>Asset Name</Text>
                <TextInput
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Enter asset name"
                  style={styles.s_52}
                  placeholderTextColor="#6B7280"
                />
              </View>

              {/* Category */}
              <View>
                <Text style={styles.s_51}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.s_53}>
                    {categoryOptions.map((category) => (
                      <TouchableOpacity
                        key={category}
                        className={`px-4 py-2 rounded-lg border ${
                          formData.category === category
                            ? 'bg-accent border-accent'
                            : 'bg-background border-input'
                        }`}
                        onPress={() => setFormData({ ...formData, category })}
                      >
                        <Text className={
                          formData.category === category
                            ? 'text-accent-foreground font-medium'
                            : 'text-foreground'
                        }>
                          {category}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Purchase and Current Value */}
              <View style={styles.s_54}>
                <View style={styles.s_19}>
                  <Text style={styles.s_51}>Purchase Value</Text>
                  <TextInput
                    value={formData.purchaseValue}
                    onChangeText={(text) => setFormData({ ...formData, purchaseValue: text })}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    style={styles.s_52}
                    placeholderTextColor="#6B7280"
                  />
                </View>
                <View style={styles.s_19}>
                  <Text style={styles.s_51}>Current Value</Text>
                  <TextInput
                    value={formData.currentValue}
                    onChangeText={(text) => setFormData({ ...formData, currentValue: text })}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    style={styles.s_52}
                    placeholderTextColor="#6B7280"
                  />
                </View>
              </View>

              {/* Purchase Date */}
              <View>
                <Text style={styles.s_51}>Purchase Date</Text>
                <TouchableOpacity
                  style={styles.s_55}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.s_48}>
                    {formData.purchaseDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={formData.purchaseDate}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                      setShowDatePicker(false);
                      if (date) {
                        setFormData({ ...formData, purchaseDate: date });
                      }
                    }}
                  />
                )}
              </View>

              {/* Condition */}
              <View>
                <Text style={styles.s_51}>Condition</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.s_53}>
                    {(['excellent', 'good', 'fair', 'poor'] as AssetRecord['condition'][]).map((condition) => (
                      <TouchableOpacity
                        key={condition}
                        className={`px-4 py-2 rounded-lg border ${
                          formData.condition === condition
                            ? 'bg-accent border-accent'
                            : 'bg-background border-input'
                        }`}
                        onPress={() => setFormData({ ...formData, condition })}
                      >
                        <Text className={
                          formData.condition === condition
                            ? 'text-accent-foreground font-medium capitalize'
                            : 'text-foreground capitalize'
                        }>
                          {condition}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Location */}
              <View>
                <Text style={styles.s_51}>Location</Text>
                <TextInput
                  value={formData.location}
                  onChangeText={(text) => setFormData({ ...formData, location: text })}
                  placeholder="Enter location"
                  style={styles.s_52}
                  placeholderTextColor="#6B7280"
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.s_56}
              onPress={handleSubmit}
            >
              <Text style={styles.s_57}>
                Add Asset
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Asset Detail Modal */}
      <Modal
        visible={!!selectedAsset}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedAsset(null)}
      >
        {selectedAsset && (
          <View style={styles.s_45}>
            <View style={styles.s_46}>
              <Text style={styles.s_47}>
                Asset Details - {selectedAsset.id}
              </Text>
              <TouchableOpacity onPress={() => setSelectedAsset(null)}>
                <Ionicons name="close" size={24} style={styles.s_48} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.s_49}>
              <View style={styles.s_58}>
                <View style={styles.s_59}>
                  <View style={styles.s_60}>
                    <Text style={styles.s_61}>Name</Text>
                    <Text style={styles.s_62}>{selectedAsset.name}</Text>
                  </View>
                  <View style={styles.s_60}>
                    <Text style={styles.s_61}>Category</Text>
                    <Text style={styles.s_62}>{selectedAsset.category}</Text>
                  </View>
                  <View style={styles.s_60}>
                    <Text style={styles.s_61}>Location</Text>
                    <Text style={styles.s_62}>{selectedAsset.location}</Text>
                  </View>
                  <View style={styles.s_60}>
                    <Text style={styles.s_61}>Condition</Text>
                    {getConditionBadge(selectedAsset.condition)}
                  </View>
                  <View style={styles.s_60}>
                    <Text style={styles.s_61}>Purchase Value</Text>
                    <Text style={styles.s_62}>
                      ${selectedAsset.purchaseValue.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.s_60}>
                    <Text style={styles.s_61}>Current Value</Text>
                    <Text style={styles.s_5}>
                      ${selectedAsset.currentValue.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.s_60}>
                    <Text style={styles.s_61}>Depreciation</Text>
                    <Text style={styles.s_63}>
                      ${(selectedAsset.purchaseValue - selectedAsset.currentValue).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.s_60}>
                    <Text style={styles.s_61}>Purchase Date</Text>
                    <Text style={styles.s_62}>
                      {new Date(selectedAsset.purchaseDate).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.s_64}>
                  <TouchableOpacity 
                    style={styles.s_65}
                    onPress={() => {
                      Alert.alert(
                        'Delete Asset',
                        `Are you sure you want to delete ${selectedAsset.name}?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { 
                            text: 'Delete', 
                            style: 'destructive',
                            onPress: () => {
                              dispatch(deleteAsset(selectedAsset.id));
                              setSelectedAsset(null);
                              Alert.alert('Success', 'Asset deleted successfully');
                            }
                          },
                        ]
                      );
                    }}
                  >
                    <Text style={styles.s_66}>
                      Delete Asset
                    </Text>
                  </TouchableOpacity>
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
  fontSize: 12,
  fontWeight: "600"
},

  s_2: {
  borderColor: "#e6edf3",
  paddingVertical: 12,
  paddingHorizontal: 16,
  backgroundColor: "#ffffff"
},

  s_3: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start"
},

  s_4: {
  color: "#0f172a"
},

  s_5: {
  fontWeight: "700",
  color: "#f97316",
  fontSize: 18
},

  s_6: {
  flex: 1,
  backgroundColor: "#ffffff"
},

  s_7: {
  padding: 16
},

  s_8: {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 16
},

  s_9: {
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

  s_10: {
  borderRadius: 6,
  marginBottom: 8
},

  s_11: {
  borderRadius: 6
},

  s_12: {
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

  s_13: {
  borderRadius: 6,
  marginBottom: 8
},

  s_14: {
  borderRadius: 6,
  marginBottom: 16
},

  s_15: {
  flexDirection: "row",
  gap: 16
},

  s_16: {
  flex: 1,
  borderRadius: 6
},

  s_17: {
  borderRadius: 6
},

  s_18: {
  borderRadius: 6,
  marginBottom: 8
},

  s_19: {
  flex: 1
},

  s_20: {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 16,
  width: "100%"
},

  s_21: {
  backgroundColor: "#0f172a",
  borderRadius: 12,
  padding: 16,
  width: "100%",
  flex: 1,
  alignItems: "center",
  justifyContent: "center"
},

  s_22: {
  fontSize: 14,
  fontWeight: "600",
  color: "#ffffff"
},

  s_23: {
  fontSize: 20,
  fontWeight: "700",
  color: "#f97316"
},

  s_24: {
  fontSize: 20,
  fontWeight: "700"
},

  s_25: {
  backgroundColor: "#ffffff",
  borderRadius: 12,
  padding: 16,
  borderWidth: 1,
  borderColor: "#e6edf3"
},

  s_26: {
  width: "100%",
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between"
},

  s_27: {
  fontSize: 18,
  fontWeight: "700",
  color: "#0f172a"
},

  s_28: {
  fontSize: 12,
  color: "#6b7280"
},

  s_29: {
  backgroundColor: "#f97316",
  borderRadius: 12,
  flexDirection: "row",
  alignItems: "center"
},

  s_30: {},

  s_31: {},

  s_32: {
  flexDirection: "column",
  gap: 16
},

  s_33: {},

  s_34: {
  color: "#6b7280"
},

  s_35: {
  backgroundColor: "#ffffff",
  borderWidth: 1,
  borderColor: "#e6edf3",
  borderRadius: 12,
  paddingRight: 16,
  paddingVertical: 12,
  color: "#0f172a"
},

  s_36: {
  borderWidth: 1,
  borderColor: "#e6edf3",
  borderRadius: 12,
  backgroundColor: "#ffffff"
},

  s_37: {
  flexDirection: "row"
},

  s_38: {
  backgroundColor: "#ffffff",
  borderRadius: 12,
  borderWidth: 1,
  borderColor: "#e6edf3"
},

  s_39: {
  alignItems: "center"
},

  s_40: {
  color: "#6b7280",
  marginBottom: 16
},

  s_41: {
  fontSize: 18,
  fontWeight: "600",
  color: "#0f172a",
  marginBottom: 8
},

  s_42: {
  color: "#6b7280",
  marginBottom: 16
},

  s_43: {
  backgroundColor: "#f97316",
  borderRadius: 12,
  paddingHorizontal: 16
},

  s_44: {},

  s_45: {
  flex: 1,
  backgroundColor: "#ffffff",
  paddingTop: 16
},

  s_46: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingHorizontal: 16,
  paddingBottom: 16,
  borderColor: "#e6edf3"
},

  s_47: {
  fontSize: 20,
  fontWeight: "700",
  color: "#0f172a"
},

  s_48: {
  color: "#0f172a"
},

  s_49: {
  flex: 1,
  padding: 16
},

  s_50: {},

  s_51: {
  fontSize: 14,
  fontWeight: "600",
  color: "#0f172a",
  marginBottom: 8
},

  s_52: {
  backgroundColor: "#ffffff",
  borderWidth: 1,
  borderColor: "#e6edf3",
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 12,
  color: "#0f172a"
},

  s_53: {
  flexDirection: "row"
},

  s_54: {
  flexDirection: "row"
},

  s_55: {
  backgroundColor: "#ffffff",
  borderWidth: 1,
  borderColor: "#e6edf3",
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 12
},

  s_56: {
  backgroundColor: "#f97316",
  borderRadius: 12
},

  s_57: {
  fontSize: 18
},

  s_58: {},

  s_59: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between",
  gap: 16
},

  s_60: {
  width: "48%"
},

  s_61: {
  fontSize: 14,
  color: "#6b7280"
},

  s_62: {
  fontWeight: "600",
  color: "#0f172a"
},

  s_63: {
  fontWeight: "600"
},

  s_64: {
  flexDirection: "row",
  paddingTop: 16
},

  s_65: {
  flex: 1,
  borderRadius: 12,
  paddingVertical: 12
},

  s_66: {}
});
export default AdminAssets;