# Commands to Run ML Review System

## Step-by-Step Setup

### 1️⃣ Database Migration (REQUIRED)

Open terminal in project root:

```powershell
cd packages\api
npx prisma migrate dev --name add_review_ml_fields
npx prisma generate
```

**What this does**: Adds `status` and `mlAnalysis` fields to ProductReview table

---

### 2️⃣ Start ML Service (Terminal 1)

```powershell
cd packages\ml
python -m app.main
```

**Expected output**:
```
============================================================
Starting Agri-Connect ML Service
============================================================
Database: mysql://...
Model directory: ./models
Vector index directory: ./vector_index
============================================================
Loading models...
✓ Recommendation models initialized
✓ Chatbot models initialized
✓ Fraud detection models initialized
✓ Review analysis initialized
============================================================
Service ready at http://0.0.0.0:8000
API docs at http://0.0.0.0:8000/docs
============================================================
```

**Verify it's running**:
```powershell
curl http://localhost:8000/health
```

---

### 3️⃣ Start API Service (Terminal 2)

```powershell
cd packages\api
npm run dev
```

**Expected output**:
```
Server running on http://localhost:3000
ML Service connected at http://localhost:8000
```

---

### 4️⃣ Test the System

#### Test 1: Check ML Service Health
```powershell
curl http://localhost:8000/
```

Should return:
```json
{
  "service": "Agri-Connect ML Service",
  "version": "1.0.0",
  "status": "running",
  "endpoints": {
    "review_analysis": "/reviews/analyze"
  }
}
```

#### Test 2: Direct ML Analysis
```powershell
curl -X POST http://localhost:8000/reviews/analyze `
  -H "Content-Type: application/json" `
  -d '{\"user_id\":\"test123\",\"product_id\":\"prod456\",\"text\":\"Great product! Fresh and organic.\",\"rating\":5}'
```

Should return ML analysis with sentiment, quality score, etc.

