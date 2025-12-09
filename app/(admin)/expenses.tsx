// app/(admin)/expenses.tsx
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
import { addExpense } from '../../store/slices/userSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { ExpenseRecord } from '../../store/types';
import type { ListRenderItem } from 'react-native';

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

const AdminExpenses = () => {
  const { expenses } = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();
  
  const [filteredExpenses, setFilteredExpenses] = useState<ExpenseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRecord | null>(null);
  
  const [formData, setFormData] = useState<ExpenseFormData>({
    category: '',
    description: '',
    amount: '',
  });

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
      setFilteredExpenses(expenses);
    }, 1000);
    return () => clearTimeout(timer);
  }, [expenses]);

  useEffect(() => {
    let filtered: ExpenseRecord[] = expenses;

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

  const handleSubmit = () => {
    if (!formData.category || !formData.description || !formData.amount) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      dispatch(
        addExpense({
          category: formData.category,
          description: formData.description,
          amount: parseFloat(formData.amount),
        }),
      );

      Alert.alert('Success', 'Expense added successfully');
      setIsDialogOpen(false);
      setFormData({ category: '', description: '', amount: '' });
    } catch (error) {
      console.error('Error creating expense:', error);
      Alert.alert('Error', 'Failed to add expense');
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const categoryTotals = expenses.reduce<Record<string, number>>((acc, expense) => {
    const key = expense.category;
    acc[key] = (acc[key] ?? 0) + expense.amount;
    return acc;
  }, {});

  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

  const getCategoryColor = (category: string) => {
    const colorMap: Record<ExpenseCategory, string> = {
      Rent: 'bg-blue-100 text-blue-800',
      Utilities: 'bg-green-100 text-green-800',
      Salaries: 'bg-purple-100 text-purple-800',
      Marketing: 'bg-pink-100 text-pink-800',
      Maintenance: 'bg-yellow-100 text-yellow-800',
      Supplies: 'bg-indigo-100 text-indigo-800',
      Transportation: 'bg-orange-100 text-orange-800',
      Insurance: 'bg-red-100 text-red-800',
      'Professional Services': 'bg-teal-100 text-teal-800',
      Miscellaneous: 'bg-gray-100 text-gray-800',
    };
    
    return colorMap[category as ExpenseCategory] ?? 'bg-gray-100 text-gray-800';
  };

  const renderExpenseItem: ListRenderItem<ExpenseRecord> = ({ item }) => (
    <TouchableOpacity 
      style={styles.s_1}
      onPress={() => setSelectedExpense(item)}
    >
      <View style={styles.s_2}>
        <View style={styles.s_3}>
          <Text style={styles.s_4}>{item.description}</Text>
       
        </View>
        <Text style={styles.s_5}>
          ${item.amount.toFixed(2)}
        </Text>
      </View>
      
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <ScrollView style={styles.s_6}>
        <View style={styles.s_7}>
          {/* Header Skeleton */}
          <View style={styles.s_8}>
            <View>
              <View style={styles.s_9} />
              <View style={styles.s_10} />
            </View>
            <View style={styles.s_11} />
          </View>

          {/* Stats Grid Skeleton */}
          <View style={styles.s_12}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.s_13}>
                <View style={styles.s_14} />
                <View style={styles.s_15} />
              </View>
            ))}
          </View>

          {/* Search and Filter Skeleton */}
          <View style={styles.s_16}>
            <View style={styles.s_17} />
            <View style={styles.s_18} />
            <View style={styles.s_19}>
              <View style={styles.s_20} />
              <View style={styles.s_21} />
            </View>
          </View>

          {/* List Skeleton */}
          <View style={styles.s_16}>
            {[1, 2, 3, 4, 5].map((i) => (
              <View key={i} style={styles.s_22} />
            ))}
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.s_6}>
      <ScrollView style={styles.s_3} showsVerticalScrollIndicator={false}>
        <View style={styles.s_7}>
         

          {/* Stats Cards */}
          <View style={styles.s_23}>
            <View style={styles.s_24}>
              <Text style={styles.s_25}>
                Total Expenses
              </Text>
              <Text style={styles.s_26}>
                ${totalExpenses.toFixed(2)}
              </Text>
            </View>
            <View style={styles.s_24}>
              <Text style={styles.s_25}>
                Number of Expenses
              </Text>
              <Text style={styles.s_26}>
                {expenses.length}
              </Text>
            </View>
            
          </View>
          <View style={styles.s_27}>
            <TouchableOpacity
              style={styles.s_28}
              onPress={() => setIsDialogOpen(true)}
            >
              <Ionicons name="add" size={20} className="text-accent-foreground mr-2 " />
              <Text style={styles.s_30}>Add New Expense</Text>
            </TouchableOpacity>
          </View>

          {/* Search and Filter */}
          <View style={styles.s_16}>
            <Text style={styles.s_31}>
              Expense History
            </Text>
            <Text style={styles.s_32}>
              All recorded business expenses
            </Text>
            
            {/* Search Input */}
            <View style={styles.s_33}>
              <Ionicons 
                name="search" 
                size={20} 
                style={styles.s_34} 
              />
              <TextInput
                placeholder="Search by description or ID..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.s_35}
                placeholderTextColor="#6B7280"
              />
            </View>

            {/* Category Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.s_36}>
                <TouchableOpacity
                  className={`px-4 py-2 rounded-lg border ${
                    categoryFilter === 'all'
                      ? 'bg-accent border-accent'
                      : 'bg-background border-input'
                  }`}
                  onPress={() => setCategoryFilter('all')}
                >
                  <Text className={
                    categoryFilter === 'all'
                      ? 'text-accent-foreground font-medium'
                      : 'text-foreground'
                  }>
                    All Categories
                  </Text>
                </TouchableOpacity>
                {EXPENSE_CATEGORY_OPTIONS.map((category) => (
                  <TouchableOpacity
                    key={category}
                    className={`px-4 py-2 rounded-lg border ${
                      categoryFilter === category
                        ? 'bg-accent border-accent'
                        : 'bg-background border-input'
                    }`}
                    onPress={() => setCategoryFilter(category)}
                  >
                    <Text className={
                      categoryFilter === category
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

          {/* Expenses List */}
          <View style={styles.s_37}>
            {filteredExpenses.length === 0 ? (
              <View style={styles.s_38}>
                <Ionicons name="receipt-outline" size={48} style={styles.s_39} />
                <Text style={styles.s_40}>
                  No expenses found
                </Text>
                <Text style={styles.s_41}>
                  {searchQuery || categoryFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Get started by adding your first expense'
                  }
                </Text>
                {(searchQuery || categoryFilter !== 'all') && (
                  <TouchableOpacity
                    style={styles.s_42}
                    onPress={() => {
                      setSearchQuery('');
                      setCategoryFilter('all');
                    }}
                  >
                    <Text style={styles.s_30}>
                      Clear Filters
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <FlatList
                data={filteredExpenses}
                renderItem={renderExpenseItem}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={true}
                style={styles.s_43}
              />
            )}
          </View>
        </View>
      </ScrollView>

      {/* Add Expense Modal */}
      <Modal
        visible={isDialogOpen}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.s_44}>
          <View style={styles.s_45}>
            <Text style={styles.s_46}>New Expense</Text>
            <TouchableOpacity onPress={() => setIsDialogOpen(false)}>
              <Ionicons name="close" size={24} style={styles.s_47} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.s_48} showsVerticalScrollIndicator={false}>
            <View style={styles.s_49}>
              {/* Category */}
              <View>
                <Text style={styles.s_50}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex flex-row gap-4  rounded-lg border-border w-full bg-muted py-2 px-2 ">
                    {EXPENSE_CATEGORY_OPTIONS.map((category) => (
                      <TouchableOpacity
                        key={category}
                        className={`px-4 py-3 mr-3 rounded-lg border ${
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
                  
                </ScrollView>
              </View>

              {/* Description */}
              <View>
                <Text style={styles.s_52}>Description</Text>
                <TextInput
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Enter expense description"
                  style={styles.s_53}
                  placeholderTextColor="#6B7280"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Amount */}
              <View>
                <Text style={styles.s_52}>Amount</Text>
                <TextInput
                  value={formData.amount}
                  onChangeText={(text) => setFormData({ ...formData, amount: text })}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  style={styles.s_54}
                  placeholderTextColor="#6B7280"
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.s_55}
              onPress={handleSubmit}
            >
              <Text style={styles.s_56}>
                Add Expense
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Expense Detail Modal */}
      <Modal
        visible={!!selectedExpense}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedExpense(null)}
      >
        {selectedExpense && (
          <View style={styles.s_44}>
            <View style={styles.s_45}>
              <Text style={styles.s_46}>
                Expense # {selectedExpense.id}
              </Text>
              <TouchableOpacity onPress={() => setSelectedExpense(null)}>
                <Ionicons name="close" size={24} style={styles.s_47} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.s_48} showsVerticalScrollIndicator={false}>
              <View style={styles.s_49}>
                <View style={styles.s_57}>
                  
                  <View className="bg-primary relative rounded-lg h-48 w-full flex flex-col items-center justify-center ">
                    
                   <View className={`px-4 py-2 absolute top-3 right-3 rounded-full ${getCategoryColor(selectedExpense.category)}`}>
                      <Text style={styles.s_59}>{selectedExpense.category}</Text>
                    </View>
                    
                    <Text style={styles.s_60}>
                      
                      ${selectedExpense.amount.toFixed(2)}
                      
                    </Text>
                    
                  </View>
                  
                  <View style={styles.s_61}>
                    <Text style={styles.s_62}> {"ID #"}
                      {selectedExpense.id}
                    </Text>
                    
                    <Text style={styles.s_62}>
                      {new Date(selectedExpense.date).toLocaleDateString()}
                    </Text>
                    
                    
                  </View>
                

                  <View style={styles.s_63}>
                    <Text style={styles.s_64}>Description</Text>
                    <Text style={styles.s_65}>
                      {selectedExpense.description}
                    </Text>
                  </View>
                  
                 
                </View>

                {/* Category Statistics */}
                <View style={styles.s_66}>
                  <Text style={styles.s_67}>Category Statistics</Text>
                  <View style={styles.s_68}>
                    <View style={styles.s_69}>
                      <Text style={styles.s_70}>Total in {selectedExpense.category}</Text>
                      <Text style={styles.s_71}>
                        ${categoryTotals[selectedExpense.category]?.toFixed(2) || '0.00'}
                      </Text>
                    </View>
                    <View style={styles.s_69}>
                      <Text style={styles.s_70}>Percentage of Total</Text>
                      <Text style={styles.s_71}>
                        {((categoryTotals[selectedExpense.category] / totalExpenses) * 100).toFixed(1)}%
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



const styles = StyleSheet.create({
  s_1: {
  borderColor: "#e6edf3",
  paddingHorizontal: 16,
  backgroundColor: "#ffffff"
},

  s_2: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: 8
},

  s_3: {
  flex: 1
},

  s_4: {
  color: "#0f172a"
},

  s_5: {
  fontWeight: "700",
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
  justifyContent: "space-between",
  alignItems: "center"
},

  s_9: {
  borderRadius: 6,
  marginBottom: 8
},

  s_10: {
  borderRadius: 6
},

  s_11: {
  borderRadius: 6
},

  s_12: {
  flexDirection: "row",
  justifyContent: "space-between",
  gap: 16
},

  s_13: {
  backgroundColor: "#ffffff",
  borderRadius: 12,
  padding: 16,
  flex: 1
},

  s_14: {
  borderRadius: 6,
  marginBottom: 8
},

  s_15: {
  borderRadius: 6
},

  s_16: {
  backgroundColor: "#ffffff",
  borderRadius: 12,
  padding: 16
},

  s_17: {
  borderRadius: 6,
  marginBottom: 8
},

  s_18: {
  borderRadius: 6,
  marginBottom: 16
},

  s_19: {
  flexDirection: "row",
  gap: 16
},

  s_20: {
  flex: 1,
  borderRadius: 6
},

  s_21: {
  borderRadius: 6
},

  s_22: {
  borderRadius: 6,
  marginBottom: 8
},

  s_23: {
  width: "100%",
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 16
},

  s_24: {
  backgroundColor: "#0f172a",
  borderRadius: 12,
  padding: 16,
  flex: 1,
  alignItems: "center",
  justifyContent: "center"
},

  s_25: {
  fontSize: 14,
  fontWeight: "600",
  color: "#ffffff"
},

  s_26: {
  fontSize: 20,
  fontWeight: "700",
  color: "#f97316"
},

  s_27: {
  width: "100%"
},

  s_28: {
  backgroundColor: "#f97316",
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 12,
  display: "flex",
  flexDirection: "row",
  width: "100%",
  alignItems: "center",
  justifyContent: "center"
},

  s_29: {},

  s_30: {},

  s_31: {
  fontSize: 18,
  fontWeight: "700",
  color: "#0f172a"
},

  s_32: {
  fontSize: 14,
  color: "#6b7280",
  marginBottom: 16
},

  s_33: {
  marginBottom: 16
},

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
  flexDirection: "row"
},

  s_37: {
  backgroundColor: "#ffffff",
  borderRadius: 12,
  borderWidth: 1,
  borderColor: "#e6edf3"
},

  s_38: {
  alignItems: "center"
},

  s_39: {
  color: "#6b7280",
  marginBottom: 16
},

  s_40: {
  fontSize: 18,
  fontWeight: "600",
  color: "#0f172a",
  marginBottom: 8
},

  s_41: {
  color: "#6b7280",
  marginBottom: 16
},

  s_42: {
  backgroundColor: "#f97316",
  borderRadius: 12,
  paddingHorizontal: 16
},

  s_43: {},

  s_44: {
  flex: 1,
  backgroundColor: "#ffffff",
  paddingTop: 16
},

  s_45: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingHorizontal: 16,
  paddingBottom: 16,
  borderColor: "#e6edf3"
},

  s_46: {
  fontSize: 20,
  fontWeight: "700",
  color: "#0f172a"
},

  s_47: {
  color: "#0f172a"
},

  s_48: {
  flex: 1,
  padding: 16
},

  s_49: {},

  s_50: {
  fontSize: 14,
  fontWeight: "600",
  color: "#0f172a",
  marginBottom: 12
},

  s_51: {
  display: "flex",
  flexDirection: "row",
  gap: 16,
  borderRadius: 12,
  borderColor: "#e6edf3",
  width: "100%"
},

  s_52: {
  fontSize: 14,
  fontWeight: "600",
  color: "#0f172a",
  marginBottom: 8
},

  s_53: {
  backgroundColor: "#ffffff",
  borderWidth: 1,
  borderColor: "#e6edf3",
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 12,
  color: "#0f172a"
},

  s_54: {
  backgroundColor: "#ffffff",
  borderWidth: 1,
  borderColor: "#e6edf3",
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 12,
  color: "#0f172a",
  fontSize: 18
},

  s_55: {
  backgroundColor: "#f97316",
  borderRadius: 12
},

  s_56: {
  fontSize: 18
},

  s_57: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between",
  gap: 16
},

  s_58: {
  backgroundColor: "#0f172a",
  borderRadius: 12,
  width: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center"
},

  s_59: {
  fontWeight: "600",
  fontSize: 14
},

  s_60: {},

  s_61: {
  width: "100%",
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between"
},

  s_62: {
  fontWeight: "600",
  color: "#0f172a"
},

  s_63: {
  width: "100%"
},

  s_64: {
  fontSize: 14,
  color: "#6b7280"
},

  s_65: {
  fontWeight: "600",
  color: "#0f172a"
},

  s_66: {
  backgroundColor: "#f3f4f6",
  borderRadius: 12,
  padding: 16
},

  s_67: {
  color: "#0f172a",
  marginBottom: 12
},

  s_68: {},

  s_69: {
  flexDirection: "row",
  justifyContent: "space-between"
},

  s_70: {
  color: "#6b7280"
},

  s_71: {
  color: "#0f172a"
}
});
export default AdminExpenses;