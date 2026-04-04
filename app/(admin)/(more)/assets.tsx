import { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  Modal,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addAsset, deleteAsset } from '../../../store/slices/assetsSlice';
import { fetchAssets } from '../../../store/slices/assetsSlice';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import type { AssetRecord } from '../../../store/types';
import { apiClient } from '../../../services/api';
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
  ADMIN_PAGE_SUBTITLE,
  ADMIN_PRIMARY_BUTTON,
  ADMIN_PRIMARY_BUTTON_DISABLED,
  ADMIN_PAGE_TITLE,
  ADMIN_SECTION_CARD,
  ADMIN_SECTION_SUBTITLE,
  ADMIN_SECTION_TITLE,
  ADMIN_STAT_CARD,
} from '../../../theme/adminUi';

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

interface StatCard {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const AdminAssets = () => {
  const { assets } = useAppSelector((state) => state.assets);
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!user?.businessId) return;
    dispatch(fetchAssets(user.businessId));
  }, [dispatch, user?.businessId]);
  
  const [filteredAssets, setFilteredAssets] = useState<AssetRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
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

  // Colors based on your Tailwind config
  const COLORS = {
    primary: ADMIN_COLORS.text,
    primaryLight: '#1e293b',
    accent: ADMIN_COLORS.accent,
    accentLight: '#fb923c',
    background: ADMIN_COLORS.background,
    card: ADMIN_COLORS.surface,
    border: ADMIN_COLORS.border,
    input: ADMIN_COLORS.surfaceMuted,
    destructive: ADMIN_COLORS.danger,
    muted: ADMIN_COLORS.secondaryText,
    mutedLight: ADMIN_COLORS.line,
    success: ADMIN_COLORS.success,
    warning: ADMIN_COLORS.warning,
    danger: ADMIN_COLORS.danger,
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setFilteredAssets(assets);
    }, 1000);
    return () => clearTimeout(timer);
  }, [assets]);

  useEffect(() => {
    let filtered = assets;

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

  const handleRefresh = async () => {
    if (!user?.businessId) return;
    setIsRefreshing(true);
    try {
      await dispatch(fetchAssets(user.businessId));
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculate statistics
  const totalValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
  const totalPurchaseValue = assets.reduce((sum, asset) => sum + asset.purchaseValue, 0);
  const depreciation = totalPurchaseValue - totalValue;
  const depreciationPercentage = totalPurchaseValue > 0 ? (depreciation / totalPurchaseValue) * 100 : 0;

  // Stat cards configuration
  const statCards: StatCard[] = [
    {
      title: "Total Assets",
      value: assets.length.toString(),
      icon: "cube-outline",
      color: COLORS.primary,
    },
    {
      title: "Current Value",
      value: `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      icon: "cash-outline",
      color: COLORS.success,
    },
    {
      title: "Purchase Value",
      value: `$${totalPurchaseValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      icon: "receipt-outline",
      color: COLORS.accent,
    },
    {
      title: "Depreciation",
      value: `$${depreciation.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      icon: "trending-down-outline",
      color: COLORS.danger,
    },
  ];

  // Category options
  const categoryOptions = [
    'Equipment',
    'Furniture',
    'Vehicle',
    'Electronics',
    'Software',
    'Other'
  ];

  // Condition options
  const conditionOptions = [
    { value: 'all' as const, label: 'All' },
    { value: 'excellent' as const, label: 'Excellent' },
    { value: 'good' as const, label: 'Good' },
    { value: 'fair' as const, label: 'Fair' },
    { value: 'poor' as const, label: 'Poor' },
  ];

  // Get condition color
  const getConditionColor = (condition: AssetRecord['condition']) => {
    const colorMap: Record<AssetRecord['condition'], string> = {
      excellent: COLORS.success,
      good: '#3b82f6', // Blue
      fair: COLORS.warning,
      poor: COLORS.danger,
    };
    return colorMap[condition] || COLORS.muted;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.name || !formData.category || !formData.purchaseValue || !formData.currentValue || !formData.location) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!user?.businessId) {
      Alert.alert('Error', 'Business context is missing. Please sign in again.');
      return;
    }

    setIsSubmitting(true);
    try {
      const createdAsset = await apiClient.createAsset(
        {
          name: formData.name,
          category: formData.category,
          purchaseValue: parseFloat(formData.purchaseValue),
          currentValue: parseFloat(formData.currentValue),
          purchaseDate: formData.purchaseDate.toISOString().split('T')[0],
          condition: formData.condition,
          location: formData.location,
        },
        user.businessId,
      );

      dispatch(addAsset(createdAsset));

      Alert.alert('Success', 'Asset added successfully');
      setIsAssetModalOpen(false);
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
      const message = error instanceof Error ? error.message : 'Failed to add asset';
      Alert.alert('Error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle asset deletion
  const handleDeleteAsset = (asset: AssetRecord) => {
    Alert.alert(
      'Delete Asset',
      `Are you sure you want to delete "${asset.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await apiClient.deleteAsset(asset.id);
              dispatch(deleteAsset(asset.id));
              Alert.alert('Success', 'Asset deleted successfully');
              setSelectedAsset(null);
            } catch (error) {
              console.error('Error deleting asset:', error);
              const message = error instanceof Error ? error.message : 'Failed to delete asset';
              Alert.alert('Error', message);
            } finally {
              setIsDeleting(false);
            }
          }
        },
      ]
    );
  };

  // Render asset item
  const renderAssetItem = ({ item }: { item: AssetRecord }) => {
    const conditionColor = getConditionColor(item.condition);
    const depreciationValue = item.purchaseValue - item.currentValue;
    
    return (
      <TouchableOpacity 
        style={[styles.assetCard, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}
        onPress={() => setSelectedAsset(item)}
        activeOpacity={0.7}
      >
        <View style={styles.assetHeader}>
          <View style={styles.assetInfo}>
            <Text style={[styles.assetName, { color: COLORS.primary }]}>{item.name}</Text>
            <Text style={[styles.assetCategory, { color: COLORS.muted }]}>{item.category}</Text>
          </View>
          <View style={[styles.conditionBadge, { backgroundColor: `${conditionColor}15` }]}>
            <Text style={[styles.conditionText, { color: conditionColor }]}>
              {item.condition.charAt(0).toUpperCase() + item.condition.slice(1)}
            </Text>
          </View>
        </View>
        
        <View style={styles.assetDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="location-outline" size={14} color={COLORS.muted} />
              <Text style={[styles.detailText, { color: COLORS.muted }]}>{item.location}</Text>
            </View>
            <Text style={[styles.assetValue, { color: COLORS.accent }]}>
              ${item.currentValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.assetDate, { color: COLORS.muted }]}>
              {new Date(item.purchaseDate).toLocaleDateString()}
            </Text>
            <Text style={[styles.depreciationText, { color: depreciationValue > 0 ? COLORS.danger : COLORS.success }]}>
              ${depreciationValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: COLORS.background }]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={[styles.loadingText, { color: COLORS.muted }]}>Loading assets...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#f97316" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: COLORS.primary }]}>Assets</Text>
          <Text style={[styles.subtitle, { color: COLORS.muted }]}>Manage business assets</Text>
        </View>

        {/* Stats Grid */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.statsScroll}
          contentContainerStyle={styles.statsContent}
        >
          {statCards.map((stat, index) => (
            <View 
              key={index} 
              style={[styles.statCard, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}
            >
              <View style={[styles.statIcon, { backgroundColor: `${stat.color}15` }]}>
                <Ionicons name={stat.icon} size={20} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: COLORS.primary }]}>{stat.value}</Text>
              <Text style={[styles.statTitle, { color: COLORS.muted }]}>{stat.title}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Search and Actions Section */}
        <View style={[styles.searchCard, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}>
          <View style={styles.searchHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: COLORS.primary }]}>Asset Inventory</Text>
              <Text style={[styles.sectionSubtitle, { color: COLORS.muted }]}>
                {filteredAssets.length} assets found
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: COLORS.accent }]}
              onPress={() => setIsAssetModalOpen(true)}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add Asset</Text>
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <View style={[styles.searchBar, { backgroundColor: COLORS.input }]}>
              <Ionicons name="search" size={18} color={COLORS.muted} />
              <TextInput
                placeholder="Search assets..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={[styles.searchInput, { color: COLORS.primary }]}
                placeholderTextColor={COLORS.muted}
              />
              {searchQuery && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={COLORS.muted} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Condition Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterContainer}>
              {conditionOptions.map((option) => {
                const isActive = conditionFilter === option.value;
                const conditionColor = option.value !== 'all' ? getConditionColor(option.value) : COLORS.primary;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterButton,
                      { 
                        backgroundColor: isActive ? conditionColor : COLORS.input,
                        borderColor: isActive ? conditionColor : COLORS.border
                      }
                    ]}
                    onPress={() => setConditionFilter(option.value)}
                  >
                    <Text style={[
                      styles.filterButtonText,
                      { color: isActive ? '#FFFFFF' : COLORS.primary }
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Assets List */}
        {filteredAssets.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color={COLORS.border} />
            <Text style={[styles.emptyTitle, { color: COLORS.primary }]}>No assets found</Text>
            <Text style={[styles.emptyText, { color: COLORS.muted }]}>
              {searchQuery || conditionFilter !== 'all' 
                ? 'Try adjusting your search'
                : 'Start by adding your first asset'
              }
            </Text>
            {(searchQuery || conditionFilter !== 'all') && (
              <TouchableOpacity
                style={[styles.clearButton, { backgroundColor: COLORS.danger }]}
                onPress={() => {
                  setSearchQuery('');
                  setConditionFilter('all');
                }}
              >
                <Text style={styles.clearButtonText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredAssets}
            renderItem={renderAssetItem}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            style={styles.assetsList}
            contentContainerStyle={styles.assetsContent}
          />
        )}
      </ScrollView>

      {/* Add Asset Modal */}
      <Modal
        visible={isAssetModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsAssetModalOpen(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: COLORS.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: COLORS.border }]}>
            <Text style={[styles.modalTitle, { color: COLORS.primary }]}>Add Asset</Text>
            <TouchableOpacity onPress={() => setIsAssetModalOpen(false)}>
              <Ionicons name="close" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
            <View style={styles.formContainer}>
              {/* Asset Name */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: COLORS.primary }]}>Asset Name *</Text>
                <TextInput
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Enter asset name"
                  style={[styles.formInput, { 
                    backgroundColor: COLORS.input,
                    borderColor: COLORS.border,
                    color: COLORS.primary 
                  }]}
                  placeholderTextColor={COLORS.muted}
                />
              </View>

              {/* Category */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: COLORS.primary }]}>Category *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.categoryContainer}>
                    {categoryOptions.map((category) => (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.categoryButton,
                          { 
                            backgroundColor: formData.category === category ? COLORS.primary : COLORS.input,
                            borderColor: formData.category === category ? COLORS.primary : COLORS.border
                          }
                        ]}
                        onPress={() => setFormData({ ...formData, category })}
                      >
                        <Text style={[
                          styles.categoryButtonText,
                          { color: formData.category === category ? '#FFFFFF' : COLORS.primary }
                        ]}>
                          {category}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Purchase and Current Value */}
              <View style={styles.formRow}>
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={[styles.formLabel, { color: COLORS.primary }]}>Purchase Value *</Text>
                  <TextInput
                    value={formData.purchaseValue}
                    onChangeText={(text) => setFormData({ ...formData, purchaseValue: text })}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    style={[styles.formInput, { 
                      backgroundColor: COLORS.input,
                      borderColor: COLORS.border,
                      color: COLORS.primary 
                    }]}
                    placeholderTextColor={COLORS.muted}
                  />
                </View>
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={[styles.formLabel, { color: COLORS.primary }]}>Current Value *</Text>
                  <TextInput
                    value={formData.currentValue}
                    onChangeText={(text) => setFormData({ ...formData, currentValue: text })}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    style={[styles.formInput, { 
                      backgroundColor: COLORS.input,
                      borderColor: COLORS.border,
                      color: COLORS.primary 
                    }]}
                    placeholderTextColor={COLORS.muted}
                  />
                </View>
              </View>

              {/* Purchase Date */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: COLORS.primary }]}>Purchase Date</Text>
                <TouchableOpacity
                  style={[styles.dateButton, { 
                    backgroundColor: COLORS.input,
                    borderColor: COLORS.border 
                  }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={18} color={COLORS.muted} />
                  <Text style={[styles.dateButtonText, { color: COLORS.primary }]}>
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
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: COLORS.primary }]}>Condition</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.conditionContainer}>
                    {(['excellent', 'good', 'fair', 'poor'] as AssetRecord['condition'][]).map((condition) => {
                      const conditionColor = getConditionColor(condition);
                      const isActive = formData.condition === condition;
                      return (
                        <TouchableOpacity
                          key={condition}
                          style={[
                            styles.conditionButton,
                            { 
                              backgroundColor: isActive ? conditionColor : COLORS.input,
                              borderColor: isActive ? conditionColor : COLORS.border
                            }
                          ]}
                          onPress={() => setFormData({ ...formData, condition })}
                        >
                          <Text style={[
                            styles.conditionButtonText,
                            { color: isActive ? '#FFFFFF' : COLORS.primary }
                          ]}>
                            {condition.charAt(0).toUpperCase() + condition.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>

              {/* Location */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: COLORS.primary }]}>Location *</Text>
                <TextInput
                  value={formData.location}
                  onChangeText={(text) => setFormData({ ...formData, location: text })}
                  placeholder="Enter location"
                  style={[styles.formInput, { 
                    backgroundColor: COLORS.input,
                    borderColor: COLORS.border,
                    color: COLORS.primary 
                  }]}
                  placeholderTextColor={COLORS.muted}
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <View style={styles.buttonContent}>
                {isSubmitting && <ActivityIndicator size="small" color="#FFFFFF" />}
                <Text style={styles.submitButtonText}>{isSubmitting ? 'Saving...' : 'Add Asset'}</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Asset Details Modal */}
      <Modal
        visible={!!selectedAsset}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedAsset(null)}
      >
        {selectedAsset && (
          <SafeAreaView style={[styles.modalContainer, { backgroundColor: COLORS.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: COLORS.border }]}>
              <Text style={[styles.modalTitle, { color: COLORS.primary }]}>Asset Details</Text>
              <TouchableOpacity onPress={() => setSelectedAsset(null)}>
                <Ionicons name="close" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
              <View style={styles.detailsContainer}>
                {/* Asset Header */}
                <View style={styles.detailsHeader}>
                  <Text style={[styles.assetNameLarge, { color: COLORS.primary }]}>{selectedAsset.name}</Text>
                  <View style={[styles.conditionBadge, { 
                    backgroundColor: `${getConditionColor(selectedAsset.condition)}15` 
                  }]}>
                    <Text style={[styles.conditionText, { color: getConditionColor(selectedAsset.condition) }]}>
                      {selectedAsset.condition.charAt(0).toUpperCase() + selectedAsset.condition.slice(1)}
                    </Text>
                  </View>
                </View>

                {/* Details Grid */}
                <View style={styles.detailsGrid}>
                  <View style={styles.detailLine}>
                    <Text style={styles.detailLineLabel}>Category</Text>
                    <Text style={styles.detailLineValue}>{selectedAsset.category}</Text>
                  </View>
                  <View style={styles.detailLine}>
                    <Text style={styles.detailLineLabel}>Location</Text>
                    <Text style={styles.detailLineValue}>{selectedAsset.location}</Text>
                  </View>
                  <View style={styles.detailLine}>
                    <Text style={styles.detailLineLabel}>Purchase Date</Text>
                    <Text style={styles.detailLineValue}>{new Date(selectedAsset.purchaseDate).toLocaleDateString()}</Text>
                  </View>
                  <View style={styles.detailLine}>
                    <Text style={styles.detailLineLabel}>Purchase Value</Text>
                    <Text style={styles.detailLineValue}>
                      ${selectedAsset.purchaseValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                  </View>
                  <View style={styles.detailLine}>
                    <Text style={styles.detailLineLabel}>Current Value</Text>
                    <Text style={[styles.detailLineValue, styles.detailLineAccent]}>
                      ${selectedAsset.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                  </View>
                  <View style={[styles.detailLine, styles.detailLineLast]}>
                    <Text style={styles.detailLineLabel}>Depreciation</Text>
                    <Text style={[styles.detailLineValue, {
                      color: (selectedAsset.purchaseValue - selectedAsset.currentValue) > 0 ? COLORS.danger : COLORS.success,
                    }]}>
                      ${(selectedAsset.purchaseValue - selectedAsset.currentValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
                    onPress={() => handleDeleteAsset(selectedAsset)}
                    disabled={isDeleting}
                  >
                    <View style={styles.buttonContent}>
                      {isDeleting ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
                      )}
                      <Text style={styles.deleteButtonText}>{isDeleting ? 'Deleting...' : 'Delete Asset'}</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
    backgroundColor: ADMIN_COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: ADMIN_COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    ...ADMIN_PAGE_TITLE,
    marginBottom: 4,
  },
  subtitle: {
    ...ADMIN_PAGE_SUBTITLE,
  },

  // Stats
  statsScroll: {
    marginBottom: 20,
  },
  statsContent: {
    paddingHorizontal: 20,
    paddingRight: 40,
  },
  statCard: {
    ...ADMIN_STAT_CARD,
    padding: 16,
    marginRight: 12,
    width: 140,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
  },

  // Search Section
  searchCard: {
    ...ADMIN_SECTION_CARD,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  searchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    ...ADMIN_SECTION_TITLE,
  },
  sectionSubtitle: {
    ...ADMIN_SECTION_SUBTITLE,
    marginTop: 2,
  },
  addButton: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },

  // Search
  searchContainer: {
    marginBottom: 16,
  },
  searchBar: {
    ...ADMIN_INPUT_SURFACE,
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
    marginRight: 8,
  },

  // Filter
  filterContainer: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },

  // Assets List
  assetsList: {
    marginHorizontal: 20,
  },
  assetsContent: {
    paddingBottom: 40,
  },
  assetCard: {
    ...ADMIN_LIST_CARD,
    marginBottom: 12,
  },
  assetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  assetInfo: {
    flex: 1,
  },
  assetName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  assetCategory: {
    fontSize: 13,
  },
  conditionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  conditionText: {
    fontSize: 12,
    fontWeight: "600",
  },
  assetDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    fontSize: 13,
    marginLeft: 4,
  },
  assetValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  assetDate: {
    fontSize: 13,
  },
  depreciationText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  clearButton: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  clearButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  // Modal
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    ...ADMIN_MODAL_HEADER,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  modalScroll: {
    flex: 1,
    padding: 20,
  },
  modalContent: {
    gap: 16,
  },

  // Form
  formContainer: {
    ...ADMIN_MODAL_SECTION,
    gap: 24,
  },
  formGroup: {
    gap: 8,
  },
  formRow: {
    flexDirection: "row",
    gap: 16,
  },
  formGroupHalf: {
    flex: 1,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  formInput: {
    ...ADMIN_INPUT_FIELD,
    fontSize: 16,
  },
  categoryContainer: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  dateButton: {
    ...ADMIN_INPUT_SURFACE,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    gap: 8,
  },
  dateButtonText: {
    fontSize: 16,
  },
  conditionContainer: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  conditionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  conditionButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  submitButton: {
    ...ADMIN_PRIMARY_BUTTON,
    marginTop: 20,
  },
  submitButtonDisabled: {
    ...ADMIN_PRIMARY_BUTTON_DISABLED,
  },
  buttonContent: {
    ...ADMIN_BUTTON_CONTENT,
  },
  submitButtonText: {
    ...ADMIN_BUTTON_TEXT,
  },

  // Details Modal
  detailsContainer: {
    gap: 24,
  },
  detailsHeader: {
    ...ADMIN_MODAL_SECTION,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  assetNameLarge: {
    fontSize: 24,
    fontWeight: "700",
    flex: 1,
    marginRight: 12,
  },
  detailsGrid: {
    ...ADMIN_MODAL_SECTION,
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
  actionButtons: {
    ...ADMIN_MODAL_SECTION,
  },
  deleteButton: {
    ...ADMIN_PRIMARY_BUTTON,
    backgroundColor: ADMIN_COLORS.danger,
  },
  deleteButtonDisabled: {
    backgroundColor: '#fca5a5',
  },
  deleteButtonText: {
    ...ADMIN_BUTTON_TEXT,
  },
});

export default AdminAssets;
