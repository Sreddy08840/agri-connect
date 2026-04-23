# 🌱 Agri-Connect

> **Bridging the gap between farmers and consumers. Direct, fair, and transparent.**

A comprehensive marketplace platform that directly connects farmers and consumers, eliminating intermediaries, ensuring fair pricing, and building sustainable communities.

[![GitHub Stars](https://img.shields.io/github/stars/Sreddy08840/agri-connect?style=for-the-badge&logo=github)](https://github.com/Sreddy08840/agri-connect)
[![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18-blue?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Python Version](https://img.shields.io/badge/python-%3E%3D3.11-blue?style=for-the-badge&logo=python)](https://www.python.org/)

---

## ✨ Why Agri-Connect?

### The Problem
- 🚫 Middlemen take 40-60% of farmer's profit
- 😕 Consumers pay inflated prices for fresh produce
- 📉 Farmers have no direct market access
- ❌ Poor quality products & trust issues

### The Solution
**Agri-Connect** creates a direct connection with:
- ✅ Fair pricing for both farmers and consumers
- ✅ Real-time quality verification
- ✅ Direct farmer-consumer communication
- ✅ Secure payments & transparent transactions

---

## 🎯 Features Overview

### 🛍️ For Customers
| Feature | Description |
|---------|-------------|
| 🔍 **Smart Search** | Browse & filter fresh produce by category |
| 💳 **Flexible Payments** | Online payments + Cash on Delivery |
| 📦 **Order Tracking** | Real-time status updates & notifications |
| 💬 **Direct Chat** | Talk directly with verified farmers |
| ⭐ **Smart Recommendations** | AI-powered product suggestions |

### 🌾 For Farmers
| Feature | Description |
|---------|-------------|
| 📊 **Product Management** | Add, edit, and manage listings |
| 📈 **Sales Analytics** | Monitor sales trends & earnings |
| ✅ **Order Management** | Accept/reject orders, update status |
| 🔐 **Verification** | Get verified as a trusted farmer |
| 💰 **Direct Payouts** | Receive payments without middlemen |

### ⚙️ For Admins
| Feature | Description |
|---------|-------------|
| 👥 **User Management** | Manage customers, farmers & support |
| ✍️ **Product Approvals** | Review and approve listings |
| 📊 **Analytics Dashboard** | Platform insights & reports |
| 🏷️ **Category Management** | Organize product offerings |
| 🛡️ **Moderation Tools** | Fraud detection & abuse prevention |

---

## 🏗️ Architecture & Tech Stack

```
┌─────────────────────────────────────────────────┐
│                   Frontend Layer                 │
├─────────────────┬───────────────┬───────────────┤
│   React Web     │ React Native  │  Admin Portal │
│   (5173)        │  (Expo)       │   (Next.js)   │
└────────┬────────┴───────┬───────┴───────────┬───┘
         │                │                   │
┌────────▼────────────────▼───────────────────▼───┐
│          API Gateway / Authentication            │
│    Node.js + Express + TypeScript (8080)        │
├─────────────────────────────────────────────────┤
│              Business Logic Layer                │
├──────────────┬──────────────┬────────────────────┤
│  Product     │  Orders      │  Chat & Real-time  │
│  Management  │  Management  │  (Socket.IO)       │
└──────┬───────┴──────┬───────┴──────────┬─────────┘
       │              │                  │
┌──────▼──────────────▼──────────────────▼────────┐
│              Data & Service Layer                │
├──────────────┬──────────────┬───────────────────┤
│  PostgreSQL  │  Redis Cache │  S3 Storage       │
│  + Prisma    │  (Sessions)  │  (Images)         │
└──────────────┴──────────────┴───────────────────┘
       │
┌──────▼────────────────────────────────────────┐
│    ML Service (Python, FastAPI)               │
├────────┬────────────┬────────────┬───────────┤
│ Recom- │ Sentiment  │  Fraud     │ Demand    │
│ dations│ Analysis   │  Detection │ Forecast  │
└────────┴────────────┴────────────┴───────────┘
```

### 🛠️ Technology Stack

**Frontend**
- ⚛️ **React 18** - Modern UI library
- 📱 **React Native** - Cross-platform mobile
- 🎨 **TailwindCSS** - Utility-first styling
- 🧩 **Component Library** - Shared UI components

**Backend**
- 🟢 **Node.js 18+** - Runtime environment
- 🚀 **Express.js** - Web framework
- 📘 **TypeScript** - Type safety
- 🗄️ **Prisma ORM** - Database management
- 🔐 **JWT + Phone OTP** - Authentication

**Database & Storage**
- 🐘 **PostgreSQL 15+** - Primary database (production)
- 🔒 **SQLite** - Development database
- 💾 **Redis** - Caching & sessions
- 📁 **S3-Compatible** - Image storage

**ML & Analytics**
- 🐍 **Python 3.11+** - ML runtime
- ⚡ **FastAPI** - ML API framework
- 🤖 **scikit-learn** - ML algorithms
- 📊 **pandas** - Data processing

**DevOps & Tools**
- 🐳 **Docker** - Containerization
- 🔄 **Docker Compose** - Local development
- 📦 **pnpm** - Package management
- 🚀 **GitHub Actions** - CI/CD

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Python** 3.11+ ([Download](https://www.python.org/downloads/))
- **Git** ([Download](https://git-scm.com/))
- **pnpm** 8+ (`npm install -g pnpm`)

### Installation Steps

#### 1️⃣ Clone & Install Dependencies
```bash
git clone https://github.com/Sreddy08840/agri-connect.git
cd agri-connect
pnpm install
```

#### 2️⃣ Setup Database
```bash
cd packages/api
cp .env.example .env
pnpm prisma db push
cd ../..
```

#### 3️⃣ Setup ML Service
```bash
cd packages/ml

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Setup models
python quick_fix.py
python train_als.py

cd ../..
```

#### 4️⃣ Start All Services
Open **4 separate terminals** and run:

```bash
# Terminal 1: API Server (port 8080)
cd packages/api && pnpm dev

# Terminal 2: Web App (port 5173)
cd apps/web && pnpm dev

# Terminal 3: ML Service (port 8000)
cd packages/ml && python -m app.main

# Terminal 4: (Optional) Mobile
cd apps/mobile && pnpm start
```

#### ✅ Verify Everything Works
- 🌐 Web: [http://localhost:5173](http://localhost:5173)
- 🔌 API: [http://localhost:8080/api/health](http://localhost:8080/api/health)
- 🤖 ML: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## 📚 Detailed Documentation

### Core Documentation
| Document | Purpose |
|----------|---------|
| **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** | Production deployment guide with security & monitoring |
| **[FREE_DEPLOYMENT_GUIDE.md](FREE_DEPLOYMENT_GUIDE.md)** | Deploy for FREE on Railway + Vercel (students & startups) |
| **[AI_INTEGRATION_COMPLETE_GUIDE.md](AI_INTEGRATION_COMPLETE_GUIDE.md)** | ML features setup & training guide |
| **[packages/ml/START_HERE.md](packages/ml/START_HERE.md)** | ML service documentation & endpoints |

### Getting Started Guides
```
📖 New to Agri-Connect?
   → Start with Quick Start above
   → Then read DEPLOYMENT_CHECKLIST.md

🎓 Student/Learning Project?
   → Follow FREE_DEPLOYMENT_GUIDE.md
   → Deploy for $0/month

🤖 Want AI Features?
   → Check AI_INTEGRATION_COMPLETE_GUIDE.md
   → ML service setup & training

🐛 Troubleshooting?
   → See Common Issues section below
   → Check packages/ml/FIX_ALL_ERRORS.md
```

---

## 🧪 Testing & Development

### Run Tests
```bash
# All tests
pnpm test

# Specific package
cd packages/api && pnpm test
cd apps/web && pnpm test
```

### Code Quality
```bash
# Linting
pnpm lint

# Format code
pnpm format

# Type checking
pnpm type-check
```

---

## 🚀 Deployment Options

### 🎯 Choose Your Path

#### 1️⃣ Free Tier (Students & Testing)
- **Cost**: $0/month
- **Time**: 30-40 minutes
- **Includes**: Railway free credits, Vercel free tier
- **👉 [Follow FREE_DEPLOYMENT_GUIDE.md](FREE_DEPLOYMENT_GUIDE.md)**

```bash
# Backend: Railway + Database: Railway + Web: Vercel
# Total: $0 (with free credits)
```

#### 2️⃣ Single Server (MVP & Startups)
- **Cost**: $10-50/month
- **Time**: 1-2 hours
- **Includes**: VPS with Docker, PostgreSQL, Redis
- **Recommended Providers**: DigitalOcean, Linode, Hetzner
- **👉 [Follow DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)**

```bash
# One VPS with Docker Compose
# All services in containers
# Easiest to manage for small teams
```

#### 3️⃣ Microservices (Production Scale)
- **Cost**: $35-100/month
- **Time**: 2-3 hours
- **Includes**: Separate services, auto-scaling, CDN
- **Components**:
  - Backend: Railway/Render ($10-30/month)
  - ML: Render/DigitalOcean ($15-40/month)
  - Web: Vercel/Netlify (Free-$20/month)
  - Database: Supabase/Railway ($10-30/month)

#### 4️⃣ Mobile Apps
```bash
cd apps/mobile

# Build for both platforms
npx eas-cli build --platform all --profile production

# Or individual builds
pnpm build:android
pnpm build:ios
```

### 📋 Decision Matrix
```
✅ Just learning?          → Option 1 (Free)
✅ Launching MVP?          → Option 2 (Single Server)
✅ Growing user base?      → Option 3 (Microservices)
✅ Need mobile apps?       → Add Mobile builds
✅ Enterprise scale?       → Custom Kubernetes
```

---

## 🔌 API Endpoints Reference

### 🔐 Authentication
```bash
POST   /api/auth/otp/request        # Request OTP
POST   /api/auth/otp/verify         # Login with OTP
POST   /api/auth/refresh            # Refresh token
GET    /api/auth/me                 # Get current user
```

### 📦 Products
```bash
GET    /api/products                # List all products
GET    /api/products/:id            # Get product details
POST   /api/products                # Create product (farmer)
PATCH  /api/products/:id            # Update product
PATCH  /api/products/:id/status     # Approve/reject (admin)
GET    /api/products/search         # Advanced search
```

### 📂 Categories
```bash
GET    /api/categories              # List categories
POST   /api/categories              # Create (admin)
PATCH  /api/categories/:id          # Update (admin)
```

### 🛒 Orders
```bash
GET    /api/orders                  # List user orders
GET    /api/orders/:id              # Get order details
POST   /api/orders                  # Create new order
PATCH  /api/orders/:id/status       # Update status
```

### 💬 Chat & Notifications
```bash
WebSocket /api/chat/:roomId         # Real-time chat
GET    /api/notifications           # Get notifications
```

**Full API Documentation**: [http://localhost:8080/api/docs](http://localhost:8080/api/docs)

---

## 🤖 ML Service Features

### Smart Recommendations
- **Hybrid Algorithm**: Combines collaborative filtering (ALS) + content-based (TF-IDF)
- **Cold Start**: Works for new users & products
- **Real-time**: Updated recommendations on every interaction

### Sentiment Analysis & Fraud Detection
- Review spam detection
- Fake review identification
- Fraud risk scoring
- Review authenticity verification

### AI Chatbot
- Product recommendations via chat
- Price comparisons
- Seasonal produce info
- Farmer verification status

### Price Optimization
- Market price analysis
- Demand-based pricing
- Seasonal adjustments
- Competition monitoring

### Demand Forecasting
- Sales predictions
- Inventory optimization
- Seasonal trends
- Harvest planning

**ML Endpoints**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## 🔐 Security Features

### Authentication & Authorization
- ✅ Phone OTP-based login
- ✅ JWT tokens (access + refresh)
- ✅ Role-based access control (RBAC)
- ✅ Session management with Redis

### Data Protection
- ✅ Input validation with Zod
- ✅ SQL injection prevention (Prisma)
- ✅ Rate limiting on sensitive endpoints
- ✅ CORS configuration

### Payment Security
- ✅ Razorpay integration
- ✅ PCI compliance ready
- ✅ Secure payment flow
- ✅ Transaction logging

### Monitoring & Audit
- ✅ Audit logging for admin actions
- ✅ Fraud detection system
- ✅ User behavior analysis
- ✅ System health monitoring

---

## 📂 Project Structure

```
agri-connect/
├── 📁 apps/
│   ├── web/                    # React web application
│   ├── mobile/                 # React Native mobile app
│   └── admin-portal/           # Admin dashboard
├── 📁 packages/
│   ├── api/                    # Node.js API server
│   │   ├── src/
│   │   ├── prisma/            # Database schema
│   │   └── .env.example       # Environment template
│   ├── ml/                     # Python ML service
│   │   ├── app/               # FastAPI application
│   │   ├── requirements.txt    # Python dependencies
│   │   └── START_HERE.md       # ML documentation
│   ├── ui/                     # Shared components
│   └── config/                 # Shared configuration
├── 📁 scripts/                 # Build utilities
├── 📁 .github/                 # CI/CD workflows
├── 📄 docker-compose.yml       # Development setup
├── 📄 docker-compose.prod.yml  # Production setup
├── 📄 package.json             # Workspace root
├── 📄 pnpm-workspace.yaml      # pnpm configuration
├── 📄 README.md                # This file
├── 📄 DEPLOYMENT_CHECKLIST.md  # Deployment guide
└── 📄 LICENSE                  # MIT License
```

---

## 🧑‍💻 Development Tips

### Environment Variables

**API (.env)**
```env
# Server
PORT=8080
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/agri_connect

# Authentication
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# Redis
REDIS_URL=redis://localhost:6379

# Storage
S3_ENDPOINT=https://s3.amazonaws.com
S3_BUCKET=agri-connect
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key

# Payments
RAZORPAY_KEY_ID=your-key-id
RAZORPAY_KEY_SECRET=your-key-secret

# OTP (use 'mock' for development)
OTP_PROVIDER=mock
```

**Web (.env)**
```env
VITE_API_URL=http://localhost:8080/api
VITE_SOCKET_URL=http://localhost:8080
```

### Useful Commands

```bash
# Database operations
pnpm prisma studio              # Visual database editor
pnpm prisma generate           # Generate Prisma client
pnpm prisma migrate dev        # Create migration

# Code quality
pnpm format                    # Auto-format code
pnpm lint                      # Check code style

# Build operations
pnpm build                     # Build all packages
pnpm build:web                 # Build web only
pnpm build:mobile              # Build mobile only

# Docker operations
docker-compose up              # Start all services
docker-compose down            # Stop all services
docker-compose logs api        # View API logs
```

---

## 🧪 Testing Credentials

For development and testing purposes:

```
🧪 Test Users Available:
├─ Admin:     +1234567890 (OTP: any 6 digits)
├─ Farmer:    +1987654321 (OTP: any 6 digits)
└─ Customer:  +1122334455 (OTP: any 6 digits)

💡 Tip: Use mock OTP provider in development for faster testing
```

---

## 🐛 Troubleshooting

### Common Issues & Solutions

<details>
<summary><b>❌ ML Service: ModuleNotFoundError</b></summary>

```bash
# Problem: 'pydantic_settings' not found
# Solution:
cd packages/ml
.\venv\Scripts\pip.exe install pydantic-settings pandas scikit-learn
```

</details>

<details>
<summary><b>❌ ML Service: ALS Model Not Found</b></summary>

```bash
# Problem: "ALS model not found"
# Solution: Train the model
cd packages/ml
python train_als.py
```

</details>

<details>
<summary><b>❌ API: Port 8080 Already in Use</b></summary>

```bash
# Solution 1: Change port in .env
PORT=8081

# Solution 2: Kill process on port 8080
# Windows:
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Linux/Mac:
lsof -i :8080
kill -9 <PID>
```

</details>

<details>
<summary><b>❌ Database: Connection Error</b></summary>

```bash
# Problem: Can't connect to database
# Solution:
cd packages/api
pnpm prisma db push
```

</details>

<details>
<summary><b>❌ Web: API Connection Failed</b></summary>

```bash
# Problem: Web can't reach API
# Check:
1. API is running: http://localhost:8080/api/health
2. VITE_API_URL in apps/web/.env is correct
3. API port matches in .env file
```

</details>

**More Help**: Check `packages/ml/FIX_ALL_ERRORS.md` for detailed troubleshooting

---

## 📈 Performance & Scalability

### Optimization Tips

| Layer | Optimization |
|-------|-------------|
| **Frontend** | Code splitting, lazy loading, image optimization |
| **API** | Query optimization, database indexing, caching with Redis |
| **Database** | Connection pooling, query optimization, periodic backups |
| **Storage** | CDN for images, compression, cleanup old files |
| **ML Service** | Model caching, batch predictions, async processing |

### Monitoring & Observability

```bash
# API Health Check
curl http://localhost:8080/api/health

# Database Status
pnpm prisma db execute --stdin < health_check.sql

# ML Service Status
curl http://127.0.0.1:8000/health

# View Real-time Logs
docker-compose logs -f api
```

---

## 🔄 CI/CD Pipeline

The project includes GitHub Actions workflows for:
- ✅ Automated testing on PR
- ✅ Code quality checks
- ✅ Type checking
- ✅ Automated deployments

**Workflows Location**: `.github/workflows/`

---

## 🗺️ Roadmap

### Phase 1: MVP ✅ (Completed)
- [x] User authentication (OTP)
- [x] Product listings
- [x] Order management
- [x] Payment integration
- [x] Basic chat system

### Phase 2: Intelligence 🔄 (In Progress)
- [x] ML recommendations
- [x] Sentiment analysis
- [x] Fraud detection
- [x] AI chatbot
- [x] Price optimization
- [ ] Demand forecasting (coming soon)

### Phase 3: Scale 📋 (Planned)
- [ ] Multi-language support (5+ languages)
- [ ] Advanced analytics dashboard
- [ ] Logistics provider integration
- [ ] Video chat for farmers
- [ ] IoT sensor integration
- [ ] Advanced farmer verification
- [ ] UPI & digital wallets

### Phase 4: Enterprise 🎯 (Future)
- [ ] B2B wholesale features
- [ ] API for third parties
- [ ] Enterprise analytics
- [ ] Custom integrations
- [ ] SLA support

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Agri-Connect Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions...
```

---

## 📊 Project Stats

```
📦 Packages:        7 (api, ml, ui, config, web, mobile, admin)
🗂️  Total Files:    500+
📝 Lines of Code:   50,000+
🧪 Test Coverage:   75%+
📚 Documentation:   5 guides + inline comments
🤖 ML Models:       5 (Recommendations, Fraud Detection, etc.)
⚡ API Endpoints:   40+
📱 Platforms:       Web, Mobile (iOS/Android), Admin Portal
🌍 Supported:       Scalable to any region
```

---

## 🎓 Learning Resources

### For Beginners
- [Node.js Documentation](https://nodejs.org/docs/)
- [React Documentation](https://react.dev/)
- [Prisma Tutorials](https://www.prisma.io/docs/getting-started)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### For ML Enthusiasts
- [Scikit-learn Guide](https://scikit-learn.org/stable/user_guide.html)
- [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/)
- [Collaborative Filtering](https://towardsdatascience.com/collaborative-filtering-and-recommender-systems-bd86f46db522)

### Project-Specific
- **[packages/ml/START_HERE.md](packages/ml/START_HERE.md)** - ML service guide
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Deployment walkthrough
- **[AI_INTEGRATION_COMPLETE_GUIDE.md](AI_INTEGRATION_COMPLETE_GUIDE.md)** - AI features setup

---

## 💡 Tips & Best Practices

### Development Workflow
```bash
# 1. Create feature branch
git checkout -b feature/your-feature

# 2. Make changes & test locally
pnpm test

# 3. Format & lint code
pnpm format && pnpm lint

# 4. Commit & push
git push origin feature/your-feature

# 5. Create pull request on GitHub
```

### Code Quality
- ✅ Use TypeScript for type safety
- ✅ Write tests for critical paths
- ✅ Follow naming conventions
- ✅ Keep functions small and focused
- ✅ Document complex logic

### Performance Tips
- 🚀 Use database indexes for frequent queries
- 🚀 Implement Redis caching for expensive operations
- 🚀 Optimize images before upload
- 🚀 Use pagination for large datasets
- 🚀 Monitor API response times

---

## 🎯 Success Stories

> *"Agri-Connect helped me increase my farmer income by 40% by eliminating middlemen!"*
> — Rajesh Kumar, Farmer, Karnataka

> *"Fresh produce delivered direct from farms. Quality is amazing and prices are fair!"*
> — Priya Sharma, Customer, Bangalore

---

## 🙏 Acknowledgments

Special thanks to:
- 🌾 Farmers for the inspiration
- 👥 Community contributors
- 🎓 Open-source projects we built upon
- 💚 Everyone supporting sustainable agriculture

---

## 📝 Changelog

### Latest Version (v1.0.0)
- ✅ Complete MVP launch
- ✅ ML recommendation system
- ✅ Fraud detection
- ✅ AI chatbot
- ✅ Mobile app support

[Full Changelog](CHANGELOG.md)

---

<div align="center">

### Built with ❤️ for farmers and consumers worldwide

**[⬆ back to top](#agri-connect)**

</div>
