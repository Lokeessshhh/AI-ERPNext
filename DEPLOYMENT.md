# 🚀 Deployment Guide - Mini ERP Lite

This guide covers deploying Mini ERP Lite to various cloud platforms.

## 🌐 Recommended Deployment Stack

### Option 1: Full Cloud (Recommended)
- **Frontend**: Vercel or Netlify
- **Backend**: Railway or Render
- **Database**: Neon PostgreSQL

### Option 2: AWS Stack
- **Frontend**: AWS S3 + CloudFront
- **Backend**: AWS EC2 or Lambda
- **Database**: AWS RDS PostgreSQL

### Option 3: Self-Hosted
- **Server**: Ubuntu/CentOS with Docker
- **Database**: PostgreSQL 15+
- **Reverse Proxy**: Nginx

## 🚀 Quick Deploy with Railway + Vercel

### 1. Database Setup (Neon)
```bash
# 1. Go to https://neon.tech and create account
# 2. Create new project "mini-erp"
# 3. Copy connection string
```

### 2. Backend Deployment (Railway)
```bash
# 1. Fork this repository
# 2. Go to https://railway.app
# 3. Connect GitHub and select your fork
# 4. Add environment variables:
DATABASE_URL=your_neon_connection_string
NVIDIA_API_KEY=your_nvidia_api_key
PORT=3001
NODE_ENV=production

# 5. Railway will auto-deploy from /backend
```

### 3. Frontend Deployment (Vercel)
```bash
# 1. Go to https://vercel.com
# 2. Import your GitHub repository
# 3. Set build settings:
#    - Framework: Vite
#    - Root Directory: frontend
#    - Build Command: npm run build
#    - Output Directory: dist
# 4. Add environment variable:
VITE_API_URL=https://your-railway-app.railway.app/api

# 5. Deploy!
```

## 🐳 Docker Deployment

### Docker Compose Setup
```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: mini_erp
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/mini_erp
      NVIDIA_API_KEY: your_api_key
      PORT: 3001
    ports:
      - "3001:3001"
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### Deploy with Docker
```bash
# Clone repository
git clone https://github.com/Lokeessshhh/AI-ERPNext.git
cd AI-ERPNext

# Create environment file
cp backend/.env.example backend/.env
# Edit .env with your settings

# Build and run
docker-compose up -d

# Initialize database
docker-compose exec backend npm run setup-db
```

## 🔧 Environment Variables

### Backend (.env)
```env
# Required
DATABASE_URL=postgresql://user:pass@host:port/db
PORT=3001

# Optional (for AI features)
NVIDIA_API_KEY=your_nvidia_api_key

# Production settings
NODE_ENV=production
```

### Frontend (Vercel/Netlify)
```env
# API endpoint
VITE_API_URL=https://your-backend-url.com/api
```

## 📊 Database Migration

### Initial Setup
```bash
# Run these commands after deployment
npm run setup-db    # Creates tables and imports sample data
```

### Manual Setup
```sql
-- Connect to your PostgreSQL database
-- Run the schema.sql file
\i schema.sql

-- Import sample data (optional)
-- Use the CSV files in /backend/data/
```

## 🔒 Production Security

### Environment Security
- Never commit .env files
- Use strong database passwords
- Enable SSL for database connections
- Use HTTPS for all endpoints

### Database Security
```sql
-- Create dedicated user for application
CREATE USER mini_erp_app WITH PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE mini_erp TO mini_erp_app;
GRANT USAGE ON SCHEMA public TO mini_erp_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO mini_erp_app;
```

## 📈 Performance Optimization

### Database Optimization
```sql
-- Add indexes for better performance
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_product ON transactions(product_id);
```

### Frontend Optimization
```bash
# Build with optimizations
npm run build

# Serve with compression
# Use CDN for static assets
# Enable gzip compression
```

## 🔍 Monitoring & Logging

### Health Checks
- Backend: `GET /api/health`
- Database: Connection status in health endpoint
- Frontend: Service worker status

### Logging
```javascript
// Add to production
console.log = () => {} // Disable console logs
// Use proper logging service like Winston
```

## 🚨 Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check connection string format
# Ensure database exists
# Verify network access
```

**AI Features Not Working**
```bash
# Verify NVIDIA_API_KEY is set
# Check API key validity
# Ensure network access to NVIDIA API
```

**Frontend Can't Connect to Backend**
```bash
# Check VITE_API_URL is correct
# Verify CORS settings
# Check network connectivity
```

### Debug Commands
```bash
# Check backend health
curl https://your-backend-url.com/api/health

# Check database connection
npm run test-db

# View logs
docker-compose logs backend
```

## 📞 Support

For deployment issues:
1. Check this guide first
2. Review error logs
3. Create GitHub issue with details
4. Contact support@mini-erp-lite.com

---

**Happy Deploying! 🚀**