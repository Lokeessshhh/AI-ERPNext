import express from 'express'
import { OpenAI } from 'openai'
import { query } from '../utils/database.js'
import dotenv from 'dotenv'

dotenv.config()

const router = express.Router()

// Initialize NVIDIA API client
const client = new OpenAI({
  baseURL: "https://integrate.api.nvidia.com/v1",
  apiKey: process.env.NVIDIA_API_KEY
})

// Generate AI reorder suggestion using NVIDIA API
const generateReorderSuggestion = async (product, transactions) => {
  const currentStock = parseInt(product.stock)
  const productTransactions = transactions.filter(t => t.product_id === product.id)
  
  // Calculate sales data
  const salesTransactions = productTransactions.filter(t => t.type === 'sale')
  const purchaseTransactions = productTransactions.filter(t => t.type === 'purchase')
  const totalSold = salesTransactions.reduce((sum, t) => sum + parseInt(t.quantity), 0)
  const totalPurchased = purchaseTransactions.reduce((sum, t) => sum + parseInt(t.quantity), 0)
  
  // Prepare context for AI
  const context = `
Product Analysis:
- Product Name: ${product.name}
- Category: ${product.category}
- Current Stock: ${currentStock} units
- Price: $${product.price}
- Total Sales (historical): ${totalSold} units
- Total Purchases (historical): ${totalPurchased} units
- Number of Sale Transactions: ${salesTransactions.length}
- Number of Purchase Transactions: ${purchaseTransactions.length}

Recent Transaction History:
${productTransactions.slice(-10).map(t => 
  `- ${t.type.toUpperCase()}: ${t.quantity} units on ${t.date}`
).join('\n')}

Please analyze this inventory data and provide a smart reorder recommendation. Consider:
1. Current stock level vs historical sales patterns
2. Seasonal trends if any
3. Optimal reorder quantity to avoid stockouts
4. Cost-effective ordering strategy

Provide a concise, actionable recommendation with specific quantities and reasoning.
`

  try {
    const completion = await client.chat.completions.create({
      model: "nvidia/llama-3.3-nemotron-super-49b-v1.5",
      messages: [
        {
          "role": "system",
          "content": "You are an expert inventory management AI assistant. Analyze product data and provide smart, actionable reorder recommendations. Be concise but thorough in your analysis."
        },
        {
          "role": "user",
          "content": context
        }
      ],
      temperature: 0.6,
      top_p: 0.95,
      max_tokens: 1024,
      frequency_penalty: 0,
      presence_penalty: 0,
      stream: false
    })

    let content = completion.choices[0].message.content
    
    // Remove thinking tags and content for cleaner user experience
    content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
    
    return content || "AI analysis completed. Please check the recommendation above."
  } catch (error) {
    console.error('NVIDIA API Error:', error)
    
    // Fallback to simple logic if API fails
    const avgMonthlySales = Math.max(1, Math.ceil(totalSold / 3))
    const reorderPoint = avgMonthlySales * 2
    
    if (currentStock <= reorderPoint) {
      const suggestedOrder = Math.max(avgMonthlySales * 3, 20)
      return `⚠️ REORDER RECOMMENDED: Current stock (${currentStock}) is below reorder point (${reorderPoint}). Suggested order quantity: ${suggestedOrder} units based on average monthly sales of ${avgMonthlySales} units. (Note: AI service temporarily unavailable, using fallback analysis)`
    } else {
      const monthsOfStock = Math.floor(currentStock / avgMonthlySales)
      return `✅ Stock levels are adequate. Current stock (${currentStock}) provides approximately ${monthsOfStock} months of inventory based on sales trends. (Note: AI service temporarily unavailable, using fallback analysis)`
    }
  }
}

// POST AI reorder suggestion
router.post('/reorder-suggestion', async (req, res) => {
  try {
    const { productId } = req.body
    
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' })
    }

    const [productResult, transactionResult] = await Promise.all([
      query('SELECT * FROM products WHERE id = $1', [productId]),
      query('SELECT * FROM transactions WHERE product_id = $1', [productId])
    ])

    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' })
    }

    const product = productResult.rows[0]
    const transactions = transactionResult.rows

    // Generate AI suggestion
    const suggestion = await generateReorderSuggestion(product, transactions)
    
    res.json({
      productId,
      productName: product.name,
      currentStock: parseInt(product.stock),
      suggestion,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('AI suggestion error:', error)
    res.status(500).json({ error: 'Failed to generate AI suggestion' })
  }
})

