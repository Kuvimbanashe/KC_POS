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
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { addExpense } from '../../store/slices/userSlice';

const AdminExpenses = () => {
  const { expenses } = useSelector(state => state.user);
  const dispatch = useDispatch();
  
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedExpense, setSelectedExpense] = useState(null);
  
  const [formData, setFormData] = useState({
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
  }, []);

  useEffect(() => {
    let filtered = expenses;

    if (searchQuery) {
      filtered = filtered.filter(expense =>
        expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.id.toString().includes(searchQuery)
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(expense => expense.category === categoryFilter);
    }

    setFilteredExpenses(filtered);
  }, [searchQuery, categoryFilter, expenses]);

  const handleSubmit = () => {
    if (!formData.category || !formData.description || !formData.amount) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      dispatch(addExpense({
        category: formData.category,
        description: formData.description,
        amount: parseFloat(formData.amount),
        date: new Date().toISOString(),
      }));

      Alert.alert('Success', 'Expense added successfully');
      setIsDialogOpen(false);
      setFormData({ category: '', description: '', amount: '' });
    } catch (error) {
      console.error('Error creating expense:', error);
      Alert.alert('Error', 'Failed to add expense');
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const categoryTotals = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

  const getCategoryColor = (category) => {
    const colorMap = {
      'Rent': 'bg-blue-100 text-blue-800',
      'Utilities': 'bg-green-100 text-green-800',
      'Salaries': 'bg-purple-100 text-purple-800',
      'Marketing': 'bg-pink-100 text-pink-800',
      'Maintenance': 'bg-yellow-100 text-yellow-800',
      'Supplies': 'bg-indigo-100 text-indigo-800',
      'Transportation': 'bg-orange-100 text-orange-800',
      'Insurance': 'bg-red-100 text-red-800',
      'Professional Services': 'bg-teal-100 text-teal-800',
      'Miscellaneous': 'bg-gray-100 text-gray-800',
    };
    
    return colorMap[category] || 'bg-gray-100 text-gray-800';
  };

  const categoryOptions = [
    'Rent',
    'Utilities',
    'Salaries',
    'Marketing',
    'Maintenance',
    'Supplies',
    'Transportation',
    'Insurance',
    'Professional Services',
    'Miscellaneous'
  ];

  const renderExpenseItem = ({ item }) => (
    <TouchableOpacity 
      className="border-b border-border py-4 px-4 bg-card active:bg-muted"
      onPress={() => setSelectedExpense(item)}
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="font-semibold text-foreground text-base">{item.description}</Text>
          <View className="flex-row items-center space-x-2 mt-1">
            <View className={`px-2 py-1 rounded-full ${getCategoryColor(item.category)}`}>
              <Text className="text-xs font-medium">{item.category}</Text>
            </View>
          </View>
        </View>
        <Text className="font-bold text-destructive text-lg">
          ${item.amount.toFixed(2)}
        </Text>
      </View>
      
      <View className="flex-row justify-between items-center">
        <Text className="text-xs text-muted-foreground">
          ID: {item.id}
        </Text>
        <Text className="text-xs text-muted-foreground">
          {new Date(item.date).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <ScrollView className="flex-1 bg-background">
        <View className="p-4 space-y-6">
          {/* Header Skeleton */}
          <View className="flex-row justify-between items-center">
            <View>
              <View className="h-8 w-32 bg-muted rounded mb-2 animate-pulse" />
              <View className="h-4 w-48 bg-muted rounded animate-pulse" />
            </View>
            <View className="h-10 w-32 bg-muted rounded animate-pulse" />
          </View>

          {/* Stats Grid Skeleton */}
          <View className="flex-row justify-between gap-4">
            {[1, 2, 3].map((i) => (
              <View key={i} className="bg-card rounded-lg p-4 flex-1">
                <View className="h-4 w-20 bg-muted rounded mb-2 animate-pulse" />
                <View className="h-6 w-16 bg-muted rounded animate-pulse" />
              </View>
            ))}
          </View>

          {/* Search and Filter Skeleton */}
          <View className="bg-card rounded-lg p-4">
            <View className="h-6 w-40 bg-muted rounded mb-2 animate-pulse" />
            <View className="h-4 w-56 bg-muted rounded mb-4 animate-pulse" />
            <View className="flex-row gap-4">
              <View className="flex-1 h-10 bg-muted rounded animate-pulse" />
              <View className="w-32 h-10 bg-muted rounded animate-pulse" />
            </View>
          </View>

          {/* List Skeleton */}
          <View className="bg-card rounded-lg p-4">
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
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4 space-y-6">
         

          {/* Stats Cards */}
          <View className="w-full grid grid-cols-2 gap-4">
            <View className="bg-primary rounded-lg p-4 flex-1 items-center justify-center">
              <Text className="text-sm font-medium text-primary-foreground mb-1">
                Total Expenses
              </Text>
              <Text className="text-xl font-bold text-accent">
                ${totalExpenses.toFixed(2)}
              </Text>
            </View>
            <View className="bg-primary rounded-lg p-4 flex-1 items-center justify-center">
              <Text className="text-sm font-medium text-primary-foreground mb-1">
                Number of Expenses
              </Text>
              <Text className="text-xl font-bold text-accent">
                {expenses.length}
              </Text>
            </View>
            
          </View>
          <View className="w-full">
            <TouchableOpacity
              className="bg-accent rounded-lg px-4 py-2 flex flex-row w-full items-center justify-center"
              onPress={() => setIsDialogOpen(true)}
            >
              <Ionicons name="add" size={20} className="text-accent-foreground mr-2 " />
              <Text className="text-accent-foreground font-semibold">Add New Expense</Text>
            </TouchableOpacity>
          </View>

          {/* Search and Filter */}
          <View className="bg-card rounded-lg p-4">
            <Text className="text-lg font-bold text-foreground mb-1">
              Expense History
            </Text>
            <Text className="text-sm text-muted-foreground mb-4">
              All recorded business expenses
            </Text>
            
            {/* Search Input */}
            <View className="relative mb-4">
              <Ionicons 
                name="search" 
                size={20} 
                className="absolute left-3 top-3 text-muted-foreground z-10" 
              />
              <TextInput
                placeholder="Search by description or ID..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="bg-background border border-input rounded-lg pl-10 pr-4 py-3 text-foreground"
                placeholderTextColor="#6B7280"
              />
            </View>

            {/* Category Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row space-x-2">
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
                {categoryOptions.map((category) => (
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
          <View className="bg-card rounded-lg overflow-hidden">
            {filteredExpenses.length === 0 ? (
              <View className="p-8 items-center">
                <Ionicons name="receipt-outline" size={48} className="text-muted-foreground mb-4" />
                <Text className="text-lg font-medium text-foreground mb-2">
                  No expenses found
                </Text>
                <Text className="text-muted-foreground text-center mb-4">
                  {searchQuery || categoryFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Get started by adding your first expense'
                  }
                </Text>
                {(searchQuery || categoryFilter !== 'all') && (
                  <TouchableOpacity
                    className="bg-accent rounded-lg px-4 py-2"
                    onPress={() => {
                      setSearchQuery('');
                      setCategoryFilter('all');
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
                data={filteredExpenses}
                renderItem={renderExpenseItem}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={true}
                className="max-h-96"
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
        <View className="flex-1 bg-background pt-4">
          <View className="flex-row justify-between items-center px-4 pb-4 border-b border-border">
            <Text className="text-xl font-bold text-foreground">Add New Expense</Text>
            <TouchableOpacity onPress={() => setIsDialogOpen(false)}>
              <Ionicons name="close" size={24} className="text-foreground" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
            <View className="space-y-6">
              {/* Category */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-3">Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row space-x-2">
                    {categoryOptions.map((category) => (
                      <TouchableOpacity
                        key={category}
                        className={`px-4 py-3 rounded-lg border ${
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

              {/* Description */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Description</Text>
                <TextInput
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Enter expense description"
                  className="bg-background border border-input rounded-lg px-4 py-3 text-foreground"
                  placeholderTextColor="#6B7280"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Amount */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Amount</Text>
                <TextInput
                  value={formData.amount}
                  onChangeText={(text) => setFormData({ ...formData, amount: text })}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  className="bg-background border border-input rounded-lg px-4 py-3 text-foreground text-lg"
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
          <View className="flex-1 bg-background pt-4">
            <View className="flex-row justify-between items-center px-4 pb-4 border-b border-border">
              <Text className="text-xl font-bold text-foreground">
                Expense Details - {selectedExpense.id}
              </Text>
              <TouchableOpacity onPress={() => setSelectedExpense(null)}>
                <Ionicons name="close" size={24} className="text-foreground" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
              <View className="space-y-6">
                <View className="flex-row flex-wrap justify-between gap-4">
                  <View className="w-[48%]">
                    <Text className="text-sm text-muted-foreground mb-1">Category</Text>
                    <View className={`px-3 py-2 rounded-full ${getCategoryColor(selectedExpense.category)}`}>
                      <Text className="font-medium text-sm">{selectedExpense.category}</Text>
                    </View>
                  </View>
                  <View className="w-[48%]">
                    <Text className="text-sm text-muted-foreground mb-1">Amount</Text>
                    <Text className="font-bold text-destructive text-lg">
                      ${selectedExpense.amount.toFixed(2)}
                    </Text>
                  </View>
                  <View className="w-full">
                    <Text className="text-sm text-muted-foreground mb-1">Description</Text>
                    <Text className="font-medium text-foreground text-base leading-6">
                      {selectedExpense.description}
                    </Text>
                  </View>
                  <View className="w-[48%]">
                    <Text className="text-sm text-muted-foreground mb-1">Date</Text>
                    <Text className="font-medium text-foreground text-base">
                      {new Date(selectedExpense.date).toLocaleDateString()}
                    </Text>
                  </View>
                  <View className="w-[48%]">
                    <Text className="text-sm text-muted-foreground mb-1">ID</Text>
                    <Text className="font-medium text-foreground text-base">
                      {selectedExpense.id}
                    </Text>
                  </View>
                </View>

                {/* Category Statistics */}
                <View className="bg-secondary rounded-lg p-4">
                  <Text className="font-semibold text-foreground mb-3">Category Statistics</Text>
                  <View className="space-y-2">
                    <View className="flex-row justify-between">
                      <Text className="text-muted-foreground">Total in {selectedExpense.category}</Text>
                      <Text className="font-semibold text-foreground">
                        ${categoryTotals[selectedExpense.category]?.toFixed(2) || '0.00'}
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-muted-foreground">Percentage of Total</Text>
                      <Text className="font-semibold text-foreground">
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

export default AdminExpenses;