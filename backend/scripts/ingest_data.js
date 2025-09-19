#!/usr/bin/env node

import { Client } from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import csv from 'csv-parser'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataDir = path.join(__dirname, '../data')

// Database connection
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

// Function to read CSV file
const readCSV = (filename) => {
  return new Promise((resolve, reject) => {
    const results = []
    const filePath = path.join(dataDir, filename)
    
    if (!fs.existsSync(filePath)) {
      reject(new Error(`CSV file not found: ${filename}`))
      return
    }

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        // Clean up any potential whitespace issues
        const cleanData = {}
        for (const [key, value] of Object.entries(data)) {
          cleanData[key.trim()] = value ? value.toString().trim() : ''
        }
        results.push(cleanData)
      })
      .on('end', () => resolve(results))
      .on('error', reject)
  })
}

// Function to debug CSV data
const debugCSVData = async (filename, sampleSize = 3) => {
  console.log(`🔍 Debugging ${filename}...`)
  try {
    const data = await readCSV(filename)
    console.log(`   Total records: ${data.length}`)
    console.log(`   Sample records:`)
    
    for (let i = 0; i < Math.min(sampleSize, data.length); i++) {
      console.log(`   [${i + 1}]:`, JSON.stringify(data[i], null, 2))
    }
  } catch (error) {
    console.error(`   Error reading ${filename}:`, error.message)
  }
}

// Function to clear existing data
const clearTables = async () => {
  console.log('🗑️  Clearing existing data...')
  
  try {
    // Disable triggers temporarily to avoid stock update conflicts
    await client.query('ALTER TABLE transactions DISABLE TRIGGER trigger_update_product_stock')
    
    // Clear tables in correct order (respecting foreign keys)
    await client.query('DELETE FROM transactions')
    await client.query('DELETE FROM products')
    await client.query('DELETE FROM suppliers')
    
    console.log('✅ Existing data cleared')
  } catch (error) {
    console.error('❌ Error clearing tables:', error.message)
    throw error
  }
}

// Function to ingest suppliers
const ingestSuppliers = async () => {
  console.log('📥 Ingesting suppliers...')
  
  try {
    const suppliers = await readCSV('suppliers.csv')
    let successCount = 0
    
    for (const supplier of suppliers) {
      // Validate required fields
      if (!supplier.id || !supplier.name || !supplier.contact) {
        console.log(`⚠️  Skipping supplier ${supplier.id}: Missing required fields`)
        continue
      }
      
      try {
        await client.query(
          'INSERT INTO suppliers (id, name, contact, email) VALUES ($1, $2, $3, $4)',
          [
            supplier.id.trim(),
            supplier.name.trim(),
            supplier.contact.trim(),
            supplier.email ? supplier.email.trim() : null
          ]
        )
        successCount++
      } catch (insertError) {
        console.log(`⚠️  Failed to insert supplier ${supplier.id}: ${insertError.message}`)
      }
    }
    
    console.log(`✅ Successfully ingested ${successCount}/${suppliers.length} suppliers`)
  } catch (error) {
    console.error('❌ Error ingesting suppliers:', error.message)
    throw error
  }
}

// Function to ingest products
const ingestProducts = async () => {
  console.log('📥 Ingesting products...')
  
  try {
    const products = await readCSV('products.csv')
    let successCount = 0
    
    for (const product of products) {
      // Validate and clean data
      const price = parseFloat(product.price)
      const stock = parseInt(product.stock)
      
      if (isNaN(price)) {
        console.log(`⚠️  Skipping product ${product.id}: Invalid price "${product.price}"`)
        continue
      }
      
      if (isNaN(stock)) {
        console.log(`⚠️  Skipping product ${product.id}: Invalid stock "${product.stock}"`)
        continue
      }
      
      if (!product.id || !product.name || !product.category || !product.supplier_id) {
        console.log(`⚠️  Skipping product ${product.id}: Missing required fields`)
        continue
      }
      
      try {
        await client.query(
          'INSERT INTO products (id, name, category, price, stock, supplier_id) VALUES ($1, $2, $3, $4, $5, $6)',
          [
            product.id.trim(),
            product.name.trim(),
            product.category.trim(),
            price,
            stock,
            product.supplier_id.trim()
          ]
        )
        successCount++
      } catch (insertError) {
        console.log(`⚠️  Failed to insert product ${product.id}: ${insertError.message}`)
      }
    }
    
    console.log(`✅ Successfully ingested ${successCount}/${products.length} products`)
  } catch (error) {
    console.error('❌ Error ingesting products:', error.message)
    throw error
  }
}

