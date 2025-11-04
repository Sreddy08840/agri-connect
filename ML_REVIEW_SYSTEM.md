# ML-Powered Review System

## Overview

The Agri-Connect platform now includes a comprehensive ML/AI-powered review analysis system that automatically detects fake reviews, spam, sentiment, and quality issues.

## Features

### 1. **Sentiment Analysis**
- Automatically analyzes review text to determine sentiment (positive, negative, neutral)
- Provides confidence scores for sentiment classification
- Detects sentiment-rating mismatches (e.g., 5-star rating with negative text)

### 2. **Spam Detection**
- Identifies promotional content and spam patterns
- Detects:
  - URLs and contact information
  - Excessive capitalization
  - Repeated punctuation
  - Generic/template language
  - Very short or low-quality reviews

### 3. **Fake Review Detection**
- Analyzes user review patterns for suspicious behavior
- Flags:
  - Review bombing (many reviews in short time)
  - Consistently extreme ratings
  - Similar text across multiple reviews
  - Rating-text mismatches

### 4. **Quality Scoring**
- Calculates overall quality score (0-1) for each review
- Considers:
  - Review length and detail
  - Sentiment confidence
  - Spam indicators
  - Rating-text alignment

### 5. **Automatic Moderation**
- Reviews are automatically categorized as:
  - **APPROVED**: High-quality, legitimate reviews (auto-published)
  - **PENDING**: Medium-risk reviews (require manual review)
  - **FLAGGED**: High-risk reviews (require immediate attention)

## Architecture

### ML Service (`packages/ml/app/api/review_analysis.py`)
- **ReviewAnalyzer Class**: Core analysis engine
  - `analyze_sentiment()`: Sentiment classification
  - `detect_spam()`: Spam pattern detection
  - `check_rating_text_mismatch()`: Consistency validation
  - `calculate_quality_score()`: Quality assessment
  - `detect_fake_review()`: Fraud detection

### API Integration (`packages/api/src/routes/reviews.ts`)
- Review submission automatically triggers ML analysis
- Results stored in database for audit trail
- User receives feedback based on analysis

### Database Schema
```prisma
model ProductReview {
  id          String   @id @default(cuid())
  productId   String
  userId      String
  orderId     String?
  rating      Int
  comment     String?
  images      String?
  status      String   @default("APPROVED") // APPROVED, PENDING, FLAGGED
  mlAnalysis  String?  // JSON string of ML analysis results
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## API Endpoints

### 1. Submit Review (with ML Analysis)
```
POST /api/reviews/products/:productId
Authorization: Bearer <token>

Request Body:
{
  "rating": 5,
  "comment": "Great product! Fresh and organic.",
  "images": ["url1", "url2"]
}

Response:
{
  "review": { ... },
  "mlAnalysis": {
    "sentiment": "positive",
    "quality_score": 0.85,
    "fraud_risk_level": "low",
    "status": "APPROVED",
    "message": "Your review has been posted successfully!"
  }
}
```

### 2. Get Product Sentiment Summary
```
GET /api/reviews/products/:productId/sentiment

Response:
{
  "product_id": "abc123",
  "total_reviews": 50,
  "sentiment_distribution": {
    "positive": 0.70,
    "negative": 0.15,
    "neutral": 0.15
  },
  "average_quality_score": 0.75,
  "rating_distribution": {
    "5": 30,
    "4": 12,
    "3": 5,
    "2": 2,
    "1": 1
  }
}
```

### 3. Get User Review Patterns
```
GET /api/reviews/users/:userId/patterns
Authorization: Bearer <token>

Response:
{
  "user_id": "user123",
  "total_reviews": 15,
  "average_rating": 4.2,
  "rating_std": 0.8,
  "risk_score": 0.2,
  "risk_level": "low",
  "suspicious_patterns": [],
  "review_frequency": 0.16
}
```

### 4. ML Service Direct Analysis
```
POST http://localhost:8000/reviews/analyze

Request Body:
{
  "user_id": "user123",
  "product_id": "prod456",
  "text": "This is an amazing product!",
  "rating": 5
}

Response:
{
  "sentiment": "positive",
  "sentiment_scores": {
    "positive": 0.9,
    "negative": 0.1,
    "confidence": 0.85
  },
  "is_spam": false,
  "spam_score": 0.1,
  "spam_reasons": [],
  "quality_score": 0.75,
  "rating_text_mismatch": false,
  "mismatch_severity": "none",
  "fraud_risk_score": 0.15,
  "fraud_risk_level": "low",
  "fraud_risk_factors": [],
  "recommendation": "Accept",
  "should_approve": true
}
```

## Setup Instructions

### 1. Database Migration
Run the Prisma migration to add new fields:
```bash
cd packages/api
npx prisma migrate dev --name add_review_ml_fields
npx prisma generate
```

### 2. Start ML Service
```bash
cd packages/ml
python -m app.main
```

The ML service will be available at `http://localhost:8000`

