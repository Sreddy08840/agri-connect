# 🤖 AI + Analytics Integration - Complete Guide

## 📋 Overview

This guide covers the complete integration of AI-powered features into the Agri-Connect platform, including:
- Product recommendations (collaborative + content-based filtering)
- Price optimization and prediction
- Sales forecasting
- Farmer performance analytics
- Customer insights dashboard
- Fraud detection
- AI chatbot with RAG (Retrieval-Augmented Generation)

---

## 🏗️ Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Web App       │         │   Mobile App    │         │  Admin Portal   │
│  (React/Vite)   │         │  (React Native) │         │                 │
└────────┬────────┘         └────────┬────────┘         └────────┬────────┘
         │                           │                           │
         └───────────────────────────┼───────────────────────────┘
                                     │
                          ┌──────────▼──────────┐
                          │   Backend API       │
                          │  (Node.js/Express)  │
                          │   Port: 8080        │
                          └──────────┬──────────┘
                                     │
                          ┌──────────▼──────────┐
                          │   ML Microservice   │
                          │  (Python/FastAPI)   │
                          │   Port: 8000        │
                          └──────────┬──────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
         ┌──────────▼────────┐  ┌───▼────┐  ┌───────▼────────┐
         │  SQLite Database  │  │ Redis  │  │  ML Models     │
         │  (Prisma)         │  │ Cache  │  │  (scikit-learn)│
         └───────────────────┘  └────────┘  └────────────────┘
```

---

## 🚀 Quick Start

### 1. Start ML Service

```bash
# Navigate to ML package
cd packages/ml

# Install dependencies (first time only)
pip install -r requirements.txt

# Start the service
python3.13 -m uvicorn main:app --host 0.0.0.0 --port 8000
```

The ML service will be available at `http://localhost:8000`

### 2. Start Backend API

```bash
# Navigate to API package
cd packages/api

# Install dependencies (if not already done)
pnpm install

# Set environment variable
# Add to .env file:
ML_BASE_URL=http://localhost:8000

# Start the API
pnpm dev
```

The API will be available at `http://localhost:8080`

### 3. Start Web App

```bash
# Navigate to web app
cd apps/web

# Install dependencies (if not already done)
pnpm install

# Start the app
pnpm dev
```

The web app will be available at `http://localhost:5173`

### 4. Start Mobile App

```bash
# Navigate to mobile app
cd apps/mobile

# Install dependencies (if not already done)
pnpm install

# Set environment variable in .env
EXPO_PUBLIC_API_URL=http://192.168.x.x:8080/api

# Start Expo
pnpm start
```

---

## 🐳 Docker Deployment

### Start All Services with Docker Compose

```bash
# From project root
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

Services will be available at:
- **ML Service**: http://localhost:8000
- **Backend API**: http://localhost:8080
- **Redis**: localhost:6380
- **PostgreSQL**: localhost:5432

---

## 📡 API Endpoints

### AI Recommendations

#### Get Personalized Recommendations
```http
GET /api/ai/recommendations?n=10
Authorization: Bearer <token>
```

**Response:**
```json
{
  "userId": "user123",
  "count": 10,
  "items": [
    {
      "id": "prod123",
      "name": "Organic Tomatoes",
      "price": 50,
      "unit": "kg",
      "recommendationScore": 0.95,
      "category": { "name": "Vegetables" },
      "farmer": { "name": "John Doe" }
    }
  ],
  "method": "collaborative"
}
```

#### Get Similar Products
```http
GET /api/ai/recommendations/similar/:productId?n=10
```

### Price Optimization

```http
POST /api/ai/price-predict
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "prod123",
  "priceRangeMin": 40,
  "priceRangeMax": 80,
  "numSamples": 20
}
```

**Response:**
```json
{
  "product_id": "prod123",
  "current_price": 50,
  "recommended_price": 55,
  "expected_revenue_increase": 12.5,
  "price_points": [
    {
      "price": 45,
      "predicted_demand": 120,
      "predicted_revenue": 5400,
      "confidence": 0.85
    }
  ]
}
```

### Sales Forecasting

```http
POST /api/ai/sales-forecast
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "prod123",
  "days": 30
}
```

**Response:**
```json
{
  "product_id": "prod123",
  "forecast": [
    {
      "date": "2024-01-15",
      "predicted_demand": 45,
      "lower_bound": 40,
      "upper_bound": 50
    }
  ],
  "method": "prophet",
  "confidence": 0.82
}
```

### Farmer Analytics

```http
GET /api/ai/analytics/farmer
Authorization: Bearer <token>
```

**Response:**
```json
{
  "totalRevenue": 125000,
  "totalOrders": 450,
  "totalProducts": 25,
  "averageRating": 4.7,
  "revenueTrend": [
    { "month": "2024-01", "revenue": 18000 },
    { "month": "2024-02", "revenue": 22000 }
  ]
}
```

### Customer Insights (Admin Only)

```http
GET /api/ai/analytics/customer
Authorization: Bearer <admin-token>
```

### Fraud Detection

```http
POST /api/ai/fraud-check
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "order123"
}
```

**Response:**
```json
{
  "orderId": "order123",
  "risk_score": 0.23,
  "risk_level": "low",
  "factors": ["Normal transaction amount", "Verified user"],
  "recommendation": "Approve transaction"
}
```

### AI Chatbot

```http
POST /api/ai/chat
Content-Type: application/json

