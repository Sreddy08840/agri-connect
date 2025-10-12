import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import {
  getRecommendationsFromML,
  getSimilarProducts,
  getForecast,
  optimizePrice,
  scoreFraud,
  queryChatbot,
  refreshMLIndex,
  refreshChatIndex,
  checkMLHealth
} from '../services/ml';

const prisma = new PrismaClient();
const router = express.Router();

// ============ RECOMMENDATIONS ============

/**
 * GET /api/ai/recommendations
 * Get personalized product recommendations for a user
 */
router.get('/recommendations', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    const n = Number(req.query.n || 10);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get recommendations from ML service
    const mlRes = await getRecommendationsFromML(String(userId), n);
    
    // Get product IDs
    const productIds = mlRes.items.map((it: any) => it.id);

    if (productIds.length === 0) {
      return res.json({ 
        userId, 
        items: [],
        method: mlRes.method || 'content-based'
      });
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
      .filter(Boolean);

    res.json({
      userId,
      count: productsOrdered.length,
      items: productsOrdered,
      method: mlRes.method || 'content-based'
    });
  } catch (err) {
    console.error('Recommendations error:', err);
    
    if (err instanceof Error && err.message.includes('ML service')) {
      return res.json({
        userId: req.user?.userId,
        items: [],
        error: 'ML service unavailable',
      });
    }
    
    res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * GET /api/ai/recommendations/similar/:productId
 * Get similar products based on a product ID
 */
router.get('/recommendations/similar/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const n = Number(req.query.n || 10);

    // Get similar products from ML service
    const mlRes = await getSimilarProducts(productId, n);
    
    const productIds = mlRes.items.map((it: any) => it.id);

    if (productIds.length === 0) {
      return res.json({ 
        productId, 
        items: [],
        method: mlRes.method || 'content-based'
      });
    }

    // Fetch full product details
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

    const productsOrdered = productIds
      .map((id: string) => {
        const product = products.find((p) => p.id === id);
        if (!product) return null;
        const mlItem = mlRes.items.find((it) => it.id === id);
        return {
          ...product,
          similarityScore: mlItem?.score || 0,
        };
      })
      .filter(Boolean);

    res.json({
      productId,
      count: productsOrdered.length,
      items: productsOrdered,
      method: mlRes.method || 'content-based'
    });
  } catch (err) {
    console.error('Similar products error:', err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// ============ PRICE PREDICTION ============

/**
 * POST /api/ai/price-predict
 * Predict optimal price for a product
 */
router.post('/price-predict', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { productId, priceRangeMin, priceRangeMax, numSamples } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'productId is required' });
    }

    // Check if user owns this product (farmers only)
    if (req.user?.role === 'FARMER') {
      const product = await prisma.product.findFirst({
        where: {
          id: productId,
          farmerId: req.user.userId,
        },
      });

      if (!product) {
        return res.status(403).json({ error: 'You can only predict prices for your own products' });
      }
    }

    // Get price optimization from ML service
    const optimization = await optimizePrice(productId, {
      price_range_min: priceRangeMin,
      price_range_max: priceRangeMax,
      num_samples: numSamples,
    });

    res.json(optimization);
  } catch (err) {
    console.error('Price prediction error:', err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// ============ SALES FORECASTING ============

/**
 * POST /api/ai/sales-forecast
 * Forecast sales for a product
 */
router.post('/sales-forecast', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { productId, days } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'productId is required' });
    }

    // Check if user owns this product (farmers only)
    if (req.user?.role === 'FARMER') {
      const product = await prisma.product.findFirst({
        where: {
          id: productId,
          farmerId: req.user.userId,
        },
      });

      if (!product) {
        return res.status(403).json({ error: 'You can only forecast sales for your own products' });
      }
    }

    // Get forecast from ML service
    const forecast = await getForecast(productId, days || 30);

    res.json(forecast);
  } catch (err) {
    console.error('Sales forecast error:', err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// ============ FARMER ANALYTICS ============

/**
 * GET /api/ai/analytics/farmer
 * Get farmer performance analytics
 */
router.get('/analytics/farmer', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId || req.user?.role !== 'FARMER') {
      return res.status(403).json({ error: 'Only farmers can access this endpoint' });
    }

    // Get farmer's products
    const products = await prisma.product.findMany({
      where: { farmerId: userId },
      select: { id: true },
    });

    const productIds = products.map(p => p.id);

    // Get orders for farmer's products
    const orders = await prisma.order.findMany({
      where: {
        items: {
          some: {
            productId: { in: productIds },
          },
        },
        status: { in: ['DELIVERED', 'COMPLETED'] },
      },
      include: {
        items: {
          where: {
            productId: { in: productIds },
          },
        },
      },
    });

    // Calculate analytics
    const totalRevenue = orders.reduce((sum, order) => {
      const farmerItems = order.items.filter(item => productIds.includes(item.productId));
      return sum + farmerItems.reduce((itemSum, item) => itemSum + item.unitPrice * item.qty, 0);
    }, 0);

    const totalOrders = orders.length;
    const totalProducts = products.length;

    // Get average rating
    const reviews = await prisma.productReview.findMany({
      where: {
        productId: { in: productIds },
      },
      select: {
        rating: true,
      },
    });

    const averageRating = reviews.length > 0
      ? reviews.reduce((sum: number, r) => sum + r.rating, 0) / reviews.length
      : 0;

    // Get revenue trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentOrders = await prisma.order.findMany({
      where: {
        items: {
          some: {
            productId: { in: productIds },
          },
        },
        status: { in: ['DELIVERED', 'COMPLETED'] },
        createdAt: { gte: sixMonthsAgo },
      },
      include: {
        items: {
          where: {
            productId: { in: productIds },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by month
    const monthlyRevenue: { [key: string]: number } = {};
    recentOrders.forEach(order => {
      const month = order.createdAt.toISOString().slice(0, 7); // YYYY-MM
      const revenue = order.items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + revenue;
    });

    const revenueTrend = Object.entries(monthlyRevenue).map(([month, revenue]) => ({
      month,
      revenue,
    }));

    res.json({
      totalRevenue,
      totalOrders,
      totalProducts,
      averageRating: parseFloat(averageRating.toFixed(2)),
      revenueTrend,
    });
  } catch (err) {
    console.error('Farmer analytics error:', err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// ============ CUSTOMER INSIGHTS ============

/**
 * GET /api/ai/analytics/customer
 * Get customer insights dashboard
 */
router.get('/analytics/customer', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get top-selling categories
    const categoryStats = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        qty: true,
      },
      orderBy: {
        _sum: {
          qty: 'desc',
        },
      },
      take: 10,
    });

    const productIds = categoryStats.map(stat => stat.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const topSellingProducts = categoryStats.map(stat => {
      const product = products.find(p => p.id === stat.productId);
      return {
        productId: stat.productId,
        productName: product?.name || 'Unknown',
        category: product?.category?.name || 'Unknown',
        totalSold: stat._sum.qty || 0,
      };
    });

    // Get customer spending habits
    const customerStats = await prisma.order.groupBy({
      by: ['customerId'],
      _sum: {
        total: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          total: 'desc',
        },
      },
      take: 10,
    });

    const topCustomers = customerStats.map(stat => ({
      userId: stat.customerId,
      totalSpent: stat._sum.total || 0,
      orderCount: stat._count.id,
    }));

    // Get seasonal demand (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: twelveMonthsAgo },
        status: { in: ['DELIVERED', 'COMPLETED'] },
      },
      select: {
        createdAt: true,
        total: true,
      },
    });

    const seasonalDemand: { [key: string]: { orders: number; revenue: number } } = {};
    monthlyOrders.forEach(order => {
      const month = order.createdAt.toISOString().slice(0, 7);
      if (!seasonalDemand[month]) {
        seasonalDemand[month] = { orders: 0, revenue: 0 };
      }
      seasonalDemand[month].orders++;
      seasonalDemand[month].revenue += order.total;
    });

    const seasonalTrend = Object.entries(seasonalDemand).map(([month, data]) => ({
      month,
      orders: data.orders,
      revenue: data.revenue,
    }));

    res.json({
      topSellingProducts,
      topCustomers,
      seasonalTrend,
    });
  } catch (err) {
    console.error('Customer insights error:', err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// ============ FRAUD DETECTION ============

/**
 * POST /api/ai/fraud-check
 * Check transaction for fraud risk
 */
router.post('/fraud-check', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' });
    }

    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Prepare transaction data for fraud detection
    const avgItemPrice = order.items.reduce((sum, item) => sum + item.unitPrice, 0) / order.items.length;
    const maxItemPrice = Math.max(...order.items.map(item => item.unitPrice));

    const transactionData = {
      user_id: order.customerId,
      amount: order.total,
      payment_method: order.paymentMethod || 'UNKNOWN',
      num_items: order.items.length,
      avg_item_price: avgItemPrice,
      max_item_price: maxItemPrice,
      hour_of_day: order.createdAt.getHours(),
      day_of_week: order.createdAt.getDay(),
    };

    // Get fraud score from ML service
    const fraudScore = await scoreFraud(transactionData);

    res.json({
      orderId,
      ...fraudScore,
    });
  } catch (err) {
    console.error('Fraud check error:', err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// ============ AI CHATBOT ============

/**
 * POST /api/ai/chat
 * Query the AI chatbot
 */
router.post('/chat', async (req, res) => {
  try {
    const { query, userId } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }

    // Query chatbot
    const response = await queryChatbot(query, userId);

    res.json(response);
  } catch (err) {
    console.error('Chatbot error:', err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// ============ UTILITY ENDPOINTS ============

/**
 * POST /api/ai/refresh
 * Refresh ML models and indexes
 */
router.post('/refresh', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const mlRefresh = await refreshMLIndex();
    const chatRefresh = await refreshChatIndex();

    res.json({
      status: 'refreshed',
      mlIndex: mlRefresh ? 'success' : 'failed',
      chatIndex: chatRefresh ? 'success' : 'failed',
    });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * GET /api/ai/health
 * Check ML service health
 */
router.get('/health', async (req, res) => {
  try {
    const isHealthy = await checkMLHealth();

    res.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Health check error:', err);
    res.status(500).json({ 
      status: 'error',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
