# Agri-Connect 🌱

A comprehensive marketplace platform that directly connects farmers and consumers, eliminating intermediaries and ensuring fair pricing.

## 🚀 Quick Start Commands

```bash
# 1. Clone and install
git clone https://github.com/Sreddy08840/agri-connect.git
cd agri-connect
pnpm install

# 2. Set up database
cd packages/api
pnpm prisma db push
cd ../..

# 3. Set up ML service
cd packages/ml
python -m venv venv
.\venv\Scripts\activate          # Windows
pip install -r requirements.txt
.\venv\Scripts\python.exe quick_fix.py
.\venv\Scripts\python.exe train_als.py
cd ../..

# 4. Start services (in separate terminals)
cd packages/api && pnpm dev      # Terminal 1 - API (port 8080)
cd apps/web && pnpm dev          # Terminal 2 - Web (port 5173)
cd packages/ml && python -m app.main  # Terminal 3 - ML (port 8000)
```

**Access the app:**
- Web: http://localhost:5173
- API: http://localhost:8080
- ML Docs: http://127.0.0.1:8000/docs

---

## 🧹 Project Cleanup & Maintenance

### Recent Cleanup (Oct 18, 2025)

**✅ Completed Full Project Analysis and Cleanup**

#### Files Removed:
1. **`structure.txt`** (21.5 MB)
   - **Why removed**: Outdated directory tree dump that was unnecessarily large
   - **Impact**: Reduced repository size by 21+ MB
   - **Status**: ✅ Deleted

2. **`tsx-4.20.5.tgz`** (154 KB)
   - **Why removed**: Package tarball that belongs in node_modules, not project root
   - **Impact**: Cleaner project structure
   - **Status**: ✅ Deleted

3. **`copy`** (0 bytes)
   - **Why removed**: Empty file with no purpose
   - **Impact**: Removed unnecessary file
   - **Status**: ✅ Deleted

4. **`.venv/` directory**
   - **Why removed**: Python virtual environment should not be committed to repository
   - **Impact**: Removed ~MB of Python packages, cleaner repo
   - **Status**: ✅ Deleted

