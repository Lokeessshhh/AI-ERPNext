import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, TrendingUp, TrendingDown, Download, Eye, Calendar, DollarSign, Package, Filter, BarChart3, PieChart, Clock } from 'lucide-react'
import Modal from '../components/Modal'
import SearchBar from '../components/SearchBar'
import DataTable from '../components/DataTable'
import Pagination from '../components/Pagination'
import { transactionsAPI, productsAPI } from '../services/api'
import { useSearch } from '../hooks/useSearch'
import { useSort } from '../hooks/useSort'
import { usePagination } from '../hooks/usePagination'

const Transactions = () => {
  const [transactions, setTransactions] = useState([])
  const [products, setProducts] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [viewingTransaction, setViewingTransaction] = useState(null)
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    type: 'purchase',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    reference: ''
  })
  const [dateRange, setDateRange] = useState('30')
  const [showAnalytics, setShowAnalytics] = useState(false)

  // Enhanced search, sort, and pagination
  const { searchTerm, setSearchTerm, activeFilter, setActiveFilter, filteredData } = useSearch(
    transactions, 
    ['product_name', 'type']
  )
  
  const { sortedData, sortConfig, handleSort } = useSort(filteredData, 'date', 'desc')
  
  const { 
    currentPage, 
    itemsPerPage, 
    totalPages, 
    paginatedData, 
    goToPage, 
    changeItemsPerPage,
    totalItems 
  } = usePagination(sortedData, 25)

  useEffect(() => {
    fetchTransactions()
    fetchProducts()
  }, [])

  const fetchTransactions = async () => {
    try {
      const response = await transactionsAPI.getAll()
      setTransactions(response.data)
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll()
      setProducts(response.data)
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const transactionData = {
        ...formData,
        product_id: formData.productId // Convert to database field name
      }
      delete transactionData.productId // Remove old field name
      
      if (editingTransaction) {
        await transactionsAPI.update(editingTransaction.id, transactionData)
      } else {
        await transactionsAPI.create(transactionData)
      }
      fetchTransactions()
      closeModal()
    } catch (error) {
      console.error('Error saving transaction:', error)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await transactionsAPI.delete(id)
        fetchTransactions()
      } catch (error) {
        console.error('Error deleting transaction:', error)
      }
    }
  }

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction)
    setFormData({
      productId: transaction.product_id, // Convert from database field name
      quantity: transaction.quantity,
      type: transaction.type,
      date: transaction.date,
      notes: transaction.notes || '',
      reference: transaction.reference || ''
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingTransaction(null)
    setFormData({
      productId: '',
      quantity: '',
      type: 'purchase',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      reference: ''
    })
  }

  const handleViewTransaction = (transaction) => {
    setViewingTransaction(transaction)
    setViewModalOpen(true)
  }

  const closeViewModal = () => {
    setViewModalOpen(false)
    setViewingTransaction(null)
  }

  const exportToCSV = () => {
    const headers = ['Product', 'Type', 'Quantity', 'Unit Price', 'Total Value', 'Date']
    const csvData = transactions.map(transaction => [
      getProductName(transaction),
      transaction.type,
      transaction.quantity,
      getProductPrice(transaction),
      (transaction.quantity * getProductPrice(transaction)).toFixed(2),
      new Date(transaction.date).toLocaleDateString()
    ])
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Get transaction type filters
  const typeFilters = [
    { value: 'purchase', label: 'Purchase' },
    { value: 'sale', label: 'Sale' }
  ]

  // Calculate totals
  const getTotalSales = () => {
    return transactions
      .filter(t => t.type === 'sale')
      .reduce((sum, t) => sum + (t.quantity * getProductPrice(t)), 0)
  }

  const getTotalPurchases = () => {
    return transactions
      .filter(t => t.type === 'purchase')
      .reduce((sum, t) => sum + (t.quantity * getProductPrice(t)), 0)
  }

  // Define table columns
  const columns = [
    {
      key: 'product_name',
      label: 'Product',
      sortable: true,
      render: (transaction) => (
        <div>
          <div className="font-medium text-gray-900">{getProductName(transaction)}</div>
          <div className="text-sm text-gray-500">ID: {transaction.product_id}</div>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (transaction) => (
        <div className="flex items-center">
          {transaction.type === 'purchase' ? (
            <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500 mr-2" />
          )}
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            transaction.type === 'purchase'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {transaction.type}
          </span>
        </div>
      )
    },
    {
      key: 'quantity',
      label: 'Quantity',
      sortable: true,
      render: (transaction) => (
        <span className="text-sm font-medium text-gray-900">{transaction.quantity}</span>
      )
    },
    {
      key: 'total_value',
      label: 'Total Value',
      sortable: false,
      render: (transaction) => (
        <span className="text-sm font-medium text-gray-900">
          ${(transaction.quantity * getProductPrice(transaction)).toFixed(2)}
        </span>
      )
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (transaction) => (
        <div className="text-sm text-gray-500">
          {new Date(transaction.date).toLocaleDateString()}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (transaction) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleViewTransaction(transaction)}
            className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleEdit(transaction)}
            className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
            title="Edit Transaction"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(transaction.id)}
            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
            title="Delete Transaction"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ]

  const getProductName = (transaction) => {
    // Use product_name from the database join, fallback to finding by ID
    if (transaction.product_name) {
      return transaction.product_name
    }
    const product = products.find(p => p.id === transaction.product_id)
    return product ? product.name : 'Unknown Product'
  }

  const getProductPrice = (transaction) => {
    // Use product_price from the database join, fallback to finding by ID
    if (transaction.product_price) {
      return parseFloat(transaction.product_price)
    }
    const product = products.find(p => p.id === transaction.product_id)
    return product ? parseFloat(product.price) : 0
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600 mt-1">Track all purchases and sales with automatic stock updates</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportToCSV}
            className="btn-secondary flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            placeholder="Search transactions by product name or type..."
            filters={typeFilters}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="input-field text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`btn-secondary flex items-center ${showAnalytics ? 'bg-blue-100 text-blue-700' : ''}`}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <div className="text-sm font-medium text-gray-500">Total Transactions</div>
              <div className="text-2xl font-bold text-gray-900">{totalItems}</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <div className="text-sm font-medium text-gray-500">Total Purchases</div>
              <div className="text-2xl font-bold text-green-600">
                ${getTotalPurchases().toLocaleString()}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <TrendingDown className="h-8 w-8 text-red-500 mr-3" />
            <div>
              <div className="text-sm font-medium text-gray-500">Total Sales</div>
              <div className="text-2xl font-bold text-red-600">
                ${getTotalSales().toLocaleString()}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-purple-500 mr-3" />
            <div>
              <div className="text-sm font-medium text-gray-500">Net Flow</div>
              <div className={`text-2xl font-bold ${
                (getTotalSales() - getTotalPurchases()) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ${(getTotalSales() - getTotalPurchases()).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      {showAnalytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transaction Trends */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Trends</h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Transaction trend chart</p>
                <p className="text-sm text-gray-400 mt-1">
                  {transactions.length} total transactions
                </p>
              </div>
            </div>
          </div>

          {/* Top Products by Volume */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products by Volume</h3>
            <div className="space-y-3">
              {transactions
                .reduce((acc, t) => {
                  const productName = getProductName(t)
                  if (!acc[productName]) {
                    acc[productName] = { name: productName, volume: 0, value: 0 }
                  }
                  acc[productName].volume += t.quantity
                  acc[productName].value += t.quantity * getProductPrice(t)
                  return acc
                }, {})
                && Object.values(transactions.reduce((acc, t) => {
                  const productName = getProductName(t)
                  if (!acc[productName]) {
                    acc[productName] = { name: productName, volume: 0, value: 0 }
                  }
                  acc[productName].volume += t.quantity
                  acc[productName].value += t.quantity * getProductPrice(t)
                  return acc
                }, {}))
                .sort((a, b) => b.volume - a.volume)
                .slice(0, 5)
                .map((product, index) => (
                  <div key={product.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-bold text-purple-600">#{index + 1}</span>
                      </div>
                      <span className="font-medium text-gray-900">{product.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{product.volume} units</p>
                      <p className="text-xs text-gray-500">${product.value.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="card p-0">
        <DataTable
          columns={columns}
          data={paginatedData}
          onSort={handleSort}
          sortConfig={sortConfig}
          onRowClick={handleViewTransaction}
        />
        
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={goToPage}
          onItemsPerPageChange={changeItemsPerPage}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product
            </label>
            <select
              required
              className="input-field"
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
            >
              <option value="">Select Product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} - ${product.price}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transaction Type
            </label>
            <select
              required
              className="input-field"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="purchase">Purchase</option>
              <option value="sale">Sale</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              type="number"
              required
              min="1"
              className="input-field"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              required
              className="input-field"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reference Number
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Optional reference number"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              className="input-field"
              rows="3"
              placeholder="Optional transaction notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingTransaction ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Transaction View Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={closeViewModal}
        title={`Transaction Details - ${viewingTransaction?.id || ''}`}
      >
        {viewingTransaction && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction ID
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded font-mono">
                  {viewingTransaction.id}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {getProductName(viewingTransaction)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction Type
                </label>
                <div className="flex items-center bg-gray-50 p-2 rounded">
                  {viewingTransaction.type === 'purchase' ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-2" />
                  )}
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    viewingTransaction.type === 'purchase'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {viewingTransaction.type.toUpperCase()}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {viewingTransaction.quantity} units
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Price
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  ${getProductPrice(viewingTransaction)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Value
                </label>
                <p className="text-sm font-bold text-gray-900 bg-primary-50 p-2 rounded">
                  ${(viewingTransaction.quantity * getProductPrice(viewingTransaction)).toFixed(2)}
                </p>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {new Date(viewingTransaction.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => {
                  closeViewModal()
                  handleEdit(viewingTransaction)
                }}
                className="btn-primary"
              >
                Edit Transaction
              </button>
              <button
                onClick={closeViewModal}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Transactions