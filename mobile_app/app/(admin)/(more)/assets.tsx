import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { fetchAssets } from '../../../store/slices/assetsSlice';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import type { AssetRecord } from '../../../store/types';
import { apiClient } from '../../../services/api';
import { ADMIN_COLORS, ADMIN_GRID_2X2, ADMIN_GRID_ITEM } from '../../../theme/adminUi';

const MAX_CURRENCY_VALUE = 9_999_999_999.99;
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

const COLORS = {
  primary: '#0f172a',
  accent: '#f97316',
  background: '#ffffff',
  card: '#ffffff',
  border: '#e2e8f0',
  input: '#f8fafc',
  muted: '#64748b',
  mutedLight: '#f8fafc',
  danger: '#ea580c',
  success: '#0f172a',
  warning: '#f97316',
};

const CATEGORY_OPTIONS = ['Equipment', 'Furniture', 'Vehicle', 'Electronics', 'Software', 'Other'];
const CONDITION_OPTIONS = [
  { value: 'all' as const, label: 'All' },
  { value: 'excellent' as const, label: 'Excellent' },
  { value: 'good' as const, label: 'Good' },
  { value: 'fair' as const, label: 'Fair' },
  { value: 'poor' as const, label: 'Poor' },
];

const getConditionColor = (condition: AssetRecord['condition']) => {
  const colorMap: Record<AssetRecord['condition'], string> = {
    excellent: COLORS.success,
    good: COLORS.primary,
    fair: COLORS.warning,
    poor: COLORS.danger,
  };

  return colorMap[condition] ?? COLORS.muted;
};