5. **`.qodo/` directory**
   - **Why removed**: IDE/tool cache directory
   - **Impact**: Removed IDE-specific files
   - **Status**: ✅ Deleted (or didn't exist)

#### Files Kept (Not Redundant):
- ✅ **README.md** - Main project documentation (you're reading it!)
- ✅ **AI_INTEGRATION_COMPLETE_GUIDE.md** - Comprehensive AI features documentation
- ✅ **DEPLOYMENT_CHECKLIST.md** - Step-by-step deployment checklist
- ✅ **FREE_DEPLOYMENT_GUIDE.md** - Free deployment options for students/college projects
- ✅ **docker-compose.yml** - Development environment setup
- ✅ **docker-compose.prod.yml** - Production deployment configuration

#### Updated `.gitignore`:
Added the following patterns to prevent future unwanted files:
```gitignore
# Python virtual environments
.venv/
venv/
env/
ENV/

# Project-specific ignore patterns
structure.txt
*.tgz

# IDE/Tool cache directories
.qodo/
```

### Maintenance Guidelines:

**🚫 Never Commit:**
- Python virtual environments (`.venv/`, `venv/`)
- Node modules (already in .gitignore)
- Package tarballs (`*.tgz`)
- Large generated files (like `structure.txt`)
- IDE-specific cache directories
- Personal configuration files

**✅ Always Keep:**
- Source code files
- Configuration templates (`.example` files)
- Documentation files (`*.md`)
- Docker configuration files
- Package manager files (`package.json`, `requirements.txt`)

**🔍 Regular Cleanup Checklist:**
1. Check for large files: `git ls-files -z | xargs -0 du -hs | sort -h`
2. Verify `.gitignore` is up to date
3. Remove unused dependencies
4. Clean up old branches
5. Archive completed feature documentation

### Summary of Cleanup Results:

**Before Cleanup:**
- Project size: ~533 MB (with node_modules and unwanted files)
- Unwanted files: 5 files/directories (21.7 MB)
- Outdated references in documentation

**After Cleanup:**
- Project size: ~511 MB (reduced by ~21.7 MB)
- All unwanted files removed ✅
- `.gitignore` updated to prevent future issues ✅
- README.md updated with accurate file references ✅
- Cleaner, more maintainable project structure ✅

**Current Project Structure (Clean):**
```
agri-connect/
├── .github/              # CI/CD workflows
├── apps/                 # Application code
│   ├── admin-portal/     # Admin dashboard
│   ├── mobile/           # React Native app
│   └── web/              # React web app
├── packages/
│   ├── api/              # Backend API (Node.js)
│   ├── ml/               # ML service (Python)
│   ├── ui/               # Shared UI components
│   └── config/           # Shared config
├── scripts/              # Build and utility scripts
├── .gitignore            # ✅ Updated with new patterns
├── README.md             # ✅ Updated with cleanup docs
├── AI_INTEGRATION_COMPLETE_GUIDE.md
├── DEPLOYMENT_CHECKLIST.md
├── FREE_DEPLOYMENT_GUIDE.md
├── docker-compose.yml
├── docker-compose.prod.yml
├── package.json
└── pnpm-workspace.yaml
```

---

## 🚀 Features

### For Customers
- **Browse & Search**: Explore fresh produce by category
- **Direct Purchase**: Buy directly from verified farmers
- **Order Tracking**: Real-time order status updates
- **Secure Payments**: Online payments + Cash on Delivery
- **Chat Support**: Direct communication with farmers

### For Farmers
- **Product Management**: Add, edit, and manage product listings
- **Order Management**: Accept/reject orders, update status
- **Earnings Tracking**: Monitor sales and payouts
- **Verification System**: Get verified as a trusted farmer

### For Admins
- **User Management**: Manage customers and farmers
- **Product Approvals**: Review and approve product listings
- **Analytics Dashboard**: Platform-wide insights and reports
- **Category Management**: Organize product categories

## 🏗️ Architecture

- **Frontend**: React (Web) + React Native (Mobile)
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite (dev) / PostgreSQL (prod) + Prisma ORM
- **ML Service**: Python + FastAPI + scikit-learn for recommendations
- **Cache**: Redis for sessions and rate limiting
- **Storage**: S3-compatible storage for images
- **Real-time**: Socket.IO for chat and notifications
- **Payments**: Razorpay integration
- **Auth**: Phone OTP with JWT tokens

## 📁 Project Structure

```
agri-connect/
├── apps/
│   ├── web/                 # React web application
│   ├── mobile/              # React Native mobile app
│   └── admin-portal/        # Admin dashboard
├── packages/
│   ├── api/                 # Node.js API server
│   ├── ml/                  # Python ML recommendation service
│   ├── ui/                  # Shared UI components
│   └── config/              # Shared configuration
├── docker-compose.yml       # Local development setup
└── README.md
```

## 🛠️ Development Setup

### Prerequisites
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **pnpm** 8+ (Install: `npm install -g pnpm`)
- **Python** 3.11+ ([Download](https://www.python.org/downloads/))
- **SQLite** (included with Python) / PostgreSQL 15+ (optional)
- **Redis** 7+ (optional, for caching)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/Sreddy08840/agri-connect.git
   cd agri-connect
   ```

2. **Install Node.js dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy example env file
   cp packages/api/.env.example packages/api/.env
   
   # Edit the .env file with your configuration
   # For development, default values should work
   ```

4. **Set up the database**
   ```bash
   # Push schema to database
   cd packages/api
   pnpm prisma db push
   
   # Seed with sample data (optional)
   pnpm prisma db seed
   
   cd ../..
   ```

5. **Set up ML Service**
   ```bash
   cd packages/ml
   
   # Create virtual environment
   python -m venv venv
   
   # Activate virtual environment
   # Windows:
   .\venv\Scripts\activate
   # Linux/Mac:
   source venv/bin/activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Run quick fix to set up models
   .\venv\Scripts\python.exe quick_fix.py
   
   # (Optional) Train ALS model
   .\venv\Scripts\python.exe train_als.py
   
   cd ../..
   ```

6. **Start all services**

   **Terminal 1 - API Server:**
   ```bash
   cd packages/api
   pnpm dev
   ```
   API will run on http://localhost:8080

   **Terminal 2 - Web App:**
   ```bash
   cd apps/web
   pnpm dev
   ```
   Web will run on http://localhost:5173

   **Terminal 3 - ML Service:**
   ```bash
   cd packages/ml
   python -m app.main
   ```
   ML service will run on http://127.0.0.1:8000

### Verify Setup

- **API**: http://localhost:8080/api/health
- **Web**: http://localhost:5173
- **ML Service**: http://127.0.0.1:8000/docs

### ML Recommendation Service

The ML service provides AI-powered recommendations, review analysis, fraud detection, and chatbot features.

#### Quick Setup

```bash
# Navigate to ML service
cd packages/ml

# Create virtual environment (first time only)
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run quick fix to set up models
.\venv\Scripts\python.exe quick_fix.py

# Train ALS model (optional, for better recommendations)
.\venv\Scripts\python.exe train_als.py

# Start the ML service
python -m app.main
```

The service will be available at:
- **API**: http://127.0.0.1:8000
- **Docs**: http://127.0.0.1:8000/docs

#### Features

- ✅ **Review Analysis** - Sentiment analysis, spam detection, fraud detection
- ✅ **Recommendations** - Hybrid (ALS + TF-IDF) collaborative filtering
- ✅ **Similar Products** - Content-based similarity matching
- ✅ **Chatbot** - RAG-based product information assistant
- ✅ **Price Optimization** - Dynamic pricing suggestions
- ✅ **Demand Forecasting** - Sales prediction models

#### Testing the ML Service

```bash
# Option 1: Interactive API docs (recommended)
# Open in browser: http://127.0.0.1:8000/docs

# Option 2: Visual test UI
# Open: packages/ml/test_ui.html

# Option 3: Automated test script
.\venv\Scripts\python.exe test_endpoints.py

# Option 4: Manual curl commands
curl http://127.0.0.1:8000/health
curl -X POST http://127.0.0.1:8000/reviews/analyze \
  -H "Content-Type: application/json" \
  -d '{"user_id":"user-123","product_id":"prod-456","text":"Great product!","rating":5}'
```

#### Key Endpoints

- `GET /health` - Service health check
- `POST /reviews/analyze` - Analyze review sentiment and spam
- `GET /recommendations/user/{user_id}` - Get personalized recommendations
- `GET /recommendations/product/{product_id}` - Get similar products
- `POST /chat/query` - Ask chatbot about products
- `POST /fraud/score` - Calculate fraud risk score

See `packages/ml/START_HERE.md` for complete documentation.

### Individual Service Commands

```bash
# API only
cd packages/api
pnpm dev

# Web only
cd apps/web
pnpm dev

# Mobile only
cd apps/mobile
pnpm start

# ML service only
cd packages/ml
python -m app.main
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
cd packages/api && pnpm test
cd apps/web && pnpm test
```

## 🚀 Deployment

**Ready to deploy?** We have comprehensive deployment guides to help you!

### 📚 Available Deployment Guides:

1. **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** 
   - Complete step-by-step production deployment checklist
   - Infrastructure setup, database configuration, service deployment
   - Security best practices and monitoring setup

2. **[FREE_DEPLOYMENT_GUIDE.md](FREE_DEPLOYMENT_GUIDE.md)**
   - Perfect for students and college projects!
   - Deploy for FREE using Railway + Vercel
   - Zero cost deployment options with $0 monthly fees
   - 30-40 minutes setup time

3. **[AI_INTEGRATION_COMPLETE_GUIDE.md](AI_INTEGRATION_COMPLETE_GUIDE.md)**
   - Complete AI features integration documentation
   - ML service setup and training
   - Recommendations, forecasting, fraud detection, and chatbot

### ⚡ Quick Deploy Options:

**Option 1: Free Tier (Perfect for Students/Testing)**
- Backend: Railway ($5 free credit/month)
- Web: Vercel (Free forever)
- Database: Railway PostgreSQL (Free)
- **Total Cost: $0/month**
- **Setup Time: 30-40 minutes**
- **See: [FREE_DEPLOYMENT_GUIDE.md](FREE_DEPLOYMENT_GUIDE.md)**

**Option 2: Production Single Server (Recommended for MVP)**
- VPS (DigitalOcean/Linode/Hetzner): $10-50/month
- All services on one server using Docker Compose
- **Setup Time: 1-2 hours**
- **See: [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)**

**Option 3: Cloud Microservices (Scalable Production)**
- Backend: Railway/Render ($10-30/month)
- ML Service: Render/DigitalOcean ($15-40/month)
- Web: Vercel/Netlify (Free-$20/month)
- Database: Supabase/Railway ($10-30/month)
- **Total Cost: $35-100/month**
- **Setup Time: 2-3 hours**

**Option 4: Mobile Apps Deployment**
```bash
cd apps/mobile
npx eas-cli build --platform all --profile production
```

### 🎯 Which Option Should I Choose?

- **Student/Learning**: Use Option 1 (Free Tier)
- **MVP/Startup**: Use Option 2 (Single Server)
- **Growing Business**: Use Option 3 (Microservices)
- **Enterprise**: Custom Kubernetes setup (contact for consultation)

## 📱 Mobile App

The mobile app is built with React Native and Expo:

```bash
cd apps/mobile

# Start development server
pnpm start

# Run on Android
pnpm android

# Run on iOS
pnpm ios

# Build for production
pnpm build:android
pnpm build:ios
```

## 🔧 Configuration

### Environment Variables

#### API (.env)
```env
PORT=8080
NODE_ENV=development
JWT_SECRET=your-secret-key
DATABASE_URL=postgresql://user:pass@host:5432/agri_connect
REDIS_URL=redis://localhost:6379
S3_ENDPOINT=https://s3.amazonaws.com
S3_BUCKET=agri-connect
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
OTP_PROVIDER=mock
PAYMENTS_PROVIDER=razorpay
RAZORPAY_KEY_ID=your-key-id
RAZORPAY_KEY_SECRET=your-key-secret
```

#### Web (.env)
```env
VITE_API_URL=http://localhost:8080/api
```

#### Mobile (app.json)
```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://your-api-domain.com/api"
    }
  }
}
```

## 🎯 Demo Credentials

For development and testing:

- **Admin**: +1234567890 (any 6-digit OTP)
- **Farmer**: +1987654321 (any 6-digit OTP)
- **Customer**: +1122334455 (any 6-digit OTP)

## 📊 Database Schema

Key entities:
- `users` - Customers, farmers, and admins
- `products` - Product listings with approval workflow
- `orders` - Order management and tracking
- `categories` - Product categorization
- `chats` - Real-time messaging
- `payouts` - Farmer earnings tracking

## 🔒 Security Features

- Phone OTP authentication
- JWT access/refresh tokens
- Rate limiting on sensitive endpoints
- Input validation with Zod
- RBAC (Role-Based Access Control)
- Audit logging for admin actions

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/otp/request` - Request OTP
- `POST /api/auth/otp/verify` - Verify OTP and login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - List products with filters
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (farmer)
- `PATCH /api/products/:id` - Update product
- `PATCH /api/products/:id/status` - Approve/reject (admin)

### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category (admin)
- `PATCH /api/categories/:id` - Update category (admin)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

## 🗺️ Roadmap

- [ ] Advanced search and filtering
- [x] Machine learning recommendations
- [x] Review sentiment analysis
- [x] Fraud detection system
- [x] AI chatbot for product queries
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Mobile app store deployment
- [ ] Integration with logistics providers
- [ ] Farmer verification enhancements
- [ ] Advanced payment options (UPI, wallets)

## 🐛 Troubleshooting

### Common Issues

#### ML Service Issues

**Problem**: `ModuleNotFoundError: No module named 'pydantic_settings'`
```bash
# Solution: Install missing dependencies
cd packages/ml
.\venv\Scripts\pip.exe install pydantic-settings pandas scikit-learn
```

**Problem**: "ALS model not found"
```bash
# Solution: Train the ALS model
cd packages/ml
.\venv\Scripts\python.exe train_als.py
```

**Problem**: Can't access http://0.0.0.0:8000
```bash
# Solution: Use 127.0.0.1 or localhost instead
# Open: http://127.0.0.1:8000/docs
```

**Problem**: "Embedding model error - paging file too small"
```bash
# This is expected and can be ignored
# The chatbot feature will be unavailable, but all other features work fine
```

#### API Issues

**Problem**: Database connection error

# Solution: Push schema again
cd packages/api
pnpm prisma db push
```

**Problem**: Port 8080 already in use
```bash
# Solution: Change port in .env file
# Or kill the process using the port
```

#### Web App Issues

**Problem**: API connection failed
```bash
# Solution: Ensure API is running on port 8080
# Check VITE_API_URL in apps/web/.env
```

### Getting Help

- Check `packages/ml/START_HERE.md` for ML service documentation
- Check `packages/ml/FIX_ALL_ERRORS.md` for detailed troubleshooting
- Open an issue on GitHub with error logs
- Check the API docs at http://localhost:8080/api/docs

---

Built with ❤️ for farmers and consumers worldwide.
