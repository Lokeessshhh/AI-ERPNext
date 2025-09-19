# 🚀 Mini ERP Lite - AI-Powered Inventory Management System

A complete, production-ready **Enterprise Resource Planning (ERP)** system built with modern web technologies and AI integration. Perfect for small to medium businesses looking to streamline their inventory management with intelligent insights.

![Mini ERP Lite](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![React](https://img.shields.io/badge/React-18.x-blue)
![Node.js](https://img.shields.io/badge/Node.js-20.x-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.x-blue)
![AI Powered](https://img.shields.io/badge/AI-NVIDIA%20Llama%203.3-purple)

## ✨ Features

### 🎯 **Core Functionality**
- **📦 Product Management** - Complete CRUD operations with categories and suppliers
- **🏢 Supplier Management** - Vendor relationships and contact management
- **📈 Transaction Tracking** - Sales and purchase recording with automatic stock updates
- **📊 Real-time Dashboard** - Comprehensive business metrics and analytics
- **🔍 Advanced Search & Filtering** - Find anything instantly across all modules
- **📄 Data Export** - CSV/JSON export for external analysis

### 🤖 **AI-Powered Features**
- **Intelligent Reorder Suggestions** - AI analyzes sales patterns and recommends optimal reorder quantities
- **Smart Inventory Assistant** - Chat with AI about your inventory using natural language
- **Predictive Analytics** - AI-driven insights for better business decisions
- **Contextual Recommendations** - Get specific advice based on your actual data

### 🎨 **Premium UI/UX**
- **Modern Design** - Clean, professional interface with TailwindCSS
- **Responsive Layout** - Works perfectly on desktop, tablet, and mobile
- **Interactive Components** - Sortable tables, pagination, and modal dialogs
- **Real-time Updates** - Live data refresh and notifications
- **Dark Mode Ready** - Professional color schemes

### 🔧 **Technical Excellence**
- **Production Architecture** - Scalable, maintainable codebase
- **Database Integrity** - Foreign keys, triggers, and proper relationships
- **Error Handling** - Comprehensive error management and validation
- **Security** - Input validation and SQL injection protection
- **Performance** - Optimized queries and efficient data loading

## 🏗️ Project Structure

```
mini-erp/
├── 📁 frontend/                    # React.js Frontend Application
│   ├── 📁 public/                  # Static assets
│   ├── 📁 src/
│   │   ├── 📁 components/          # Reusable UI Components
│   │   │   ├── AIAssistant.jsx     # AI Chat Interface
│   │   │   ├── Chart.jsx           # Data Visualization
│   │   │   ├── DataTable.jsx       # Enhanced Table Component
│   │   │   ├── FilterBar.jsx       # Advanced Filtering
│   │   │   ├── Layout.jsx          # Main App Layout
│   │   │   ├── Modal.jsx           # Modal Dialogs
│   │   │   ├── NotificationCenter.jsx # Notification System
│   │   │   ├── Pagination.jsx      # Table Pagination
│   │   │   ├── QuickActions.jsx    # Action Buttons
│   │   │   ├── SearchBar.jsx       # Search Interface
│   │   │   └── StatsCard.jsx       # Metric Display Cards
│   │   ├── 📁 hooks/               # Custom React Hooks
│   │   │   ├── usePagination.js    # Pagination Logic
│   │   │   ├── useSearch.js        # Search Functionality
│   │   │   └── useSort.js          # Sorting Logic
│   │   ├── 📁 pages/               # Main Application Pages
│   │   │   ├── Dashboard.jsx       # Analytics Dashboard
│   │   │   ├── Products.jsx        # Product Management
│   │   │   ├── Suppliers.jsx       # Supplier Management
│   │   │   └── Transactions.jsx    # Transaction History
│   │   ├── 📁 services/            # API Integration
│   │   │   └── api.js              # Axios API Client
│   │   ├── App.jsx                 # Main App Component
│   │   ├── index.css               # Global Styles
│   │   └── main.jsx                # App Entry Point
│   ├── index.html                  # HTML Template
│   ├── package.json                # Frontend Dependencies
│   ├── postcss.config.js           # PostCSS Configuration
│   ├── tailwind.config.js          # TailwindCSS Configuration
│   └── vite.config.js              # Vite Build Configuration
├── 📁 backend/                     # Node.js Backend API
│   ├── 📁 data/                    # Sample Data Files
│   │   ├── products.csv            # 201 Sample Products
│   │   ├── suppliers.csv           # 21 Sample Suppliers
│   │   └── transactions.csv        # 251 Sample Transactions
│   ├── 📁 routes/                  # API Route Handlers
│   │   ├── ai.js                   # AI Integration Endpoints
│   │   ├── products.js             # Product CRUD Operations
│   │   ├── reports.js              # Analytics & Reports
│   │   ├── suppliers.js            # Supplier Management
│   │   └── transactions.js         # Transaction Processing
│   ├── 📁 scripts/                 # Database & Setup Scripts
│   │   ├── fix_schema.js           # Schema Migration
│   │   ├── fix_schema.sql          # SQL Schema Updates
│   │   ├── ingest_data.js          # Data Import Script
│   │   └── setup_database.js       # Database Initialization
│   ├── 📁 utils/                   # Utility Functions
│   │   ├── csvHelper.js            # CSV Processing
│   │   ├── database.js             # Database Connection
│   │   └── dataInitializer.js      # Data Setup Helper
│   ├── .env                        # Environment Variables
│   ├── package.json                # Backend Dependencies
│   ├── schema.sql                  # Database Schema
│   └── server.js                   # Express Server
├── .gitignore                      # Git Ignore Rules
└── README.md                       # This File
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18.x or higher
- **PostgreSQL** 15.x or higher
- **NVIDIA API Key** (for AI features)

### 1. Clone Repository
```bash
git clone https://github.com/Lokeessshhh/AI-ERPNext.git
cd AI-ERPNext
```

### 2. Database Setup
```bash
# Create PostgreSQL database
createdb mini_erp

# Set up environment variables
cd backend
cp .env.example .env
# Edit .env with your database URL and NVIDIA API key
```

### 3. Backend Setup
```bash
cd backend
npm install
npm run setup-db    # Initialize database and import sample data
npm start          # Start backend server on http://localhost:3001
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev        # Start frontend on http://localhost:5173
```

### 5. Access Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/api/health

## 🔧 Configuration

### Environment Variables (.env)
```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/mini_erp

# AI Configuration (Optional - for AI features)
NVIDIA_API_KEY=your_nvidia_api_key_here

# Server Configuration
PORT=3001
NODE_ENV=development
```

### Database Schema
The system uses PostgreSQL with the following tables:
- **suppliers** - Vendor information and contacts
- **products** - Product catalog with categories and pricing
- **transactions** - Sales and purchase records
- **Triggers** - Automatic stock level updates

## 🤖 AI Integration

### NVIDIA Llama 3.3 Integration
- **Reorder Suggestions**: AI analyzes sales patterns and recommends optimal reorder quantities
- **Inventory Chat**: Natural language queries about your inventory
- **Smart Insights**: Contextual business recommendations

### AI Features Usage
1. **Product Reorder**: Click the 🤖 icon next to any product for AI suggestions
2. **Inventory Assistant**: Use the chat bubble in bottom-right corner
3. **Ask Questions**: "How many Electronics products do I have?" or "What needs reordering?"

## 📊 Sample Data

The system comes pre-loaded with realistic sample data:
- **201 Products** across 6 categories (Electronics, Office Supplies, etc.)
- **21 Suppliers** with complete contact information
- **251 Transactions** showing sales and purchase history
- **Total Inventory Value**: $216,520

## 🎯 Key Features Walkthrough

### Dashboard
- **8 Key Metrics** with trend indicators
- **Category Distribution** with percentages
- **Top Products & Suppliers** rankings
- **Recent Transactions** with filtering
- **Low Stock Alerts** for items needing attention

### Product Management
- **Advanced Search** by name, category, or supplier
- **Column Sorting** with visual indicators
- **Pagination** with customizable page sizes
- **AI Reorder Suggestions** for each product
- **Export Functionality** (CSV/JSON)

### Supplier Management
- **Contact Management** with email and phone
- **Product Relationships** showing linked products
- **Performance Metrics** by inventory value
- **CRUD Operations** with validation

### Transaction Processing
- **Automatic Stock Updates** on sales/purchases
- **Real-time Inventory** level adjustments
- **Transaction History** with comprehensive filtering
- **Financial Tracking** with value calculations

## 🔒 Security Features

- **Input Validation** on all forms and API endpoints
- **SQL Injection Protection** using parameterized queries
- **Error Handling** with proper HTTP status codes
- **Data Validation** with comprehensive checks

## 📈 Performance Optimizations

- **Efficient Queries** with proper indexing
- **Lazy Loading** for large datasets
- **Caching** for frequently accessed data
- **Optimized Bundle** with Vite build system

## 🚀 Deployment

### Production Build
```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm run start
```

### Environment Setup
1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Import sample data (optional)
5. Start production servers

### Recommended Hosting
- **Frontend**: Vercel, Netlify, or AWS S3
- **Backend**: Railway, Heroku, or AWS EC2
- **Database**: Neon, Supabase, or AWS RDS

## 🛠️ Development

### Available Scripts

**Backend:**
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm run setup-db   # Initialize database and import data
```

**Frontend:**
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
```

### Tech Stack

**Frontend:**
- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library
- **Axios** - HTTP client for API calls

**Backend:**
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **PostgreSQL** - Relational database
- **NVIDIA API** - AI integration for smart features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **NVIDIA** for providing the Llama 3.3 AI model
- **Neon** for PostgreSQL database hosting
- **TailwindCSS** for the beautiful UI framework
- **React Team** for the amazing frontend library

## 📞 Support

For support, email support@mini-erp-lite.com or create an issue on GitHub.

---

**Built with ❤️ for modern businesses seeking intelligent inventory management.**

🌟 **Star this repository if you found it helpful!**