{
  "query": "What are the best practices for growing tomatoes?",
  "userId": "user123"
}
```

**Response:**
```json
{
  "query": "What are the best practices for growing tomatoes?",
  "answer": "Here are the best practices for growing tomatoes...",
  "documents": [
    {
      "id": "doc1",
      "text": "Tomato growing guide...",
      "score": 0.92
    }
  ],
  "confidence": 0.88
}
```

---

## 💻 Frontend Integration

### Web App (React)

#### 1. Import AI Services

```typescript
import { 
  getRecommendations, 
  getFarmerAnalytics,
  predictPrice,
  forecastSales 
} from '@/lib/api/ai';
```

#### 2. Use in Components

```tsx
// Get recommendations
const recommendations = await getRecommendations(token, 10);

// Get farmer analytics
const analytics = await getFarmerAnalytics(token);

// Predict price
const priceOpt = await predictPrice(token, productId);

// Forecast sales
const forecast = await forecastSales(token, productId, 30);
```

#### 3. Add Components to Pages

**HomePage.tsx:**
```tsx
import RecommendedProducts from '@/components/RecommendedProducts';

function HomePage() {
  return (
    <div>
      {/* Other content */}
      <RecommendedProducts />
    </div>
  );
}
```

**FarmerDashboard:**
```tsx
import { Link } from 'react-router-dom';

function FarmerDashboard() {
  return (
    <div>
      <Link to="/farmer/ai-insights">
        <button>AI Insights Dashboard</button>
      </Link>
    </div>
  );
}
```

**App.tsx (Add Routes):**
```tsx
import AIInsightsPage from '@/pages/farmer/AIInsightsPage';
import AIChatbot from '@/components/AIChatbot';

function App() {
  return (
    <Router>
      <Routes>
        {/* Other routes */}
        <Route path="/farmer/ai-insights" element={<AIInsightsPage />} />
      </Routes>
      <AIChatbot />
    </Router>
  );
}
```

### Mobile App (React Native)

#### 1. Import AI Services

```typescript
import { 
  getRecommendations, 
  getFarmerAnalytics 
} from '@/lib/api/ai';
```

#### 2. Add to Navigation

**navigation/AppNavigator.tsx:**
```tsx
import AIInsightsScreen from '@/screens/AIInsightsScreen';

function FarmerStack() {
  return (
    <Stack.Navigator>
      {/* Other screens */}
      <Stack.Screen 
        name="AIInsights" 
        component={AIInsightsScreen}
        options={{ title: 'AI Insights' }}
      />
    </Stack.Navigator>
  );
}
```

#### 3. Add Components

**HomeScreen.tsx:**
```tsx
import RecommendedProducts from '@/components/RecommendedProducts';

function HomeScreen() {
  return (
    <ScrollView>
      {/* Other content */}
      <RecommendedProducts />
    </ScrollView>
  );
}
```

---

## 🔧 Configuration

### Backend (.env)

```bash
# ML Service URL
ML_BASE_URL=http://localhost:8000

# Redis for caching
REDIS_URL=redis://localhost:6380

# Database
DATABASE_URL=file:./prisma/dev.db
```

### Web App (.env)

```bash
# API URL
VITE_API_URL=http://localhost:8080/api

# Socket URL
VITE_SOCKET_URL=http://localhost:8080
```

### Mobile App (.env)

```bash
# API URL (use your local IP for physical devices)
EXPO_PUBLIC_API_URL=http://192.168.1.100:8080/api

# For Android Emulator
# EXPO_PUBLIC_API_URL=http://10.0.2.2:8080/api

# For iOS Simulator
# EXPO_PUBLIC_API_URL=http://localhost:8080/api
```

### ML Service (.env)

```bash
# Database
DATABASE_URL=file:../api/prisma/dev.db

# Model directories
MODEL_DIR=./models
VECTOR_INDEX_DIR=./vectors

# Service config
ML_SERVICE_HOST=0.0.0.0
ML_SERVICE_PORT=8000
```

---

## 🧪 Testing

### Test ML Service Health

```bash
curl http://localhost:8000/health
```

### Test Recommendations

```bash
curl -X GET "http://localhost:8000/recommendations/user/user123?n=5"
```

### Test Backend AI Routes

```bash
# Get recommendations (requires auth token)
curl -X GET "http://localhost:8080/api/ai/recommendations?n=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check ML health
curl http://localhost:8080/api/ai/health
```

### Test Web App

1. Login as a farmer
2. Navigate to `/farmer/ai-insights`
3. View analytics dashboard
4. Test price prediction
5. Test sales forecasting

### Test Mobile App

1. Login as a customer
2. View recommended products on home screen
3. Navigate to AI Insights (for farmers)
4. Test chatbot functionality

---

## 🔄 Data Flow

### Recommendation Flow

```
User Request → Backend API → ML Service → Database Query
                    ↓              ↓
                  Cache          ML Model
                    ↓              ↓
                  Response ← Product IDs
                    ↓
              Fetch Full Data
                    ↓
              Return to User
