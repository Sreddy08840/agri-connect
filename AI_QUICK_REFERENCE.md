# 🚀 AI Integration - Quick Reference Card

## 📍 Service URLs

| Service | URL | Port |
|---------|-----|------|
| ML Service | http://localhost:8000 | 8000 |
| Backend API | http://localhost:8080 | 8080 |
| Web App | http://localhost:5173 | 5173 |
| Redis | localhost:6380 | 6380 |

---

## 🔑 Key API Endpoints

### Public Endpoints (No Auth)
```bash
# AI Chatbot
POST /api/ai/chat
Body: { "query": "your question", "userId": "optional" }

# ML Health Check
GET /api/ai/health

# Similar Products
GET /api/ai/recommendations/similar/:productId?n=10
```

### Authenticated Endpoints (Requires JWT)
```bash
# Personalized Recommendations
GET /api/ai/recommendations?n=10
Header: Authorization: Bearer <token>

# Farmer Analytics
GET /api/ai/analytics/farmer
Header: Authorization: Bearer <token>

# Price Prediction
POST /api/ai/price-predict
Header: Authorization: Bearer <token>
Body: { "productId": "prod123" }

# Sales Forecast
POST /api/ai/sales-forecast
Header: Authorization: Bearer <token>
Body: { "productId": "prod123", "days": 30 }

# Fraud Check
POST /api/ai/fraud-check
Header: Authorization: Bearer <token>
Body: { "orderId": "order123" }
```

### Admin Only
```bash
# Customer Insights
GET /api/ai/analytics/customer
Header: Authorization: Bearer <admin-token>

# Refresh ML Models
POST /api/ai/refresh
Header: Authorization: Bearer <admin-token>
```

---

## 💻 Frontend Usage

### Web App (React)

```typescript
// Import AI services
import { 
  getRecommendations, 
  getFarmerAnalytics,
  predictPrice,
  queryChatbot 
} from '@/lib/api/ai';

// Get recommendations
const recommendations = await getRecommendations(token, 10);

// Get analytics
const analytics = await getFarmerAnalytics(token);

// Predict price
const priceOpt = await predictPrice(token, productId);

// Chat with AI
const response = await queryChatbot("How to grow tomatoes?");
```

### Mobile App (React Native)

```typescript
// Import AI services
import { 
  getRecommendations, 
  getFarmerAnalytics 
} from '@/lib/api/ai';

// Same usage as web
const recommendations = await getRecommendations(token, 10);
const analytics = await getFarmerAnalytics(token);
```

---

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f ml-service
docker-compose logs -f api

# Restart ML service
docker-compose restart ml-service

# Stop all services
docker-compose down

# Rebuild and start
docker-compose up -d --build

# Check service status
docker-compose ps
```

---

## 🧪 Quick Tests

### Test ML Service
```bash
# Health check
curl http://localhost:8000/health

# Get recommendations
curl "http://localhost:8000/recommendations/user/test-user?n=5"

# Test chatbot
curl -X POST http://localhost:8000/chat/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Hello"}'
```

### Test Backend API
```bash
# Health check
curl http://localhost:8080/api/ai/health

# Test chatbot (no auth)
curl -X POST http://localhost:8080/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "What is Agri-Connect?"}'

# Test recommendations (with auth)
curl http://localhost:8080/api/ai/recommendations?n=5 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📂 Important Files

### Backend
- `packages/api/src/routes/ai.ts` - AI routes
- `packages/api/src/services/ml.ts` - ML service client
- `packages/api/src/index.ts` - Main app file

### Web App
- `apps/web/src/lib/api/ai.ts` - AI service client
- `apps/web/src/pages/farmer/AIInsightsPage.tsx` - AI dashboard
- `apps/web/src/components/RecommendedProducts.tsx` - Recommendations
- `apps/web/src/components/AIChatbot.tsx` - Chatbot widget

### Mobile App
- `apps/mobile/src/lib/api/ai.ts` - AI service client
- `apps/mobile/src/screens/AIInsightsScreen.tsx` - AI screen
- `apps/mobile/src/components/RecommendedProducts.tsx` - Recommendations

### ML Service
- `packages/ml/app/main.py` - Main FastAPI app
- `packages/ml/app/api/recommend.py` - Recommendations
- `packages/ml/app/api/forecast.py` - Forecasting
- `packages/ml/app/api/chat.py` - Chatbot

---

