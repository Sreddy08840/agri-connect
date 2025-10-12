# Agri-Connect 🌱

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

A comprehensive marketplace platform that directly connects farmers and consumers, eliminating intermediaries and ensuring fair pricing.

## 📋 Table of Contents
- [Features](#-features)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Development](#-development)
- [Deployment](#-deployment)
- [Mobile App](#-mobile-app)
- [Contributing](#-contributing)
- [License](#-license)

## 🚀 Features

### For Customers 👥
- **Browse & Search**: Explore fresh produce by category with advanced filters
- **Direct Purchase**: Buy directly from verified farmers with transparent pricing
- **Order Tracking**: Real-time order status and delivery updates
- **Secure Payments**: Multiple payment options including UPI and cards
- **Chat Support**: Direct communication with farmers for inquiries

### For Farmers 👨‍🌾
- **Product Management**: Add, edit, and manage product listings with images
- **Order Management**: Accept/reject orders, update order status
- **Earnings Dashboard**: Track sales, payouts, and performance metrics
- **Verification System**: Get verified as a trusted farmer with KYC
- **Inventory Management**: Real-time stock level tracking

### For Admins 👨‍💼
- **User Management**: Manage customers, farmers, and staff accounts
- **Product Moderation**: Review and approve product listings
- **Analytics Dashboard**: Platform-wide insights and business metrics
- **Category Management**: Organize and manage product categories
- **Dispute Resolution**: Handle customer-farmer disputes and refunds

## 🏗️ Architecture

### Tech Stack

#### Frontend
- **Web**: React.js with TypeScript
- **Mobile**: React Native with Expo
- **State Management**: React Query + Zustand
- **UI Library**: TailwindCSS + shadcn/ui

#### Backend
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js
- **API**: REST + WebSockets
- **Authentication**: JWT + OTP
- **Payments**: Razorpay Integration

#### Database
- **Primary**: PostgreSQL
- **ORM**: Prisma
- **Caching**: Redis
- **Search**: MeiliSearch (for product search)

## 📁 Project Structure

```
agri-connect/
├── apps/
│   ├── web/                 # React web application
│   ├── mobile/              # React Native mobile app
│   └── admin-portal/        # Admin dashboard (Next.js)
├── packages/
│   ├── api/                 # Node.js API server
│   ├── ml/                  # Python ML recommendation service
│   ├── ui/                  # Shared UI components
│   └── config/              # Shared configuration
├── .github/                 # GitHub workflows and templates
├── docker/                  # Docker configurations
├── docs/                    # Documentation
└── README.md
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- pnpm 8+
- Python 3.11+ (for ML service)
- Docker & Docker Compose
- PostgreSQL 15+ (or use Docker)
- Redis 7+

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/agri-connect.git
   cd agri-connect
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   pnpm install
   
   # Install workspace dependencies
   pnpm -r install
   ```

3. **Set up environment variables**
   ```bash
   cp packages/api/.env.example packages/api/.env
   cp apps/web/.env.example apps/web/.env.local
   cp apps/mobile/.env.example apps/mobile/.env
   ```
   Update the environment variables in each `.env` file with your configuration.

4. **Start development services**
   ```bash
   # Start database and cache
   docker-compose up postgres redis -d
   
   # Run database migrations
   pnpm db:migrate
   
   # Seed initial data
   pnpm db:seed
   ```

## 🚀 Development

### Running Services

#### Start all services in development mode:
```bash
pnpm dev
```

This will start:
- API server: http://localhost:8080
- Web app: http://localhost:5173
- Mobile app: Expo dev server
- Admin portal: http://localhost:3000

#### Individual services:

```bash
# API only
cd packages/api && pnpm dev

# Web app only
cd apps/web && pnpm dev

# Mobile app only
cd apps/mobile && pnpm start

# Admin portal
cd apps/admin-portal && pnpm dev
```

### ML Recommendation Service

The ML service provides intelligent product recommendations:

```bash
cd packages/ml

# Install Python dependencies
pip install -r requirements.txt

# Start the service
python -m uvicorn main:app --reload --port 8000
```

**Endpoints:**
- `GET /recommendations?userId=1&n=10` - Get recommendations
- `POST /train` - Retrain the recommendation model
- `GET /health` - Service health check

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch

# Test specific package
cd packages/api && pnpm test
```

## 🚀 Deployment

### Using Docker

```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Production deployment
NODE_ENV=production docker-compose -f docker-compose.prod.yml up -d
```

### Manual Deployment

1. **API**
   - Deploy to Railway, Fly.io, or AWS/GCP
   - Set up environment variables
   - Run database migrations

2. **Web App**
   ```bash
   cd apps/web
   pnpm build
   # Deploy the generated files to your hosting provider
   ```

3. **Mobile App**
   ```bash
   cd apps/mobile
   
   # Build for Android
   pnpm build:android
   
   # Build for iOS
   pnpm build:ios
   
   # Publish to app stores using EAS
   pnpm eas:submit
   ```

## 📱 Mobile App

The mobile app is built with React Native and Expo:

```bash
cd apps/mobile

# Start development server
pnpm start

# Run on Android emulator
pnpm android

# Run on iOS simulator
pnpm ios

# Build production APK
pnpm build:android

# Build production IPA
pnpm build:ios
```

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) to get started.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  Made with ❤️ by the Agri-Connect Team
</div>
