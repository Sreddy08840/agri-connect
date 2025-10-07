# ML Recommendation Service - Quick Start

## 🚀 Setup & Run Instructions

### Prerequisites
- Python 3.11+
- SQLite database (or PostgreSQL)
- Redis (optional, falls back to in-memory)

### 1. Install Dependencies

```bash
cd packages/ml
pip install -r requirements.txt
```

### 2. Environment Variables

Create `.env` file or set environment variables:

```bash
# Database (defaults to SQLite)
DATABASE_URL=file:../api/prisma/dev.db

# Optional: PostgreSQL
# DATABASE_URL=postgresql://user:password@localhost:5432/agriconnect

# ML Service Configuration
ML_SERVICE_PORT=8000
ML_SERVICE_HOST=0.0.0.0

# Redis (optional)
REDIS_URL=redis://localhost:6379
```

### 3. Start Services

**Terminal 1 - Start Database (if using Docker):**
```bash
docker-compose up postgres redis -d
```

**Terminal 2 - Start API Server:**
```bash
cd packages/api
npm run dev
# API runs on http://localhost:8080
```

**Terminal 3 - Start ML Service:**
```bash
cd packages/ml
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Application startup complete.
```

## 🧪 Testing Endpoints

### 1. Health Check

```bash
# Check if service is running
curl http://localhost:8000/docs
```

Opens interactive API documentation (Swagger UI).

### 2. Get Recommendations

**Basic Request:**
```bash
curl "http://localhost:8000/recommendations?userId=1&n=5"
```

**Expected Response:**
```json
{
  "userId": 1,
  "items": [
    {"id": "clx123...", "score": 0.85},
    {"id": "clx456...", "score": 0.72},
    {"id": "clx789...", "score": 0.68}
  ]
}
```

**PowerShell (Windows):**
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/recommendations?userId=1&n=5"
```

### 3. Refresh Product Index

**Bash/Linux/Mac:**
```bash
curl -X POST http://localhost:8000/refresh
```

**PowerShell (Windows):**
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/refresh" -Method POST
```

**Expected Response:**
```json
{
  "status": "refreshed"
}
```

### 4. Train Model (Future)

```bash
curl -X POST http://localhost:8000/train
```

**Note:** Training endpoint is planned for future implementation.

## 🔧 API Integration Testing

Test the full API integration (requires API server running):

```bash
cd packages/api
node test-recommendations.js
```

**Or test individual endpoints:**

```bash
# Get recommendations through API
curl "http://localhost:8080/api/recommendations?userId=1&n=5"

# Refresh ML index through API
curl -X POST "http://localhost:8080/api/recommendations/refresh"
```

## 📊 Verification Checklist

- [ ] ML service starts without errors
- [ ] Database connection successful
- [ ] Products loaded into memory
- [ ] TF-IDF matrix built
- [ ] `/recommendations` endpoint returns data
- [ ] `/refresh` endpoint works
- [ ] API integration works
- [ ] Caching is functional

## 🐛 Troubleshooting

### Service won't start

**Check database path:**
```bash
python test_service.py
```

**Common issues:**
- Database file not found → Check `DATABASE_URL` path
- No products in database → Run seed script: `npm run db:seed`
- Port already in use → Change port or kill existing process

### No recommendations returned

**Check events table:**
```sql
SELECT COUNT(*) FROM events WHERE type = 'view';
```

**Solutions:**
- Run backfill script: `npm run backfill:events`
- Create test events manually
- Check user has viewing history

### Empty product list

**Verify products exist:**
```bash
python -c "from sqlalchemy import create_engine, text; engine = create_engine('sqlite:///../api/prisma/dev.db'); conn = engine.connect(); result = conn.execute(text('SELECT COUNT(*) FROM products WHERE status=\"APPROVED\"')); print(f'Approved products: {result.fetchone()[0]}')"
```

**Solutions:**
- Approve products in admin panel
- Run seed script with products
- Check product status in database

## 📝 Quick Commands Reference

### Start Services
```bash
# ML Service
cd packages/ml && python -m uvicorn main:app --reload --port 8000

# API Server
cd packages/api && npm run dev

# Both in background (Linux/Mac)
cd packages/ml && python -m uvicorn main:app --port 8000 &
cd packages/api && npm run dev &
```

### Test Endpoints
```bash
# Direct ML service
curl "http://localhost:8000/recommendations?userId=1&n=5"
curl -X POST "http://localhost:8000/refresh"

# Through API (with caching)
curl "http://localhost:8080/api/recommendations?userId=1&n=5"
curl -X POST "http://localhost:8080/api/recommendations/refresh"
```

### Database Operations
```bash
# Backfill events from orders
cd packages/api && npm run backfill:events

# Seed database
cd packages/api && npm run db:seed

# Open Prisma Studio
cd packages/api && npm run db:studio
```

## 🔄 Development Workflow

1. **Make changes to `main.py`**
2. **Service auto-reloads** (if using `--reload` flag)
3. **Test changes:**
   ```bash
   curl "http://localhost:8000/recommendations?userId=1&n=5"
   ```
4. **Refresh index if needed:**
   ```bash
   curl -X POST "http://localhost:8000/refresh"
   ```

## 📈 Performance Tips

### Caching
- Recommendations cached for 1 hour in Redis
- Check cache hit rate in Redis logs
- Clear cache: `redis-cli FLUSHDB` (if using Redis)

### Optimization
- Increase `max_features` in TF-IDF for better accuracy
- Add more product text (descriptions, tags)
- Implement collaborative filtering
- Use GPU for larger datasets

## 🚀 Production Deployment

### Docker
```bash
# Build image
docker build -t agri-ml-service .

# Run container
docker run -p 8000:8000 \
  -e DATABASE_URL="file:./prisma/dev.db" \
  -v /path/to/db:/app/prisma \
  agri-ml-service
```

### Environment Variables (Production)
```bash
DATABASE_URL=postgresql://user:pass@db-host:5432/agriconnect
ML_SERVICE_HOST=0.0.0.0
ML_SERVICE_PORT=8000
REDIS_URL=redis://redis-host:6379
```

### Health Monitoring
```bash
# Check service health
curl http://your-domain.com:8000/docs

# Monitor logs
tail -f /var/log/ml-service.log
```

## 📚 Additional Resources

- **API Documentation:** http://localhost:8000/docs (when running)
- **Integration Guide:** `../ML_INTEGRATION_GUIDE.md`
- **Quick Start:** `QUICKSTART.md`
- **Main README:** `README.md`

## 🎯 Next Steps

1. ✅ Service is running
2. ✅ Tests are passing
3. 🔄 Integrate with frontend
4. 📊 Monitor recommendation quality
5. 🚀 Deploy to production

---

**Status:** ✅ ML Recommendation Service is fully operational!

For questions or issues, check the troubleshooting section or review the integration guide.
