import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Submit or update a farmer rating
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { farmerId, rating, comment } = req.body;
    const userId = req.user!.userId;

    // Validate inputs
    if (!farmerId) {
      return res.status(400).json({ error: 'Farmer ID is required' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if farmer exists
    const farmer = await prisma.farmerProfile.findUnique({
      where: { id: farmerId }
    });

    if (!farmer) {
      return res.status(404).json({ error: 'Farmer not found' });
    }

    // Check if user has purchased from this farmer
    const hasPurchased = await prisma.order.findFirst({
      where: {
        customerId: userId,
        farmerId: farmerId,
        status: 'DELIVERED'
      }
    });

    if (!hasPurchased) {
      return res.status(403).json({ 
        error: 'You can only rate farmers you have purchased from' 
      });
    }

    // Create or update rating
    const farmerRating = await prisma.farmerRating.upsert({
      where: {
        farmerId_userId: {
          farmerId,
          userId
        }
      },
      create: {
        farmerId,
        userId,
        rating,
        comment: comment?.trim() || null
      },
      update: {
        rating,
        comment: comment?.trim() || null,
        updatedAt: new Date()
      }
    });

    // Recalculate farmer's average rating
    const ratings = await prisma.farmerRating.findMany({
      where: { farmerId },
      select: { rating: true }
    });

    const avgRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;

    // Update farmer profile with new average
    await prisma.farmerProfile.update({
      where: { id: farmerId },
      data: { ratingAvg: avgRating }
    });

    res.json({
      rating: farmerRating,
      message: 'Rating submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting farmer rating:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

// Get ratings for a farmer
router.get('/farmer/:farmerId', async (req, res) => {
  try {
    const { farmerId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [ratings, total] = await Promise.all([
      prisma.farmerRating.findMany({
        where: { farmerId },
        include: {
          // Note: We don't have User relation in FarmerRating model yet
          // We'll need to fetch user info separately or add the relation
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.farmerRating.count({ where: { farmerId } })
    ]);

    // Fetch user info for each rating
    const ratingsWithUsers = await Promise.all(
      ratings.map(async (rating) => {
        const user = await prisma.user.findUnique({
          where: { id: rating.userId },
          select: { id: true, name: true, avatarUrl: true }
        });
        return {
          ...rating,
          user
        };
      })
    );

    res.json({
      ratings: ratingsWithUsers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching farmer ratings:', error);
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
});

// Get current user's rating for a farmer
router.get('/farmer/:farmerId/my-rating', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { farmerId } = req.params;
    const userId = req.user!.userId;

    const rating = await prisma.farmerRating.findUnique({
      where: {
        farmerId_userId: {
          farmerId,
          userId
        }
      }
    });

    res.json({ rating });
  } catch (error) {
    console.error('Error fetching user rating:', error);
    res.status(500).json({ error: 'Failed to fetch rating' });
  }
});

export default router;
