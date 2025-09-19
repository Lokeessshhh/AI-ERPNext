import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { query } from '../utils/database.js'

const router = express.Router()

// GET all transactions
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT t.*, p.name as product_name, p.price as product_price
      FROM transactions t 
      LEFT JOIN products p ON t.product_id = p.id 
      ORDER BY t.date DESC, t.created_at DESC
    `)
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching transactions:', error)
    res.status(500).json({ error: 'Failed to fetch transactions' })
  }
})

// GET transaction by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await query(`
      SELECT t.*, p.name as product_name, p.price as product_price
      FROM transactions t 
      LEFT JOIN products p ON t.product_id = p.id 
      WHERE t.id = $1
    `, [req.params.id])
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' })
    }
    
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching transaction:', error)
    res.status(500).json({ error: 'Failed to fetch transaction' })
  }
})

// POST create new transaction
router.post('/', async (req, res) => {
  try {
    const { product_id, quantity, type, date } = req.body
    
    if (!product_id || !quantity || !type || !date) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    if (!['purchase', 'sale'].includes(type)) {
      return res.status(400).json({ error: 'Type must be either "purchase" or "sale"' })
    }

    const newTransaction = {
      id: uuidv4(),
      product_id,
      quantity: parseInt(quantity),
      type,
      date
    }

    // The database trigger will automatically handle stock updates
    const result = await query(`
      INSERT INTO transactions (id, product_id, quantity, type, date) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *
    `, [newTransaction.id, newTransaction.product_id, newTransaction.quantity, newTransaction.type, newTransaction.date])
    
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creating transaction:', error)
    if (error.message.includes('Insufficient stock')) {
      res.status(400).json({ error: 'Insufficient stock for sale' })
    } else if (error.code === '23503') {
      res.status(400).json({ error: 'Invalid product ID' })
    } else {
      res.status(500).json({ error: 'Failed to create transaction' })
    }
  }
})

// PUT update transaction
router.put('/:id', async (req, res) => {
  try {
    const { product_id, quantity, type, date } = req.body
    
    // For updates, we need to handle this manually since triggers don't work well with updates
    // First, get the old transaction
    const oldResult = await query('SELECT * FROM transactions WHERE id = $1', [req.params.id])
    
    if (oldResult.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    const oldTransaction = oldResult.rows[0]
    
    // Delete the old transaction (this will revert stock changes)
    await query('DELETE FROM transactions WHERE id = $1', [req.params.id])
    
    // Create the updated transaction (this will apply new stock changes)
    const updatedTransaction = {
      id: req.params.id,
      product_id: product_id || oldTransaction.product_id,
      quantity: quantity ? parseInt(quantity) : oldTransaction.quantity,
      type: type || oldTransaction.type,
      date: date || oldTransaction.date
    }

    const result = await query(`
      INSERT INTO transactions (id, product_id, quantity, type, date) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *
    `, [updatedTransaction.id, updatedTransaction.product_id, updatedTransaction.quantity, updatedTransaction.type, updatedTransaction.date])

    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating transaction:', error)
    if (error.message.includes('Insufficient stock')) {
      res.status(400).json({ error: 'Insufficient stock for sale' })
    } else if (error.code === '23503') {
      res.status(400).json({ error: 'Invalid product ID' })
    } else {
      res.status(500).json({ error: 'Failed to update transaction' })
    }
  }
})

// DELETE transaction
router.delete('/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM transactions WHERE id = $1 RETURNING *', [req.params.id])
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    res.json({ message: 'Transaction deleted successfully' })
  } catch (error) {
    console.error('Error deleting transaction:', error)
    res.status(500).json({ error: 'Failed to delete transaction' })
  }
})

export default router