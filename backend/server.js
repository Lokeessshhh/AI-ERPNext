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

// Middleware
app.use(cors())
app.use(express.json())

// Test database connection
const testDatabaseConnection = async () => {
  let retries = 3
  while (retries > 0) {
    try {
      console.log(`🔄 Testing database connection... (${4 - retries}/3)`)
      const result = await query('SELECT NOW() as current_time, COUNT(*) as product_count FROM products')
      console.log('✅ Database connected successfully')
      console.log(`📅 Database time: ${result.rows[0].current_time}`)
      console.log(`📦 Products in database: ${result.rows[0].product_count}`)
      return
    } catch (error) {
      retries--
      console.error(`❌ Database connection attempt failed: ${error.message}`)
      
      if (retries === 0) {
        console.log('💡 Database connection failed after 3 attempts.')
        console.log('💡 Make sure to run: npm run setup-db')
        console.log('💡 Or check if your DATABASE_URL is correct')
        process.exit(1)
      }
      
      console.log(`⏳ Retrying in 2 seconds... (${retries} attempts left)`)
      await new Promise(resolve => setTimeout(resolve, 2000))
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



app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api`)
  console.log(`🗄️  Using PostgreSQL database`)
})