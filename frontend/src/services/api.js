import axios from 'axios'

const API_BASE_URL = 'http://localhost:3001/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

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