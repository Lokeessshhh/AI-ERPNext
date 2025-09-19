import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Bot, Download, Upload, Eye } from 'lucide-react'
import Modal from '../components/Modal'
import SearchBar from '../components/SearchBar'
import DataTable from '../components/DataTable'
import Pagination from '../components/Pagination'
import { productsAPI, suppliersAPI, aiAPI } from '../services/api'
import { useSearch } from '../hooks/useSearch'
import { useSort } from '../hooks/useSort'
import { usePagination } from '../hooks/usePagination'

const Products = () => {
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [aiSuggestion, setAiSuggestion] = useState('')
  const [loadingAI, setLoadingAI] = useState(null)
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiProductName, setAiProductName] = useState('')
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [viewingProduct, setViewingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    stock: '',
    supplierId: ''
  })

  // Enhanced search, sort, and pagination
  const { searchTerm, setSearchTerm, activeFilter, setActiveFilter, filteredData } = useSearch(
    products, 
    ['name', 'category', 'supplier_name']
  )
  
  const { sortedData, sortConfig, handleSort } = useSort(filteredData, 'name', 'asc')
  
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
    fetchProducts()
    fetchSuppliers()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll()
      setProducts(response.data)
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const response = await suppliersAPI.getAll()
      setSuppliers(response.data)
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const productData = {
        ...formData,
        supplier_id: formData.supplierId // Convert to database field name
      }
      delete productData.supplierId // Remove old field name

      if (editingProduct) {
        await productsAPI.update(editingProduct.id, productData)
      } else {
        await productsAPI.create(productData)
      }
      fetchProducts()
      closeModal()
    } catch (error) {
      console.error('Error saving product:', error)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productsAPI.delete(id)
        fetchProducts()
      } catch (error) {
        console.error('Error deleting product:', error)
      }
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock,
      supplierId: product.supplier_id // Convert from database field name
    })
    setIsModalOpen(true)
  }

  const getAISuggestion = async (productId) => {
    setLoadingAI(productId)
    try {
      const product = products.find(p => p.id === productId)
      setAiProductName(product ? product.name : 'Unknown Product')

      const response = await aiAPI.getReorderSuggestion(productId)
      setAiSuggestion(response.data.suggestion)
      setAiModalOpen(true)
    } catch (error) {
      console.error('Error getting AI suggestion:', error)
      setAiSuggestion('AI service temporarily unavailable. Please try again later.')
      setAiModalOpen(true)
    } finally {
      setLoadingAI(null)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingProduct(null)
    setFormData({
      name: '',
      category: '',
      price: '',
      stock: '',
      supplierId: ''
    })
  }

  const closeAiModal = () => {
    setAiModalOpen(false)
    setAiSuggestion('')
    setAiProductName('')
  }

  const handleViewProduct = (product) => {
    setViewingProduct(product)
    setViewModalOpen(true)
  }

  const closeViewModal = () => {
    setViewModalOpen(false)
    setViewingProduct(null)
  }

  const exportToCSV = () => {
    const headers = ['Name', 'Category', 'Price', 'Stock', 'Supplier']
    const csvData = products.map(product => [
      product.name,
      product.category,
      product.price,
      product.stock,
      getSupplierName(product)
    ])
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `products-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Get unique categories for filter
  const categoryFilters = [...new Set(products.map(p => p.category))]
    .map(category => ({ value: category, label: category }))

  // Define table columns
  const columns = [
    {
      key: 'name',
      label: 'Product',
      sortable: true,
      render: (product) => (
        <div className="font-medium text-gray-900">{product.name}</div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (product) => (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          {product.category}
        </span>
      )
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (product) => (
        <span className="text-gray-900 font-medium">${product.price}</span>
      )
    },
    {
      key: 'stock',
      label: 'Stock',
      sortable: true,
      render: (product) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          product.stock < 10 
            ? 'bg-red-100 text-red-800' 
            : product.stock < 25
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-green-100 text-green-800'
        }`}>
          {product.stock}
        </span>
      )
    },
    {
      key: 'supplier_name',
      label: 'Supplier',
      sortable: true,
      render: (product) => (
        <span className="text-gray-500">{getSupplierName(product)}</span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (product) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleViewProduct(product)}
            className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => getAISuggestion(product.id)}
            className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50"
            disabled={loadingAI === product.id}
            title="Get AI Reorder Suggestion"
          >
            {loadingAI === product.id ? (
              <div className="animate-spin h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full"></div>
            ) : (
              <Bot className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={() => handleEdit(product)}
            className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
            title="Edit Product"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(product.id)}
            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
            title="Delete Product"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ]

  const getSupplierName = (product) => {
    // Use supplier_name from the database join, fallback to finding by ID
    if (product.supplier_name) {
      return product.supplier_name
    }
    const supplier = suppliers.find(s => s.id === product.supplier_id)
    return supplier ? supplier.name : 'Unknown'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">Manage your inventory with AI-powered insights</p>
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
            Add Product
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search products by name, category, or supplier..."
        filters={categoryFilters}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Total Products</div>
          <div className="text-2xl font-bold text-gray-900">{totalItems}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Low Stock</div>
          <div className="text-2xl font-bold text-red-600">
            {products.filter(p => p.stock < 10).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Categories</div>
          <div className="text-2xl font-bold text-gray-900">{categoryFilters.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Avg. Stock</div>
          <div className="text-2xl font-bold text-gray-900">
            {products.length > 0 ? Math.round(products.reduce((sum, p) => sum + p.stock, 0) / products.length) : 0}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="card p-0">
        <DataTable
          columns={columns}
          data={paginatedData}
          onSort={handleSort}
          sortConfig={sortConfig}
          onRowClick={handleViewProduct}
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
        title={editingProduct ? 'Edit Product' : 'Add Product'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name
            </label>
            <input
              type="text"
              required
              className="input-field"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <input
              type="text"
              required
              className="input-field"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price
            </label>
            <input
              type="number"
              step="0.01"
              required
              className="input-field"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock
            </label>
            <input
              type="number"
              required
              className="input-field"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier
            </label>
            <select
              required
              className="input-field"
              value={formData.supplierId}
              onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
            >
              <option value="">Select Supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
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
              {editingProduct ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* AI Suggestion Modal */}
      <Modal
        isOpen={aiModalOpen}
        onClose={closeAiModal}
        title={`AI Reorder Suggestion - ${aiProductName}`}
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Bot className="h-6 w-6 text-purple-600" />
            <span className="text-lg font-semibold text-purple-800">AI Analysis</span>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="prose prose-sm max-w-none">
              <div className="text-purple-900 whitespace-pre-wrap leading-relaxed">
                {aiSuggestion}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={closeAiModal}
              className="btn-primary"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Product View Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={closeViewModal}
        title={`Product Details - ${viewingProduct?.name || ''}`}
      >
        {viewingProduct && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {viewingProduct.name}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {viewingProduct.category}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  ${viewingProduct.price}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Level
                </label>
                <p className={`text-sm p-2 rounded ${
                  viewingProduct.stock < 10 
                    ? 'bg-red-50 text-red-800' 
                    : 'bg-green-50 text-green-800'
                }`}>
                  {viewingProduct.stock} units
                </p>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {getSupplierName(viewingProduct)}
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => {
                  closeViewModal()
                  handleEdit(viewingProduct)
                }}
                className="btn-primary"
              >
                Edit Product
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

export default Products