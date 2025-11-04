import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { analyzeReview, getProductSentimentSummary, getUserReviewPatterns } from '../services/ml';

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

    // Analyze review with ML (if comment provided)
    let mlAnalysis = null;
    let reviewStatus = 'APPROVED'; // Default status
    
    if (comment && comment.trim().length > 0) {
      try {
        mlAnalysis = await analyzeReview({
          user_id: userId,
          product_id: productId,
          text: comment,
          rating: rating
        });
        
        // Determine review status based on ML analysis
        if (mlAnalysis.fraud_risk_level === 'high' || mlAnalysis.is_spam) {
          reviewStatus = 'FLAGGED'; // Flag for manual review
        } else if (mlAnalysis.fraud_risk_level === 'medium' || mlAnalysis.quality_score < 0.3) {
          reviewStatus = 'PENDING'; // Needs review
        }
        
        console.log('ML Review Analysis:', {
          sentiment: mlAnalysis.sentiment,
          quality_score: mlAnalysis.quality_score,
          fraud_risk_level: mlAnalysis.fraud_risk_level,
          should_approve: mlAnalysis.should_approve,
          status: reviewStatus
        });
      } catch (mlError) {
        console.error('ML analysis failed, proceeding without it:', mlError);
        // Continue without ML analysis if service is unavailable
      }
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
        status: reviewStatus,
        mlAnalysis: mlAnalysis ? JSON.stringify(mlAnalysis) : null,
        updatedAt: new Date(),
      },
      create: {
        productId,
        userId,
        orderId: purchase.orderId,
        rating,
        comment,
        images: images ? JSON.stringify(images) : null,
        status: reviewStatus,
        mlAnalysis: mlAnalysis ? JSON.stringify(mlAnalysis) : null,
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

    res.json({ 
      review,
      mlAnalysis: mlAnalysis ? {
        sentiment: mlAnalysis.sentiment,
        quality_score: mlAnalysis.quality_score,
        fraud_risk_level: mlAnalysis.fraud_risk_level,
        status: reviewStatus,
        message: reviewStatus === 'FLAGGED' 
          ? 'Your review has been flagged for manual review due to quality concerns.'
          : reviewStatus === 'PENDING'
          ? 'Your review is pending approval.'
          : 'Your review has been posted successfully!'
      } : null
    });
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

// Get sentiment summary for a product
router.get('/products/:productId/sentiment', async (req, res) => {
  try {
    const { productId } = req.params;
    
    const summary = await getProductSentimentSummary(productId);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching sentiment summary:', error);
    res.status(500).json({ error: 'Failed to fetch sentiment summary' });
  }
});

// Get user review patterns (for fraud detection)
router.get('/users/:userId/patterns', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    
    // Only allow users to see their own patterns or admins
    if (req.user!.userId !== userId && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const patterns = await getUserReviewPatterns(userId);
    res.json(patterns);
  } catch (error) {
    console.error('Error fetching user review patterns:', error);
    res.status(500).json({ error: 'Failed to fetch review patterns' });
  }
});

export default router;
