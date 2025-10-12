import axios from 'axios';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api';

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

export interface PriceOptimization {
  product_id: string;
  current_price: number;
  recommended_price: number;
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

export interface ChatResponse {
  query: string;
  answer: string;
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
  productId: string
): Promise<PriceOptimization> {
  const response = await axios.post(
    `${API_BASE}/ai/price-predict`,
    { productId },
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
 * Query AI chatbot
 */
export async function queryChatbot(query: string, userId?: string): Promise<ChatResponse> {
  const response = await axios.post(`${API_BASE}/ai/chat`, { query, userId });
  return response.data;
}

/**
 * Check ML service health
 */
export async function checkMLHealth(): Promise<{ status: string; timestamp: string }> {
  const response = await axios.get(`${API_BASE}/ai/health`);
  return response.data;
}
