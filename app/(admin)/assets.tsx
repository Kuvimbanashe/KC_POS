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
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { addAsset, deleteAsset } from '../../store/slices/assetsSlice';
import DateTimePicker from '@react-native-community/datetimepicker';

const AdminAssets = () => {
  const { assets } = useSelector(state => state.assets);
  const dispatch = useDispatch();
  
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [formData, setFormData] = useState({
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
  }, []);

  useEffect(() => {
    let filtered = assets;

    if (searchQuery) {
      filtered = filtered.filter(asset =>
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (conditionFilter !== 'all') {
      filtered = filtered.filter(asset => asset.condition === conditionFilter);
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

  const getConditionBadge = (condition) => {
    const colorMap = {
      excellent: 'bg-green-100 text-green-800',
      good: 'bg-blue-100 text-blue-800',
      fair: 'bg-yellow-100 text-yellow-800',
      poor: 'bg-red-100 text-red-800',
    };
    
    return (
      <View className={`px-2 py-1 rounded-full ${colorMap[condition] || 'bg-gray-100'}`}>
        <Text className="text-xs font-medium capitalize">
          {condition}
        </Text>
      </View>
    );
  };

  const conditionOptions = [
    { value: 'all', label: 'All Conditions' },
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' },
  ];

  const categoryOptions = [
    'Equipment',
    'Furniture',
    'Vehicle',
    'Electronics',
    'Software',
    'Other'
  ];

  const renderAssetItem = ({ item }) => (
    <TouchableOpacity 
      className="border-b border-border py-3 px-4 bg-card active:bg-muted"
      onPress={() => setSelectedAsset(item)}
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="font-semibold text-foreground text-base">{item.name}</Text>
          <Text className="text-muted-foreground text-sm">{item.category}</Text>
        </View>
        <Text className="font-bold text-accent text-lg">
          ${item.currentValue.toFixed(2)}
        </Text>
      </View>
      
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center space-x-3">
          <Text className="text-xs text-muted-foreground">
            Purchase: ${item.purchaseValue.toFixed(2)}
          </Text>
          {getConditionBadge(item.condition)}
        </View>
        <Text className="text-xs text-muted-foreground">
          {new Date(item.purchaseDate).toLocaleDateString()}
        </Text>
      </View>
      
      <Text className="text-xs text-muted-foreground mt-1">
        Location: {item.location}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <ScrollView className="flex-1 bg-background">
        <View className="p-4 md:p-6 space-y-6">
       

          {/* Stats Grid Skeleton */}
          <View className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
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
        </View>
      </ScrollView>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1">
        <View className="p-4 md:p-6 space-y-6">
  

          {/* Stats Cards */}
          <View className="grid grid-cols-2 gap-4 w-full">
            <View className="bg-primary rounded-lg p-4 w-full flex-1 items-center justify-center">
              <Text className="text-sm font-medium text-primary-foreground mb-1">
                Total Assets
              </Text>
              <Text className="text-xl md:text-2xl font-bold text-accent">
                {assets.length}
              </Text>
            </View>
            <View className="bg-primary rounded-lg p-4 w-full flex-1 items-center justify-center">
              <Text className="text-sm font-medium text-primary-foreground mb-1">
                Current Value
              </Text>
              <Text className="text-xl md:text-2xl font-bold text-accent">
                ${totalValue.toFixed(2)}
              </Text>
            </View>
            <View className="bg-primary rounded-lg p-4 w-full flex-1 items-center justify-center">
              <Text className="text-sm font-medium text-primary-foreground mb-1">
                Purchase Value
              </Text>
              <Text className="text-xl md:text-2xl font-bold text-accent">
                ${totalPurchaseValue.toFixed(2)}
              </Text>
            </View>
            <View className="bg-primary rounded-lg p-4 w-full flex-1 items-center justify-center">
              <Text className="text-sm font-medium text-primary-foreground mb-1">
                Depreciation
              </Text>
              <Text className="text-xl md:text-2xl font-bold text-destructive">
                ${depreciation.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Search and Filter */}
          <View className="bg-card rounded-lg p-4 border border-border">
            <View className="w-full flex flex-row gap-2 items-center justify-between mb-6">
            <View>
            <Text className="text-lg font-bold text-foreground mb-1">
              Asset Inventory
            </Text>
            <Text className="text-xs  text-muted-foreground ">
              All business assets and their values
            </Text>
            
            </View>
             <TouchableOpacity
              className="bg-accent rounded-lg px-2 h-fit w-fit py-2 flex-row items-center"
              onPress={() => setIsDialogOpen(true)}
            >
              <Ionicons name="add" size={20} className="text-accent-foreground mr-2" />
              <Text className="text-accent-foreground font-semibold">Add Asset</Text>
            </TouchableOpacity>
            </View>
            
            <View className="flex-col gap-4">
              {/* Search Input */}
              <View className="flex-1">
                <View className="relative">
                  <Ionicons 
                    name="search" 
                    size={20} 
                    className="absolute left-3 top-3 text-muted-foreground" 
                  />
                  <TextInput
                    placeholder="Search by name, category, or location..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    className="bg-background border border-input rounded-lg pl-10 pr-4 py-3 text-foreground"
                    placeholderTextColor="#6B7280"
                  />
                </View>
              </View>

              {/* Condition Filter */}
              <View className="border border-input rounded-lg bg-background min-w-[140px]">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row px-2 py-1">
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
          <View className="bg-card rounded-lg bordee border-border overflow-hidden">
            {filteredAssets.length === 0 ? (
              <View className="p-8 items-center">
                <Ionicons name="cube-outline" size={48} className="text-muted-foreground mb-4" />
                <Text className="text-lg font-medium text-foreground mb-2">
                  No assets found
                </Text>
                <Text className="text-muted-foreground text-center mb-4">
                  {searchQuery || conditionFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Get started by adding your first asset'
                  }
                </Text>
                {(searchQuery || conditionFilter !== 'all') && (
                  <TouchableOpacity
                    className="bg-accent rounded-lg px-4 py-2"
                    onPress={() => {
                      setSearchQuery('');
                      setConditionFilter('all');
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
                data={filteredAssets}
                renderItem={renderAssetItem}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={true}
                className="max-h-96"
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
        <View className="flex-1 bg-background pt-4">
          <View className="flex-row justify-between items-center px-4 pb-4 border-b border-border">
            <Text className="text-xl font-bold text-foreground">Add New Asset</Text>
            <TouchableOpacity onPress={() => setIsDialogOpen(false)}>
              <Ionicons name="close" size={24} className="text-foreground" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-4">
            <View className="space-y-4">
              {/* Asset Name */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Asset Name</Text>
                <TextInput
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Enter asset name"
                  className="bg-background border border-input rounded-lg px-4 py-3 text-foreground"
                  placeholderTextColor="#6B7280"
                />
              </View>

              {/* Category */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row space-x-2">
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
              <View className="flex-row space-x-4">
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground mb-2">Purchase Value</Text>
                  <TextInput
                    value={formData.purchaseValue}
                    onChangeText={(text) => setFormData({ ...formData, purchaseValue: text })}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    className="bg-background border border-input rounded-lg px-4 py-3 text-foreground"
                    placeholderTextColor="#6B7280"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground mb-2">Current Value</Text>
                  <TextInput
                    value={formData.currentValue}
                    onChangeText={(text) => setFormData({ ...formData, currentValue: text })}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    className="bg-background border border-input rounded-lg px-4 py-3 text-foreground"
                    placeholderTextColor="#6B7280"
                  />
                </View>
              </View>

              {/* Purchase Date */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Purchase Date</Text>
                <TouchableOpacity
                  className="bg-background border border-input rounded-lg px-4 py-3"
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text className="text-foreground">
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
                <Text className="text-sm font-medium text-foreground mb-2">Condition</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row space-x-2">
                    {['excellent', 'good', 'fair', 'poor'].map((condition) => (
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
                <Text className="text-sm font-medium text-foreground mb-2">Location</Text>
                <TextInput
                  value={formData.location}
                  onChangeText={(text) => setFormData({ ...formData, location: text })}
                  placeholder="Enter location"
                  className="bg-background border border-input rounded-lg px-4 py-3 text-foreground"
                  placeholderTextColor="#6B7280"
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              className="bg-accent rounded-lg py-4 mt-6"
              onPress={handleSubmit}
            >
              <Text className="text-accent-foreground text-center font-semibold text-lg">
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
          <View className="flex-1 bg-background pt-4">
            <View className="flex-row justify-between items-center px-4 pb-4 border-b border-border">
              <Text className="text-xl font-bold text-foreground">
                Asset Details - {selectedAsset.id}
              </Text>
              <TouchableOpacity onPress={() => setSelectedAsset(null)}>
                <Ionicons name="close" size={24} className="text-foreground" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-4">
              <View className="space-y-6">
                <View className="flex-row flex-wrap justify-between gap-4">
                  <View className="w-[48%]">
                    <Text className="text-sm text-muted-foreground mb-1">Name</Text>
                    <Text className="font-medium text-foreground text-base">{selectedAsset.name}</Text>
                  </View>
                  <View className="w-[48%]">
                    <Text className="text-sm text-muted-foreground mb-1">Category</Text>
                    <Text className="font-medium text-foreground text-base">{selectedAsset.category}</Text>
                  </View>
                  <View className="w-[48%]">
                    <Text className="text-sm text-muted-foreground mb-1">Location</Text>
                    <Text className="font-medium text-foreground text-base">{selectedAsset.location}</Text>
                  </View>
                  <View className="w-[48%]">
                    <Text className="text-sm text-muted-foreground mb-1">Condition</Text>
                    {getConditionBadge(selectedAsset.condition)}
                  </View>
                  <View className="w-[48%]">
                    <Text className="text-sm text-muted-foreground mb-1">Purchase Value</Text>
                    <Text className="font-medium text-foreground text-base">
                      ${selectedAsset.purchaseValue.toFixed(2)}
                    </Text>
                  </View>
                  <View className="w-[48%]">
                    <Text className="text-sm text-muted-foreground mb-1">Current Value</Text>
                    <Text className="font-bold text-accent text-lg">
                      ${selectedAsset.currentValue.toFixed(2)}
                    </Text>
                  </View>
                  <View className="w-[48%]">
                    <Text className="text-sm text-muted-foreground mb-1">Depreciation</Text>
                    <Text className="font-medium text-destructive text-base">
                      ${(selectedAsset.purchaseValue - selectedAsset.currentValue).toFixed(2)}
                    </Text>
                  </View>
                  <View className="w-[48%]">
                    <Text className="text-sm text-muted-foreground mb-1">Purchase Date</Text>
                    <Text className="font-medium text-foreground text-base">
                      {new Date(selectedAsset.purchaseDate).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View className="flex-row space-x-3 pt-4">
                  <TouchableOpacity 
                    className="flex-1 bg-destructive rounded-lg py-3"
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
                    <Text className="text-destructive-foreground text-center font-semibold">
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

export default AdminAssets;