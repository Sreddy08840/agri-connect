import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get reviews for a product
router.get('/products/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = '10', offset = '0' } = req.query;

    const reviews = await prisma.productReview.findMany({
      where: { productId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.productReview.count({
      where: { productId },
    });

    res.json({ reviews, total });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Get user's review for a product
router.get('/products/:productId/my-review', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user!.userId;

    const review = await prisma.productReview.findUnique({
      where: {
        productId_userId: {
          productId,
          userId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.json({ review });
  } catch (error) {
    console.error('Error fetching user review:', error);
    res.status(500).json({ error: 'Failed to fetch review' });
  }
});

// Check if user can review a product (has purchased it)
router.get('/products/:productId/can-review', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user!.userId;

    // Check if user has purchased this product
    const purchase = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          customerId: userId,
          status: 'DELIVERED', // Only delivered orders
        },
      },
    });

    // Check if user already reviewed
    const existingReview = await prisma.productReview.findUnique({
      where: {
        productId_userId: {
          productId,
          userId,
        },
      },
    });

    res.json({
      canReview: !!purchase && !existingReview,
      hasPurchased: !!purchase,
      hasReviewed: !!existingReview,
    });
  } catch (error) {
    console.error('Error checking review eligibility:', error);
    res.status(500).json({ error: 'Failed to check review eligibility' });
  }
});

// Create or update a review
router.post('/products/:productId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user!.userId;
    const { rating, comment, images } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if user has purchased this product
    const purchase = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          customerId: userId,
          status: 'DELIVERED',
        },
      },
      include: {
        order: true,
      },
    });

    if (!purchase) {
      return res.status(403).json({ error: 'You can only review products you have purchased and received' });
    }

    // Create or update review
    const review = await prisma.productReview.upsert({
      where: {
        productId_userId: {
          productId,
          userId,
        },
      },
      update: {
        rating,
        comment,
        images: images ? JSON.stringify(images) : null,
        updatedAt: new Date(),
      },
      create: {
        productId,
        userId,
        orderId: purchase.orderId,
        rating,
        comment,
        images: images ? JSON.stringify(images) : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Update product's average rating
    const stats = await prisma.productReview.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.product.update({
      where: { id: productId },
      data: {
        ratingAvg: stats._avg.rating || 0,
        ratingCount: stats._count.rating || 0,
      },
    });

    res.json({ review });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// Delete a review
router.delete('/:reviewId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user!.userId;

    // Check if review exists and belongs to user
    const review = await prisma.productReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review.userId !== userId && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'You can only delete your own reviews' });
    }

    const productId = review.productId;

    // Delete review
    await prisma.productReview.delete({
      where: { id: reviewId },
    });

    // Update product's average rating
    const stats = await prisma.productReview.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.product.update({
      where: { id: productId },
      data: {
        ratingAvg: stats._avg.rating || 0,
        ratingCount: stats._count.rating || 0,
      },
    });

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

export default router;
