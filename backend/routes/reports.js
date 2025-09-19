import express from 'express'
import { query } from '../utils/database.js'

const router = express.Router()

// GET dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    // Use direct queries instead of the function for better reliability
    const [productsResult, suppliersResult, transactionsResult, inventoryResult] = await Promise.all([
      query('SELECT COUNT(*) as count FROM products'),
      query('SELECT COUNT(*) as count FROM suppliers'),
      query('SELECT COUNT(*) as count FROM transactions'),
      query('SELECT COALESCE(SUM(price * stock), 0) as total FROM products')
    ])

    const stats = {
      totalProducts: parseInt(productsResult.rows[0].count),
      totalSuppliers: parseInt(suppliersResult.rows[0].count),
      totalTransactions: parseInt(transactionsResult.rows[0].count),
      inventoryValue: parseFloat(inventoryResult.rows[0].total)
    }

    res.json(stats)
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error)
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' })
  }
})

// GET inventory value report
router.get('/inventory-value', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        id,
        name,
        category,
        price,
        stock,
        (price * stock) as total_value
      FROM products 
      ORDER BY total_value DESC
    `)

    const totalValue = result.rows.reduce((sum, item) => sum + parseFloat(item.total_value), 0)

    res.json({
      products: result.rows,
      totalInventoryValue: Math.round(totalValue * 100) / 100
    })
  } catch (error) {
    console.error('Error fetching inventory value report:', error)
    res.status(500).json({ error: 'Failed to fetch inventory value report' })
  }
})

// GET products grouped by supplier
router.get('/products-by-supplier', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        s.id as supplier_id,
        s.name as supplier_name,
        s.contact as supplier_contact,
        COUNT(p.id) as product_count,
        COALESCE(SUM(p.price * p.stock), 0) as total_value,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', p.id,
            'name', p.name,
            'category', p.category,
            'price', p.price,
            'stock', p.stock
          )
        ) FILTER (WHERE p.id IS NOT NULL) as products
      FROM suppliers s
      LEFT JOIN products p ON s.id = p.supplier_id
      GROUP BY s.id, s.name, s.contact
      ORDER BY total_value DESC
    `)

    const report = result.rows.map(row => ({
      supplier: {
        id: row.supplier_id,
        name: row.supplier_name,
        contact: row.supplier_contact
      },
      productCount: parseInt(row.product_count),
      products: row.products || [],
      totalValue: parseFloat(row.total_value)
    }))

    res.json(report)
  } catch (error) {
    console.error('Error fetching products by supplier report:', error)
    res.status(500).json({ error: 'Failed to fetch products by supplier report' })
  }
})

// GET low stock report
router.get('/low-stock', async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 10

    const result = await query(`
      SELECT p.*, s.name as supplier_name
      FROM products p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.stock < $1
      ORDER BY p.stock ASC
    `, [threshold])

    res.json({
      threshold,
      count: result.rows.length,
      products: result.rows
    })
  } catch (error) {
    console.error('Error fetching low stock report:', error)
    res.status(500).json({ error: 'Failed to fetch low stock report' })
  }
})

