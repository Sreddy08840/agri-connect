<div align="center">

# 🌱 Agri-Connect

### *Bridging the gap between farmers and consumers — direct, fair, and intelligent.*

[![GitHub Stars](https://img.shields.io/github/stars/Sreddy08840/agri-connect?style=for-the-badge&logo=github&color=22c55e)](https://github.com/Sreddy08840/agri-connect)
[![License](https://img.shields.io/badge/license-MIT-brightgreen?style=for-the-badge)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB?style=for-the-badge&logo=python)](https://python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5%2B-3178C6?style=for-the-badge&logo=typescript)](https://typescriptlang.org/)

<br/>

> **Agri-Connect** is a full-stack agricultural marketplace that eliminates middlemen, empowers farmers with AI-driven tools, and gives consumers direct access to fresh produce — with a built-in multilingual voice assistant powered by Vapi, Groq, and Azure Neural TTS.

</div>

---

## 📸 Platform Highlights

| 🛒 Customer Marketplace | 🌾 Farmer Dashboard | 🎙️ Voice AI Assistant |
|---|---|---|
| Browse & buy fresh produce directly | Manage products, orders & earnings | Speak in English, Hindi or Kannada |
| Real-time order tracking | Accept/reject orders instantly | Add products, check orders by voice |
| AI-powered recommendations | AI price insights & demand forecasts | Powered by Groq + Azure Neural TTS |

---

## ✨ Feature Overview

### 🛍️ For Customers
- **Smart Product Discovery** — Browse, filter, and search fresh produce by category
- **AI Recommendations** — Personalized suggestions powered by hybrid ML (ALS + TF-IDF)
- **Direct Chat** — Real-time messaging with verified farmers via Socket.IO
- **Flexible Payments** — Razorpay online payments + Cash on Delivery
- **Order Tracking** — Live status updates from placement to delivery
- **Reviews & Ratings** — Verified purchase reviews with fraud detection

### 🌾 For Farmers
- **Voice-First Product Listing** — Add products just by speaking in Hindi, Kannada, or English
- **Product Management** — Add, edit, and manage product listings with image uploads
- **Order Management** — Accept/reject orders with real-time customer notifications
- **AI Insights** — Price optimization suggestions & demand forecasting
- **Sales Analytics** — Track earnings, order trends, and inventory levels
- **Verification System** — Get verified to build trust with consumers

### 🎙️ Multilingual Voice AI (Krishi AI)
- **3 Native Languages** — English (`en-IN`), Hindi (`हिन्दी`), Kannada (`ಕನ್ನಡ`)
- **Azure Neural TTS** — Premium voice output using `Neerja`, `Swara`, and `Sapna` neural voices
- **Deepgram STT** — Accurate speech transcription with `Nova-2` across all Indian accents
- **Groq LLM (LLama-3)** — Ultra-fast intent extraction with < 300ms latency
- **Qdrant RAG** — Retrieval-Augmented Generation for farming knowledge base
- **Client-Side Tool Calling** — Secure local API calls from browser to backend without tunneling
- **Full Language Enforcement** — AI strictly responds in user's selected language, end to end

### ⚙️ For Admins
- **User Management** — Manage customers, farmers, and admin access
- **Product Approvals** — Review and approve all new product listings
- **Analytics Dashboard** — Platform-wide insights and sales reports
- **Category Management** — Organize and manage product taxonomies
- **Fraud Detection** — AI-flagged review spam & suspicious activity monitoring
- **Audit Logging** — Complete trail of all admin actions

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
├────────────────────┬──────────────────┬──────────────────────┤
│   React Web App    │  React Native    │    Admin Portal      │
│   (Vite, Port 5173)│  (Expo)          │    (Next.js)         │
└─────────┬──────────┴────────┬─────────┴──────────┬───────────┘
          │                   │                    │
          ▼                   ▼                    ▼
┌──────────────────────────────────────────────────────────────┐
│            REST API + WebSocket Gateway (Port 8080)          │
│            Node.js + Express + TypeScript + Prisma           │
├──────────────┬──────────────┬──────────────┬─────────────────┤
│    Auth      │   Products   │    Orders    │  Voice/AI API   │
│  (OTP + JWT) │   + Reviews  │   + Payouts  │  (Groq + Vapi)  │
└──────┬───────┴──────┬───────┴──────┬───────┴──────┬──────────┘
       │              │              │              │
       ▼              ▼              ▼              ▼
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────┐
│ PostgreSQL  │ │   Redis    │ │  S3/MinIO  │ │ Qdrant (RAG)   │
│ + Prisma   │ │  (Cache)   │ │  (Images)  │ │ Vector Search  │
└────────────┘ └────────────┘ └────────────┘ └────────────────┘
                                                     │
                                              ┌──────▼─────────┐
                                              │  ML Service    │
                                              │ Python+FastAPI │
                                              │  (Port 8000)   │
                                              └────────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Web Frontend** | React 18, TypeScript, Vite, CSS |
| **Mobile** | React Native, Expo |
| **Backend API** | Node.js 18+, Express, TypeScript, Prisma ORM |
| **Database** | PostgreSQL (prod) / SQLite (dev) |
| **Caching** | Redis |
| **File Storage** | S3-compatible (MinIO/AWS) |
| **ML Service** | Python 3.11+, FastAPI, scikit-learn, pandas |
| **Voice AI** | Vapi SDK, Deepgram Nova-2, Azure Neural TTS |
| **LLM / Intent** | Groq (LLama-3 70B), Gemini Flash (fallback) |
| **Vector DB** | Qdrant (RAG for farming knowledge) |
| **Real-time** | Socket.IO |
| **Payments** | Razorpay |
| **Auth** | Phone OTP + JWT (access + refresh tokens) |
| **Package Manager** | pnpm workspaces (monorepo) |
| **Containerization** | Docker + Docker Compose |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ → [Download](https://nodejs.org/)
- **Python** 3.11+ → [Download](https://python.org/)
- **pnpm** 8+ → `npm install -g pnpm`
- **Git** → [Download](https://git-scm.com/)

### 1️⃣ Clone & Install

```bash
git clone https://github.com/Sreddy08840/agri-connect.git
cd agri-connect
pnpm install
```

### 2️⃣ Configure Environment

```bash
# Backend API
cp packages/api/.env.example packages/api/.env
# Edit packages/api/.env with your configuration

# Frontend
cp apps/web/.env.example apps/web/.env
# Edit apps/web/.env with your Vapi keys
```

### 3️⃣ Setup Database

```bash
cd packages/api
pnpm prisma db push
pnpm prisma db seed   # Optional: seed sample data
cd ../..
```

### 4️⃣ Setup ML Service

```bash
cd packages/ml

# Windows
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python quick_fix.py
python train_als.py   # Optional: train recommendation model
cd ../..
```

### 5️⃣ Start All Services

Open **3 separate terminals**:

```bash
# Terminal 1 — API Server (port 8080)
cd packages/api && pnpm dev

# Terminal 2 — Web App (port 5173)
cd apps/web && pnpm dev

# Terminal 3 — ML Service (port 8000)
cd packages/ml && python -m app.main
```

### ✅ Verify

| Service | URL |
|---------|-----|
| 🌐 Web App | http://localhost:5173 |
| 🔌 API | http://localhost:8080/api/health |
| 🤖 ML Docs | http://127.0.0.1:8000/docs |

---

## 🔑 Environment Variables

### Backend (`packages/api/.env`)

```env
# Server
PORT=8080
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/agri_connect

# Auth
JWT_SECRET=your-super-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

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

# AI / LLM
GROQ_API_KEY=your-groq-api-key
GEMINI_API_KEY=your-gemini-api-key

# Voice / RAG
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your-qdrant-api-key

# OTP (use 'mock' for development)
OTP_PROVIDER=mock
```

### Frontend (`apps/web/.env`)

```env
VITE_API_URL=http://localhost:8080/api
VITE_SOCKET_URL=http://localhost:8080
VITE_VAPI_PUBLIC_KEY=your-vapi-public-key
VITE_VAPI_ASSISTANT_ID=your-vapi-assistant-id
```

---

## 🎙️ Voice AI — Krishi AI

### How to Use

1. Open the web app and **log in as a farmer**
2. Click the **floating microphone button** (bottom right)
3. Select your language: **English 🇬🇧 | हिन्दी 🇮🇳 | ಕನ್ನಡ 🇮🇳**
4. Speak naturally!

### Example Voice Commands

| Language | Example Commands |
|----------|-----------------|
| 🇬🇧 English | *"Add 50 kg of tomatoes for 30 rupees per kg"* |
| 🇮🇳 Hindi | *"मुझे ५० किलो टमाटर ३० रुपये किलो में जोड़ने हैं"* |
| 🇮🇳 Kannada | *"ನಾನು ೫೦ ಕೆಜಿ ಟೊಮೆಟೊ ೩೦ ರೂಪಾಯಿಗೆ ಮಾರಾಟ ಮಾಡಲು ಬಯಸುತ್ತೇನೆ"* |
| 🇬🇧 English | *"What are my recent orders?"* |
| 🇬🇧 English | *"What is the current price of onions?"* |

---

## 📡 API Reference

### 🔐 Authentication
```
POST  /api/auth/otp/request    → Request OTP to phone number
POST  /api/auth/otp/verify     → Verify OTP and receive JWT tokens
POST  /api/auth/refresh        → Refresh access token
GET   /api/auth/me             → Get current authenticated user
```

### 📦 Products
```
GET   /api/products            → List all approved products
GET   /api/products/:id        → Get product details
POST  /api/products            → Create product (farmer only)
PATCH /api/products/:id        → Update product
PATCH /api/products/:id/status → Approve / reject product (admin)
```

### 🛒 Orders
```
POST  /api/orders              → Place a new order
GET   /api/orders              → Get user's orders
GET   /api/orders/:id          → Get order details
PATCH /api/orders/:id/status   → Update order status (farmer/admin)
```

### 🎙️ Voice / AI
```
POST  /api/voice/process       → Process voice intent + execute action
POST  /api/voice/webhook       → Vapi webhook for LLM processing
POST  /api/ai/chat             → Text chatbot queries
GET   /api/recommendations/:id → Get personalized product recommendations
```

### 💬 Chat & Notifications
```
WS    /api/chat/:roomId        → Real-time Socket.IO chat room
GET   /api/notifications       → Get user notifications
```

---

## 🤖 ML Service Features

Located in `packages/ml` (Python + FastAPI, port 8000):

| Feature | Endpoint | Description |
|---------|----------|-------------|
| 🎯 **Recommendations** | `GET /recommendations/user/:id` | Hybrid ALS + TF-IDF personalized recommendations |
| 🔍 **Similar Products** | `GET /recommendations/product/:id` | Content-based similarity matching |
| 😊 **Sentiment Analysis** | `POST /reviews/analyze` | Review authenticity & spam detection |
| 🛡️ **Fraud Detection** | `POST /fraud/score` | Calculate transaction risk score |
| 💬 **Product Chatbot** | `POST /chat/query` | RAG-based product information assistant |
| 📈 **Price Optimization** | `POST /price/optimize` | Demand-based dynamic pricing suggestions |
| 📊 **Demand Forecasting** | `POST /forecast/demand` | Seasonal sales trend predictions |

---

## 🧪 Development

### Test Credentials

```
👤 Admin:     +1234567890  (OTP: any 6 digits)
🌾 Farmer:    +1987654321  (OTP: any 6 digits)
🛒 Customer:  +1122334455  (OTP: any 6 digits)
```
> In development mode, the OTP provider is `mock` — any 6-digit code works.

### Useful Commands

```bash
# Database
pnpm prisma studio          # Visual database browser
pnpm prisma migrate dev     # Create and apply new migration
pnpm prisma generate        # Regenerate Prisma client

# Code Quality
pnpm lint                   # Check code style
pnpm format                 # Auto-format code
pnpm type-check             # TypeScript type checking

# Docker (full stack)
docker-compose up           # Start all services
docker-compose down         # Stop all services
docker-compose logs -f api  # Stream API logs
```

---

## 🔐 Security

- ✅ Phone OTP authentication (no passwords)
- ✅ JWT access + refresh token rotation
- ✅ Role-based access control (RBAC): Customer / Farmer / Admin
- ✅ Input validation with **Zod** schemas
- ✅ SQL injection prevention via **Prisma ORM**
- ✅ Rate limiting on all sensitive endpoints
- ✅ CORS configuration
- ✅ Audit logging for all admin actions
- ✅ ML-based fraud detection on reviews and transactions

---

## 🚀 Deployment

### Free Tier (Students / Hackathons)

```
Backend  → Railway ($5 free credit/month)
Database → Railway PostgreSQL (Free tier)
Web      → Vercel (Free forever)
Total    → $0/month | ~30 min setup
```

See [`FREE_DEPLOYMENT_GUIDE.md`](FREE_DEPLOYMENT_GUIDE.md) for step-by-step instructions.

### Production (Single Server)

```
VPS (DigitalOcean / Hetzner / Linode) → $10-50/month
All services via Docker Compose
See DEPLOYMENT_CHECKLIST.md
```

### Mobile Apps

```bash
cd apps/mobile
npx eas-cli build --platform all --profile production
```

---

## 📁 Project Structure

```
agri-connect/
├── 📁 apps/
│   ├── web/                    # React + Vite web app (Port 5173)
│   │   └── src/
│   │       ├── features/voice/ # Krishi AI voice assistant
│   │       ├── pages/          # Farmer, customer & admin pages
│   │       └── components/     # Shared UI components
│   ├── mobile/                 # React Native + Expo mobile app
│   └── admin-portal/           # Next.js admin dashboard
│
├── 📁 packages/
│   ├── api/                    # Node.js + Express API (Port 8080)
│   │   └── src/
│   │       ├── routes/         # auth, products, orders, voice, AI...
│   │       ├── services/       # qdrant, payments, email...
│   │       └── prisma/         # Database schema & migrations
│   ├── ml/                     # Python + FastAPI ML service (Port 8000)
│   │   └── app/                # Recommendations, fraud, chatbot...
│   ├── voice-ai/               # Voice processing utilities
│   ├── ui/                     # Shared UI component library
│   └── config/                 # Shared ESLint, TypeScript configs
│
├── 📁 .github/workflows/       # CI/CD with GitHub Actions
├── 🐳 docker-compose.yml       # Local development stack
├── 🐳 docker-compose.prod.yml  # Production deployment stack
└── 📄 README.md                # You are here!
```

---

## 🗺️ Roadmap

### ✅ Phase 1 — Core Platform
- [x] Phone OTP authentication
- [x] Product listings & approval workflow
- [x] Order placement & management
- [x] Razorpay payment integration
- [x] Real-time farmer-customer chat

### ✅ Phase 2 — AI & Intelligence
- [x] ML-powered product recommendations
- [x] Sentiment analysis & fraud detection
- [x] AI chatbot for product queries
- [x] Price optimization engine
- [x] **Multilingual voice assistant (English, Hindi, Kannada)**

### 🔄 Phase 3 — Scale
- [ ] 5+ additional regional languages
- [ ] Advanced analytics dashboard
- [ ] Logistics & delivery partner integration
- [ ] IoT sensor integration (soil, weather)
- [ ] UPI & digital wallet payments

### 📋 Phase 4 — Enterprise
- [ ] B2B wholesale features
- [ ] Open API for third-party integrations
- [ ] Custom Kubernetes deployment
- [ ] SLA-backed enterprise support

---

## 🐛 Troubleshooting

<details>
<summary><b>❌ ML Service: ModuleNotFoundError</b></summary>

```bash
cd packages/ml
.\venv\Scripts\pip.exe install pydantic-settings pandas scikit-learn
```
</details>

<details>
<summary><b>❌ Voice AI: "Meeting ended" error</b></summary>

This usually means a Server URL is configured in your Vapi dashboard pointing to `localhost`.
1. Go to [dashboard.vapi.ai](https://dashboard.vapi.ai)
2. Open your Assistant settings
3. **Clear the Server URL field** completely
4. Save and refresh the web app
</details>

<details>
<summary><b>❌ API: Port 8080 already in use</b></summary>

```bash
# Windows — find and kill process on port 8080
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```
</details>

<details>
<summary><b>❌ Database: Connection refused</b></summary>

```bash
cd packages/api
pnpm prisma db push
```
</details>

<details>
<summary><b>❌ Voice: Responding in English even when Kannada is selected</b></summary>

1. Make sure you are **logged in** as a farmer before using the voice assistant
2. Ensure the **language dropdown** is set before clicking the microphone
3. Speak clearly — Deepgram Nova-2 works best with natural conversational phrasing
</details>

---

## 👥 Contributors

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/Sreddy08840">
        <img src="https://github.com/Sreddy08840.png" width="100px;" alt="Sreddy08840"/><br/>
        <sub><b>Sreddy08840</b></sub>
      </a><br/>
      <sub>🌱 Creator & Lead Developer</sub><br/>
      <sub>Full-Stack · Voice AI · ML Integration</sub>
    </td>
  </tr>
</table>

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for farmers and consumers across India**

*Empowering agriculture through technology, one voice command at a time.*

⭐ **Star this repo if you found it helpful!** ⭐

[🌐 Live Demo](https://agri-connect.vercel.app) · [🐛 Report Bug](https://github.com/Sreddy08840/agri-connect/issues) · [💡 Request Feature](https://github.com/Sreddy08840/agri-connect/issues)

</div>
