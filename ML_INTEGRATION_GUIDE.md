# ML Recommendations - Integration Guide

## ✅ What's Been Implemented

### 1. ML Service (Python/FastAPI)
**Location**: `packages/ml/`

- Content-based recommendation engine using TF-IDF and cosine similarity
- SQLite database integration
- Two endpoints:
  - `GET /recommendations?userId={id}&n={count}` - Get recommendations
  - `POST /refresh` - Reload product index

### 2. API Integration (Node.js/Express)
**Location**: `packages/api/src/`

**New Files Created:**
- `src/services/ml.ts` - ML service wrapper with Redis caching
- `src/routes/recommendations.ts` - API endpoints for recommendations

**Modified Files:**
- `src/index.ts` - Added recommendations route
- `.env.example` - Added ML_BASE_URL configuration

### 3. Features

#### Redis Caching
- Recommendations cached for 1 hour per user
- Reduces load on ML service
- Falls back to in-memory cache if Redis unavailable

#### Error Handling
- Graceful fallback if ML service is down
- Returns empty recommendations instead of error
- Proper validation of user IDs

#### Product Details
- Fetches full product information from database
- Includes category and farmer details
- Maintains ML service's recommendation order
- Adds recommendation scores to products

## 🚀 Getting Started

### Step 1: Start ML Service

```bash
cd packages/ml
python -m uvicorn main:app --reload --port 8000
```

The service will:
- Connect to SQLite database at `../api/prisma/dev.db`
- Load all APPROVED products
- Build TF-IDF index
- Start listening on http://localhost:8000

### Step 2: Start API Server

```bash
cd packages/api
npm run dev
```

The API will:
- Connect to the same SQLite database
- Use in-memory Redis (or real Redis if configured)
- Mount recommendations endpoint at `/api/recommendations`

### Step 3: Test the Integration

```bash
cd packages/api
node test-recommendations.js
```

Or manually:
```bash
# Get recommendations
curl "http://localhost:8080/api/recommendations?userId=1&n=5"

# Refresh ML index
curl -X POST "http://localhost:8080/api/recommendations/refresh"
```

## 📡 API Endpoints

### GET /api/recommendations

Get personalized product recommendations for a user.

**Query Parameters:**
- `userId` (required) - User ID to get recommendations for
- `n` (optional, default=10) - Number of recommendations to return

**Response:**
```json
{
  "userId": 1,
  "count": 5,
  "items": [
    {
      "id": "clx123...",
      "name": "Organic Tomatoes",
      "description": "Fresh organic tomatoes",
      "price": 50,
      "unit": "kg",
      "stock": 100,
      "images": "[\"url1.jpg\"]",
      "status": "APPROVED",
      "recommendationScore": 0.85,
      "category": {
        "id": "cat123",
        "name": "Vegetables",
        "slug": "vegetables"
      },
      "farmer": {
        "id": "user123",
        "name": "John Farmer",
        "phone": "+1234567890"
      }
    }
  ]
}
```

**Error Responses:**
- `400` - Invalid userId parameter
- `500` - Internal server error

**Fallback Behavior:**
- If ML service is unavailable, returns empty array with error message
- If user has no viewing history, returns newest products

### POST /api/recommendations/refresh

Refresh the ML service's product index.

**Response:**
```json
{
  "status": "refreshed",
  "message": "ML index refreshed successfully"
}
```

**When to Call:**
- After bulk product updates
- After product approvals
- Periodically (e.g., daily cron job)

## 🔧 Configuration

### Environment Variables

Add to `packages/api/.env`:

```bash
# ML Service URL
ML_BASE_URL=http://localhost:8000

# Redis (optional, falls back to in-memory)
REDIS_URL=redis://localhost:6379
```

### Production Deployment

1. **Deploy ML Service**
   ```bash
   cd packages/ml
   docker build -t agri-ml-service .
   docker run -p 8000:8000 -e DATABASE_URL="..." agri-ml-service
   ```

2. **Update API Environment**
   ```bash
   ML_BASE_URL=https://ml-service.yourdomain.com
   ```

3. **Enable Real Redis**
   ```bash
   USE_REDIS=true
   REDIS_URL=redis://your-redis-host:6379
   ```

## 💡 Usage Examples

### Frontend Integration (React)

```javascript
// Fetch recommendations for current user
async function getRecommendations(userId) {
  const response = await fetch(
    `${API_BASE}/api/recommendations?userId=${userId}&n=10`
  );
  return await response.json();
}

// Display in component
function RecommendedProducts() {
  const [recommendations, setRecommendations] = useState([]);
  
  useEffect(() => {
    getRecommendations(currentUser.id)
      .then(data => setRecommendations(data.items));
  }, [currentUser.id]);
  
  return (
    <div>
      <h2>Recommended for You</h2>
      {recommendations.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### Admin Panel - Refresh Index

```javascript
async function refreshRecommendations() {
  await fetch(`${API_BASE}/api/recommendations/refresh`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  alert('Recommendations index refreshed!');
}
```

## 🎯 How It Works

### Recommendation Flow

1. **User views a product** → Event tracked in database
2. **User requests recommendations** → API receives request
3. **Check cache** → Redis checked for cached results
4. **Call ML service** → If not cached, fetch from ML service
5. **ML service logic**:
   - Finds user's last viewed product
   - Calculates similarity with all products using TF-IDF
   - Returns top N most similar products
6. **Enrich with details** → API fetches full product info from DB
7. **Cache results** → Store in Redis for 1 hour
8. **Return to client** → Send enriched recommendations

### Caching Strategy

- **Cache Key**: `recs:user:{userId}:n:{count}`
- **TTL**: 3600 seconds (1 hour)
- **Invalidation**: Automatic expiry or manual refresh

### Fallback Strategy

1. If ML service down → Return empty array
2. If user has no history → ML returns newest products
3. If product not found → Filter out from results

## 🧪 Testing Checklist

- [ ] ML service starts without errors
- [ ] API server connects to ML service
- [ ] Recommendations endpoint returns data
- [ ] Caching works (second request faster)
- [ ] Refresh endpoint works
- [ ] Error handling for invalid userId
- [ ] Graceful fallback when ML service down
- [ ] Product details included in response

## 📊 Monitoring

### Health Checks

```bash
# ML service health
curl http://localhost:8000/docs

# API health
curl http://localhost:8080/health
```

### Logs to Monitor

- ML service startup: "Application startup complete"
- Cache hits: Check Redis logs
- ML service errors: API logs "ML service unavailable"

## 🔄 Maintenance

### Daily Tasks
- Monitor ML service uptime
- Check cache hit rates

### Weekly Tasks
- Review recommendation quality
- Check for stale cache entries

### After Product Updates
- Call `/api/recommendations/refresh`
- Clear user recommendation caches if needed

## 🚀 Next Steps

### Immediate
1. Start both services
2. Run test script
3. Integrate into frontend

### Future Enhancements
- [ ] Collaborative filtering (user-user similarity)
- [ ] Track recommendation clicks
- [ ] A/B testing framework
- [ ] Real-time model updates
- [ ] Personalized ranking with user features
- [ ] Multi-modal recommendations (images + text)

## 📝 Notes

- **Database**: Both services use same SQLite database
- **No Schema Changes**: Works with existing database structure
- **Independent Services**: ML service can run separately
- **Graceful Degradation**: System works even if ML service is down

---

**Status**: ✅ Fully implemented and ready for testing!
