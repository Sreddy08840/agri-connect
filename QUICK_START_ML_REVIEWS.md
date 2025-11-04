# Quick Start: ML-Powered Review System

## What Was Implemented

Your Agri-Connect platform now has a **fully functional ML/AI-powered review analysis system** that automatically:

✅ **Detects fake reviews** - Identifies suspicious patterns and fraud  
✅ **Analyzes sentiment** - Determines if reviews are positive, negative, or neutral  
✅ **Filters spam** - Catches promotional content and low-quality reviews  
✅ **Scores quality** - Rates review helpfulness and detail  
✅ **Auto-moderates** - Flags problematic reviews for manual review  

## Files Created/Modified

### New Files
1. **`packages/ml/app/api/review_analysis.py`** - ML review analysis engine
2. **`ML_REVIEW_SYSTEM.md`** - Complete documentation

### Modified Files
1. **`packages/ml/app/schemas.py`** - Added review analysis schemas
2. **`packages/ml/app/main.py`** - Integrated review analysis router
3. **`packages/ml/app/db.py`** - Added review database methods
4. **`packages/api/src/services/ml.ts`** - Added review analysis service functions
5. **`packages/api/src/routes/reviews.ts`** - Integrated ML analysis into review submission
6. **`packages/api/prisma/schema.prisma`** - Added `status` and `mlAnalysis` fields

## How to Run

### Step 1: Update Database Schema
```bash
cd packages/api
npx prisma migrate dev --name add_review_ml_fields
npx prisma generate
```

### Step 2: Start ML Service
```bash
cd packages/ml
python -m app.main
```

The ML service will start at `http://localhost:8000`

### Step 3: Start API Server
```bash
cd packages/api
npm run dev
```

### Step 4: Test the System

#### Test 1: Submit a Good Review
```bash
curl -X POST http://localhost:3000/api/reviews/products/PRODUCT_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "comment": "Excellent product! The vegetables were fresh, organic, and delivered on time. Highly recommend!"
  }'
```

**Expected Result**: Status = `APPROVED`, Quality Score > 0.7

#### Test 2: Submit a Suspicious Review
```bash
curl -X POST http://localhost:3000/api/reviews/products/PRODUCT_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "comment": "Terrible product, waste of money!!!"
  }'
```

**Expected Result**: Status = `FLAGGED` (rating-text mismatch)

#### Test 3: Get Sentiment Summary
```bash
curl http://localhost:3000/api/reviews/products/PRODUCT_ID/sentiment
```

## What Happens When You Submit a Review

```
User submits review
       ↓
Purchase verified ✓
       ↓
ML Analysis runs:
  • Sentiment: positive/negative/neutral
  • Spam check: URLs, caps, generic text
  • Quality score: 0.0 - 1.0
  • Fraud risk: low/medium/high
       ↓
Status determined:
  • APPROVED (auto-published)
  • PENDING (needs review)
  • FLAGGED (suspicious)
       ↓
Saved to database with ML results
       ↓
User gets feedback message
```

## Key Features

### 1. Sentiment Analysis
Detects if review text matches the rating:
- 5 stars + positive text = ✅ Good
- 5 stars + negative text = ⚠️ Flagged
- Provides confidence scores

### 2. Spam Detection
Catches:
- URLs and phone numbers
- ALL CAPS TEXT
- Excessive punctuation!!!
- Generic phrases ("good product")

### 3. Fake Review Detection
Monitors:
- Review frequency (bombing)
- Consistent extreme ratings
- Similar text patterns
- User behavior anomalies

### 4. Quality Scoring
Considers:
- Review length and detail
- Sentiment confidence
- Specific information (numbers, measurements)
- Overall helpfulness

## API Endpoints

### Submit Review (with ML)
```
POST /api/reviews/products/:productId
```

### Get Sentiment Summary
```
GET /api/reviews/products/:productId/sentiment
```

### Get User Patterns
```
GET /api/reviews/users/:userId/patterns
```

### Direct ML Analysis
```
POST http://localhost:8000/reviews/analyze
```

## Example Response

When a user submits a review, they get:

```json
{
  "review": {
    "id": "abc123",
    "rating": 5,
    "comment": "Great product!",
    "status": "APPROVED"
  },
  "mlAnalysis": {
    "sentiment": "positive",
    "quality_score": 0.85,
    "fraud_risk_level": "low",
    "status": "APPROVED",
    "message": "Your review has been posted successfully!"
  }
}
```

## Monitoring

Check ML service health:
```bash
curl http://localhost:8000/health
```

View available endpoints:
```bash
curl http://localhost:8000/
```

## Troubleshooting

### ML Service Won't Start
```bash
cd packages/ml
pip install -r requirements.txt
py -m app.main
```

### Database Migration Issues
```bash
cd packages/api
npx prisma migrate reset
npx prisma migrate dev
npx prisma generate
```

### Reviews Not Being Analyzed
- Check `ML_BASE_URL` in `.env` file
- Verify ML service is running on port 8000
- Check API logs for errors
- System gracefully degrades if ML service is down

## What's Different Now

### Before
- Reviews were accepted without validation
- No spam or fraud detection
- No sentiment analysis
- Manual moderation only

### After
- ✅ Automatic ML analysis on every review
- ✅ Spam and fraud detection
- ✅ Sentiment analysis with confidence scores
- ✅ Quality scoring
- ✅ Auto-moderation (APPROVED/PENDING/FLAGGED)
- ✅ Detailed analytics and insights
- ✅ User feedback on submission

## Next Steps

1. **Run the database migration** to add new fields
2. **Start the ML service** to enable analysis
3. **Test with real reviews** to see it in action
4. **Monitor the results** via API endpoints
5. **Adjust thresholds** if needed in `review_analysis.py`

## Need Help?

- 📖 Full documentation: `ML_REVIEW_SYSTEM.md`
- 🔍 Check logs in `packages/api/logs/` and `packages/ml/logs/`
- 🏥 Health check: `http://localhost:8000/health`
- 📊 API docs: `http://localhost:8000/docs`

---

**Status**: ✅ Ready to Use  
**Version**: 1.0.0  
**Last Updated**: November 2025
