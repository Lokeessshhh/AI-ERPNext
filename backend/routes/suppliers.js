import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { query } from '../utils/database.js'

const router = express.Router()

// GET all suppliers
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM suppliers ORDER BY name')
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    res.status(500).json({ error: 'Failed to fetch suppliers' })
  }
})

// GET supplier by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM suppliers WHERE id = $1', [req.params.id])
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' })
    }
    
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching supplier:', error)
    res.status(500).json({ error: 'Failed to fetch supplier' })
  }
})

// POST create new supplier
router.post('/', async (req, res) => {
  try {
    const { name, contact, email } = req.body
    
    if (!name || !contact) {
      return res.status(400).json({ error: 'Name and contact are required' })
    }

    const newSupplier = {
      id: uuidv4(),
      name,
      contact,
      email: email || null
    }

    const result = await query(`
      INSERT INTO suppliers (id, name, contact, email) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *
    `, [newSupplier.id, newSupplier.name, newSupplier.contact, newSupplier.email])
    
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creating supplier:', error)
    res.status(500).json({ error: 'Failed to create supplier' })
  }
})

// PUT update supplier
router.put('/:id', async (req, res) => {
  try {
    const { name, contact, email } = req.body
    
    const result = await query(`
      UPDATE suppliers 
      SET name = COALESCE($2, name),
          contact = COALESCE($3, contact),
          email = COALESCE($4, email),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 
      RETURNING *
    `, [req.params.id, name, contact, email])
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating supplier:', error)
    res.status(500).json({ error: 'Failed to update supplier' })
  }
})

// DELETE supplier
router.delete('/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM suppliers WHERE id = $1 RETURNING *', [req.params.id])
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' })
    }

    res.json({ message: 'Supplier deleted successfully' })
  } catch (error) {
    console.error('Error deleting supplier:', error)
    if (error.code === '23503') {
      res.status(400).json({ error: 'Cannot delete supplier with existing products' })
    } else {
      res.status(500).json({ error: 'Failed to delete supplier' })
    }
  }
})

export default router