#### Test 3: Submit Review via API
```powershell
# Replace YOUR_TOKEN and PRODUCT_ID with actual values
curl -X POST http://localhost:3000/api/reviews/products/PRODUCT_ID `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{\"rating\":5,\"comment\":\"Excellent product! Very fresh and delivered on time.\"}'
```

Should return review with ML analysis results.

---

## Quick Verification Checklist

✅ Database migration completed  
✅ ML service running on port 8000  
✅ API service running on port 3000  
✅ Health check returns "healthy"  
✅ Test review submission works  
✅ ML analysis appears in response  

---

## Troubleshooting

### Problem: ML Service Won't Start

**Solution 1**: Install dependencies
```powershell
cd packages\ml
pip install -r requirements.txt
python -m app.main
```

**Solution 2**: Check Python version
```powershell
python --version  # Should be 3.8+
```

**Solution 3**: Check port availability
```powershell
netstat -ano | findstr :8000
# If port is in use, kill the process or change port in config
```

---

### Problem: Database Migration Fails

**Solution 1**: Reset and retry
```powershell
cd packages\api
npx prisma migrate reset
npx prisma migrate dev
npx prisma generate
```

**Solution 2**: Check database connection
```powershell
# Verify DATABASE_URL in .env file
# Test connection:
npx prisma db pull
```

---

### Problem: Reviews Not Being Analyzed

**Check 1**: ML service is running
```powershell
curl http://localhost:8000/health
```

**Check 2**: Environment variable is set
```
# In packages/api/.env
ML_BASE_URL=http://localhost:8000
```

**Check 3**: Check API logs
```powershell
# Look for "ML analysis failed" messages in console
```

**Note**: System will still work if ML service is down (graceful degradation)

---

### Problem: "Module not found" Error

**Solution**: Install dependencies
```powershell
# For ML service
cd packages\ml
pip install fastapi uvicorn pandas numpy scikit-learn sqlalchemy pymysql

# For API service
cd packages\api
npm install
```

---

## Development Workflow

### Normal Operation (2 terminals)

**Terminal 1 - ML Service**:
```powershell
cd packages\ml
python -m app.main
```

**Terminal 2 - API Service**:
```powershell
cd packages\api
npm run dev
```

### Testing Changes

**After modifying ML code**:
```powershell
# Restart ML service (Ctrl+C then restart)
cd packages\ml
python -m app.main
```

**After modifying API code**:
```powershell
# API auto-reloads with nodemon
# Or manually restart:
cd packages\api
npm run dev
```

**After modifying schema**:
```powershell
cd packages\api
npx prisma migrate dev
npx prisma generate
# Restart API service
```

---

## Monitoring Commands

### Check ML Service Status
```powershell
curl http://localhost:8000/health
```

### View API Docs
Open browser: `http://localhost:8000/docs`

### Check Review Stats
```powershell
# Get sentiment summary for a product
curl http://localhost:3000/api/reviews/products/PRODUCT_ID/sentiment

# Get user review patterns
curl http://localhost:3000/api/reviews/users/USER_ID/patterns `
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Database Queries
```powershell
cd packages\api
npx prisma studio
# Opens GUI at http://localhost:5555
```

---

## Production Deployment

### Environment Variables

**packages/api/.env**:
```env
ML_BASE_URL=http://ml-service:8000  # Update for production
DATABASE_URL=your_production_db_url
```

**packages/ml/.env**:
```env
DATABASE_URL=your_production_db_url
ML_SERVICE_HOST=0.0.0.0
ML_SERVICE_PORT=8000
```

### Docker Commands (if using Docker)

```bash
# Build ML service
docker build -t agri-ml-service ./packages/ml

# Run ML service
docker run -p 8000:8000 agri-ml-service

# Build API service
docker build -t agri-api-service ./packages/api

# Run API service
docker run -p 3000:3000 agri-api-service
```

---

## Testing Scenarios

### Scenario 1: Good Review (Should be APPROVED)
```powershell
curl -X POST http://localhost:3000/api/reviews/products/PRODUCT_ID `
  -H "Authorization: Bearer TOKEN" `
  -H "Content-Type: application/json" `
  -d '{\"rating\":5,\"comment\":\"Excellent organic vegetables! Fresh, delivered on time, and great quality. The tomatoes were especially good and lasted a week.\"}'
```

### Scenario 2: Suspicious Review (Should be FLAGGED)
```powershell
curl -X POST http://localhost:3000/api/reviews/products/PRODUCT_ID `
  -H "Authorization: Bearer TOKEN" `
  -H "Content-Type: application/json" `
  -d '{\"rating\":5,\"comment\":\"Terrible waste of money!!!\"}'
```

### Scenario 3: Spam Review (Should be FLAGGED)
```powershell
curl -X POST http://localhost:3000/api/reviews/products/PRODUCT_ID `
  -H "Authorization: Bearer TOKEN" `
  -H "Content-Type: application/json" `
  -d '{\"rating\":5,\"comment\":\"BEST PRODUCT!!! CALL 9876543210 www.spam.com\"}'
```

### Scenario 4: Short Review (Lower Quality Score)
```powershell
curl -X POST http://localhost:3000/api/reviews/products/PRODUCT_ID `
  -H "Authorization: Bearer TOKEN" `
  -H "Content-Type: application/json" `
  -d '{\"rating\":4,\"comment\":\"good\"}'
```

---

## Logs Location

### ML Service Logs
- Console output (stdout)
- Check terminal where ML service is running

### API Service Logs
- Console output (stdout)
- Check terminal where API service is running

### Database Logs
- Check your database server logs
- Use Prisma Studio for visual inspection

---

## Performance Monitoring

### Check Response Times
```powershell
# Measure ML analysis time
Measure-Command { curl http://localhost:8000/reviews/analyze -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"user_id":"test","product_id":"test","text":"test","rating":5}' }
```

### Monitor Resource Usage
```powershell
# Check Python process
Get-Process python | Select-Object CPU,WorkingSet

# Check Node process
Get-Process node | Select-Object CPU,WorkingSet
```

---

## Success Indicators

When everything is working correctly, you should see:

✅ ML service responds to health checks  
✅ API service connects to ML service  
✅ Reviews get analyzed automatically  
✅ Status field shows APPROVED/PENDING/FLAGGED  
✅ mlAnalysis field contains JSON data  
✅ Users receive feedback messages  
✅ Sentiment endpoints return data  

---

## Need Help?

1. **Check logs** in both terminals
2. **Verify services** are running on correct ports
3. **Test endpoints** individually
4. **Review documentation** in ML_REVIEW_SYSTEM.md
5. **Check environment variables** in .env files

---

**Ready to go! 🚀**

Start with Step 1 (Database Migration) and work through each step in order.
