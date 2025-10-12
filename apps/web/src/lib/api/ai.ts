import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export interface RecommendationItem {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  images: string[];
  category: {
    id: string;
    name: string;
    slug: string;
  };
  farmer: {
    id: string;
    name: string;
    phone: string;
  };
  recommendationScore: number;
}

export interface PricePoint {
  price: number;
  predicted_demand: number;
  predicted_revenue: number;
  confidence: number;
}

export interface PriceOptimization {
  product_id: string;
  current_price: number;
  recommended_price: number;
  price_points: PricePoint[];
  expected_revenue_increase: number;
}

export interface ForecastPoint {
  date: string;
  predicted_demand: number;
  lower_bound?: number;
  upper_bound?: number;
}

export interface SalesForecast {
  product_id: string;
  forecast: ForecastPoint[];
  method: string;
  confidence?: number;
}

export interface FarmerAnalytics {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  averageRating: number;
  revenueTrend: Array<{
    month: string;
    revenue: number;
  }>;
}

export interface CustomerInsights {
  topSellingProducts: Array<{
    productId: string;
    productName: string;
    category: string;
    totalSold: number;
  }>;
  topCustomers: Array<{
    userId: string;
    totalSpent: number;
    orderCount: number;
  }>;
  seasonalTrend: Array<{
    month: string;
    orders: number;
    revenue: number;
  }>;
}

export interface FraudScore {
  orderId: string;
  risk_score: number;
  risk_level: string;
  factors: string[];
  recommendation: string;
}

export interface ChatResponse {
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

/**
 * Get personalized product recommendations
 */
export async function getRecommendations(token: string, n: number = 10): Promise<RecommendationItem[]> {
  const response = await axios.get(`${API_BASE}/ai/recommendations`, {
    params: { n },
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.items;
}

/**
 * Get similar products
 */
export async function getSimilarProducts(productId: string, n: number = 10): Promise<RecommendationItem[]> {
  const response = await axios.get(`${API_BASE}/ai/recommendations/similar/${productId}`, {
    params: { n },
  });
  return response.data.items;
}

/**
 * Predict optimal price for a product
 */
export async function predictPrice(
  token: string,
  productId: string,
  options?: {
    priceRangeMin?: number;
    priceRangeMax?: number;
    numSamples?: number;
  }
): Promise<PriceOptimization> {
  const response = await axios.post(
    `${API_BASE}/ai/price-predict`,
    { productId, ...options },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}

/**
 * Forecast sales for a product
 */
export async function forecastSales(
  token: string,
  productId: string,
  days: number = 30
): Promise<SalesForecast> {
  const response = await axios.post(
    `${API_BASE}/ai/sales-forecast`,
    { productId, days },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}

/**
 * Get farmer analytics
 */
export async function getFarmerAnalytics(token: string): Promise<FarmerAnalytics> {
  const response = await axios.get(`${API_BASE}/ai/analytics/farmer`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

/**
 * Get customer insights (Admin only)
 */
export async function getCustomerInsights(token: string): Promise<CustomerInsights> {
  const response = await axios.get(`${API_BASE}/ai/analytics/customer`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

/**
 * Check fraud risk for an order
 */
export async function checkFraud(token: string, orderId: string): Promise<FraudScore> {
  const response = await axios.post(
    `${API_BASE}/ai/fraud-check`,
    { orderId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}

/**
 * Query AI chatbot
 */
export async function queryChatbot(query: string, userId?: string): Promise<ChatResponse> {
  const response = await axios.post(`${API_BASE}/ai/chat`, { query, userId });
  return response.data;
}

/**
 * Refresh ML models and indexes (Admin only)
 */
export async function refreshMLModels(token: string): Promise<{ status: string; mlIndex: string; chatIndex: string }> {
  const response = await axios.post(
    `${API_BASE}/ai/refresh`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}

/**
 * Check ML service health
 */
export async function checkMLHealth(): Promise<{ status: string; timestamp: string }> {
  const response = await axios.get(`${API_BASE}/ai/health`);
  return response.data;
}
