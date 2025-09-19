import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Download, Eye, Phone, Mail, MapPin, Package, Building, Calendar, TrendingUp, Star, Filter } from 'lucide-react'
import Modal from '../components/Modal'
import SearchBar from '../components/SearchBar'
import DataTable from '../components/DataTable'
import Pagination from '../components/Pagination'
import { suppliersAPI, productsAPI } from '../services/api'
import { useSearch } from '../hooks/useSearch'
import { useSort } from '../hooks/useSort'
import { usePagination } from '../hooks/usePagination'

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [viewingSupplier, setViewingSupplier] = useState(null)
  const [supplierProducts, setSupplierProducts] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    email: '',
    address: '',
    phone: '',
    website: '',
    rating: 5,
    notes: ''
  })
  const [filterBy, setFilterBy] = useState('all')
  const [sortBy, setSortBy] = useState('name')

  // Enhanced search, sort, and pagination
  const { searchTerm, setSearchTerm, filteredData } = useSearch(
    suppliers, 
    ['name', 'contact', 'email']
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
  } = usePagination(sortedData, 20)

  useEffect(() => {
    fetchSuppliers()
    fetchProducts()
  }, [])

  const fetchSuppliers = async () => {
    try {
      const response = await suppliersAPI.getAll()
      setSuppliers(response.data)
    } catch (error) {
      console.error('Error fetching suppliers:', error)
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
      if (editingSupplier) {
        await suppliersAPI.update(editingSupplier.id, formData)
      } else {
        await suppliersAPI.create(formData)
      }
      fetchSuppliers()
      closeModal()
    } catch (error) {
      console.error('Error saving supplier:', error)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await suppliersAPI.delete(id)
        fetchSuppliers()
      } catch (error) {
        console.error('Error deleting supplier:', error)
      }
    }
  }

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier)
    setFormData({
      name: supplier.name,
      contact: supplier.contact,
      email: supplier.email || '',
      address: supplier.address || '',
      phone: supplier.phone || '',
      website: supplier.website || '',
      rating: supplier.rating || 5,
      notes: supplier.notes || ''
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingSupplier(null)
    setFormData({
      name: '',
      contact: '',
      email: '',
      address: '',
      phone: '',
      website: '',
      rating: 5,
      notes: ''
    })
  }

  const handleViewSupplier = async (supplier) => {
    setViewingSupplier(supplier)
    // Get products for this supplier
    const supplierProds = products.filter(p => p.supplier_id === supplier.id)
    setSupplierProducts(supplierProds)
    setViewModalOpen(true)
  }

  const closeViewModal = () => {
    setViewModalOpen(false)
    setViewingSupplier(null)
    setSupplierProducts([])
  }

  const exportToCSV = () => {
    const headers = ['Name', 'Contact', 'Email', 'Products Count']
    const csvData = suppliers.map(supplier => [
      supplier.name,
      supplier.contact,
      supplier.email || '',
      products.filter(p => p.supplier_id === supplier.id).length
    ])
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `suppliers-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getSupplierProductCount = (supplierId) => {
    return products.filter(p => p.supplier_id === supplierId).length
  }

  const getSupplierTotalValue = (supplierId) => {
    return products
      .filter(p => p.supplier_id === supplierId)
      .reduce((sum, p) => sum + (parseFloat(p.price) * parseInt(p.stock)), 0)
  }

  // Define table columns
  const columns = [
    {
      key: 'name',
      label: 'Supplier',
      sortable: true,
      render: (supplier) => (
        <div>
          <div className="font-medium text-gray-900">{supplier.name}</div>
          <div className="text-sm text-gray-500">{supplier.contact}</div>
        </div>
      )
    },
    {
      key: 'email',
      label: 'Contact Info',
      sortable: true,
      render: (supplier) => (
        <div className="space-y-1">
          {supplier.email && (
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="h-3 w-3 mr-1" />
              {supplier.email}
            </div>
          )}
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="h-3 w-3 mr-1" />
            {supplier.contact}
          </div>
        </div>
      )
    },
    {
      key: 'products',
      label: 'Products',
      sortable: false,
      render: (supplier) => (
        <div className="text-center">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Package className="h-3 w-3 mr-1" />
            {getSupplierProductCount(supplier.id)}
          </span>
        </div>
      )
    },
    {
      key: 'value',
      label: 'Total Value',
      sortable: false,
      render: (supplier) => (
        <div className="text-right">
          <span className="text-sm font-medium text-gray-900">
            ${getSupplierTotalValue(supplier.id).toLocaleString()}
          </span>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (supplier) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleViewSupplier(supplier)}
            className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleEdit(supplier)}
            className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
            title="Edit Supplier"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(supplier.id)}
            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
            title="Delete Supplier"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-600 mt-1">Manage your vendor relationships and partnerships</p>
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
            Add Supplier
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            placeholder="Search suppliers by name, contact, or email..."
            showFilters={false}
          />
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="input-field text-sm"
          >
            <option value="all">All Suppliers</option>
            <option value="active">Active Partners</option>
            <option value="inactive">No Products</option>
            <option value="high-value">High Value</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-field text-sm"
          >
            <option value="name">Sort by Name</option>
            <option value="products">Sort by Products</option>
            <option value="value">Sort by Value</option>
            <option value="rating">Sort by Rating</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Total Suppliers</div>
          <div className="text-2xl font-bold text-gray-900">{totalItems}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Active Partnerships</div>
          <div className="text-2xl font-bold text-green-600">
            {suppliers.filter(s => getSupplierProductCount(s.id) > 0).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Total Products</div>
          <div className="text-2xl font-bold text-gray-900">{products.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Avg Products/Supplier</div>
          <div className="text-2xl font-bold text-gray-900">
            {suppliers.length > 0 ? Math.round(products.length / suppliers.length) : 0}
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
          onRowClick={handleViewSupplier}
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
        title={editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier Name
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
              Contact Person
            </label>
            <input
              type="text"
              required
              className="input-field"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              className="input-field"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              className="input-field"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <input
              type="url"
              className="input-field"
              placeholder="https://example.com"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              className="input-field"
              rows="3"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rating (1-5)
              </label>
              <select
                className="input-field"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
              >
                <option value={1}>1 Star</option>
                <option value={2}>2 Stars</option>
                <option value={3}>3 Stars</option>
                <option value={4}>4 Stars</option>
                <option value={5}>5 Stars</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select className="input-field">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              className="input-field"
              rows="3"
              placeholder="Additional notes about this supplier"
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
              {editingSupplier ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Supplier View Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={closeViewModal}
        title={`Supplier Details - ${viewingSupplier?.name || ''}`}
      >
        {viewingSupplier && (
          <div className="space-y-6">
            {/* Supplier Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {viewingSupplier.name}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Person
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                  {viewingSupplier.contact}
                </p>
              </div>
              {viewingSupplier.email && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {viewingSupplier.email}
                  </p>
                </div>
              )}
            </div>

            {/* Products Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Products ({supplierProducts.length})
              </h3>
              {supplierProducts.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {supplierProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600">{product.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">${product.price}</p>
                        <p className="text-xs text-gray-500">Stock: {product.stock}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No products linked to this supplier</p>
              )}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{supplierProducts.length}</p>
                <p className="text-sm text-gray-500">Products</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  ${getSupplierTotalValue(viewingSupplier.id).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">Total Value</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => {
                  closeViewModal()
                  handleEdit(viewingSupplier)
                }}
                className="btn-primary"
              >
                Edit Supplier
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

export default Suppliers