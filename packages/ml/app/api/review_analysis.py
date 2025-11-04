"""Review analysis and moderation API endpoints."""
from fastapi import APIRouter, HTTPException, Body
from typing import Dict, List, Optional, Tuple
import numpy as np
from datetime import datetime, timedelta
import re
from collections import Counter

from ..db import db
from ..schemas import ReviewAnalysisRequest, ReviewAnalysisResponse

router = APIRouter(prefix="/reviews", tags=["review-analysis"])


class ReviewAnalyzer:
    """Analyze reviews for sentiment, quality, and fraud detection."""
    
    # Sentiment lexicon (simplified - in production, use VADER or TextBlob)
    POSITIVE_WORDS = {
        'excellent', 'amazing', 'great', 'good', 'best', 'love', 'perfect',
        'wonderful', 'fantastic', 'awesome', 'outstanding', 'superb', 'quality',
        'fresh', 'delicious', 'tasty', 'healthy', 'organic', 'recommend',
        'satisfied', 'happy', 'pleased', 'impressed', 'worth', 'value'
    }
    
    NEGATIVE_WORDS = {
        'bad', 'poor', 'worst', 'terrible', 'awful', 'horrible', 'disappointing',
        'disappointed', 'waste', 'useless', 'defective', 'broken', 'damaged',
        'rotten', 'spoiled', 'stale', 'expired', 'fake', 'fraud', 'scam',
        'unhappy', 'unsatisfied', 'regret', 'avoid', 'never', 'not recommend'
    }
    
    # Spam indicators
    SPAM_PATTERNS = [
        r'(https?://|www\.)',  # URLs
        r'(\+?\d{10,})',  # Phone numbers
        r'(whatsapp|telegram|contact me)',  # Contact requests
        r'(buy now|click here|limited offer)',  # Promotional language
        r'(.)\1{4,}',  # Repeated characters (aaaaa)
    ]
    
    def __init__(self):
        self.spam_regex = re.compile('|'.join(self.SPAM_PATTERNS), re.IGNORECASE)
    
    def analyze_sentiment(self, text: str) -> Dict[str, float]:
        """
        Analyze sentiment of review text.
        
        Returns:
            Dict with sentiment scores and classification
        """
        if not text:
            return {
                'sentiment': 'neutral',
                'positive_score': 0.0,
                'negative_score': 0.0,
                'confidence': 0.0
            }
        
        # Tokenize and clean
        words = re.findall(r'\b\w+\b', text.lower())
        
        # Count sentiment words
        positive_count = sum(1 for word in words if word in self.POSITIVE_WORDS)
        negative_count = sum(1 for word in words if word in self.NEGATIVE_WORDS)
        
        total_sentiment_words = positive_count + negative_count
        
        if total_sentiment_words == 0:
            return {
                'sentiment': 'neutral',
                'positive_score': 0.5,
                'negative_score': 0.5,
                'confidence': 0.3
            }
        
        # Calculate scores
        positive_score = positive_count / max(len(words), 1)
        negative_score = negative_count / max(len(words), 1)
        
        # Determine sentiment
        if positive_count > negative_count:
            sentiment = 'positive'
            confidence = positive_count / total_sentiment_words
        elif negative_count > positive_count:
            sentiment = 'negative'
            confidence = negative_count / total_sentiment_words
        else:
            sentiment = 'neutral'
            confidence = 0.5
        
        return {
            'sentiment': sentiment,
            'positive_score': min(positive_score * 10, 1.0),
            'negative_score': min(negative_score * 10, 1.0),
            'confidence': confidence
        }
    
    def detect_spam(self, text: str) -> Dict[str, any]:
        """
        Detect spam/promotional content in review.
        
        Returns:
            Dict with spam detection results
        """
        if not text:
            return {'is_spam': False, 'spam_score': 0.0, 'reasons': []}
        
        reasons = []
        spam_score = 0.0
        
        # Check for spam patterns
        if self.spam_regex.search(text):
            reasons.append('Contains suspicious links or contact info')
            spam_score += 0.4
        
        # Check for excessive capitalization
        caps_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)
        if caps_ratio > 0.5:
            reasons.append('Excessive capitalization')
            spam_score += 0.2
        
        # Check for repeated punctuation
        if re.search(r'[!?]{3,}', text):
            reasons.append('Excessive punctuation')
            spam_score += 0.1
        
        # Check for very short reviews (likely not helpful)
        if len(text.split()) < 5:
            reasons.append('Very short review')
            spam_score += 0.1
        
        # Check for generic/template language
        generic_phrases = ['good product', 'nice product', 'ok product', 'fine']
        if any(phrase in text.lower() for phrase in generic_phrases) and len(text.split()) < 10:
            reasons.append('Generic/template language')
            spam_score += 0.2
        
        return {
            'is_spam': spam_score >= 0.5,
            'spam_score': min(spam_score, 1.0),
            'reasons': reasons
        }
    
    def check_rating_text_mismatch(self, rating: int, text: str) -> Dict[str, any]:
        """
        Check if rating matches review text sentiment.
        
        Returns:
            Dict with mismatch detection results
        """
        sentiment_result = self.analyze_sentiment(text)
        
        # Expected sentiment based on rating
        if rating >= 4:
            expected_sentiment = 'positive'
        elif rating <= 2:
            expected_sentiment = 'negative'
        else:
            expected_sentiment = 'neutral'
        
        actual_sentiment = sentiment_result['sentiment']
        
        # Check for mismatch
        is_mismatch = False
        severity = 'none'
        
        if rating >= 4 and actual_sentiment == 'negative':
            is_mismatch = True
            severity = 'high'
        elif rating <= 2 and actual_sentiment == 'positive':
            is_mismatch = True
            severity = 'high'
        elif rating == 3 and actual_sentiment in ['positive', 'negative']:
            is_mismatch = True
            severity = 'low'
        
        return {
            'is_mismatch': is_mismatch,
            'severity': severity,
            'expected_sentiment': expected_sentiment,
            'actual_sentiment': actual_sentiment,
            'confidence': sentiment_result['confidence']
        }
    
    def calculate_quality_score(self, text: str, rating: int) -> float:
        """
        Calculate overall quality score for review.
        
        Returns:
            Quality score between 0 and 1
        """
        if not text:
            return 0.3
        
        score = 0.5  # Base score
        
        # Length factor (prefer detailed reviews)
        word_count = len(text.split())
        if word_count >= 20:
            score += 0.2
        elif word_count >= 10:
            score += 0.1
        elif word_count < 5:
            score -= 0.2
        
        # Sentiment analysis
        sentiment = self.analyze_sentiment(text)
        if sentiment['confidence'] > 0.7:
            score += 0.1
        
        # Check for spam
        spam_check = self.detect_spam(text)
        if spam_check['is_spam']:
            score -= 0.3
        
        # Check rating-text mismatch
        mismatch = self.check_rating_text_mismatch(rating, text)
        if mismatch['is_mismatch']:
            if mismatch['severity'] == 'high':
                score -= 0.3
            else:
                score -= 0.1
        
        # Check for specific details (numbers, measurements, etc.)
        if re.search(r'\d+', text):
            score += 0.05
        
        return max(0.0, min(1.0, score))
    
    def detect_fake_review(self, user_id: str, product_id: str, text: str, rating: int) -> Dict[str, any]:
        """
        Detect potentially fake or fraudulent reviews.
        
        Returns:
            Dict with fraud detection results
        """
        risk_score = 0.0
        risk_factors = []
        
        # Check spam
        spam_check = self.detect_spam(text)
        if spam_check['is_spam']:
            risk_score += 0.3
            risk_factors.extend(spam_check['reasons'])
        
        # Check rating-text mismatch
        mismatch = self.check_rating_text_mismatch(rating, text)
        if mismatch['is_mismatch'] and mismatch['severity'] == 'high':
            risk_score += 0.3
            risk_factors.append('Rating does not match review sentiment')
        
        # Check user review patterns
        try:
            user_reviews = db.get_user_reviews(user_id, days=30)
            
            if not user_reviews.empty:
                # Check for review bombing (many reviews in short time)
                if len(user_reviews) > 10:
                    risk_score += 0.2
                    risk_factors.append('Unusually high review frequency')
                
                # Check for consistent extreme ratings
                if len(user_reviews) >= 5:
                    avg_rating = user_reviews['rating'].mean()
                    if avg_rating >= 4.8 or avg_rating <= 1.5:
                        risk_score += 0.15
                        risk_factors.append('Consistently extreme ratings')
                
                # Check for similar text patterns
                if len(user_reviews) >= 3:
                    # Simple similarity check (in production, use proper text similarity)
                    texts = user_reviews['comment'].tolist()
                    if any(text.lower() in other.lower() or other.lower() in text.lower() 
                           for other in texts if other and other != text):
                        risk_score += 0.2
                        risk_factors.append('Similar text in multiple reviews')
        except Exception as e:
            print(f"Error checking user review patterns: {e}")
        
        # Determine risk level
        if risk_score >= 0.7:
            risk_level = 'high'
            recommendation = 'Flag for manual review'
        elif risk_score >= 0.4:
            risk_level = 'medium'
            recommendation = 'Monitor'
        else:
            risk_level = 'low'
            recommendation = 'Accept'
        
        return {
            'risk_score': min(risk_score, 1.0),
            'risk_level': risk_level,
            'risk_factors': risk_factors,
            'recommendation': recommendation
        }