## ⚙️ Environment Variables

### Backend (.env)
```bash
ML_BASE_URL=http://localhost:8000
REDIS_URL=redis://localhost:6380
DATABASE_URL=file:./prisma/dev.db
JWT_SECRET=your-secret-key
```

### Web (.env)
```bash
VITE_API_URL=http://localhost:8080/api
VITE_SOCKET_URL=http://localhost:8080
```

### Mobile (.env)
```bash
EXPO_PUBLIC_API_URL=http://192.168.1.100:8080/api
```

### ML Service (.env)
```bash
DATABASE_URL=file:../api/prisma/dev.db
MODEL_DIR=./models
VECTOR_INDEX_DIR=./vectors
ML_SERVICE_HOST=0.0.0.0
ML_SERVICE_PORT=8000
```

---

## 🔧 Troubleshooting

### ML Service Not Responding
```bash
# Check if running
curl http://localhost:8000/health

# Check Docker logs
docker-compose logs ml-service

# Restart service
docker-compose restart ml-service
```

### Backend Can't Connect to ML
```bash
# Verify ML_BASE_URL in .env
echo $ML_BASE_URL

# Test connection
curl http://localhost:8000/health

# Check Docker network
docker-compose ps
```

### No Recommendations
```bash
# Refresh ML index
curl -X POST http://localhost:8000/recommendations/refresh

# Check database has products
# Check user has interaction history
```

### Mobile Can't Connect
```bash
# Find your IP
ipconfig  # Windows
ifconfig  # Mac/Linux

# Update .env with your IP
EXPO_PUBLIC_API_URL=http://YOUR_IP:8080/api

# Restart Expo
pnpm start --clear
```

---

## 📊 Response Examples

### Recommendations
```json
{
  "userId": "user123",
  "count": 5,
  "items": [
    {
      "id": "prod1",
      "name": "Organic Tomatoes",
      "price": 50,
      "unit": "kg",
      "recommendationScore": 0.95,
      "category": { "name": "Vegetables" }
    }
  ],
  "method": "collaborative"
}
```

### Farmer Analytics
```json
{
  "totalRevenue": 125000,
  "totalOrders": 450,
  "totalProducts": 25,
  "averageRating": 4.7,
  "revenueTrend": [
    { "month": "2024-01", "revenue": 18000 }
  ]
}
```

### Price Optimization
```json
{
  "product_id": "prod123",
  "current_price": 50,
  "recommended_price": 55,
  "expected_revenue_increase": 12.5
}
```

---

## 🎯 Common Tasks

### Add New AI Feature
1. Add endpoint in `packages/ml/app/api/`
2. Add route in `packages/api/src/routes/ai.ts`
3. Add service function in `apps/web/src/lib/api/ai.ts`
4. Create UI component in `apps/web/src/components/`

### Update ML Model
1. Train new model in `packages/ml/training/`
2. Save model to `packages/ml/models/`
3. Update loader in ML service
4. Restart ML service

### Debug API Issue
1. Check backend logs: `docker-compose logs api`
2. Check ML logs: `docker-compose logs ml-service`
3. Test endpoint with curl
4. Verify authentication token

---

## 📱 Mobile Development

### Get Your Local IP
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig

# Look for IPv4 address (e.g., 192.168.1.100)
```

### Update Mobile Config
```bash
# Edit apps/mobile/.env
EXPO_PUBLIC_API_URL=http://192.168.1.100:8080/api

# Restart Expo
cd apps/mobile
pnpm start --clear
```

### Test on Device
1. Connect phone to same WiFi
2. Scan QR code from Expo
3. App should connect to API

---

## 🚀 Deployment Checklist

### Pre-deployment
- [ ] Test all endpoints locally
- [ ] Run integration tests
- [ ] Update environment variables
- [ ] Train models with production data
- [ ] Set up monitoring

### Production
- [ ] Deploy ML service
- [ ] Deploy backend API
- [ ] Deploy web app
- [ ] Update mobile app config
- [ ] Configure HTTPS
- [ ] Set up backups

---

## 📞 Quick Links

- **Full Guide**: `AI_INTEGRATION_COMPLETE_GUIDE.md`
- **Summary**: `AI_INTEGRATION_SUMMARY.md`
- **ML Docs**: `packages/ml/README.md`
- **Test Script**: `test-ai-integration.bat`

---

**Keep this card handy for quick reference!** 📌
