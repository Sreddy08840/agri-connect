# 🌍 Environment Variables Setup Guide

This guide explains how to properly configure environment variables across all packages in the agri-connect project.

## 📁 Package Structure

```
packages/
├── api/           # Backend API server
├── ml/            # Machine Learning service
├── ui/            # Shared UI components
└── config/        # Shared configuration
```

## 🔧 Environment Files

Each package has its own environment configuration:

### 📡 API Package (`packages/api/`)

**Environment File**: `.env`

```bash
# Database
DATABASE_URL="file:./prisma/dev.db"

# Server Configuration
PORT=8080
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

# ML Service Integration
ML_BASE_URL=http://localhost:8000

# Redis (for caching and rate limiting)
REDIS_URL=redis://localhost:6380

# Email Service
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Payment Gateway
PAYMENTS_PROVIDER=razorpay
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
```

### 🤖 ML Package (`packages/ml/`)

**Environment File**: `.env`

```bash
# Database Configuration
DATABASE_URL=file:../api/prisma/dev.db

# Server Configuration
ML_SERVICE_PORT=8000
ML_SERVICE_HOST=0.0.0.0

# Model Configuration
TFIDF_MAX_FEATURES=20000
DEFAULT_RECOMMENDATIONS=10

# Model Storage
MODEL_DIR=./models
VECTOR_INDEX_DIR=./vectors

# Forecasting Configuration
FORECAST_DAYS=30
MIN_HISTORY_DAYS=30

# Price Optimization
PRICE_OPTIMIZATION_SAMPLES=100

# Fraud Detection
FRAUD_THRESHOLD=0.7

# Chatbot/RAG Configuration
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
TOP_K_DOCS=5
MAX_CONTEXT_LENGTH=512
```

## 🚀 Starting Services with Environment Variables

### Method 1: Using Startup Scripts

#### Start ML Service
```bash
cd packages/ml
python start_with_env.py
```

#### Start API Service
```bash
cd packages/api
node start_with_env.js
```

### Method 2: Manual Start

#### Start ML Service
```bash
cd packages/ml
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

#### Start API Service
```bash
cd packages/api
pnpm dev
```

### Method 3: Using Environment Variables Directly

#### ML Service
```bash
cd packages/ml
export ML_SERVICE_HOST=0.0.0.0
export ML_SERVICE_PORT=8000
python -m uvicorn main:app --host $ML_SERVICE_HOST --port $ML_SERVICE_PORT
```

#### API Service
```bash
cd packages/api
export PORT=8080
export ML_BASE_URL=http://localhost:8000
pnpm dev
```

## 🔄 Environment Variable Loading

### API Package (Node.js)
The API package uses `dotenv/config` to automatically load environment variables:

```typescript
// src/index.ts
import 'dotenv/config';  // Loads .env automatically

const PORT = process.env.PORT || 8080;
const ML_BASE_URL = process.env.ML_BASE_URL || 'http://localhost:8000';
```

### ML Package (Python)
The ML package uses `python-dotenv` to load environment variables:

```python
# main.py
from dotenv import load_dotenv
import os

load_dotenv()  # Loads .env automatically

ML_SERVICE_PORT = int(os.environ.get('ML_SERVICE_PORT', '8000'))
ML_SERVICE_HOST = os.environ.get('ML_SERVICE_HOST', '0.0.0.0')
```

## 🛠️ Development vs Production

### Development Environment
- Uses local SQLite database
- ML service runs on localhost:8000
- API runs on localhost:8080
- CORS allows localhost origins
- Debug logging enabled

### Production Environment
- Uses PostgreSQL database
- Services run on configured hosts/ports
- CORS restricted to production domains
- Logging level set to 'info' or 'warn'
- Secure JWT secrets

## 🔐 Security Best Practices

1. **Never commit `.env` files to version control**
2. **Use strong, unique JWT secrets in production**
3. **Set appropriate CORS origins**
4. **Use environment-specific database URLs**
5. **Enable HTTPS in production**
6. **Use secure email credentials**

## 📝 Environment File Templates

Copy `.env.example` to `.env` and customize:

```bash
# API Package
cd packages/api
cp .env.example .env

# ML Package
cd packages/ml
cp .env.example .env
```

## 🐳 Docker Environment Variables

For Docker deployment, pass environment variables:

```bash
docker run -e PORT=8080 -e ML_BASE_URL=http://ml-service:8000 api-service
```

## 🔍 Troubleshooting

### Environment Variables Not Loading
1. Check `.env` file exists in package directory
2. Verify `dotenv` is installed
3. Ensure `.env` file syntax is correct (no spaces around `=`)
4. Restart the service after changing environment variables

### ML Service Can't Connect to Database
1. Check `DATABASE_URL` points to correct database file
2. Verify database file exists and is readable
3. Check file permissions

### API Can't Connect to ML Service
1. Verify `ML_BASE_URL` is correct
2. Ensure ML service is running
3. Check network connectivity
4. Verify CORS configuration

## 📊 Environment Status Check

### Check ML Service Environment
```bash
curl http://localhost:8000/health
```

### Check API Service Environment
```bash
curl http://localhost:8080/health
```

### Check Environment Variables
```bash
# API Package
cd packages/api
node -e "require('dotenv/config'); console.log(process.env.ML_BASE_URL)"

# ML Package
cd packages/ml
python -c "from dotenv import load_dotenv; import os; load_dotenv(); print(os.environ.get('ML_SERVICE_PORT'))"
```