// POST batch AI suggestions for all low stock products
router.post('/batch-reorder-suggestions', async (req, res) => {
  try {
    const [productResult, transactionResult] = await Promise.all([
      query('SELECT * FROM products WHERE stock < 10'),
      query('SELECT * FROM transactions')
    ])

    const lowStockProducts = productResult.rows
    const allTransactions = transactionResult.rows
    
    const suggestions = await Promise.all(
      lowStockProducts.map(async (product) => {
        const suggestion = await generateReorderSuggestion(product, allTransactions)
        return {
          productId: product.id,
          productName: product.name,
          currentStock: parseInt(product.stock),
          suggestion
        }
      })
    )

    res.json({
      count: suggestions.length,
      suggestions,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Batch AI suggestions error:', error)
    res.status(500).json({ error: 'Failed to generate batch AI suggestions' })
  }
})

// POST AI chat - General inventory assistant
router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' })
    }

    // Get real-time inventory data
    const [productsResult, suppliersResult, transactionsResult] = await Promise.all([
      query('SELECT * FROM products ORDER BY name'),
      query('SELECT * FROM suppliers ORDER BY name'),
      query('SELECT * FROM transactions ORDER BY date DESC LIMIT 100')
    ])

    const products = productsResult.rows
    const suppliers = suppliersResult.rows
    const transactions = transactionsResult.rows

    // Calculate key metrics
    const totalProducts = products.length
    const totalValue = products.reduce((sum, p) => sum + (parseFloat(p.price) * parseInt(p.stock)), 0)
    const lowStockProducts = products.filter(p => parseInt(p.stock) < 10)
    const categories = [...new Set(products.map(p => p.category))]
    const totalSuppliers = suppliers.length

    // Recent transactions summary
    const recentSales = transactions.filter(t => t.type === 'sale').slice(0, 10)
    const recentPurchases = transactions.filter(t => t.type === 'purchase').slice(0, 10)

    // Create context for AI
    const context = `
Current Inventory Status:
- Total Products: ${totalProducts}
- Total Inventory Value: $${totalValue.toLocaleString()}
- Low Stock Items: ${lowStockProducts.length} (below 10 units)
- Categories: ${categories.join(', ')}
- Total Suppliers: ${totalSuppliers}

Low Stock Products (need attention):
${lowStockProducts.slice(0, 5).map(p => `- ${p.name}: ${p.stock} units (${p.category})`).join('\n')}

Recent Sales (last 10):
${recentSales.map(t => `- ${t.product_name}: ${t.quantity} units on ${t.date}`).join('\n')}

Top Categories by Product Count:
${categories.map(cat => {
  const count = products.filter(p => p.category === cat).length
  return `- ${cat}: ${count} products`
}).join('\n')}

User Question: "${message}"

Please provide a SHORT, ACCURATE response based on the REAL data above. Be specific with numbers and actionable. Avoid generic guides or lengthy explanations.
`

    try {
      const completion = await client.chat.completions.create({
        model: "nvidia/llama-3.3-nemotron-super-49b-v1.5",
        messages: [
          {
            "role": "system",
            "content": "You are a concise inventory management AI. Give SHORT, SPECIFIC answers using REAL data. No generic guides. Be direct and actionable. Use actual numbers from the data provided."
          },
          {
            "role": "user",
            "content": context
          }
        ],
        temperature: 0.3,
        top_p: 0.9,
        max_tokens: 200,
        frequency_penalty: 0,
        presence_penalty: 0,
        stream: false
      })

      let response = completion.choices[0].message.content
      
      // Clean up response
      response = response.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
      
      res.json({
        message: response,
        timestamp: new Date().toISOString(),
        dataSnapshot: {
          totalProducts,
          totalValue: Math.round(totalValue),
          lowStockCount: lowStockProducts.length,
          categoriesCount: categories.length
        }
      })
    } catch (error) {
      console.error('NVIDIA API Error:', error)
      
      // Fallback response with real data
      let fallbackResponse = ""
      
      if (message.toLowerCase().includes('inventory') || message.toLowerCase().includes('status')) {
        fallbackResponse = `You have ${totalProducts} products worth $${Math.round(totalValue).toLocaleString()}. ${lowStockProducts.length} items need reordering (below 10 units).`
      } else if (message.toLowerCase().includes('reorder') || message.toLowerCase().includes('low stock')) {
        fallbackResponse = `${lowStockProducts.length} products need reordering: ${lowStockProducts.slice(0, 3).map(p => p.name).join(', ')}${lowStockProducts.length > 3 ? '...' : ''}`
      } else if (message.toLowerCase().includes('supplier')) {
        fallbackResponse = `You have ${totalSuppliers} suppliers. Top suppliers: ${suppliers.slice(0, 3).map(s => s.name).join(', ')}`
      } else if (message.toLowerCase().includes('categor')) {
        fallbackResponse = `${categories.length} categories: ${categories.slice(0, 4).join(', ')}${categories.length > 4 ? '...' : ''}`
      } else {
        fallbackResponse = `Current inventory: ${totalProducts} products, $${Math.round(totalValue).toLocaleString()} total value, ${lowStockProducts.length} items need reordering.`
      }
      
      res.json({
        message: fallbackResponse + " (AI service temporarily unavailable)",
        timestamp: new Date().toISOString(),
        dataSnapshot: {
          totalProducts,
          totalValue: Math.round(totalValue),
          lowStockCount: lowStockProducts.length,
          categoriesCount: categories.length
        }
      })
    }
  } catch (error) {
    console.error('AI chat error:', error)
    res.status(500).json({ error: 'Failed to process AI chat request' })
  }
})

export default router