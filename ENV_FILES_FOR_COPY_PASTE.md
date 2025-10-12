# 📋 Environment Files - Copy & Paste Ready

Since `.env` files are in `.gitignore`, here are the complete environment files you need to create manually:

## 🔧 API Package Environment File

**File**: `packages/api/.env`

```bash
# Database
DATABASE_URL="file:./prisma/dev.db"

# Server
PORT=8080
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=565912943332-bdga9vs4f19r91hr8r99baqng47cqo24.apps.googleusercontent.com

# Redis (optional - for rate limiting and caching)
REDIS_URL=redis://localhost:6380

# File Storage (S3 compatible)
S3_ENDPOINT=https://s3.amazonaws.com
S3_BUCKET=agri-connect-dev
S3_ACCESS_KEY=your-s3-access-key
S3_SECRET_KEY=your-s3-secret-key
S3_REGION=us-east-1

# OTP Service (for phone verification)
OTP_PROVIDER=mock
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+911234567890
TWILIO_MESSAGING_SERVICE_SID=your-messaging-service-sid

# Payment Gateway
PAYMENTS_PROVIDER=razorpay
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# Logging
LOG_LEVEL=info

# ML Service Integration
ML_BASE_URL=http://localhost:8000

# Email Service (for order confirmations and notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=agriconnect28@gmail.com
EMAIL_PASS=ccdgfejdhfxgtqfg
EMAIL_FROM=agriconnect28@gmail.com
```

## 🤖 ML Package Environment File

**File**: `packages/ml/.env`

```bash
# Database Configuration
# Default: SQLite database in API package
DATABASE_URL=file:../api/prisma/dev.db

# For PostgreSQL (alternative)
# DATABASE_URL=postgresql://username:password@localhost:5432/agriconnect

# Server Configuration
ML_SERVICE_PORT=8000
ML_SERVICE_HOST=0.0.0.0

# Model Storage
MODEL_DIR=./models
VECTOR_INDEX_DIR=./vectors

# Model Configuration
TFIDF_MAX_FEATURES=20000
DEFAULT_RECOMMENDATIONS=10

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

## 🌐 Web App Environment File

**File**: `apps/web/.env`

```bash
# API Configuration
VITE_API_URL=http://localhost:8080/api

# Environment
VITE_NODE_ENV=development

# Google OAuth (if using)
VITE_GOOGLE_CLIENT_ID=565912943332-bdga9vs4f19r91hr8r99baqng47cqo24.apps.googleusercontent.com

# App Configuration
VITE_APP_NAME=Agri-Connect
VITE_APP_VERSION=1.0.0
```

## 📱 Mobile App Environment File

**File**: `apps/mobile/.env`

```bash
# API Configuration
EXPO_PUBLIC_API_URL=http://192.168.30.223:8080/api

# For Android Emulator: http://10.0.2.2:8080/api
# For iOS Simulator: http://localhost:8080/api
# For Physical Device: http://YOUR_COMPUTER_IP:8080/api

# Environment
EXPO_PUBLIC_NODE_ENV=development

# Google OAuth (if using)
EXPO_PUBLIC_GOOGLE_CLIENT_ID=565912943332-bdga9vs4f19r91hr8r99baqng47cqo24.apps.googleusercontent.com

# App Configuration
EXPO_PUBLIC_APP_NAME=Agri-Connect
EXPO_PUBLIC_APP_VERSION=1.0.0
```

## 🔧 Admin Portal Environment File

**File**: `apps/admin-portal/.env`

```bash
# API Configuration
VITE_API_URL=http://localhost:8080/api

# Environment
VITE_NODE_ENV=development

# Google OAuth (if using)
VITE_GOOGLE_CLIENT_ID=565912943332-bdga9vs4f19r91hr8r99baqng47cqo24.apps.googleusercontent.com

# App Configuration
VITE_APP_NAME=Agri-Connect Admin
VITE_APP_VERSION=1.0.0
```

## 📋 How to Create These Files

### Method 1: Using Command Line
```bash
# API Package
cd packages/api
# Copy the API .env content above and save as .env

# ML Package
cd packages/ml
# Copy the ML .env content above and save as .env

# Web App
cd apps/web
# Copy the Web .env content above and save as .env

# Mobile App
cd apps/mobile
# Copy the Mobile .env content above and save as .env

# Admin Portal
cd apps/admin-portal
# Copy the Admin Portal .env content above and save as .env
```

### Method 2: Using File Explorer
1. Navigate to each directory
2. Create a new file named `.env` (make sure to remove any .txt extension)
3. Copy and paste the content for each package

### Method 3: Using PowerShell (Windows)
```powershell
# Create API .env
cd packages/api
@"
# Database
DATABASE_URL="file:./prisma/dev.db"

# Server
PORT=8080
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=565912943332-bdga9vs4f19r91hr8r99baqng47cqo24.apps.googleusercontent.com

# Redis (optional - for rate limiting and caching)
REDIS_URL=redis://localhost:6380

# File Storage (S3 compatible)
S3_ENDPOINT=https://s3.amazonaws.com
S3_BUCKET=agri-connect-dev
S3_ACCESS_KEY=your-s3-access-key
S3_SECRET_KEY=your-s3-secret-key
S3_REGION=us-east-1

# OTP Service (for phone verification)
OTP_PROVIDER=mock
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+911234567890
TWILIO_MESSAGING_SERVICE_SID=your-messaging-service-sid

# Payment Gateway
PAYMENTS_PROVIDER=razorpay
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# Logging
LOG_LEVEL=info

# ML Service Integration
ML_BASE_URL=http://localhost:8000

# Email Service (for order confirmations and notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=agriconnect28@gmail.com
EMAIL_PASS=ccdgfejdhfxgtqfg
EMAIL_FROM=agriconnect28@gmail.com
"@ | Out-File -FilePath ".env" -Encoding UTF8
```

## ⚠️ Important Notes

1. **Security**: Change the JWT_SECRET to a secure random string in production
2. **Database**: The DATABASE_URL points to a SQLite file - make sure the path is correct
3. **ML Service**: ML_BASE_URL should match where your ML service is running
4. **CORS**: CORS_ORIGIN should match your frontend URL
5. **Mobile IP**: Update EXPO_PUBLIC_API_URL with your computer's IP address for mobile testing

## 🔍 Verification

After creating the files, verify they work:

```bash
# Test API
curl http://localhost:8080/health

# Test ML Service
curl http://localhost:8000/health

# Test ML Integration
curl http://localhost:8080/api/ai/health
```

## 🚀 Quick Start

1. Copy and paste the environment files above
2. Start the services:
   ```bash
   # Terminal 1 - ML Service
   cd packages/ml
   python start_with_env.py
   
   # Terminal 2 - API Service
   cd packages/api
   node start_with_env.js
   
   # Terminal 3 - Web App
   cd apps/web
   npm run dev
   ```

Your environment is now properly configured! 🎉