# Initialize analyzer
analyzer = ReviewAnalyzer()


@router.post("/analyze", response_model=ReviewAnalysisResponse)
async def analyze_review(request: ReviewAnalysisRequest = Body(...)):
    """
    Analyze a review for sentiment, quality, and fraud detection.
    
    This endpoint provides comprehensive analysis including:
    - Sentiment analysis (positive/negative/neutral)
    - Spam detection
    - Rating-text mismatch detection
    - Quality scoring
    - Fake review detection
    """
    try:
        # Sentiment analysis
        sentiment = analyzer.analyze_sentiment(request.text)
        
        # Spam detection
        spam_check = analyzer.detect_spam(request.text)
        
        # Rating-text mismatch
        mismatch = analyzer.check_rating_text_mismatch(request.rating, request.text)
        
        # Quality score
        quality_score = analyzer.calculate_quality_score(request.text, request.rating)
        
        # Fake review detection
        fraud_check = analyzer.detect_fake_review(
            request.user_id,
            request.product_id,
            request.text,
            request.rating
        )
        
        # Overall recommendation
        should_approve = (
            not spam_check['is_spam'] and
            fraud_check['risk_level'] != 'high' and
            quality_score >= 0.3
        )
        
        return ReviewAnalysisResponse(
            sentiment=sentiment['sentiment'],
            sentiment_scores={
                'positive': sentiment['positive_score'],
                'negative': sentiment['negative_score'],
                'confidence': sentiment['confidence']
            },
            is_spam=spam_check['is_spam'],
            spam_score=spam_check['spam_score'],
            spam_reasons=spam_check['reasons'],
            quality_score=quality_score,
            rating_text_mismatch=mismatch['is_mismatch'],
            mismatch_severity=mismatch['severity'],
            fraud_risk_score=fraud_check['risk_score'],
            fraud_risk_level=fraud_check['risk_level'],
            fraud_risk_factors=fraud_check['risk_factors'],
            recommendation=fraud_check['recommendation'],
            should_approve=should_approve
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Review analysis failed: {str(e)}")


@router.get("/product/{product_id}/sentiment-summary")
async def get_product_sentiment_summary(product_id: str):
    """
    Get sentiment summary for all reviews of a product.
    """
    try:
        reviews = db.get_product_reviews(product_id)
        
        if reviews.empty:
            return {
                'product_id': product_id,
                'total_reviews': 0,
                'sentiment_distribution': {},
                'average_quality_score': 0.0
            }
        
        # Analyze each review
        sentiments = []
        quality_scores = []
        
        for _, review in reviews.iterrows():
            sentiment = analyzer.analyze_sentiment(review['comment'] or '')
            sentiments.append(sentiment['sentiment'])
            
            quality = analyzer.calculate_quality_score(
                review['comment'] or '',
                review['rating']
            )
            quality_scores.append(quality)
        
        # Calculate distribution
        sentiment_counts = Counter(sentiments)
        total = len(sentiments)
        
        return {
            'product_id': product_id,
            'total_reviews': total,
            'sentiment_distribution': {
                'positive': sentiment_counts.get('positive', 0) / total,
                'negative': sentiment_counts.get('negative', 0) / total,
                'neutral': sentiment_counts.get('neutral', 0) / total
            },
            'average_quality_score': np.mean(quality_scores) if quality_scores else 0.0,
            'rating_distribution': reviews['rating'].value_counts().to_dict()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get sentiment summary: {str(e)}")


@router.get("/user/{user_id}/review-patterns")
async def get_user_review_patterns(user_id: str):
    """
    Analyze user's review patterns for fraud detection.
    """
    try:
        reviews = db.get_user_reviews(user_id, days=90)
        
        if reviews.empty:
            return {
                'user_id': user_id,
                'total_reviews': 0,
                'risk_level': 'unknown'
            }
        
        # Calculate patterns
        total_reviews = len(reviews)
        avg_rating = reviews['rating'].mean()
        rating_std = reviews['rating'].std()
        
        # Check for suspicious patterns
        risk_score = 0.0
        patterns = []
        
        # High volume
        if total_reviews > 20:
            risk_score += 0.2
            patterns.append('High review volume')
        
        # Extreme ratings
        if avg_rating >= 4.8 or avg_rating <= 1.5:
            risk_score += 0.3
            patterns.append('Consistently extreme ratings')
        
        # Low variance (all similar ratings)
        if rating_std < 0.5 and total_reviews >= 5:
            risk_score += 0.2
            patterns.append('Low rating variance')
        
        # Determine risk level
        if risk_score >= 0.5:
            risk_level = 'high'
        elif risk_score >= 0.3:
            risk_level = 'medium'
        else:
            risk_level = 'low'
        
        return {
            'user_id': user_id,
            'total_reviews': total_reviews,
            'average_rating': float(avg_rating),
            'rating_std': float(rating_std),
            'risk_score': risk_score,
            'risk_level': risk_level,
            'suspicious_patterns': patterns,
            'review_frequency': total_reviews / 90  # reviews per day
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze user patterns: {str(e)}")
