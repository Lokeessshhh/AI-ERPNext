import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { query } from '../utils/database.js'

const router = express.Router()

// GET all products
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT p.*, s.name as supplier_name 
      FROM products p 
      LEFT JOIN suppliers s ON p.supplier_id = s.id 
      ORDER BY p.name
    `)
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching products:', error)
    res.status(500).json({ error: 'Failed to fetch products' })
  }
})

// GET low stock products (stock < 10) - MUST be before /:id route
router.get('/low-stock', async (req, res) => {
  try {
    const result = await query(`
      SELECT p.*, s.name as supplier_name 
      FROM products p 
      LEFT JOIN suppliers s ON p.supplier_id = s.id 
      WHERE p.stock < 10 
      ORDER BY p.stock ASC
    `)
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching low stock products:', error)
    res.status(500).json({ error: 'Failed to fetch low stock products' })
  }
})

// GET product by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await query(`
      SELECT p.*, s.name as supplier_name 
      FROM products p 
      LEFT JOIN suppliers s ON p.supplier_id = s.id 
      WHERE p.id = $1
    `, [req.params.id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching product:', error)
    res.status(500).json({ error: 'Failed to fetch product' })
  }
})



// POST create new product
router.post('/', async (req, res) => {
  try {
    const { name, category, price, stock, supplier_id } = req.body

    if (!name || !category || !price || !stock || !supplier_id) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    const newProduct = {
      id: uuidv4(),
      name,
      category,
      price: parseFloat(price),
      stock: parseInt(stock),
      supplier_id
    }

    const result = await query(`
      INSERT INTO products (id, name, category, price, stock, supplier_id) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *
    `, [newProduct.id, newProduct.name, newProduct.category, newProduct.price, newProduct.stock, newProduct.supplier_id])

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creating product:', error)
    if (error.code === '23503') {
      res.status(400).json({ error: 'Invalid supplier ID' })
    } else {
      res.status(500).json({ error: 'Failed to create product' })
    }
  }
})

// PUT update product
router.put('/:id', async (req, res) => {
  try {
    const { name, category, price, stock, supplier_id } = req.body

    const result = await query(`
      UPDATE products 
      SET name = COALESCE($2, name),
          category = COALESCE($3, category),
          price = COALESCE($4, price),
          stock = COALESCE($5, stock),
          supplier_id = COALESCE($6, supplier_id),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 
      RETURNING *
    `, [req.params.id, name, category, price ? parseFloat(price) : null, stock ? parseInt(stock) : null, supplier_id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating product:', error)
    if (error.code === '23503') {
      res.status(400).json({ error: 'Invalid supplier ID' })
    } else {
      res.status(500).json({ error: 'Failed to update product' })
    }
  }
})

// DELETE product
router.delete('/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM products WHERE id = $1 RETURNING *', [req.params.id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' })
    }

    res.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Error deleting product:', error)
    if (error.code === '23503') {
      res.status(400).json({ error: 'Cannot delete product with existing transactions' })
    } else {
      res.status(500).json({ error: 'Failed to delete product' })
    }
  }
})

export default router