// app/(admin)/accounting.js
import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { addJournalEntry } from '../../store/slices/accountingSlice';

export default function AccountingScreen() {
  const [activeTab, setActiveTab] = useState('journal');
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    debitAccount: '',
    creditAccount: '',
    amount: '',
  });
  
  const { journalEntries, chartOfAccounts } = useSelector(state => state.accounting);
  const dispatch = useDispatch();

  const handleAddJournalEntry = () => {
    if (!newEntry.description || !newEntry.debitAccount || !newEntry.creditAccount || !newEntry.amount) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const entry = {
      id: Date.now(),
      date: newEntry.date,
      reference: `JE${journalEntries.length + 1001}`,
      description: newEntry.description,
      type: 'manual',
      entries: [
        {
          accountCode: newEntry.debitAccount,
          debit: parseFloat(newEntry.amount),
          credit: 0,
        },
        {
          accountCode: newEntry.creditAccount,
          debit: 0,
          credit: parseFloat(newEntry.amount),
        },
      ],
      total: parseFloat(newEntry.amount),
    };

    dispatch(addJournalEntry(entry));
    setNewEntry({
      date: new Date().toISOString().split('T')[0],
      description: '',
      debitAccount: '',
      creditAccount: '',
      amount: '',
    });
    Alert.alert('Success', 'Journal entry added successfully');
  };

  const renderJournalEntries = () => (
    <View className="space-y-4">
      <Text className="text-lg font-semibold text-primary-navy-dark">Add Journal Entry</Text>
      
      <View className="bg-gray-50 p-4 rounded-lg space-y-3">
        <TextInput
          className="bg-primary-white p-3 rounded border border-gray-300"
          placeholder="Date (YYYY-MM-DD)"
          value={newEntry.date}
          onChangeText={(text) => setNewEntry({...newEntry, date: text})}
        />
        <TextInput
          className="bg-primary-white p-3 rounded border border-gray-300"
          placeholder="Description"
          value={newEntry.description}
          onChangeText={(text) => setNewEntry({...newEntry, description: text})}
        />
        <TextInput
          className="bg-primary-white p-3 rounded border border-gray-300"
          placeholder="Debit Account Code"
          value={newEntry.debitAccount}
          onChangeText={(text) => setNewEntry({...newEntry, debitAccount: text})}
        />
        <TextInput
          className="bg-primary-white p-3 rounded border border-gray-300"
          placeholder="Credit Account Code"
          value={newEntry.creditAccount}
          onChangeText={(text) => setNewEntry({...newEntry, creditAccount: text})}
        />
        <TextInput
          className="bg-primary-white p-3 rounded border border-gray-300"
          placeholder="Amount"
          value={newEntry.amount}
          onChangeText={(text) => setNewEntry({...newEntry, amount: text})}
          keyboardType="numeric"
        />
        
        <TouchableOpacity 
          className="bg-primary-orange-400 py-3 rounded-lg"
          onPress={handleAddJournalEntry}
        >
          <Text className="text-primary-white text-center font-semibold">
            Add Journal Entry
          </Text>
        </TouchableOpacity>
      </View>

      <Text className="text-lg font-semibold text-primary-navy-dark mt-6">Recent Entries</Text>
      
      {journalEntries.slice(0, 10).map(entry => (
        <View key={entry.id} className="bg-white p-4 rounded-lg shadow-sm">
          <View className="flex-row justify-between mb-2">
            <Text className="font-semibold text-primary-navy-dark">{entry.reference}</Text>
            <Text className="text-gray-600">{entry.date}</Text>
          </View>
          <Text className="text-primary-navy-dark mb-3">{entry.description}</Text>
          
          {entry.entries.map((line, index) => (
            <View key={index} className="flex-row justify-between py-1">
              <Text className="text-gray-600 flex-1">
                {chartOfAccounts.find(acc => acc.code === line.accountCode)?.name}
              </Text>
              <View className="flex-row space-x-4 w-32">
                <Text className={line.debit > 0 ? 'text-green-600' : 'text-gray-400'}>
                  {line.debit > 0 ? `$${line.debit}` : ''}
                </Text>
                <Text className={line.credit > 0 ? 'text-red-600' : 'text-gray-400'}>
                  {line.credit > 0 ? `$${line.credit}` : ''}
                </Text>
              </View>
            </View>
          ))}
          
          <View className="flex-row justify-between border-t border-gray-200 pt-2 mt-2">
            <Text className="font-semibold text-primary-navy-dark">Total</Text>
            <Text className="font-semibold text-primary-orange-400">${entry.total}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderChartOfAccounts = () => (
    <View className="space-y-4">
      <Text className="text-lg font-semibold text-primary-navy-dark">Chart of Accounts</Text>
      
      {['asset', 'liability', 'equity', 'revenue', 'expense'].map(type => (
        <View key={type} className="bg-white p-4 rounded-lg shadow-sm">
          <Text className="font-semibold text-primary-navy-dark mb-3 capitalize">
            {type}s
          </Text>
          
          {chartOfAccounts
            .filter(account => account.type === type)
            .map(account => (
              <View key={account.id} className="flex-row justify-between py-2 border-b border-gray-100">
                <View className="flex-1">
                  <Text className="text-primary-navy-dark font-medium">{account.name}</Text>
                  <Text className="text-gray-600 text-sm">{account.code}</Text>
                </View>
                <Text className={
                  account.type === 'asset' || account.type === 'expense' 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }>
                  {account.type === 'asset' || account.type === 'expense' ? 'Debit' : 'Credit'}
                </Text>
              </View>
            ))}
        </View>
      ))}
    </View>
  );

  const renderTrialBalance = () => {
    const trialBalance = chartOfAccounts.map(account => {
      const journalEntriesForAccount = journalEntries.flatMap(entry => 
        entry.entries.filter(line => line.accountCode === account.code)
      );
      
      const totalDebit = journalEntriesForAccount.reduce((sum, line) => sum + line.debit, 0);
      const totalCredit = journalEntriesForAccount.reduce((sum, line) => sum + line.credit, 0);
      
      return {
        ...account,
        totalDebit,
        totalCredit,
        balance: totalDebit - totalCredit,
      };
    });

    const totalDebits = trialBalance.reduce((sum, acc) => sum + acc.totalDebit, 0);
    const totalCredits = trialBalance.reduce((sum, acc) => sum + acc.totalCredit, 0);

    return (
      <View className="space-y-4">
        <Text className="text-lg font-semibold text-primary-navy-dark">Trial Balance</Text>
        
        <View className="bg-white p-4 rounded-lg shadow-sm">
          <View className="flex-row justify-between py-3 border-b border-gray-200">
            <Text className="font-semibold text-primary-navy-dark flex-1">Account</Text>
            <Text className="font-semibold text-primary-navy-dark w-20 text-center">Debit</Text>
            <Text className="font-semibold text-primary-navy-dark w-20 text-center">Credit</Text>
          </View>
          
          {trialBalance.map(account => (
            <View key={account.id} className="flex-row justify-between py-3 border-b border-gray-100">
              <View className="flex-1">
                <Text className="text-primary-navy-dark">{account.name}</Text>
                <Text className="text-gray-600 text-sm">{account.code}</Text>
              </View>
              <Text className="text-green-600 w-20 text-center">
                ${account.totalDebit.toFixed(2)}
              </Text>
              <Text className="text-red-600 w-20 text-center">
                ${account.totalCredit.toFixed(2)}
              </Text>
            </View>
          ))}
          
          <View className="flex-row justify-between py-3 border-t border-gray-200 mt-2">
            <Text className="font-bold text-primary-navy-dark">Total</Text>
            <Text className="font-bold text-green-600 w-20 text-center">
              ${totalDebits.toFixed(2)}
            </Text>
            <Text className="font-bold text-red-600 w-20 text-center">
              ${totalCredits.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-primary-white">
      {/* Accounting Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="bg-gray-100">
        <View className="flex-row p-2 space-x-2">
          {['journal', 'accounts', 'trial-balance'].map((tab) => (
            <TouchableOpacity
              key={tab}
              className={`px-4 py-2 rounded-full ${
                activeTab === tab 
                  ? 'bg-primary-orange-400' 
                  : 'bg-primary-white'
              }`}
              onPress={() => setActiveTab(tab)}
            >
              <Text className={
                activeTab === tab 
                  ? 'text-primary-white font-semibold' 
                  : 'text-primary-navy-dark'
              }>
                {tab.split('-').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Accounting Content */}
      <ScrollView className="flex-1 p-4">
        {activeTab === 'journal' && renderJournalEntries()}
        {activeTab === 'accounts' && renderChartOfAccounts()}
        {activeTab === 'trial-balance' && renderTrialBalance()}
      </ScrollView>
    </View>
  );
}