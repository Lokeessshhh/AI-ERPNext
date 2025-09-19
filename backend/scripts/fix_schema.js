#!/usr/bin/env node

import { Client } from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Database connection
const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
})

const fixSchema = async () => {
    console.log('🔧 Fixing database schema for UUID support...')

    try {
        // Connect to database
        await client.connect()
        console.log('✅ Connected to PostgreSQL database')

        console.log('📋 Updating column types to support UUIDs...')

        // Drop views first
        console.log('⏸️  Dropping views...')
        await client.query('DROP VIEW IF EXISTS low_stock_products CASCADE')
        await client.query('DROP VIEW IF EXISTS inventory_value_report CASCADE')
        await client.query('DROP VIEW IF EXISTS transaction_summary CASCADE')

        // Drop triggers and functions
        console.log('⏸️  Dropping triggers and functions...')
        await client.query('DROP TRIGGER IF EXISTS trigger_update_product_stock ON transactions')
        await client.query('DROP FUNCTION IF EXISTS update_product_stock() CASCADE')
        await client.query('DROP FUNCTION IF EXISTS get_dashboard_stats() CASCADE')

        // Drop foreign key constraints
        console.log('⏸️  Dropping foreign key constraints...')
        await client.query('ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_product_id_fkey')
        await client.query('ALTER TABLE products DROP CONSTRAINT IF EXISTS products_supplier_id_fkey')

        // Update column types
        console.log('🔄 Updating suppliers.id column...')
        await client.query('ALTER TABLE suppliers ALTER COLUMN id TYPE VARCHAR(50)')

        console.log('🔄 Updating products columns...')
        await client.query('ALTER TABLE products ALTER COLUMN id TYPE VARCHAR(50)')
        await client.query('ALTER TABLE products ALTER COLUMN supplier_id TYPE VARCHAR(50)')

        console.log('🔄 Updating transactions columns...')
        await client.query('ALTER TABLE transactions ALTER COLUMN id TYPE VARCHAR(50)')
        await client.query('ALTER TABLE transactions ALTER COLUMN product_id TYPE VARCHAR(50)')

        // Re-add foreign key constraints
        console.log('🔗 Re-adding foreign key constraints...')
        await client.query(`
      ALTER TABLE products ADD CONSTRAINT products_supplier_id_fkey 
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT
    `)

        await client.query(`
      ALTER TABLE transactions ADD CONSTRAINT transactions_product_id_fkey 
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
    `)

        // Recreate views
        console.log('🔄 Recreating views...')
        await client.query(`
      CREATE VIEW low_stock_products AS
      SELECT 
        p.id,
        p.name,
        p.category,
        p.price,
        p.stock,
        s.name as supplier_name
      FROM products p
      JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.stock < 10
      ORDER BY p.stock ASC
    `)

        await client.query(`
      CREATE VIEW inventory_value_report AS
      SELECT 
        p.id,
        p.name,
        p.category,
        p.price,
        p.stock,
        (p.price * p.stock) as total_value,
        s.name as supplier_name
      FROM products p
      JOIN suppliers s ON p.supplier_id = s.id
      ORDER BY total_value DESC
    `)

        console.log('✅ Schema fix completed successfully!')
        console.log('🎉 You can now create new records with UUID support')

    } catch (error) {
        console.error('💥 Schema fix failed:', error.message)
        process.exit(1)
    } finally {
        await client.end()
        console.log('🔌 Database connection closed')
    }
}

// Run schema fix
fixSchema().catch(console.error)