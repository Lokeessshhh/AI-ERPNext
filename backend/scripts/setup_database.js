#!/usr/bin/env node

import { Client } from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { execSync } from 'child_process'

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const schemaPath = path.join(__dirname, '../schema.sql')

// Database connection
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

const setupDatabase = async () => {
  console.log('🏗️  Setting up Mini ERP Database...')
  console.log(`📡 Connecting to: ${process.env.DATABASE_URL.split('@')[1].split('/')[0]}`)
  
  try {
    // Connect to database
    await client.connect()
    console.log('✅ Connected to PostgreSQL database')
    
    // Read and execute schema
    console.log('📋 Creating database schema...')
    const schema = fs.readFileSync(schemaPath, 'utf8')
    await client.query(schema)
    console.log('✅ Database schema created successfully')
    
    await client.end()
    console.log('🔌 Database connection closed')
    
    // Run data ingestion
    console.log('\n📥 Starting data ingestion...')
    execSync('node scripts/ingest_data.js', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    })
    
  } catch (error) {
    console.error('💥 Database setup failed:', error.message)
    process.exit(1)
  }
}

// Run setup
setupDatabase().catch(console.error)