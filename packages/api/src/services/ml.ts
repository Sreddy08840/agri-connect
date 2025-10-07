import { redis } from '../config/redis';

const ML_BASE = process.env.ML_BASE_URL || 'http://localhost:8000';

interface MLRecommendation {
  userId: number;
  items: Array<{ id: string; score: number }>;
}

export async function getRecommendationsFromML(userId: number, n = 10): Promise<MLRecommendation> {
  const cacheKey = `recs:user:${userId}:n:${n}`;
  
  // Try to get from cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch from ML service
  const res = await fetch(`${ML_BASE}/recommendations?userId=${userId}&n=${n}`);
  if (!res.ok) {
    throw new Error(`ML service error: ${res.status} ${res.statusText}`);
  }
  
  const data = await res.json() as MLRecommendation;
  
  // Cache for 1 hour
  await redis.set(cacheKey, JSON.stringify(data), 'EX', 3600);
  
  return data;
}

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
