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
import { fetchOperationalData } from '../../../store/slices/userSlice';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import type { ExpenseRecord } from '../../../store/types';
import { apiClient } from '../../../services/api';

const MAX_CURRENCY_VALUE = 9_999_999_999.99;
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
const EXPENSE_PAYMENT_METHOD_OPTIONS = ['Cash', 'Bank Transfer', 'Check', 'Online Payment'] as const;
const EXPENSE_STATUS_OPTIONS = ['Paid', 'Pending'] as const;

type ExpenseCategory = typeof EXPENSE_CATEGORY_OPTIONS[number];
type CategoryFilter = 'all' | ExpenseCategory;

interface ExpenseFormData {
  category: ExpenseCategory | '';
  description: string;
  amount: string;
  vendor: string;
  paymentMethod: ExpenseRecord['paymentMethod'];
  status: ExpenseRecord['status'];
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
};

const getCategoryColor = (category: string) => {
  const colorMap: Record<ExpenseCategory, { bg: string; text: string }> = {
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

const AdminExpenses = () => {
  const { expenses } = useAppSelector((state) => state.user);
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!user?.businessId) return;
    dispatch(fetchOperationalData(user.businessId));
  }, [dispatch, user?.businessId]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);
  const [isDeletingExpense, setIsDeletingExpense] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRecord | null>(null);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);

  const [formData, setFormData] = useState<ExpenseFormData>({
    category: '',
    description: '',
    amount: '',
    vendor: '',
    paymentMethod: 'Cash',
    status: 'Paid',
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return expenses.filter((expense) => {
      const matchesSearch =
        !query ||
        expense.description.toLowerCase().includes(query) ||
        expense.category.toLowerCase().includes(query) ||
        expense.vendor.toLowerCase().includes(query) ||
        expense.id.toString().includes(query);

      const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [categoryFilter, expenses, searchQuery]);

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const categoryTotals = expenses.reduce<Record<string, number>>((acc, expense) => {
    acc[expense.category] = (acc[expense.category] ?? 0) + expense.amount;
    return acc;
  }, {});
  const topCategory = Object.entries(categoryTotals).sort((left, right) => right[1] - left[1])[0];

  const statCards: StatCard[] = [
    {
      title: 'Total Expenses',
      value: `$${totalExpenses.toFixed(2)}`,
      icon: 'cash-outline',
      color: COLORS.accent,
    },
    {
      title: 'Number of Expenses',
      value: expenses.length.toString(),
      icon: 'receipt-outline',
      color: COLORS.primary,
    },
    {
      title: 'Top Category',
      value: topCategory?.[0] || 'None',
      icon: 'trending-up-outline',
      color: COLORS.primary,
    },
  ];

  const resetForm = () => {
    setFormData({
      category: '',
      description: '',
      amount: '',
      vendor: '',
      paymentMethod: 'Cash',
      status: 'Paid',
    });
    setEditingExpense(null);
  };

  const openCreateExpense = () => {
    resetForm();
    setIsExpenseModalOpen(true);
  };

  const handleEditExpense = (expense: ExpenseRecord) => {
    setSelectedExpense(null);
    setEditingExpense(expense);
    setFormData({
      category: expense.category as ExpenseCategory,
      description: expense.description,
      amount: expense.amount.toFixed(2),
      vendor: expense.vendor,
      paymentMethod: expense.paymentMethod,
      status: expense.status,
    });
    setIsExpenseModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.category || !formData.description.trim() || !formData.amount || !formData.vendor.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    if (!user?.businessId) {
      Alert.alert('Error', 'Business context missing. Please sign in again.');
      return;
    }

    const amount = Number.parseFloat(formData.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Error', 'Amount must be greater than zero.');
      return;
    }

    if (amount > MAX_CURRENCY_VALUE) {
      Alert.alert('Error', `Amount must be below ${MAX_CURRENCY_VALUE.toFixed(2)}.`);
      return;
    }

    setIsSubmittingExpense(true);
    try {
      const payload = {
        category: formData.category,
        description: formData.description.trim(),
        amount: Number(amount.toFixed(2)),
        vendor: formData.vendor.trim(),
        paymentMethod: formData.paymentMethod,
        status: formData.status,
        businessId: user.businessId,
      };

      if (editingExpense) {
        await apiClient.updateExpense(editingExpense.id, payload);
      } else {
        await apiClient.createExpense(payload);
      }

      dispatch(fetchOperationalData(user.businessId));
      Alert.alert('Success', editingExpense ? 'Expense updated successfully.' : 'Expense saved successfully.');
      setIsExpenseModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving expense:', error);
      const message = error instanceof Error ? error.message : 'Failed to save expense';
      Alert.alert('Error', message);
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  const handleDeleteExpense = (expense: ExpenseRecord) => {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete "${expense.description}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!user?.businessId) {
              Alert.alert('Error', 'Business context missing. Please sign in again.');
              return;
            }

            setIsDeletingExpense(true);
            try {
              await apiClient.deleteExpense(expense.id);
              dispatch(fetchOperationalData(user.businessId));
              setSelectedExpense(null);
              Alert.alert('Success', 'Expense deleted successfully.');
            } catch (error) {
              console.error('Error deleting expense:', error);
              const message = error instanceof Error ? error.message : 'Failed to delete expense';
              Alert.alert('Error', message);
            } finally {
              setIsDeletingExpense(false);
            }
          },
        },
      ],
    );
  };

  const renderExpenseItem = ({ item }: { item: ExpenseRecord }) => {
    const categoryColor = getCategoryColor(item.category);

    return (
      <TouchableOpacity
        style={[styles.expenseCard, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}
        onPress={() => setSelectedExpense(item)}
        activeOpacity={0.7}
      >
        <View style={styles.expenseHeader}>
          <View style={styles.expenseInfo}>
            <Text style={[styles.expenseDescription, { color: COLORS.primary }]}>{item.description}</Text>
            <Text style={[styles.expenseDate, { color: COLORS.muted }]}>
              {new Date(item.date).toLocaleDateString()}
            </Text>
          </View>
          <Text style={[styles.expenseAmount, { color: COLORS.accent }]}>${item.amount.toFixed(2)}</Text>
        </View>

        <View style={styles.expenseFooter}>
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor.bg }]}>
            <Text style={[styles.categoryText, { color: categoryColor.text }]}>{item.category}</Text>
          </View>
          <Text style={[styles.expenseMeta, { color: COLORS.muted }]}>{item.vendor}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: COLORS.background }]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={[styles.loadingText, { color: COLORS.muted }]}>Loading expenses...</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: COLORS.primary }]}>Expenses</Text>
          <Text style={[styles.subtitle, { color: COLORS.muted }]}>Track business expenses</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statsScroll}
          contentContainerStyle={styles.statsContent}
        >
          {statCards.map((stat) => (
            <View
              key={stat.title}
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

        <View style={[styles.searchCard, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}>
          <View style={styles.searchHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: COLORS.primary }]}>Expense History</Text>
              <Text style={[styles.sectionSubtitle, { color: COLORS.muted }]}>
                {filteredExpenses.length} expenses found
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: COLORS.primary }]}
              onPress={openCreateExpense}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add Expense</Text>
            </TouchableOpacity>
          </View>

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
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={COLORS.muted} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterContainer}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: categoryFilter === 'all' ? COLORS.accent : COLORS.input,
                    borderColor: categoryFilter === 'all' ? COLORS.accent : COLORS.border,
                  },
                ]}
                onPress={() => setCategoryFilter('all')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: categoryFilter === 'all' ? '#FFFFFF' : COLORS.primary },
                  ]}
                >
                  All Categories
                </Text>
              </TouchableOpacity>
              {EXPENSE_CATEGORY_OPTIONS.map((category) => {
                const isActive = categoryFilter === category;
                return (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: isActive ? COLORS.primary : COLORS.input,
                        borderColor: isActive ? COLORS.primary : COLORS.border,
                      },
                    ]}
                    onPress={() => setCategoryFilter(category)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
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

        {filteredExpenses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color={COLORS.border} />
            <Text style={[styles.emptyTitle, { color: COLORS.primary }]}>No expenses found</Text>
            <Text style={[styles.emptyText, { color: COLORS.muted }]}>
              {searchQuery || categoryFilter !== 'all'
                ? 'Try adjusting your search'
                : 'Start by adding your first expense'}
            </Text>
            {searchQuery || categoryFilter !== 'all' ? (
              <TouchableOpacity
                style={[styles.clearButton, { backgroundColor: COLORS.primary }]}
                onPress={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                }}
              >
                <Text style={styles.clearButtonText}>Clear Filters</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: COLORS.primary }]}
                onPress={openCreateExpense}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Add Expense</Text>
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

      <Modal
        visible={isExpenseModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setIsExpenseModalOpen(false);
          resetForm();
        }}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: COLORS.background }]} edges={['top', 'bottom']}>
          <View style={[styles.modalHeader, { borderBottomColor: COLORS.border }]}>
            <Text style={[styles.modalTitle, { color: COLORS.primary }]}>
              {editingExpense ? 'Edit Expense' : 'New Expense'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setIsExpenseModalOpen(false);
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
                  <Text style={[styles.formLabel, { color: COLORS.primary }]}>Category *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.filterContainer}>
                      {EXPENSE_CATEGORY_OPTIONS.map((category) => {
                        const isActive = formData.category === category;
                        return (
                          <TouchableOpacity
                            key={category}
                            style={[
                              styles.optionChip,
                              {
                                backgroundColor: isActive ? COLORS.primary : COLORS.input,
                                borderColor: isActive ? COLORS.primary : COLORS.border,
                              },
                            ]}
                            onPress={() => setFormData((prev) => ({ ...prev, category }))}
                          >
                            <Text
                              style={[
                                styles.optionChipText,
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

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: COLORS.primary }]}>Description *</Text>
                  <TextInput
                    value={formData.description}
                    onChangeText={(text) => setFormData((prev) => ({ ...prev, description: text }))}
                    placeholder="Enter expense description"
                    style={[styles.multilineInput, { backgroundColor: COLORS.input, borderColor: COLORS.border, color: COLORS.primary }]}
                    placeholderTextColor={COLORS.muted}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: COLORS.primary }]}>Vendor *</Text>
                  <TextInput
                    value={formData.vendor}
                    onChangeText={(text) => setFormData((prev) => ({ ...prev, vendor: text }))}
                    placeholder="Enter vendor name"
                    style={[styles.formInput, { backgroundColor: COLORS.input, borderColor: COLORS.border, color: COLORS.primary }]}
                    placeholderTextColor={COLORS.muted}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: COLORS.primary }]}>Payment Method</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.filterContainer}>
                      {EXPENSE_PAYMENT_METHOD_OPTIONS.map((paymentMethod) => {
                        const isActive = formData.paymentMethod === paymentMethod;
                        return (
                          <TouchableOpacity
                            key={paymentMethod}
                            style={[
                              styles.optionChip,
                              {
                                backgroundColor: isActive ? COLORS.primary : COLORS.input,
                                borderColor: isActive ? COLORS.primary : COLORS.border,
                              },
                            ]}
                            onPress={() => setFormData((prev) => ({ ...prev, paymentMethod }))}
                          >
                            <Text
                              style={[
                                styles.optionChipText,
                                { color: isActive ? '#FFFFFF' : COLORS.primary },
                              ]}
                            >
                              {paymentMethod}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: COLORS.primary }]}>Status</Text>
                  <View style={styles.filterContainer}>
                    {EXPENSE_STATUS_OPTIONS.map((status) => {
                      const isActive = formData.status === status;
                      return (
                        <TouchableOpacity
                          key={status}
                          style={[
                            styles.optionChip,
                            {
                              backgroundColor: isActive ? COLORS.primary : COLORS.input,
                              borderColor: isActive ? COLORS.primary : COLORS.border,
                            },
                          ]}
                          onPress={() => setFormData((prev) => ({ ...prev, status }))}
                        >
                          <Text
                            style={[
                              styles.optionChipText,
                              { color: isActive ? '#FFFFFF' : COLORS.primary },
                            ]}
                          >
                            {status}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: COLORS.primary }]}>Amount *</Text>
                  <TextInput
                    value={formData.amount}
                    onChangeText={(text) => setFormData((prev) => ({ ...prev, amount: text }))}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    style={[styles.amountInput, { backgroundColor: COLORS.input, borderColor: COLORS.border, color: COLORS.primary }]}
                    placeholderTextColor={COLORS.muted}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: COLORS.accent },
                  isSubmittingExpense && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={isSubmittingExpense}
              >
                <View style={styles.buttonContent}>
                  {isSubmittingExpense ? <ActivityIndicator size="small" color="#FFFFFF" /> : null}
                  <Text style={styles.submitButtonText}>
                    {isSubmittingExpense
                      ? editingExpense
                        ? 'Updating Expense...'
                        : 'Saving Expense...'
                      : editingExpense
                        ? 'Update Expense'
                        : 'Add Expense'}
                  </Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={!!selectedExpense}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedExpense(null)}
      >
        {selectedExpense ? (
          <SafeAreaView style={[styles.modalContainer, { backgroundColor: COLORS.background }]} edges={['top', 'bottom']}>
            <View style={[styles.modalHeader, { borderBottomColor: COLORS.border }]}>
              <Text style={[styles.modalTitle, { color: COLORS.primary }]}>Expense Details</Text>
              <TouchableOpacity onPress={() => setSelectedExpense(null)}>
                <Ionicons name="close" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.detailScrollContent}>
              <View style={styles.detailStack}>
                <View style={[styles.amountDisplay, { backgroundColor: COLORS.primary }]}>
                  <Text style={styles.amountValue}>${selectedExpense.amount.toFixed(2)}</Text>
                  <Text style={styles.amountLabel}>Total Amount</Text>
                </View>

                <View style={[styles.detailCard, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}>
                  <View style={styles.detailSection}>
                    <Text style={[styles.detailLabel, { color: COLORS.muted }]}>Description</Text>
                    <Text style={[styles.detailValueWide, { color: COLORS.primary }]}>{selectedExpense.description}</Text>
                  </View>

                  <View style={styles.detailsGrid}>
                    <View style={styles.detailSection}>
                      <Text style={[styles.detailLabel, { color: COLORS.muted }]}>Category</Text>
                      <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(selectedExpense.category).bg }]}>
                        <Text style={[styles.categoryText, { color: getCategoryColor(selectedExpense.category).text }]}>
                          {selectedExpense.category}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.detailSection}>
                      <Text style={[styles.detailLabel, { color: COLORS.muted }]}>Date</Text>
                      <Text style={[styles.detailValueWide, { color: COLORS.primary }]}>
                        {new Date(selectedExpense.date).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailsGrid}>
                    <View style={styles.detailSection}>
                      <Text style={[styles.detailLabel, { color: COLORS.muted }]}>Vendor</Text>
                      <Text style={[styles.detailValueWide, { color: COLORS.primary }]}>{selectedExpense.vendor}</Text>
                    </View>
                    <View style={styles.detailSection}>
                      <Text style={[styles.detailLabel, { color: COLORS.muted }]}>Payment</Text>
                      <Text style={[styles.detailValueWide, { color: COLORS.primary }]}>
                        {selectedExpense.paymentMethod}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailsGrid}>
                    <View style={styles.detailSection}>
                      <Text style={[styles.detailLabel, { color: COLORS.muted }]}>Status</Text>
                      <Text style={[styles.detailValueWide, { color: COLORS.primary }]}>{selectedExpense.status}</Text>
                    </View>
                    <View style={styles.detailSection}>
                      <Text style={[styles.detailLabel, { color: COLORS.muted }]}>Receipt #</Text>
                      <Text style={[styles.detailValueWide, { color: COLORS.primary }]}>
                        {selectedExpense.receiptNumber}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={[styles.statsSection, { backgroundColor: COLORS.mutedLight }]}>
                  <Text style={[styles.statsTitle, { color: COLORS.primary }]}>Category Statistics</Text>
                  <View style={styles.statRows}>
                    <View style={styles.statRow}>
                      <Text style={[styles.statLabel, { color: COLORS.muted }]}>
                        Total in {selectedExpense.category}
                      </Text>
                      <Text style={[styles.statValueDetail, { color: COLORS.primary }]}>
                        ${categoryTotals[selectedExpense.category]?.toFixed(2) || '0.00'}
                      </Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={[styles.statLabel, { color: COLORS.muted }]}>Percentage of Total</Text>
                      <Text style={[styles.statValueDetail, { color: COLORS.primary }]}>
                        {totalExpenses > 0
                          ? `${((categoryTotals[selectedExpense.category] / totalExpenses) * 100).toFixed(1)}%`
                          : '0.0%'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.secondaryActionButton, { backgroundColor: COLORS.primary }]}
                    onPress={() => handleEditExpense(selectedExpense)}
                  >
                    <Text style={styles.secondaryActionText}>Edit Expense</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.destructiveButton,
                      { backgroundColor: COLORS.danger },
                      isDeletingExpense && styles.submitButtonDisabled,
                    ]}
                    onPress={() => handleDeleteExpense(selectedExpense)}
                    disabled={isDeletingExpense}
                  >
                    {isDeletingExpense ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                    )}
                    <Text style={styles.destructiveButtonText}>
                      {isDeletingExpense ? 'Deleting...' : 'Delete Expense'}
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
  statsScroll: {
    marginBottom: 20,
  },
  statsContent: {
    paddingHorizontal: 20,
    paddingRight: 40,
  },
  statCard: {
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 140,
    borderWidth: 1,
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
    borderRadius: 8,
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
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  expensesList: {
    marginHorizontal: 20,
  },
  expensesContent: {
    paddingBottom: 40,
  },
  expenseCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 13,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  expenseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  expenseMeta: {
    fontSize: 13,
    flex: 1,
    textAlign: 'right',
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
    borderRadius: 8,
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
    gap: 12,
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
  multilineInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
  },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  optionChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  amountInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '600',
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
  detailScrollContent: {
    paddingBottom: 28,
  },
  detailStack: {
    gap: 20,
  },
  amountDisplay: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  detailCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 16,
  },
  detailSection: {
    flex: 1,
    gap: 8,
  },
  detailLabel: {
    fontSize: 13,
  },
  detailValueWide: {
    fontSize: 15,
    fontWeight: '600',
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statsSection: {
    borderRadius: 12,
    padding: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  statRows: {
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  statLabel: {
    fontSize: 14,
  },
  statValueDetail: {
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
  destructiveButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  destructiveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AdminExpenses;