```

### Analytics Flow

```
Farmer Dashboard → Backend API → Database Aggregation
                        ↓
                   Calculate Stats
                        ↓
                   Return Analytics
```

---

## 📊 ML Models

### Recommendation System
- **Content-Based**: TF-IDF + Cosine Similarity
- **Collaborative Filtering**: Matrix Factorization (ALS)
- **Hybrid**: Combines both approaches

### Price Optimization
- **Algorithm**: XGBoost Regression
- **Features**: Historical prices, demand, seasonality, competition

### Sales Forecasting
- **Algorithm**: Prophet (Facebook)
- **Features**: Time series data, seasonality, trends

### Fraud Detection
- **Algorithm**: Isolation Forest + XGBoost
- **Features**: Transaction patterns, user behavior, anomaly detection

---

## 🛠️ Troubleshooting

### ML Service Not Starting

```bash
# Check Python version (requires 3.8+)
python --version

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Check port availability
netstat -an | grep 8000
```

### Backend Can't Connect to ML Service

```bash
# Verify ML service is running
curl http://localhost:8000/health

# Check environment variable
echo $ML_BASE_URL

# Test connection from backend
curl http://localhost:8000/health
```

### No Recommendations Returned

```bash
# Check if products exist in database
# Check if user has interaction history (events table)
# Refresh ML index
curl -X POST http://localhost:8000/recommendations/refresh
```

### Mobile App Can't Connect

```bash
# Find your local IP
ipconfig  # Windows
ifconfig  # Mac/Linux

# Update EXPO_PUBLIC_API_URL with your IP
EXPO_PUBLIC_API_URL=http://192.168.1.100:8080/api

# Restart Expo
pnpm start --clear
```

---

## 🔐 Security

### Authentication
- All AI endpoints require JWT authentication (except chatbot)
- Farmers can only access their own product data
- Admin-only endpoints for customer insights

### Rate Limiting
- Implemented via Express middleware
- Cached responses to reduce ML service load

### Data Privacy
- User data anonymized in ML models
- No PII stored in ML service
- GDPR-compliant data handling

---

## 📈 Performance Optimization

### Caching Strategy
- **Redis**: Cache ML responses for 1 hour
- **In-Memory**: Cache frequently accessed data
- **CDN**: Static assets and images

### Database Optimization
- Indexed queries for fast lookups
- Aggregated analytics queries
- Connection pooling

### ML Service Optimization
- Model pre-loading on startup
- Batch predictions when possible
- Async processing for long-running tasks

---

## 🚀 Production Deployment

### Environment Variables

**Production Backend:**
```bash
ML_BASE_URL=https://ml.agriconnect.com
REDIS_URL=redis://production-redis:6379
DATABASE_URL=postgresql://user:pass@db:5432/agriconnect
```

**Production ML Service:**
```bash
DATABASE_URL=postgresql://user:pass@db:5432/agriconnect
MODEL_DIR=/app/models
VECTOR_INDEX_DIR=/app/vectors
```

### Docker Production

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d

# Scale ML service
docker-compose -f docker-compose.prod.yml up -d --scale ml-service=3
```

### Monitoring

- **Health Checks**: `/health` endpoints
- **Metrics**: Prometheus + Grafana
- **Logging**: Centralized logging (ELK stack)
- **Alerts**: Set up alerts for service failures

---

## 📚 Additional Resources

### ML Service Documentation
- API Examples: `packages/ml/API_EXAMPLES.md`
- Implementation Guide: `packages/ml/IMPLEMENTATION_SUMMARY.md`
- Deployment Guide: `packages/ml/DEPLOYMENT_GUIDE.md`

### Backend Documentation
- API Routes: `packages/api/src/routes/ai.ts`
- ML Service Integration: `packages/api/src/services/ml.ts`

### Frontend Documentation
- Web Components: `apps/web/src/components/`
- Mobile Screens: `apps/mobile/src/screens/`

---

## 🎯 Next Steps

1. ✅ Train ML models with production data
2. ✅ Set up monitoring and alerting
3. ✅ Configure production environment variables
4. ✅ Deploy to cloud infrastructure
5. ✅ Set up CI/CD pipeline
6. ✅ Implement A/B testing for recommendations
7. ✅ Add more ML features (demand prediction, crop recommendations)

---

## 💡 Support

For issues or questions:
- Check troubleshooting section above
- Review ML service logs: `docker-compose logs ml-service`
- Review backend logs: `docker-compose logs api`
- Contact development team

---

**Last Updated**: January 2024  
**Version**: 1.0.0
