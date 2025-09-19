import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://ai-erpnext.onrender.com/api'

// Debug logging
console.log('🔧 API Configuration:')
console.log('   VITE_API_URL:', import.meta.env.VITE_API_URL)
console.log('   API_BASE_URL:', API_BASE_URL)
console.log('   Environment:', import.meta.env.MODE)

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('🚀 API Request:', config.method?.toUpperCase(), config.url)
    console.log('   Full URL:', config.baseURL + config.url)
    return config
  },
  (error) => {
    console.error('❌ Request Error:', error)
    return Promise.reject(error)
  }
)

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url)
    console.log('   Data length:', Array.isArray(response.data) ? response.data.length : 'Not array')
    return response
  },
  (error) => {
    console.error('❌ API Error:', error.response?.status, error.config?.url)
    console.error('   Error message:', error.message)
    return Promise.reject(error)
  }
)

// Products API
export const productsAPI = {
  getAll: () => api.get('/products'),
  getById: (id) => api.get(`/products/${id}`),
  create: (product) => api.post('/products', product),
  update: (id, product) => api.put(`/products/${id}`, product),
  delete: (id) => api.delete(`/products/${id}`),
  getLowStock: () => api.get('/products/low-stock'),
}

// Suppliers API
export const suppliersAPI = {
  getAll: () => api.get('/suppliers'),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (supplier) => api.post('/suppliers', supplier),
  update: (id, supplier) => api.put(`/suppliers/${id}`, supplier),
  delete: (id) => api.delete(`/suppliers/${id}`),
}

// Transactions API
export const transactionsAPI = {
  getAll: () => api.get('/transactions'),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (transaction) => api.post('/transactions', transaction),
  update: (id, transaction) => api.put(`/transactions/${id}`, transaction),
  delete: (id) => api.delete(`/transactions/${id}`),
}

// Reports API
export const reportsAPI = {
  getDashboardStats: () => api.get('/reports/dashboard'),
  getInventoryValue: () => api.get('/reports/inventory-value'),
  getProductsBySupplier: () => api.get('/reports/products-by-supplier'),
  getMonthlyTrends: (months = 6) => api.get(`/reports/trends/monthly?months=${months}`),
  getCategoryAnalytics: () => api.get('/reports/analytics/categories'),
  getSupplierPerformance: () => api.get('/reports/analytics/suppliers'),
  getLowStock: (threshold = 10) => api.get(`/reports/low-stock?threshold=${threshold}`),
  getSalesReport: () => api.get('/reports/sales'),
}

// AI API
export const aiAPI = {
  getReorderSuggestion: (productId) => api.post('/ai/reorder-suggestion', { productId }),
  chat: (message) => api.post('/ai/chat', { message }).then(response => response.data),
}

export default api