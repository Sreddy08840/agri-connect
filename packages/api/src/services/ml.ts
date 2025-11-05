import { redis } from '../config/redis';

const ML_BASE = process.env.ML_BASE_URL || 'http://localhost:8000';

// Interfaces
interface MLRecommendation {
  user_id: string;
  items: Array<{ id: string; score: number }>;
  method: string;
}

interface ForecastPoint {
  date: string;
  predicted_demand: number;
  lower_bound?: number;
  upper_bound?: number;
}

interface ForecastResponse {
  product_id: string;
  forecast: ForecastPoint[];
  method: string;
  confidence?: number;
}

interface PricePoint {
  price: number;
  predicted_demand: number;
  predicted_revenue: number;
  confidence: number;
}

interface PriceOptimizationResponse {
  product_id: string;
  current_price: number;
  recommended_price: number;
  price_points: PricePoint[];
  expected_revenue_increase: number;
}

interface FraudScoreResponse {
  risk_score: number;
  risk_level: string;
  factors: string[];
  recommendation: string;
}

interface ChatResponse {
  query: string;
  answer: string;
  documents: Array<{
    id: string;
    text: string;
    score: number;
    metadata?: any;
  }>;
  confidence: number;
}

interface ReviewAnalysisRequest {
  user_id: string;
  product_id: string;
  text: string;
  rating: number;
}

interface ReviewAnalysisResponse {
  sentiment: string;
  sentiment_scores: {
    positive: number;
    negative: number;
    confidence: number;
  };
  is_spam: boolean;
  spam_score: number;
  spam_reasons: string[];
  quality_score: number;
  rating_text_mismatch: boolean;
  mismatch_severity: string;
  fraud_risk_score: number;
  fraud_risk_level: string;
  fraud_risk_factors: string[];
  recommendation: string;
  should_approve: boolean;
}

// Recommendations
export async function getRecommendationsFromML(userId: string, n = 10): Promise<MLRecommendation> {
  const cacheKey = `recs:user:${userId}:n:${n}`;
  
  // Try to get from cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch from ML service - using the correct endpoint
  const res = await fetch(`${ML_BASE}/recommendations?userId=${userId}&n=${n}`);
  if (!res.ok) {
    throw new Error(`ML service error: ${res.status} ${res.statusText}`);
  }
  
  const data: any = await res.json();
  
  // Transform to expected format
  const transformedData: MLRecommendation = {
    user_id: String(userId),
    items: data.items || [],
    method: 'content-based'
  };
  
  // Cache for 1 hour
  await redis.set(cacheKey, JSON.stringify(transformedData), 'EX', 3600);
  
  return transformedData;
}

export async function getSimilarProducts(productId: string, n = 10): Promise<MLRecommendation> {
  const cacheKey = `recs:product:${productId}:n:${n}`;
  
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // For now, return similar products using the same endpoint but with a dummy user
  // In a real implementation, you'd have a dedicated similar products endpoint
  const res = await fetch(`${ML_BASE}/recommendations?userId=1&n=${n}`);
  if (!res.ok) {
    throw new Error(`ML service error: ${res.status} ${res.statusText}`);
  }
  
  const data: any = await res.json();
  
  // Transform to expected format
  const transformedData: MLRecommendation = {
    user_id: String(productId),
    items: data.items || [],
    method: 'content-based'
  };
  
  await redis.set(cacheKey, JSON.stringify(transformedData), 'EX', 3600);
  
  return transformedData;
}

// Forecasting
export async function getForecast(productId: string, days = 30): Promise<ForecastResponse> {
  const cacheKey = `forecast:${productId}:${days}`;
  
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const res = await fetch(`${ML_BASE}/forecast/product/${productId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ days })
  });
  
  if (!res.ok) {
    throw new Error(`Forecast error: ${res.status} ${res.statusText}`);
  }
  
  const data = await res.json() as ForecastResponse;
  await redis.set(cacheKey, JSON.stringify(data), 'EX', 7200); // Cache for 2 hours
  
  return data;
}

// Price Optimization
export async function optimizePrice(
  productId: string,
  options?: { price_range_min?: number; price_range_max?: number; num_samples?: number }
): Promise<PriceOptimizationResponse> {
  const res = await fetch(`${ML_BASE}/price-optimize/product/${productId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options || {})
  });
  
  if (!res.ok) {
    throw new Error(`Price optimization error: ${res.status} ${res.statusText}`);
  }
  
  return await res.json() as PriceOptimizationResponse;
}

// Fraud Detection
export async function scoreFraud(transaction: {
  user_id: string;
  amount: number;
  payment_method: string;
  num_items: number;
  avg_item_price: number;
  max_item_price: number;
  hour_of_day?: number;
  day_of_week?: number;
}): Promise<FraudScoreResponse> {
  const res = await fetch(`${ML_BASE}/fraud/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transaction)
  });
  
  if (!res.ok) {
    throw new Error(`Fraud detection error: ${res.status} ${res.statusText}`);
  }
  
  return await res.json() as FraudScoreResponse;
}

// Chatbot
export async function queryChatbot(query: string, userId?: string): Promise<ChatResponse> {
  const res = await fetch(`${ML_BASE}/chat/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, user_id: userId })
  });
  
  if (!res.ok) {
    throw new Error(`Chat error: ${res.status} ${res.statusText}`);
  }
  
  return await res.json() as ChatResponse;
}

// Review Analysis
export async function analyzeReview(review: ReviewAnalysisRequest): Promise<ReviewAnalysisResponse> {
  const res = await fetch(`${ML_BASE}/reviews/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(review)
  });
  
  if (!res.ok) {
    throw new Error(`Review analysis error: ${res.status} ${res.statusText}`);
  }
  
  return await res.json() as ReviewAnalysisResponse;
}

export async function getProductSentimentSummary(productId: string): Promise<any> {
  const res = await fetch(`${ML_BASE}/reviews/product/${productId}/sentiment-summary`);
  
  if (!res.ok) {
    throw new Error(`Sentiment summary error: ${res.status} ${res.statusText}`);
  }
  
  return await res.json();
}

export async function getUserReviewPatterns(userId: string): Promise<any> {
  const res = await fetch(`${ML_BASE}/reviews/user/${userId}/review-patterns`);
  
  if (!res.ok) {
    throw new Error(`User review patterns error: ${res.status} ${res.statusText}`);
  }
  
  return await res.json();
}

// Utility functions
export async function refreshMLIndex(): Promise<boolean> {
  try {
    const res = await fetch(`${ML_BASE}/refresh`, { method: 'POST' });
    if (!res.ok) {
      throw new Error(`ML refresh failed: ${res.status}`);
    }
    return true;
  } catch (error) {
    console.error('Failed to refresh ML index:', error);
    return false;
  }
}

export async function refreshChatIndex(): Promise<boolean> {
  try {
    const res = await fetch(`${ML_BASE}/chat/refresh-index`, { method: 'POST' });
    if (!res.ok) {
      throw new Error(`Chat index refresh failed: ${res.status}`);
    }
    return true;
  } catch (error) {
    console.error('Failed to refresh chat index:', error);
    return false;
  }
}

export async function checkMLHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${ML_BASE}/health`);
    return res.ok;
  } catch (error) {
    console.error('ML service health check failed:', error);
    return false;
  }
}
