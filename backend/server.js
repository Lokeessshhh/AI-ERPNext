import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { query } from './utils/database.js'
import productRoutes from './routes/products.js'
import supplierRoutes from './routes/suppliers.js'
import transactionRoutes from './routes/transactions.js'
import reportRoutes from './routes/reports.js'
import aiRoutes from './routes/ai.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Validate required environment variables
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required')
  console.log('💡 Make sure to set DATABASE_URL in your environment variables')
  console.log('💡 Example: postgresql://user:pass@host:port/database?sslmode=require')
  process.exit(1)
}

console.log('🔧 Environment check:')
console.log(`   NODE_ENV: ${process.env.NODE_ENV}`)
console.log(`   PORT: ${PORT}`)
console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? 'Set ✅' : 'Missing ❌'}`)
console.log(`   NVIDIA_API_KEY: ${process.env.NVIDIA_API_KEY ? 'Set ✅' : 'Missing (optional)'}`)
console.log('')

// Middleware
app.use(cors())
app.use(express.json())

// Test database connection
const testDatabaseConnection = async () => {
  let retries = 3
  while (retries > 0) {
    try {
      console.log(`🔄 Testing database connection... (${4 - retries}/3)`)
      
      // First try a simple connection test
      const simpleResult = await query('SELECT NOW() as current_time')
      console.log('✅ Database connected successfully')
      console.log(`📅 Database time: ${simpleResult.rows[0].current_time}`)
      
      // Then try to check if tables exist
      try {
        const productResult = await query('SELECT COUNT(*) as product_count FROM products')
        console.log(`📦 Products in database: ${productResult.rows[0].product_count}`)
      } catch (tableError) {
        console.log('⚠️  Tables not found - database needs initialization')
        console.log('💡 Run POST /api/setup-database after deployment')
      }
      
      return
    } catch (error) {
      retries--
      console.error(`❌ Database connection attempt failed: ${error.message}`)
      console.error(`❌ Full error:`, error)
      
      if (retries === 0) {
        console.log('💡 Database connection failed after 3 attempts.')
        console.log('💡 Check your DATABASE_URL environment variable')
        console.log('💡 Current DATABASE_URL format:', process.env.DATABASE_URL?.substring(0, 20) + '...')
        process.exit(1)
      }
      
      console.log(`⏳ Retrying in 3 seconds... (${retries} attempts left)`)
      await new Promise(resolve => setTimeout(resolve, 3000))
    }
  }
}

// Initialize database connection
await testDatabaseConnection()

// Routes
app.use('/api/products', productRoutes)
app.use('/api/suppliers', supplierRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/ai', aiRoutes)

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const dbResult = await query('SELECT COUNT(*) as total_products FROM products')
    res.json({ 
      status: 'OK', 
      message: 'Mini ERP Backend is running',
      database: 'Connected',
      products: dbResult.rows[0].total_products
    })
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Database connection failed',
      error: error.message
    })
  }
})

// Database setup endpoint (for initial deployment)
app.post('/api/setup-database', async (req, res) => {
  try {
    // Import the setup script
    const { setupDatabase } = await import('./scripts/setup_database.js')
    await setupDatabase()
    res.json({ 
      status: 'SUCCESS', 
      message: 'Database setup completed successfully' 
    })
  } catch (error) {
    console.error('Database setup failed:', error)
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Database setup failed',
      error: error.message
    })
  }
})



app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api`)
  console.log(`🗄️  Using PostgreSQL database`)
})