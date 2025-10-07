import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

const createClaimSchema = z.object({
  orderId: z.string(),
  issueDescription: z.string().min(10).max(1000),
  photos: z.array(z.string().url()).optional(),
});

const updateClaimSchema = z.object({
  status: z.enum(['PENDING', 'IN_REVIEW', 'RESOLVED', 'REJECTED']),
  resolutionNotes: z.string().optional(),
});

// Create warranty claim
router.post('/claim', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { orderId, issueDescription, photos } = createClaimSchema.parse(req.body);
    const customerId = req.user!.userId;

    // Verify order belongs to customer
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.customerId !== customerId) {
      return res.status(403).json({ error: 'Not authorized to claim warranty for this order' });
    }

    // Check if claim already exists for this order
    const existingClaim = await prisma.warrantyClaim.findFirst({
      where: { orderId },
    });

    if (existingClaim) {
      return res.status(400).json({ error: 'Warranty claim already exists for this order' });
    }

    const claim = await prisma.warrantyClaim.create({
      data: {
        orderId,
        customerId,
        issueDescription,
        photos: photos ? JSON.stringify(photos) : null,
      },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json(claim);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    console.error('Create warranty claim error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all warranty claims for current user
router.get('/claims', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;

    let claims;

    if (role === 'CUSTOMER') {
      claims = await prisma.warrantyClaim.findMany({
        where: { customerId: userId },
        include: {
          order: {
            include: {
              items: {
                include: {
                  product: true,
                },
              },
            },
          },
          resolver: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (role === 'FARMER') {
      // Get claims for orders that belong to this farmer
      claims = await prisma.warrantyClaim.findMany({
        where: {
          order: {
            farmerId: userId,
          },
        },
        include: {
          order: {
            include: {
              items: {
                include: {
                  product: true,
                },
              },
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          resolver: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Admin can see all claims
      claims = await prisma.warrantyClaim.findMany({
        include: {
          order: {
            include: {
              items: {
                include: {
                  product: true,
                },
              },
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          resolver: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    res.json(claims);
  } catch (error) {
    console.error('Get warranty claims error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single warranty claim
router.get('/claims/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const role = req.user!.role;

    const claim = await prisma.warrantyClaim.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        resolver: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!claim) {
      return res.status(404).json({ error: 'Warranty claim not found' });
    }

    // Check authorization
    if (role === 'CUSTOMER' && claim.customerId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (role === 'FARMER' && claim.order.farmerId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(claim);
  } catch (error) {
    console.error('Get warranty claim error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update warranty claim status (Farmer/Admin only)
router.patch('/claims/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { status, resolutionNotes } = updateClaimSchema.parse(req.body);
    const userId = req.user!.userId;
    const role = req.user!.role;

    if (role === 'CUSTOMER') {
      return res.status(403).json({ error: 'Customers cannot update warranty status' });
    }

    const claim = await prisma.warrantyClaim.findUnique({
      where: { id },
      include: {
        order: true,
      },
    });

    if (!claim) {
      return res.status(404).json({ error: 'Warranty claim not found' });
    }

    // Check if farmer owns this order
    if (role === 'FARMER' && claim.order.farmerId !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this claim' });
    }

    const updatedClaim = await prisma.warrantyClaim.update({
      where: { id },
      data: {
        status,
        resolutionNotes,
        resolvedBy: ['RESOLVED', 'REJECTED'].includes(status) ? userId : undefined,
        resolvedAt: ['RESOLVED', 'REJECTED'].includes(status) ? new Date() : undefined,
      },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        resolver: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json(updatedClaim);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    console.error('Update warranty claim error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get warranty claims for a specific order
router.get('/order/:orderId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user!.userId;
    const role = req.user!.role;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check authorization
    if (role === 'CUSTOMER' && order.customerId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (role === 'FARMER' && order.farmerId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const claims = await prisma.warrantyClaim.findMany({
      where: { orderId },
      include: {
        resolver: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(claims);
  } catch (error) {
    console.error('Get order warranty claims error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