const AdminAssets = () => {
  const { assets } = useAppSelector((state) => state.assets);
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!user?.businessId) return;
    dispatch(fetchAssets(user.businessId));
  }, [dispatch, user?.businessId]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingAsset, setIsSubmittingAsset] = useState(false);
  const [isDeletingAsset, setIsDeletingAsset] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [conditionFilter, setConditionFilter] = useState<ConditionFilter>('all');
  const [selectedAsset, setSelectedAsset] = useState<AssetRecord | null>(null);
  const [editingAsset, setEditingAsset] = useState<AssetRecord | null>(null);
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
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, [assets]);

  const filteredAssets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return assets.filter((asset) => {
      const matchesSearch =
        !query ||
        asset.name.toLowerCase().includes(query) ||
        asset.category.toLowerCase().includes(query) ||
        asset.location.toLowerCase().includes(query);

      const matchesCondition = conditionFilter === 'all' || asset.condition === conditionFilter;

      return matchesSearch && matchesCondition;
    });
  }, [assets, conditionFilter, searchQuery]);

  const totalValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
  const totalPurchaseValue = assets.reduce((sum, asset) => sum + asset.purchaseValue, 0);
  const depreciation = totalPurchaseValue - totalValue;

  const statCards: StatCard[] = [
    {
      title: 'Total Assets',
      value: assets.length.toString(),
      icon: 'cube-outline',
      color: COLORS.primary,
    },
    {
      title: 'Current Value',
      value: `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      icon: 'cash-outline',
      color: COLORS.success,
    },
    {
      title: 'Purchase Value',
      value: `$${totalPurchaseValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      icon: 'receipt-outline',
      color: COLORS.accent,
    },
    {
      title: 'Depreciation',
      value: `$${depreciation.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      icon: 'trending-down-outline',
      color: COLORS.danger,
    },
  ];

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      purchaseValue: '',
      currentValue: '',
      purchaseDate: new Date(),
      condition: 'good',
      location: '',
    });
    setEditingAsset(null);
  };

  const openCreateAsset = () => {
    resetForm();
    setIsAssetModalOpen(true);
  };

  const handleEditAsset = (asset: AssetRecord) => {
    setSelectedAsset(null);
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      category: asset.category,
      purchaseValue: asset.purchaseValue.toFixed(2),
      currentValue: asset.currentValue.toFixed(2),
      purchaseDate: new Date(asset.purchaseDate),
      condition: asset.condition,
      location: asset.location,
    });
    setIsAssetModalOpen(true);
  };

  const handleSubmit = async () => {
    if (
      !formData.name.trim() ||
      !formData.category ||
      !formData.purchaseValue ||
      !formData.currentValue ||
      !formData.location.trim()
    ) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    if (!user?.businessId) {
      Alert.alert('Error', 'Business context is missing. Please sign in again.');
      return;
    }

    const purchaseValue = Number.parseFloat(formData.purchaseValue);
    const currentValue = Number.parseFloat(formData.currentValue);

    if (!Number.isFinite(purchaseValue) || purchaseValue <= 0) {
      Alert.alert('Error', 'Purchase value must be greater than zero.');
      return;
    }

    if (!Number.isFinite(currentValue) || currentValue < 0) {
      Alert.alert('Error', 'Current value must be zero or greater.');
      return;
    }

    if (purchaseValue > MAX_CURRENCY_VALUE || currentValue > MAX_CURRENCY_VALUE) {
      Alert.alert('Error', `Values must be below ${MAX_CURRENCY_VALUE.toFixed(2)}.`);
      return;
    }

    setIsSubmittingAsset(true);
    try {
      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        purchaseValue: Number(purchaseValue.toFixed(2)),
        currentValue: Number(currentValue.toFixed(2)),
        purchaseDate: formData.purchaseDate.toISOString().split('T')[0],
        condition: formData.condition,
        location: formData.location.trim(),
        businessId: user.businessId,
      };

      if (editingAsset) {
        await apiClient.updateAsset(editingAsset.id, payload);
      } else {
        await apiClient.createAsset(payload, user.businessId);
      }

      dispatch(fetchAssets(user.businessId));
      Alert.alert('Success', editingAsset ? 'Asset updated successfully.' : 'Asset added successfully.');
      setIsAssetModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving asset:', error);
      const message = error instanceof Error ? error.message : 'Failed to save asset';
      Alert.alert('Error', message);
    } finally {
      setIsSubmittingAsset(false);
    }
  };

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
            setIsDeletingAsset(true);
            try {
              await apiClient.deleteAsset(asset.id);
              if (user?.businessId) {
                dispatch(fetchAssets(user.businessId));
              }
              setSelectedAsset(null);
              Alert.alert('Success', 'Asset deleted successfully.');
            } catch (error) {
              console.error('Error deleting asset:', error);
              const message = error instanceof Error ? error.message : 'Failed to delete asset';
              Alert.alert('Error', message);
            } finally {
              setIsDeletingAsset(false);
            }
          },
        },
      ],
    );
  };

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
            <Text
              style={[
                styles.depreciationText,
                { color: depreciationValue > 0 ? COLORS.danger : COLORS.success },
              ]}
            >
              ${depreciationValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: COLORS.background }]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={[styles.loadingText, { color: COLORS.muted }]}>Loading assets...</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: COLORS.primary }]}>Assets</Text>
          <Text style={[styles.subtitle, { color: COLORS.muted }]}>Manage business assets</Text>
        </View>

        <View style={styles.statsGrid}>
          {statCards.map((stat) => (
            <View key={stat.title} style={styles.statCardWrapper}>
              <View style={[styles.statCard, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}>
                <View style={[styles.statIcon, { backgroundColor: `${stat.color}15` }]}>
                  <Ionicons name={stat.icon} size={20} color={stat.color} />
                </View>
                <Text style={[styles.statValue, { color: COLORS.primary }]}>{stat.value}</Text>
                <Text style={[styles.statTitle, { color: COLORS.muted }]}>{stat.title}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.searchCard, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}>
          <View style={styles.searchHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: COLORS.primary }]}>Asset Inventory</Text>
              <Text style={[styles.sectionSubtitle, { color: COLORS.muted }]}>
                {filteredAssets.length} assets found
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: COLORS.primary }]}
              onPress={openCreateAsset}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add Asset</Text>
            </TouchableOpacity>
          </View>

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
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={COLORS.muted} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterContainer}>
              {CONDITION_OPTIONS.map((option) => {
                const isActive = conditionFilter === option.value;
                const conditionColor = option.value === 'all' ? COLORS.primary : getConditionColor(option.value);
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterButton,
                      {
                        backgroundColor: isActive ? conditionColor : COLORS.input,
                        borderColor: isActive ? conditionColor : COLORS.border,
                      },
                    ]}
                    onPress={() => setConditionFilter(option.value)}
                  >
                    <Text
                      style={[
                        styles.filterButtonText,
                        { color: isActive ? '#FFFFFF' : COLORS.primary },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {filteredAssets.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color={COLORS.border} />
            <Text style={[styles.emptyTitle, { color: COLORS.primary }]}>No assets found</Text>
            <Text style={[styles.emptyText, { color: COLORS.muted }]}>
              {searchQuery || conditionFilter !== 'all'
                ? 'Try adjusting your search'
                : 'Start by adding your first asset'}
            </Text>
            {searchQuery || conditionFilter !== 'all' ? (
              <TouchableOpacity
                style={[styles.clearButton, { backgroundColor: COLORS.primary }]}
                onPress={() => {
                  setSearchQuery('');
                  setConditionFilter('all');
                }}
              >
                <Text style={styles.clearButtonText}>Clear Filters</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: COLORS.primary }]}
                onPress={openCreateAsset}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Add Asset</Text>
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

      <Modal
        visible={isAssetModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setIsAssetModalOpen(false);
          resetForm();
        }}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: COLORS.background }]} edges={['top', 'bottom']}>
          <View style={[styles.modalHeader, { borderBottomColor: COLORS.border }]}>
            <Text style={[styles.modalTitle, { color: COLORS.primary }]}>
              {editingAsset ? 'Edit Asset' : 'Add Asset'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setIsAssetModalOpen(false);
                resetForm();
              }}
            >
              <Ionicons name="close" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
              <View style={styles.formContainer}>
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: COLORS.primary }]}>Asset Name *</Text>
                  <TextInput
                    value={formData.name}
                    onChangeText={(text) => setFormData((prev) => ({ ...prev, name: text }))}
                    placeholder="Enter asset name"
                    style={[styles.formInput, { backgroundColor: COLORS.input, borderColor: COLORS.border, color: COLORS.primary }]}
                    placeholderTextColor={COLORS.muted}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: COLORS.primary }]}>Category *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.categoryContainer}>
                      {CATEGORY_OPTIONS.map((category) => {
                        const isActive = formData.category === category;
                        return (
                          <TouchableOpacity
                            key={category}
                            style={[
                              styles.categoryButton,
                              {
                                backgroundColor: isActive ? COLORS.primary : COLORS.input,
                                borderColor: isActive ? COLORS.primary : COLORS.border,
                              },
                            ]}
                            onPress={() => setFormData((prev) => ({ ...prev, category }))}
                          >
                            <Text
                              style={[
                                styles.categoryButtonText,
                                { color: isActive ? '#FFFFFF' : COLORS.primary },
                              ]}
                            >
                              {category}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, styles.formGroupHalf]}>
                    <Text style={[styles.formLabel, { color: COLORS.primary }]}>Purchase Value *</Text>
                    <TextInput
                      value={formData.purchaseValue}
                      onChangeText={(text) => setFormData((prev) => ({ ...prev, purchaseValue: text }))}
                      placeholder="0.00"
                      keyboardType="decimal-pad"
                      style={[styles.formInput, { backgroundColor: COLORS.input, borderColor: COLORS.border, color: COLORS.primary }]}
                      placeholderTextColor={COLORS.muted}
                    />
                  </View>
                  <View style={[styles.formGroup, styles.formGroupHalf]}>
                    <Text style={[styles.formLabel, { color: COLORS.primary }]}>Current Value *</Text>
                    <TextInput
                      value={formData.currentValue}
                      onChangeText={(text) => setFormData((prev) => ({ ...prev, currentValue: text }))}
                      placeholder="0.00"
                      keyboardType="decimal-pad"
                      style={[styles.formInput, { backgroundColor: COLORS.input, borderColor: COLORS.border, color: COLORS.primary }]}
                      placeholderTextColor={COLORS.muted}
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: COLORS.primary }]}>Purchase Date</Text>
                  <TouchableOpacity
                    style={[styles.dateButton, { backgroundColor: COLORS.input, borderColor: COLORS.border }]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={18} color={COLORS.muted} />
                    <Text style={[styles.dateButtonText, { color: COLORS.primary }]}>
                      {formData.purchaseDate.toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                  {showDatePicker ? (
                    <DateTimePicker
                      value={formData.purchaseDate}
                      mode="date"
                      display="default"
                      onChange={(_, date) => {
                        setShowDatePicker(false);
                        if (date) {
                          setFormData((prev) => ({ ...prev, purchaseDate: date }));
                        }
                      }}
                    />
                  ) : null}
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: COLORS.primary }]}>Condition</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.conditionContainer}>
                      {(['excellent', 'good', 'fair', 'poor'] as AssetRecord['condition'][]).map((condition) => {
                        const isActive = formData.condition === condition;
                        const conditionColor = getConditionColor(condition);
                        return (
                          <TouchableOpacity
                            key={condition}
                            style={[
                              styles.conditionButton,
                              {
                                backgroundColor: isActive ? conditionColor : COLORS.input,
                                borderColor: isActive ? conditionColor : COLORS.border,
                              },
                            ]}
                            onPress={() => setFormData((prev) => ({ ...prev, condition }))}
                          >
                            <Text
                              style={[
                                styles.conditionButtonText,
                                { color: isActive ? '#FFFFFF' : COLORS.primary },
                              ]}
                            >
                              {condition.charAt(0).toUpperCase() + condition.slice(1)}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: COLORS.primary }]}>Location *</Text>
                  <TextInput
                    value={formData.location}
                    onChangeText={(text) => setFormData((prev) => ({ ...prev, location: text }))}
                    placeholder="Enter location"
                    style={[styles.formInput, { backgroundColor: COLORS.input, borderColor: COLORS.border, color: COLORS.primary }]}
                    placeholderTextColor={COLORS.muted}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: COLORS.accent },
                  isSubmittingAsset && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={isSubmittingAsset}
              >
                <View style={styles.buttonContent}>
                  {isSubmittingAsset ? <ActivityIndicator size="small" color="#FFFFFF" /> : null}
                  <Text style={styles.submitButtonText}>
                    {isSubmittingAsset
                      ? editingAsset
                        ? 'Updating Asset...'
                        : 'Saving Asset...'
                      : editingAsset
                        ? 'Update Asset'
                        : 'Add Asset'}
                  </Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={!!selectedAsset}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedAsset(null)}
      >
        {selectedAsset ? (
          <SafeAreaView style={[styles.modalContainer, { backgroundColor: COLORS.background }]} edges={['top', 'bottom']}>
            <View style={[styles.modalHeader, { borderBottomColor: COLORS.border }]}>
              <Text style={[styles.modalTitle, { color: COLORS.primary }]}>Asset Details</Text>
              <TouchableOpacity onPress={() => setSelectedAsset(null)}>
                <Ionicons name="close" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.assetDetailScrollContent}>
              <View style={styles.assetDetailStack}>
                <View style={[styles.assetDetailHero, { backgroundColor: COLORS.primary }]}>
                  <Text style={styles.assetDetailHeroValue}>
                    ${selectedAsset.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                  <Text style={styles.assetDetailHeroLabel}>Current Asset Value</Text>
                </View>

                <View style={styles.assetDetailSection}>
                  <View style={styles.assetDetailFieldWide}>
                    <Text style={[styles.assetDetailFieldLabel, { color: COLORS.muted }]}>Asset Name</Text>
                    <Text style={[styles.assetDetailFieldValue, { color: COLORS.primary }]}>{selectedAsset.name}</Text>
                  </View>
                  <View style={styles.assetDetailFieldWide}>
                    <Text style={[styles.assetDetailFieldLabel, { color: COLORS.muted }]}>Condition</Text>
                    <View
                      style={[
                        styles.conditionBadge,
                        { backgroundColor: `${getConditionColor(selectedAsset.condition)}15` },
                      ]}
                    >
                      <Text style={[styles.conditionText, { color: getConditionColor(selectedAsset.condition) }]}>
                        {selectedAsset.condition.charAt(0).toUpperCase() + selectedAsset.condition.slice(1)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.assetDetailGrid}>
                    <View style={styles.assetDetailField}>
                      <Text style={[styles.assetDetailFieldLabel, { color: COLORS.muted }]}>Category</Text>
                      <Text style={[styles.assetDetailFieldValue, { color: COLORS.primary }]}>{selectedAsset.category}</Text>
                    </View>
                    <View style={styles.assetDetailField}>
                      <Text style={[styles.assetDetailFieldLabel, { color: COLORS.muted }]}>Location</Text>
                      <Text style={[styles.assetDetailFieldValue, { color: COLORS.primary }]}>{selectedAsset.location}</Text>
                    </View>
                  </View>
                </View>

                <View style={[styles.assetDetailStatsCard, { backgroundColor: COLORS.mutedLight, borderColor: COLORS.border }]}>
                  <Text style={[styles.assetDetailStatsTitle, { color: COLORS.primary }]}>Value Breakdown</Text>
                  <View style={styles.assetDetailMetaGrid}>
                    <View style={styles.assetDetailMetaRow}>
                      <Text style={[styles.assetDetailMetaLabel, { color: COLORS.muted }]}>Purchase Date</Text>
                      <Text style={[styles.assetDetailMetaValue, { color: COLORS.primary }]}>
                        {new Date(selectedAsset.purchaseDate).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.assetDetailMetaRow}>
                      <Text style={[styles.assetDetailMetaLabel, { color: COLORS.muted }]}>Purchase Value</Text>
                      <Text style={[styles.assetDetailMetaValue, { color: COLORS.primary }]}>
                        ${selectedAsset.purchaseValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Text>
                    </View>
                    <View style={styles.assetDetailMetaRow}>
                      <Text style={[styles.assetDetailMetaLabel, { color: COLORS.muted }]}>Depreciation</Text>
                      <Text
                        style={[
                          styles.assetDetailMetaValue,
                          {
                            color:
                              selectedAsset.purchaseValue - selectedAsset.currentValue > 0
                                ? COLORS.danger
                                : COLORS.success,
                          },
                        ]}
                      >
                        ${(selectedAsset.purchaseValue - selectedAsset.currentValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.secondaryActionButton, { backgroundColor: COLORS.primary }]}
                    onPress={() => handleEditAsset(selectedAsset)}
                  >
                    <Text style={styles.secondaryActionText}>Edit Asset</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.deleteButton,
                      { backgroundColor: COLORS.danger },
                      isDeletingAsset && styles.submitButtonDisabled,
                    ]}
                    onPress={() => handleDeleteAsset(selectedAsset)}
                    disabled={isDeletingAsset}
                  >
                    {isDeletingAsset ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
                    )}
                    <Text style={styles.deleteButtonText}>
                      {isDeletingAsset ? 'Deleting...' : 'Delete Asset'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        ) : null}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  statsGrid: {
    ...ADMIN_GRID_2X2,
    marginHorizontal: 14,
    marginBottom: 20,
  },
  statCardWrapper: {
    ...ADMIN_GRID_ITEM,
  },
  statCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    minHeight: 136,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
  },
  searchCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  addButton: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
    marginRight: 8,
  },
  filterContainer: {
    flexDirection: 'row',
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
    fontWeight: '500',
  },
  assetsList: {
    marginHorizontal: 20,
  },
  assetsContent: {
    paddingBottom: 40,
  },
  assetCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  assetInfo: {
    flex: 1,
  },
  assetName: {
    fontSize: 16,
    fontWeight: '600',
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
    fontWeight: '600',
  },
  assetDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 13,
    marginLeft: 4,
  },
  assetValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  assetDate: {
    fontSize: 13,
  },
  depreciationText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  clearButton: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalScroll: {
    flex: 1,
    padding: 20,
  },
  formContainer: {
    gap: 24,
  },
  formGroup: {
    gap: 8,
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
  },
  formGroupHalf: {
    flex: 1,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  categoryContainer: {
    flexDirection: 'row',
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
    fontWeight: '500',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  dateButtonText: {
    fontSize: 16,
  },
  conditionContainer: {
    flexDirection: 'row',
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
    fontWeight: '500',
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  assetDetailScrollContent: {
    paddingBottom: 28,
  },
  assetDetailStack: {
    gap: 20,
  },
  assetDetailHero: {
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assetDetailHeroValue: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  assetDetailHeroLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.92,
  },
  assetDetailSection: {
    gap: 16,
  },
  assetDetailGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  assetDetailField: {
    flex: 1,
    backgroundColor: ADMIN_COLORS.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    padding: 16,
    gap: 8,
  },
  assetDetailFieldWide: {
    backgroundColor: ADMIN_COLORS.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    padding: 16,
    gap: 8,
  },
  assetDetailFieldLabel: {
    fontSize: 13,
  },
  assetDetailFieldValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  assetDetailStatsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  assetDetailStatsTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  assetDetailMetaGrid: {
    gap: 10,
  },
  assetDetailMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  assetDetailMetaLabel: {
    fontSize: 14,
  },
  assetDetailMetaValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    gap: 12,
  },
  secondaryActionButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AdminAssets;
