// app/(admin)/reports.js
import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

export default function ReportsScreen() {
  const [selectedReport, setSelectedReport] = useState('financial');
  const { sales, purchases, expenses, products } = useSelector(state => state.user);
  const { financialReports } = useSelector(state => state.accounting);

  const screenWidth = Dimensions.get('window').width;

  // Sales data for charts
  const monthlySales = sales.reduce((acc, sale) => {
    const month = new Date(sale.date).getMonth();
    acc[month] = (acc[month] || 0) + sale.total;
    return acc;
  }, {});

  const salesChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      data: Object.values(monthlySales).slice(0, 6),
    }],
  };

  const productPerformance = products.slice(0, 5).map(product => {
    const productSales = sales.filter(s => s.productId === product.id);
    const totalRevenue = productSales.reduce((sum, sale) => sum + sale.total, 0);
    return {
      name: product.name,
      revenue: totalRevenue,
      quantity: productSales.reduce((sum, sale) => sum + sale.quantity, 0),
    };
  });

  const pieChartData = productPerformance.map((product, index) => ({
    name: product.name,
    population: product.revenue,
    color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
    legendFontColor: '#1E3A8A',
    legendFontSize: 12,
  }));

  const chartConfig = {
    backgroundColor: '#FFFFFF',
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(251, 146, 60, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(30, 58, 138, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#FB923C',
    },
  };

  const renderFinancialReports = () => (
    <View className="space-y-6">
      {/* Balance Sheet */}
      <View className="bg-gray-50 p-4 rounded-lg">
        <Text className="text-xl font-bold text-primary-navy-dark mb-4">Balance Sheet</Text>
        <View className="space-y-2">
          <View className="flex-row justify-between">
            <Text className="text-primary-navy-dark">Total Assets</Text>
            <Text className="text-green-600 font-semibold">
              ${financialReports.balanceSheet.total_assets.toLocaleString()}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-primary-navy-dark">Total Liabilities</Text>
            <Text className="text-red-600 font-semibold">
              ${financialReports.balanceSheet.total_liabilities.toLocaleString()}
            </Text>
          </View>
          <View className="flex-row justify-between border-t border-gray-300 pt-2">
            <Text className="text-primary-navy-dark font-semibold">Total Equity</Text>
            <Text className="text-primary-orange-400 font-bold">
              ${financialReports.balanceSheet.total_equity.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Income Statement */}
      <View className="bg-gray-50 p-4 rounded-lg">
        <Text className="text-xl font-bold text-primary-navy-dark mb-4">Income Statement</Text>
        <View className="space-y-2">
          <View className="flex-row justify-between">
            <Text className="text-primary-navy-dark">Revenue</Text>
            <Text className="text-green-600">${financialReports.incomeStatement.revenue.toLocaleString()}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-primary-navy-dark">Cost of Goods Sold</Text>
            <Text className="text-red-600">${financialReports.incomeStatement.cogs.toLocaleString()}</Text>
          </View>
          <View className="flex-row justify-between border-t border-gray-300 pt-2">
            <Text className="text-primary-navy-dark font-semibold">Gross Profit</Text>
            <Text className="text-green-600 font-semibold">
              ${financialReports.incomeStatement.gross_profit.toLocaleString()}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-primary-navy-dark">Operating Expenses</Text>
            <Text className="text-red-600">${financialReports.incomeStatement.operating_expenses.toLocaleString()}</Text>
          </View>
          <View className="flex-row justify-between border-t border-gray-300 pt-2">
            <Text className="text-primary-navy-dark font-bold">Net Income</Text>
            <Text className="text-primary-orange-400 font-bold">
              ${financialReports.incomeStatement.net_income.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Cash Flow */}
      <View className="bg-gray-50 p-4 rounded-lg">
        <Text className="text-xl font-bold text-primary-navy-dark mb-4">Cash Flow Statement</Text>
        <View className="space-y-2">
          <View className="flex-row justify-between">
            <Text className="text-primary-navy-dark">Operating Activities</Text>
            <Text className="text-green-600">${financialReports.cashFlow.operating.toLocaleString()}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-primary-navy-dark">Investing Activities</Text>
            <Text className="text-red-600">${financialReports.cashFlow.investing.toLocaleString()}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-primary-navy-dark">Financing Activities</Text>
            <Text className="text-red-600">${financialReports.cashFlow.financing.toLocaleString()}</Text>
          </View>
          <View className="flex-row justify-between border-t border-gray-300 pt-2">
            <Text className="text-primary-navy-dark font-bold">Net Cash Flow</Text>
            <Text className="text-primary-orange-400 font-bold">
              ${financialReports.cashFlow.net_cash_flow.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderSalesAnalytics = () => (
    <View className="space-y-6">
      {/* Sales Trend Chart */}
      <View className="bg-white p-4 rounded-lg shadow-sm">
        <Text className="text-lg font-semibold text-primary-navy-dark mb-4">Sales Trend</Text>
        <LineChart
          data={salesChartData}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
        />
      </View>

      {/* Product Performance */}
      <View className="bg-white p-4 rounded-lg shadow-sm">
        <Text className="text-lg font-semibold text-primary-navy-dark mb-4">Top Products</Text>
        <BarChart
          data={{
            labels: productPerformance.map(p => p.name.substring(0, 8)),
            datasets: [{
              data: productPerformance.map(p => p.revenue),
            }],
          }}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
        />
      </View>

      {/* Revenue Distribution */}
      <View className="bg-white p-4 rounded-lg shadow-sm">
        <Text className="text-lg font-semibold text-primary-navy-dark mb-4">Revenue Distribution</Text>
        <PieChart
          data={pieChartData}
          width={screenWidth - 40}
          height={200}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
        />
      </View>
    </View>
  );

  const renderInventoryReports = () => (
    <View className="space-y-4">
      {/* Stock Levels */}
      <View className="bg-white p-4 rounded-lg shadow-sm">
        <Text className="text-lg font-semibold text-primary-navy-dark mb-4">Stock Levels</Text>
        {products.slice(0, 10).map(product => (
          <View key={product.id} className="flex-row justify-between py-2 border-b border-gray-100">
            <Text className="text-primary-navy-dark flex-1">{product.name}</Text>
            <View className="flex-row space-x-4">
              <Text className="text-gray-600">Stock: {product.stock}</Text>
              <Text className={
                product.stock < 10 ? 'text-red-600 font-semibold' : 'text-green-600'
              }>
                {product.stock < 10 ? 'Low' : 'Adequate'}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Inventory Valuation */}
      <View className="bg-white p-4 rounded-lg shadow-sm">
        <Text className="text-lg font-semibold text-primary-navy-dark mb-4">
          Inventory Valuation
        </Text>
        <View className="space-y-2">
          <View className="flex-row justify-between">
            <Text className="text-primary-navy-dark">Total Inventory Value</Text>
            <Text className="text-primary-orange-400 font-semibold">
              ${products.reduce((sum, p) => sum + (p.price * p.stock), 0).toLocaleString()}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-primary-navy-dark">Slow Moving Items</Text>
            <Text className="text-red-600 font-semibold">
              {products.filter(p => p.stock > 50).length}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderTaxReports = () => (
    <View className="space-y-4">
      {/* Tax Summary */}
      <View className="bg-white p-4 rounded-lg shadow-sm">
        <Text className="text-lg font-semibold text-primary-navy-dark mb-4">Tax Summary</Text>
        <View className="space-y-3">
          <View className="flex-row justify-between">
            <Text className="text-primary-navy-dark">VAT Collected (16%)</Text>
            <Text className="text-green-600">
              ${(sales.reduce((sum, s) => sum + s.total, 0) * 0.16).toLocaleString()}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-primary-navy-dark">Estimated Corporate Tax (30%)</Text>
            <Text className="text-red-600">
              ${(financialReports.incomeStatement.net_income * 0.3).toLocaleString()}
            </Text>
          </View>
          <View className="flex-row justify-between border-t border-gray-300 pt-2">
            <Text className="text-primary-navy-dark font-bold">Total Tax Liability</Text>
            <Text className="text-primary-orange-400 font-bold">
              ${(sales.reduce((sum, s) => sum + s.total, 0) * 0.16 + 
                 financialReports.incomeStatement.net_income * 0.3).toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Tax Compliance */}
      <View className="bg-white p-4 rounded-lg shadow-sm">
        <Text className="text-lg font-semibold text-primary-navy-dark mb-4">
          Compliance Status
        </Text>
        <View className="space-y-2">
          <View className="flex-row justify-between items-center">
            <Text className="text-primary-navy-dark">VAT Filing</Text>
            <Text className="text-green-600 bg-green-100 px-3 py-1 rounded-full text-xs">
              Up to Date
            </Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-primary-navy-dark">Income Tax</Text>
            <Text className="text-green-600 bg-green-100 px-3 py-1 rounded-full text-xs">
              Up to Date
            </Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-primary-navy-dark">Audit Ready</Text>
            <Text className="text-green-600 bg-green-100 px-3 py-1 rounded-full text-xs">
              Yes
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-primary-white">
      {/* Report Type Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="bg-gray-100">
        <View className="flex-row p-2 space-x-2">
          {['financial', 'sales', 'inventory', 'tax'].map((type) => (
            <TouchableOpacity
              key={type}
              className={`px-4 py-2 rounded-full ${
                selectedReport === type 
                  ? 'bg-primary-orange-400' 
                  : 'bg-primary-white'
              }`}
              onPress={() => setSelectedReport(type)}
            >
              <Text className={
                selectedReport === type 
                  ? 'text-primary-white font-semibold' 
                  : 'text-primary-navy-dark'
              }>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Report Content */}
      <ScrollView className="flex-1 p-4">
        {selectedReport === 'financial' && renderFinancialReports()}
        {selectedReport === 'sales' && renderSalesAnalytics()}
        {selectedReport === 'inventory' && renderInventoryReports()}
        {selectedReport === 'tax' && renderTaxReports()}

        {/* Export Options */}
        <View className="bg-primary-navy-dark p-4 rounded-lg mt-6">
          <Text className="text-primary-white text-lg font-semibold mb-4">
            Export Reports
          </Text>
          <View className="flex-row justify-between">
            <TouchableOpacity className="bg-primary-orange-400 px-4 py-2 rounded-lg">
              <Text className="text-primary-white font-semibold">PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-primary-orange-400 px-4 py-2 rounded-lg">
              <Text className="text-primary-white font-semibold">Excel</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-primary-orange-400 px-4 py-2 rounded-lg">
              <Text className="text-primary-white font-semibold">Print</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}