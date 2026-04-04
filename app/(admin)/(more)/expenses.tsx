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
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { addExpense, fetchOperationalData } from '../../../store/slices/userSlice';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import type { ExpenseRecord } from '../../../store/types';
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

const EXPENSE_CATEGORY_OPTIONS = [
  'Rent',
  'Utilities',
  'Salaries',
  'Marketing',
  'Maintenance',
  'Supplies',
  'Transportation',
  'Insurance',
  'Professional Services',
  'Miscellaneous',
] as const;

type ExpenseCategory = typeof EXPENSE_CATEGORY_OPTIONS[number];
type CategoryFilter = 'all' | ExpenseCategory;

interface ExpenseFormData {
  category: ExpenseCategory | '';
  description: string;
  amount: string;
}

interface StatCard {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const AdminExpenses = () => {
  const { expenses } = useAppSelector((state) => state.user);
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!user?.businessId) return;
    dispatch(fetchOperationalData(user.businessId));
  }, [dispatch, user?.businessId]);
  
  const [filteredExpenses, setFilteredExpenses] = useState<ExpenseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRecord | null>(null);
  
  const [formData, setFormData] = useState<ExpenseFormData>({
    category: '',
    description: '',
    amount: '',
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
      setFilteredExpenses(expenses);
    }, 1000);
    return () => clearTimeout(timer);
  }, [expenses]);

  useEffect(() => {
    let filtered = expenses;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (expense) =>
          expense.description.toLowerCase().includes(query) ||
          expense.id.toString().includes(query),
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((expense) => expense.category === categoryFilter);
    }

    setFilteredExpenses(filtered);
  }, [searchQuery, categoryFilter, expenses]);

  const handleRefresh = async () => {
    if (!user?.businessId) return;
    setIsRefreshing(true);
    try {
      await dispatch(fetchOperationalData(user.businessId));
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.category || !formData.description || !formData.amount) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (!user?.businessId) {
      Alert.alert('Error', 'Business context missing. Please sign in again.');
      return;
    }

    setIsSubmitting(true);
    try {
      const amount = parseFloat(formData.amount);
      await apiClient.createExpense({
        category: formData.category,
        description: formData.description,
        amount,
        businessId: user.businessId,
      });

      dispatch(
        addExpense({
          category: formData.category,
          description: formData.description,
          amount,
        }),
      );
      dispatch(fetchOperationalData(user.businessId));

      Alert.alert('Success', 'Expense saved to backend successfully');
      setIsDialogOpen(false);
      setFormData({ category: '', description: '', amount: '' });
    } catch (error) {
      console.error('Error creating expense:', error);
      Alert.alert('Error', 'Failed to add expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate statistics
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const categoryTotals = expenses.reduce<Record<string, number>>((acc, expense) => {
    const key = expense.category;
    acc[key] = (acc[key] ?? 0) + expense.amount;
    return acc;
  }, {});

  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

  // Stat cards
  const statCards: StatCard[] = [
    {
      title: "Total Expenses",
      value: `$${totalExpenses}`,
      icon: "cash-outline",
      color: COLORS.accent,
    },
    {
      title: "Number of Expenses",
      value: expenses.length.toString(),
      icon: "receipt-outline",
      color: COLORS.primary,
    },
    {
      title: "Top Category",
      value: topCategory?.[0] || 'None',
      icon: "trending-up-outline",
      color: COLORS.success,
    },
  ];

  // Category colors
  const getCategoryColor = (category: string) => {
    const colorMap: Record<ExpenseCategory, { bg: string, text: string }> = {
      Rent: { bg: '#dbeafe', text: '#1e40af' },
      Utilities: { bg: '#d1fae5', text: '#065f46' },
      Salaries: { bg: '#ede9fe', text: '#5b21b6' },
      Marketing: { bg: '#fce7f3', text: '#9d174d' },
      Maintenance: { bg: '#fef3c7', text: '#92400e' },
      Supplies: { bg: '#e0e7ff', text: '#3730a3' },
      Transportation: { bg: '#fed7aa', text: '#9a3412' },
      Insurance: { bg: '#fee2e2', text: '#991b1b' },
      'Professional Services': { bg: '#ccfbf1', text: '#0f766e' },
      Miscellaneous: { bg: '#f1f5f9', text: '#475569' },
    };
    
    return colorMap[category as ExpenseCategory] ?? { bg: '#f1f5f9', text: '#475569' };
  };

  // Render expense item
  const renderExpenseItem = ({ item }: { item: ExpenseRecord }) => {
    const categoryColor = getCategoryColor(item.category);
    const date = new Date(item.date);
    
    return (
      <TouchableOpacity 
        style={[styles.expenseCard, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}
        onPress={() => setSelectedExpense(item)}
        activeOpacity={0.7}
      >
        <View style={styles.expenseHeader}>
          <View style={styles.expenseInfo}>
            <Text style={[styles.expenseDescription, { color: COLORS.primary }]}>
              {item.description}
            </Text>
            <Text style={[styles.expenseDate, { color: COLORS.muted }]}>
              {date.toLocaleDateString()}
            </Text>
          </View>
          <Text style={[styles.expenseAmount, { color: COLORS.accent }]}>
            ${item.amount}
          </Text>
        </View>
        
        <View style={styles.expenseFooter}>
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor.bg }]}>
            <Text style={[styles.categoryText, { color: categoryColor.text }]}>
              {item.category}
            </Text>
          </View>
          <Text style={[styles.expenseId, { color: COLORS.muted }]}>
            #{item.id.toString().padStart(4, '0')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: COLORS.background }]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={[styles.loadingText, { color: COLORS.muted }]}>Loading expenses...</Text>
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
          <Text style={[styles.title, { color: COLORS.primary }]}>Expenses</Text>
          <Text style={[styles.subtitle, { color: COLORS.muted }]}>Track business expenses</Text>
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
              style={[
                styles.statCard, 
                { 
                  backgroundColor: COLORS.card,
                  borderColor: COLORS.border 
                }
              ]}
            >
              <View style={[styles.statIcon, { backgroundColor: `${stat.color}15` }]}>
                <Ionicons name={stat.icon} size={20} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: COLORS.primary }]}>{stat.value}</Text>
              <Text style={[styles.statTitle, { color: COLORS.muted }]}>{stat.title}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Search and Filter Section */}
        <View style={[styles.searchCard, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}>
          <View style={styles.searchHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: COLORS.primary }]}>Expense History</Text>
              <Text style={[styles.sectionSubtitle, { color: COLORS.muted }]}>
                {filteredExpenses.length} expenses found
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: COLORS.accent }]}
              onPress={() => setIsDialogOpen(true)}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add Expense</Text>
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <View style={[styles.searchBar, { backgroundColor: COLORS.input }]}>
              <Ionicons name="search" size={18} color={COLORS.muted} />
              <TextInput
                placeholder="Search expenses..."
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

          {/* Category Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoryContainer}>
              <TouchableOpacity
                style={[
                  styles.categoryFilter,
                  { 
                    backgroundColor: categoryFilter === 'all' ? COLORS.accent : COLORS.input,
                    borderColor: categoryFilter === 'all' ? COLORS.accent : COLORS.border
                  }
                ]}
                onPress={() => setCategoryFilter('all')}
              >
                <Text style={[
                  styles.categoryFilterText,
                  { color: categoryFilter === 'all' ? '#FFFFFF' : COLORS.primary }
                ]}>
                  All Categories
                </Text>
              </TouchableOpacity>
              {EXPENSE_CATEGORY_OPTIONS.map((category) => {
                const categoryColor = getCategoryColor(category);
                const isActive = categoryFilter === category;
                return (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryFilter,
                      { 
                        backgroundColor: isActive ? COLORS.primary : COLORS.input,
                        borderColor: isActive ? COLORS.primary : COLORS.border
                      }
                    ]}
                    onPress={() => setCategoryFilter(category)}
                  >
                    <Text style={[
                      styles.categoryFilterText,
                      { color: isActive ? '#FFFFFF' : COLORS.primary }
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Expenses List */}
        {filteredExpenses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color={COLORS.border} />
            <Text style={[styles.emptyTitle, { color: COLORS.primary }]}>No expenses found</Text>
            <Text style={[styles.emptyText, { color: COLORS.muted }]}>
              {searchQuery || categoryFilter !== 'all' 
                ? 'Try adjusting your search'
                : 'Start by adding your first expense'
              }
            </Text>
            {(searchQuery || categoryFilter !== 'all') && (
              <TouchableOpacity
                style={[styles.clearButton, { backgroundColor: COLORS.danger }]}
                onPress={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                }}
              >
                <Text style={styles.clearButtonText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredExpenses}
            renderItem={renderExpenseItem}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            style={styles.expensesList}
            contentContainerStyle={styles.expensesContent}
          />
        )}
      </ScrollView>

      {/* Add Expense Modal */}
      <Modal
        visible={isDialogOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsDialogOpen(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: COLORS.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: COLORS.border }]}>
            <Text style={[styles.modalTitle, { color: COLORS.primary }]}>New Expense</Text>
            <TouchableOpacity onPress={() => setIsDialogOpen(false)}>
              <Ionicons name="close" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
            <View style={styles.formContainer}>
              {/* Category */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: COLORS.primary }]}>Category *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.categoryGrid}>
                    {EXPENSE_CATEGORY_OPTIONS.map((category) => {
                      const categoryColor = getCategoryColor(category);
                      const isActive = formData.category === category;
                      return (
                        <TouchableOpacity
                          key={category}
                          style={[
                            styles.categoryTag,
                            { 
                              backgroundColor: isActive ? COLORS.primary : COLORS.input,
                              borderColor: isActive ? COLORS.primary : COLORS.border
                            }
                          ]}
                          onPress={() => setFormData({ ...formData, category })}
                        >
                          <Text style={[
                            styles.categoryTagText,
                            { color: isActive ? '#FFFFFF' : COLORS.primary }
                          ]}>
                            {category}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>

              {/* Description */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: COLORS.primary }]}>Description *</Text>
                <TextInput
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Enter expense description"
                  style={[styles.descriptionInput, { 
                    backgroundColor: COLORS.input,
                    borderColor: COLORS.border,
                    color: COLORS.primary 
                  }]}
                  placeholderTextColor={COLORS.muted}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Amount */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: COLORS.primary }]}>Amount *</Text>
                <TextInput
                  value={formData.amount}
                  onChangeText={(text) => setFormData({ ...formData, amount: text })}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  style={[styles.amountInput, { 
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
                <Text style={styles.submitButtonText}>{isSubmitting ? 'Saving...' : 'Add Expense'}</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Expense Detail Modal */}
      <Modal
        visible={!!selectedExpense}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedExpense(null)}
      >
        {selectedExpense && (
          <SafeAreaView style={[styles.modalContainer, { backgroundColor: COLORS.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: COLORS.border }]}>
              <Text style={[styles.modalTitle, { color: COLORS.primary }]}>
                Expense Details
              </Text>
              <TouchableOpacity onPress={() => setSelectedExpense(null)}>
                <Ionicons name="close" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
              <View style={styles.detailsContainer}>
                {/* Details */}
                <View style={styles.detailsSection}>
                  <View style={styles.detailLine}>
                    <Text style={styles.detailLineLabel}>Total Amount</Text>
                    <Text style={[styles.detailLineValue, styles.detailLineAccent]}>${selectedExpense.amount}</Text>
                  </View>
                  <View style={styles.detailLine}>
                    <Text style={styles.detailLineLabel}>Description</Text>
                    <Text style={styles.detailLineValue}>{selectedExpense.description}</Text>
                  </View>
                  <View style={styles.detailLine}>
                    <Text style={styles.detailLineLabel}>Category</Text>
                    <View style={[styles.categoryBadge, { 
                      backgroundColor: getCategoryColor(selectedExpense.category).bg 
                    }]}>
                      <Text style={[styles.categoryText, { 
                        color: getCategoryColor(selectedExpense.category).text 
                      }]}>
                        {selectedExpense.category}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailLine}>
                    <Text style={styles.detailLineLabel}>Date</Text>
                    <Text style={styles.detailLineValue}>{new Date(selectedExpense.date).toLocaleDateString()}</Text>
                  </View>
                  <View style={[styles.detailLine, styles.detailLineLast]}>
                    <Text style={styles.detailLineLabel}>Expense ID</Text>
                    <Text style={styles.detailLineValue}>#{selectedExpense.id.toString().padStart(4, '0')}</Text>
                  </View>
                </View>

                {/* Category Statistics */}
                <View style={[styles.statsSection, { backgroundColor: COLORS.mutedLight }]}>
                  <Text style={[styles.statsTitle, { color: COLORS.primary }]}>
                    Category Statistics
                  </Text>
                  <View style={styles.statsGrid}>
                    <View style={styles.statRow}>
                      <Text style={[styles.statLabel, { color: COLORS.muted }]}>
                        Total in {selectedExpense.category}
                      </Text>
                      <Text style={[styles.statValue, { color: COLORS.primary }]}>
                        ${categoryTotals[selectedExpense.category] || '0.00'}
                      </Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={[styles.statLabel, { color: COLORS.muted }]}>
                        Percentage of Total
                      </Text>
                      <Text style={[styles.statValue, { color: COLORS.primary }]}>
                        {((categoryTotals[selectedExpense.category] / totalExpenses) * 100).toFixed(1)}%
                      </Text>
                    </View>
                  </View>
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

  // Category Filter
  categoryContainer: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  categoryFilter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryFilterText: {
    fontSize: 13,
    fontWeight: "500",
  },

  // Expenses List
  expensesList: {
    marginHorizontal: 20,
  },
  expensesContent: {
    paddingBottom: 40,
  },
  expenseCard: {
    ...ADMIN_LIST_CARD,
    marginBottom: 12,
  },
  expenseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 13,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: "700",
  },
  expenseFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
  },
  expenseId: {
    fontSize: 12,
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
    gap: 12,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryTag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  categoryTagText: {
    fontSize: 13,
    fontWeight: "500",
  },
  descriptionInput: {
    ...ADMIN_INPUT_FIELD,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },
  amountInput: {
    ...ADMIN_INPUT_FIELD,
    fontSize: 18,
    fontWeight: "600",
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
  detailsSection: {
    ...ADMIN_MODAL_SECTION,
    gap: 20,
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
  detailRow: {
    flexDirection: "row",
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  detailsGrid: {
    flexDirection: "row",
    gap: 16,
  },
  statsSection: {
    ...ADMIN_MODAL_SECTION,
    padding: 16,
    gap: 12,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  statsGrid: {
    gap: 12,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: {
    fontSize: 14,
  },
  
});

export default AdminExpenses;