// GET sales report
router.get('/sales', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        t.*,
        p.name as product_name,
        p.price as unit_price,
        (t.quantity * p.price) as total_value
      FROM transactions t
      JOIN products p ON t.product_id = p.id
      WHERE t.type = 'sale'
      ORDER BY t.date DESC
    `)

    const totalSales = result.rows.reduce((sum, sale) => sum + parseFloat(sale.total_value), 0)

    res.json({
      transactions: result.rows,
      totalSales: Math.round(totalSales * 100) / 100,
      transactionCount: result.rows.length
    })
  } catch (error) {
    console.error('Error fetching sales report:', error)
    res.status(500).json({ error: 'Failed to fetch sales report' })
  }
})

// GET monthly trends
router.get('/trends/monthly', async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6

    const result = await query(`
      SELECT 
        DATE_TRUNC('month', t.date) as month,
        t.type,
        COUNT(*) as transaction_count,
        SUM(t.quantity) as total_quantity,
        SUM(t.quantity * p.price) as total_value
      FROM transactions t
      JOIN products p ON t.product_id = p.id
      WHERE t.date >= NOW() - INTERVAL '${months} months'
      GROUP BY DATE_TRUNC('month', t.date), t.type
      ORDER BY month DESC, t.type
    `)

    // Process data into monthly trends
    const monthlyData = {}
    result.rows.forEach(row => {
      const monthKey = row.month.toISOString().slice(0, 7) // YYYY-MM
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          sales: { count: 0, quantity: 0, value: 0 },
          purchases: { count: 0, quantity: 0, value: 0 }
        }
      }

      const type = row.type === 'sale' ? 'sales' : 'purchases'
      monthlyData[monthKey][type] = {
        count: parseInt(row.transaction_count),
        quantity: parseInt(row.total_quantity),
        value: parseFloat(row.total_value)
      }
    })

    const trends = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month))

    res.json({
      trends,
      period: `${months} months`,
      totalMonths: trends.length
    })
  } catch (error) {
    console.error('Error fetching monthly trends:', error)
    res.status(500).json({ error: 'Failed to fetch monthly trends' })
  }
})

// GET category analytics
router.get('/analytics/categories', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        p.category,
        COUNT(p.id) as product_count,
        SUM(p.stock) as total_stock,
        SUM(p.price * p.stock) as total_value,
        AVG(p.price) as avg_price,
        MIN(p.stock) as min_stock,
        MAX(p.stock) as max_stock,
        COUNT(CASE WHEN p.stock < 10 THEN 1 END) as low_stock_count
      FROM products p
      GROUP BY p.category
      ORDER BY total_value DESC
    `)

    const analytics = result.rows.map(row => ({
      category: row.category,
      productCount: parseInt(row.product_count),
      totalStock: parseInt(row.total_stock),
      totalValue: parseFloat(row.total_value),
      avgPrice: parseFloat(row.avg_price),
      minStock: parseInt(row.min_stock),
      maxStock: parseInt(row.max_stock),
      lowStockCount: parseInt(row.low_stock_count)
    }))

    res.json({
      categories: analytics,
      totalCategories: analytics.length,
      totalValue: analytics.reduce((sum, cat) => sum + cat.totalValue, 0)
    })
  } catch (error) {
    console.error('Error fetching category analytics:', error)
    res.status(500).json({ error: 'Failed to fetch category analytics' })
  }
})

// GET supplier performance
router.get('/analytics/suppliers', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        s.id,
        s.name,
        s.contact,
        s.email,
        COUNT(p.id) as product_count,
        SUM(p.stock) as total_stock,
        SUM(p.price * p.stock) as total_value,
        AVG(p.price) as avg_product_price,
        COUNT(CASE WHEN p.stock < 10 THEN 1 END) as low_stock_products
      FROM suppliers s
      LEFT JOIN products p ON s.id = p.supplier_id
      GROUP BY s.id, s.name, s.contact, s.email
      ORDER BY total_value DESC NULLS LAST
    `)

    const performance = result.rows.map(row => ({
      supplier: {
        id: row.id,
        name: row.name,
        contact: row.contact,
        email: row.email
      },
      metrics: {
        productCount: parseInt(row.product_count) || 0,
        totalStock: parseInt(row.total_stock) || 0,
        totalValue: parseFloat(row.total_value) || 0,
        avgProductPrice: parseFloat(row.avg_product_price) || 0,
        lowStockProducts: parseInt(row.low_stock_products) || 0
      }
    }))

    res.json({
      suppliers: performance,
      totalSuppliers: performance.length
    })
  } catch (error) {
    console.error('Error fetching supplier performance:', error)
    res.status(500).json({ error: 'Failed to fetch supplier performance' })
  }
})

export default router