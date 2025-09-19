import { useState, useEffect } from 'react'
import { 
  Package, Users, TrendingUp, AlertTriangle, DollarSign, 
  ShoppingCart, TrendingDown, BarChart3, PieChart, 
  Calendar, RefreshCw, Download, Eye, ArrowUp, ArrowDown,
  Activity, Target, Zap, Clock, Star, Award
} from 'lucide-react'
import { reportsAPI, productsAPI, transactionsAPI, suppliersAPI } from '../services/api'


const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSuppliers: 0,
    totalTransactions: 0,
    inventoryValue: 0
  })
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [recentTransactions, setRecentTransactions] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [categoryStats, setCategoryStats] = useState([])
  const [salesData, setSalesData] = useState([])
  const [purchaseData, setPurchaseData] = useState([])
  const [monthlyTrends, setMonthlyTrends] = useState([])
  const [topSuppliers, setTopSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [timeRange, setTimeRange] = useState('30') // days
  const [selectedMetric, setSelectedMetric] = useState('revenue')

  useEffect(() => {
    fetchDashboardData()
  }, [timeRange])

  const fetchDashboardData = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true)
    try {
      console.log('🔄 Fetching comprehensive dashboard data...')
      
      const [
        statsResponse, 
        lowStockResponse, 
        transactionsResponse,
        productsResponse,
        suppliersResponse
      ] = await Promise.all([
        reportsAPI.getDashboardStats(),
        productsAPI.getLowStock(),
        transactionsAPI.getAll(),
        productsAPI.getAll(),
        suppliersAPI.getAll()
      ])

      console.log('📊 Stats response:', statsResponse.data)
      setStats(statsResponse.data)
      setLowStockProducts(lowStockResponse.data)
      
      // Process transactions for analytics
      const transactions = transactionsResponse.data
      const products = productsResponse.data
      const suppliers = suppliersResponse.data
      
      // Recent transactions (last 10)
      const recent = transactions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10)
        .map(t => ({
          ...t,
          product_name: products.find(p => p.id === t.product_id)?.name || 'Unknown',
          product_price: products.find(p => p.id === t.product_id)?.price || 0
        }))
      setRecentTransactions(recent)

      // Top products by transaction volume
      const productTransactions = {}
      transactions.forEach(t => {
        if (!productTransactions[t.product_id]) {
          productTransactions[t.product_id] = { sales: 0, purchases: 0, revenue: 0 }
        }
        const product = products.find(p => p.id === t.product_id)
        const value = t.quantity * (product?.price || 0)
        
        if (t.type === 'sale') {
          productTransactions[t.product_id].sales += t.quantity
          productTransactions[t.product_id].revenue += value
        } else {
          productTransactions[t.product_id].purchases += t.quantity
        }
      })

      const topProds = Object.entries(productTransactions)
        .map(([productId, data]) => {
          const product = products.find(p => p.id === productId)
          return {
            ...product,
            ...data,
            totalVolume: data.sales + data.purchases
          }
        })
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
      setTopProducts(topProds)

      // Category statistics
      const categoryData = {}
      products.forEach(product => {
        if (!categoryData[product.category]) {
          categoryData[product.category] = {
            count: 0,
            totalValue: 0,
            totalStock: 0
          }
        }
        categoryData[product.category].count++
        categoryData[product.category].totalValue += parseFloat(product.price) * parseInt(product.stock)
        categoryData[product.category].totalStock += parseInt(product.stock)
      })

      const categoryStatsArray = Object.entries(categoryData)
        .map(([category, data]) => ({ category, ...data }))
        .sort((a, b) => b.totalValue - a.totalValue)
      setCategoryStats(categoryStatsArray)

      // Sales vs Purchase data for charts
      const salesTransactions = transactions.filter(t => t.type === 'sale')
      const purchaseTransactions = transactions.filter(t => t.type === 'purchase')
      
      setSalesData(salesTransactions)
      setPurchaseData(purchaseTransactions)

      // Monthly trends (last 6 months) - Generate sample data if no transactions
      const monthlyData = {}
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

      // Initialize with current month and previous months
      for (let i = 0; i < 6; i++) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthKey = date.toISOString().slice(0, 7)
        monthlyData[monthKey] = { sales: 0, purchases: 0, revenue: 0, profit: 0 }
      }

      transactions
        .filter(t => new Date(t.date) >= sixMonthsAgo)
        .forEach(t => {
          const month = new Date(t.date).toISOString().slice(0, 7) // YYYY-MM
          if (!monthlyData[month]) {
            monthlyData[month] = { sales: 0, purchases: 0, revenue: 0, profit: 0 }
          }
          const product = products.find(p => p.id === t.product_id)
          const value = t.quantity * (product?.price || 0)
          
          if (t.type === 'sale') {
            monthlyData[month].sales += t.quantity
            monthlyData[month].revenue += value
            monthlyData[month].profit += value * 0.3 // Assume 30% profit margin
          } else {
            monthlyData[month].purchases += t.quantity
          }
        })

      const trendsArray = Object.entries(monthlyData)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month))
      
      console.log('📈 Monthly trends data:', trendsArray)
      setMonthlyTrends(trendsArray)

      // Top suppliers by product count and value
      const supplierData = suppliers.map(supplier => {
        const supplierProducts = products.filter(p => p.supplier_id === supplier.id)
        const totalValue = supplierProducts.reduce((sum, p) => sum + (parseFloat(p.price) * parseInt(p.stock)), 0)
        return {
          ...supplier,
          productCount: supplierProducts.length,
          totalValue
        }
      }).sort((a, b) => b.totalValue - a.totalValue).slice(0, 5)
      
      setTopSuppliers(supplierData)

    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    fetchDashboardData(true)
  }

  const exportDashboardData = () => {
    const data = {
      stats,
      lowStockProducts,
      recentTransactions,
      topProducts,
      categoryStats,
      salesData: salesData.length,
      purchaseData: purchaseData.length,
      monthlyTrends,
      topSuppliers,
      exportDate: new Date().toISOString(),
      timeRange
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Calculate advanced metrics
  const totalRevenue = recentTransactions
    .filter(t => t.type === 'sale')
    .reduce((sum, t) => sum + (t.quantity * parseFloat(t.product_price)), 0)

  const totalPurchases = recentTransactions
    .filter(t => t.type === 'purchase')
    .reduce((sum, t) => sum + (t.quantity * parseFloat(t.product_price)), 0)

  const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalPurchases) / totalRevenue * 100) : 0

  const averageOrderValue = salesData.length > 0 
    ? salesData.reduce((sum, t) => sum + (t.quantity * parseFloat(t.product_price || 0)), 0) / salesData.length 
    : 0

  // Enhanced stat cards with more metrics
  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts?.toLocaleString() || '0',
      icon: Package,
      color: 'bg-blue-500',
      trend: '+12%',
      trendUp: true
    },
    {
      title: 'Active Suppliers',
      value: stats.totalSuppliers?.toLocaleString() || '0',
      icon: Users,
      color: 'bg-green-500',
      trend: '+5%',
      trendUp: true
    },
    {
      title: 'Total Transactions',
      value: stats.totalTransactions?.toLocaleString() || '0',
      icon: TrendingUp,
      color: 'bg-purple-500',
      trend: '+18%',
      trendUp: true
    },
    {
      title: 'Inventory Value',
      value: `$${stats.inventoryValue?.toLocaleString() || '0'}`,
      icon: DollarSign,
      color: 'bg-orange-500',
      trend: '+8%',
      trendUp: true
    },
    {
      title: 'Monthly Revenue',
      value: `$${totalRevenue.toLocaleString()}`,
      icon: BarChart3,
      color: 'bg-emerald-500',
      trend: '+25%',
      trendUp: true
    },
    {
      title: 'Profit Margin',
      value: `${profitMargin.toFixed(1)}%`,
      icon: Target,
      color: 'bg-cyan-500',
      trend: '+3.2%',
      trendUp: true
    },
    {
      title: 'Avg Order Value',
      value: `$${averageOrderValue.toFixed(2)}`,
      icon: ShoppingCart,
      color: 'bg-pink-500',
      trend: '+15%',
      trendUp: true
    },
    {
      title: 'Low Stock Items',
      value: lowStockProducts.length,
      icon: AlertTriangle,
      color: 'bg-red-500',
      trend: '-2',
      trendUp: false
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading dashboard...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time insights and analytics for your inventory</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input-field text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <button
            onClick={exportDashboardData}
            className="btn-secondary flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-primary flex items-center"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="card hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
                <div className={`flex items-center text-sm font-medium ${
                  stat.trendUp ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.trendUp ? (
                    <ArrowUp className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowDown className="h-4 w-4 mr-1" />
                  )}
                  {stat.trend}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Category Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Distribution</h3>
          <div className="space-y-3">
            {categoryStats.slice(0, 6).map((category, index) => {
              const percentage = categoryStats.length > 0 
                ? (category.totalValue / categoryStats.reduce((sum, c) => sum + c.totalValue, 0) * 100)
                : 0
              return (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500', 'bg-cyan-500'][index]
                    }`}></div>
                    <span className="text-sm font-medium text-gray-700">{category.category}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{percentage.toFixed(1)}%</span>
                    <div className="text-xs text-gray-500">{category.count} products</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Monthly Summary */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Summary</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Total Revenue</span>
              </div>
              <span className="text-lg font-bold text-green-600">${totalRevenue.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <ShoppingCart className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Total Purchases</span>
              </div>
              <span className="text-lg font-bold text-blue-600">${totalPurchases.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center">
                <Target className="h-5 w-5 text-purple-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Profit Margin</span>
              </div>
              <span className="text-lg font-bold text-purple-600">{profitMargin.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Data Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
            <Star className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">${product.revenue?.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{product.sales} sold</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Suppliers */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Suppliers</h3>
            <Award className="h-5 w-5 text-green-500" />
          </div>
          <div className="space-y-3">
            {topSuppliers.map((supplier, index) => (
              <div key={supplier.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-bold text-green-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{supplier.name}</p>
                    <p className="text-sm text-gray-500">{supplier.contact}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">${supplier.totalValue?.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{supplier.productCount} products</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>



      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
          <Activity className="h-5 w-5 text-blue-500" />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentTransactions.slice(0, 5).map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{transaction.product_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      transaction.type === 'purchase'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${(transaction.quantity * parseFloat(transaction.product_price)).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="card border-l-4 border-red-500">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Low Stock Alert</h2>
            <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {lowStockProducts.length} items
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-600">{product.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-red-600">
                    Stock: {product.stock}
                  </p>
                  <p className="text-xs text-gray-500">
                    ${product.price}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard