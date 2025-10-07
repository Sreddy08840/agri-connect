# Agri-Connect 🌱

A comprehensive marketplace platform that directly connects farmers and consumers, eliminating intermediaries and ensuring fair pricing.

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
- Node.js 18+
- pnpm 8+
- Python 3.11+ (for ML service)
- SQLite (included) / PostgreSQL 15+ (optional)
- Redis 7+ (optional)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd agri-connect
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp packages/api/env.example packages/api/.env
   # Edit the .env file with your configuration
   ```

4. **Start the database**
   ```bash
   docker-compose up postgres redis -d
   ```

5. **Set up the database**
   ```bash
   pnpm db:push
   pnpm db:seed
   ```

6. **Start all services**
   ```bash
   pnpm dev
   ```

This will start:
- API server on http://localhost:8080
- Web app on http://localhost:5173
- Mobile app (via Expo) on your device

### ML Recommendation Service

The ML service provides content-based product recommendations:

```bash
# Install Python dependencies
cd packages/ml
pip install -r requirements.txt

# Start the ML service
python -m uvicorn main:app --reload --port 8000

# Or use npm script
npm run dev
```

The service will be available at http://localhost:8000

**Features:**
- Content-based filtering using TF-IDF and cosine similarity
- Automatic product index on startup
- Fallback to newest products if no viewing history
- `/recommendations?userId=1&n=10` - Get recommendations
- `/refresh` - Reload product data

See `packages/ml/QUICKSTART.md` for detailed documentation.

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
python -m uvicorn main:app --reload
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

### Using Docker

```bash
# Build and start all services
docker-compose up --build

# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Deployment

1. **API**: Deploy to Railway, Fly.io, or similar
2. **Web**: Deploy to Vercel, Netlify, or similar
3. **Mobile**: Build and deploy to app stores using EAS

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
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Mobile app store deployment
- [ ] Integration with logistics providers
- [ ] Farmer verification enhancements
- [ ] Advanced payment options

---

Built with ❤️ for farmers and consumers worldwide.