### 3. Environment Variables
Ensure the following is set in your `.env`:
```
ML_BASE_URL=http://localhost:8000
```

## How It Works

### Review Submission Flow

1. **User submits review** → API receives request
2. **Purchase verification** → Check if user bought the product
3. **ML Analysis** → Send review to ML service for analysis
4. **Status determination**:
   - High fraud risk OR spam → `FLAGGED`
   - Medium fraud risk OR low quality → `PENDING`
   - Otherwise → `APPROVED`
5. **Database storage** → Save review with ML analysis results
6. **User feedback** → Return status and message to user

### Sentiment Analysis Algorithm

Uses a lexicon-based approach with positive/negative word dictionaries:
- Counts sentiment words in review text
- Calculates positive/negative scores
- Determines overall sentiment with confidence

### Fraud Detection Algorithm

Multi-factor analysis:
- **Spam patterns**: URLs, phone numbers, promotional language
- **User behavior**: Review frequency, rating patterns
- **Text quality**: Length, detail, consistency
- **Rating alignment**: Sentiment vs. rating match

## Benefits

### For Users
- ✅ Trustworthy reviews from verified purchasers
- ✅ High-quality, detailed reviews prioritized
- ✅ Spam and fake reviews filtered out
- ✅ Transparent feedback on review submission

### For Platform
- ✅ Automated moderation reduces manual work
- ✅ Maintains review quality and trust
- ✅ Detects fraud patterns early
- ✅ Analytics on sentiment trends
- ✅ Audit trail for all reviews

### For Farmers/Sellers
- ✅ Genuine feedback from real customers
- ✅ Sentiment analysis for product improvement
- ✅ Protection from review manipulation
- ✅ Better understanding of customer satisfaction

## Future Enhancements

### Planned Features
1. **Advanced NLP Models**
   - BERT/RoBERTa for better sentiment analysis
   - Named Entity Recognition for product mentions
   - Aspect-based sentiment analysis

2. **Review Helpfulness**
   - User voting on review helpfulness
   - ML model to predict helpful reviews
   - Rank reviews by helpfulness score

3. **Image Analysis**
   - Verify review images match product
   - Detect stock photos or duplicates
   - Extract text from images (OCR)

4. **Multilingual Support**
   - Support for multiple languages
   - Cross-language sentiment analysis
   - Translation for international users

5. **Real-time Monitoring**
   - Dashboard for review trends
   - Alerts for suspicious activity
   - Automated reports for admins

## Testing

### Manual Testing
1. Submit a legitimate 5-star review with detailed text
   - Expected: `APPROVED` status
2. Submit a 5-star review with negative text
   - Expected: `FLAGGED` or `PENDING` status
3. Submit a very short review (e.g., "good")
   - Expected: Lower quality score
4. Submit multiple reviews quickly
   - Expected: Fraud risk increases

### Automated Testing
```bash
# Test ML service
cd packages/ml
pytest tests/

# Test API integration
cd packages/api
npm test
```

## Monitoring

### Key Metrics to Track
- Review approval rate (APPROVED vs PENDING vs FLAGGED)
- Average quality scores
- Sentiment distribution by product
- Fraud detection accuracy
- False positive rate

### Logs
- All ML analyses are logged with timestamps
- Review status changes tracked in database
- User patterns monitored for anomalies

## Troubleshooting

### ML Service Not Running
```bash
# Check if service is running
curl http://localhost:8000/health

# Restart service
cd packages/ml
python -m app.main
```

### Reviews Not Being Analyzed
- Check ML_BASE_URL environment variable
- Verify ML service is accessible
- Check API logs for errors
- Reviews will still be saved if ML service fails (graceful degradation)

### High False Positive Rate
- Adjust thresholds in `review_analysis.py`
- Expand positive/negative word dictionaries
- Fine-tune quality score calculation

## Support

For issues or questions:
1. Check logs in `packages/api/logs/` and `packages/ml/logs/`
2. Review ML service health: `GET http://localhost:8000/health`
3. Test individual components with provided endpoints
4. Contact development team for assistance

---

**Version**: 1.0.0  
**Last Updated**: November 2025  
**Status**: Production Ready ✅
