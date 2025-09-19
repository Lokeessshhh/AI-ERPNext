import { Client, Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

// Create a connection pool for better performance
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  acquireTimeoutMillis: 10000,
  createTimeoutMillis: 10000,
  destroyTimeoutMillis: 5000,
  reapIntervalMillis: 1000,
  createRetryIntervalMillis: 200,
})

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
  process.exit(-1)
})

export const query = async (text, params) => {
  const start = Date.now()
  let client
  try {
    client = await pool.connect()
    const res = await client.query(text, params)
    const duration = Date.now() - start
    console.log('Executed query', { text: text.substring(0, 50) + '...', duration, rows: res.rowCount })
    return res
  } catch (error) {
    console.error('Database query error:', error.message)
    throw error
  } finally {
    if (client) {
      client.release()
    }
  }
}

export const getClient = async () => {
  const client = await pool.connect()
  return client
}

export default pool