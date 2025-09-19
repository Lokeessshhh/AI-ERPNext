import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataDir = path.join(__dirname, '../data')

export const initializeData = async () => {
  try {
    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
      console.log('📁 Data directory created')
    }

    // Check if CSV files exist
    const suppliersPath = path.join(dataDir, 'suppliers.csv')
    const productsPath = path.join(dataDir, 'products.csv')
    const transactionsPath = path.join(dataDir, 'transactions.csv')

    const filesExist = {
      suppliers: fs.existsSync(suppliersPath),
      products: fs.existsSync(productsPath),
      transactions: fs.existsSync(transactionsPath)
    }

    if (filesExist.suppliers && filesExist.products && filesExist.transactions) {
      console.log('✅ CSV data files found and loaded')
    } else {
      console.log('⚠️  Some CSV files are missing:')
      if (!filesExist.suppliers) console.log('   - suppliers.csv not found')
      if (!filesExist.products) console.log('   - products.csv not found')
      if (!filesExist.transactions) console.log('   - transactions.csv not found')
      console.log('📝 Please ensure all CSV files are present in the data/ directory')
    }

    console.log('📊 Data initialization complete')
  } catch (error) {
    console.error('❌ Error initializing data:', error)
  }
}