// Function to ingest transactions
const ingestTransactions = async () => {
  console.log('📥 Ingesting transactions...')
  
  try {
    const transactions = await readCSV('transactions.csv')
    
    // Re-enable the trigger before inserting transactions
    await client.query('ALTER TABLE transactions ENABLE TRIGGER trigger_update_product_stock')
    
    // Reset all product stocks to 0 before processing transactions
    await client.query('UPDATE products SET stock = 0')
    
    let successCount = 0
    
    for (const transaction of transactions) {
      // Validate data
      const quantity = parseInt(transaction.quantity)
      
      if (isNaN(quantity) || quantity <= 0) {
        console.log(`⚠️  Skipping transaction ${transaction.id}: Invalid quantity "${transaction.quantity}"`)
        continue
      }
      
      if (!transaction.id || !transaction.product_id || !transaction.type || !transaction.date) {
        console.log(`⚠️  Skipping transaction ${transaction.id}: Missing required fields`)
        continue
      }
      
      if (!['purchase', 'sale'].includes(transaction.type)) {
        console.log(`⚠️  Skipping transaction ${transaction.id}: Invalid type "${transaction.type}"`)
        continue
      }
      
      try {
        await client.query(
          'INSERT INTO transactions (id, product_id, quantity, type, date) VALUES ($1, $2, $3, $4, $5)',
          [
            transaction.id.trim(),
            transaction.product_id.trim(),
            quantity,
            transaction.type.trim(),
            transaction.date.trim()
          ]
        )
        successCount++
      } catch (insertError) {
        console.log(`⚠️  Failed to insert transaction ${transaction.id}: ${insertError.message}`)
      }
    }
    
    console.log(`✅ Successfully ingested ${successCount}/${transactions.length} transactions`)
  } catch (error) {
    console.error('❌ Error ingesting transactions:', error.message)
    throw error
  }
}

// Function to verify data integrity
const verifyData = async () => {
  console.log('🔍 Verifying data integrity...')
  
  try {
    const supplierCount = await client.query('SELECT COUNT(*) FROM suppliers')
    const productCount = await client.query('SELECT COUNT(*) FROM products')
    const transactionCount = await client.query('SELECT COUNT(*) FROM transactions')
    
    console.log(`📊 Data Summary:`)
    console.log(`   - Suppliers: ${supplierCount.rows[0].count}`)
    console.log(`   - Products: ${productCount.rows[0].count}`)
    console.log(`   - Transactions: ${transactionCount.rows[0].count}`)
    
    // Check for orphaned records
    const orphanedProducts = await client.query(`
      SELECT COUNT(*) FROM products p 
      LEFT JOIN suppliers s ON p.supplier_id = s.id 
      WHERE s.id IS NULL
    `)
    
    const orphanedTransactions = await client.query(`
      SELECT COUNT(*) FROM transactions t 
      LEFT JOIN products p ON t.product_id = p.id 
      WHERE p.id IS NULL
    `)
    
    if (parseInt(orphanedProducts.rows[0].count) > 0) {
      console.log(`⚠️  Found ${orphanedProducts.rows[0].count} products with invalid supplier references`)
    }
    
    if (parseInt(orphanedTransactions.rows[0].count) > 0) {
      console.log(`⚠️  Found ${orphanedTransactions.rows[0].count} transactions with invalid product references`)
    }
    
    if (parseInt(orphanedProducts.rows[0].count) === 0 && parseInt(orphanedTransactions.rows[0].count) === 0) {
      console.log('✅ All foreign key references are valid')
    }
    
    // Show some sample data
    const sampleProducts = await client.query(`
      SELECT p.name, p.stock, s.name as supplier_name 
      FROM products p 
      JOIN suppliers s ON p.supplier_id = s.id 
      LIMIT 5
    `)
    
    console.log('\n📋 Sample Products:')
    sampleProducts.rows.forEach(row => {
      console.log(`   - ${row.name} (Stock: ${row.stock}) - Supplier: ${row.supplier_name}`)
    })
    
  } catch (error) {
    console.error('❌ Error verifying data:', error.message)
    throw error
  }
}

// Main ingestion function
const main = async () => {
  console.log('🚀 Starting data ingestion to Neon PostgreSQL...')
  console.log(`📡 Connecting to: ${process.env.DATABASE_URL.split('@')[1].split('/')[0]}`)
  
  try {
    // Connect to database
    await client.connect()
    console.log('✅ Connected to PostgreSQL database')
    
    // Check if tables exist
    const tablesExist = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('suppliers', 'products', 'transactions')
    `)
    
    if (tablesExist.rows.length < 3) {
      console.log('⚠️  Some tables are missing. Please run schema.sql first:')
      console.log('   psql $DATABASE_URL -f backend/schema.sql')
      process.exit(1)
    }
    
    // Debug CSV data first
    await debugCSVData('suppliers.csv')
    await debugCSVData('products.csv')
    await debugCSVData('transactions.csv')
    
    // Clear existing data
    await clearTables()
    
    // Ingest data in correct order (respecting foreign keys)
    await ingestSuppliers()
    await ingestProducts()
    await ingestTransactions()
    
    // Verify data integrity
    await verifyData()
    
    console.log('\n🎉 Data ingestion completed successfully!')
    console.log('💡 Your Mini ERP system is now ready to use with PostgreSQL backend')
    
  } catch (error) {
    console.error('💥 Ingestion failed:', error.message)
    process.exit(1)
  } finally {
    await client.end()
    console.log('🔌 Database connection closed')
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n⏹️  Ingestion interrupted')
  await client.end()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n⏹️  Ingestion terminated')
  await client.end()
  process.exit(0)
})

// Run the main function
main().catch(console.error)