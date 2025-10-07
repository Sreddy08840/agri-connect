import express from 'express';
import { PrismaClient } from '@prisma/client';
import { getRecommendationsFromML, refreshMLIndex } from '../services/ml';

const prisma = new PrismaClient();
const router = express.Router();

// GET /api/recommendations - Get personalized product recommendations
router.get('/', async (req, res) => {
  try {
    const userId = Number(req.query.userId);
    const n = Number(req.query.n || 10);

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid userId parameter' });
    }

    // Get recommendations from ML service
    const mlRes = await getRecommendationsFromML(userId, n);
    
    // mlRes.items -> [{id, score}, ...]
    const productIds = mlRes.items.map((it: any) => it.id);

    if (productIds.length === 0) {
      return res.json({ userId, items: [] });
    }

    // Fetch full product details from database
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        status: 'APPROVED',
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        farmer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    // Keep original order from ML service and add scores
    const productsOrdered = productIds
      .map((id: string) => {
        const product = products.find((p) => p.id === id);
        if (!product) return null;
        const mlItem = mlRes.items.find((it) => it.id === id);
        return {
          ...product,
          recommendationScore: mlItem?.score || 0,
        };
      })
      .filter(Boolean); // Remove null entries

    res.json({
      userId,
      count: productsOrdered.length,
      items: productsOrdered,
    });
  } catch (err) {
    console.error('Recommendations error:', err);
    
    // If ML service is down, return empty recommendations
    if (err instanceof Error && err.message.includes('ML service')) {
      return res.json({
        userId: Number(req.query.userId),
        items: [],
        error: 'ML service unavailable',
      });
    }
    
    res.status(500).json({ error: 'internal_error' });
  }
});

// POST /api/recommendations/refresh - Refresh ML index
router.post('/refresh', async (req, res) => {
  try {
    const success = await refreshMLIndex();
    
    if (success) {
      res.json({ status: 'refreshed', message: 'ML index refreshed successfully' });
    } else {
      res.status(500).json({ error: 'Failed to refresh ML index' });
    }
  } catch (err) {
    console.error('ML refresh error:', err);
    res.status(500).json({ error: 'internal_error' });
  }
});

export default router;
