import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticateToken, requireCustomer, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

const createPaymentIntentSchema = z.object({
  orderId: z.string(),
  amount: z.number().positive(),
});

// Create payment intent
router.post('/intent', authenticateToken, requireCustomer, async (req: AuthenticatedRequest, res) => {
  try {
    const { orderId, amount } = createPaymentIntentSchema.parse(req.body);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { customerId: true, status: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.customerId !== req.user!.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (order.status !== 'PENDING') {
      return res.status(400).json({ error: 'Order already processed' });
    }

    // TODO: Integrate with Razorpay
    // For now, return a mock payment intent
    const paymentIntent = {
      id: `pi_${Date.now()}`,
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      status: 'created',
      orderId: orderId,
    };

    res.json(paymentIntent);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data' });
    }
    console.error('Create payment intent error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Handle payment webhook
router.post('/webhook', async (req, res) => {
  try {
    // TODO: Verify webhook signature
    const { event, data } = req.body;

    if (event === 'payment.captured') {
      const { order_id } = data.payment.entity;
      
      // Update order payment status
      await prisma.order.update({
        where: { id: order_id },
        data: { status: 'PAID' },
      });

      // TODO: Send confirmation notification
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Payment webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get payment status
router.get('/:orderId/status', authenticateToken, requireCustomer, async (req: AuthenticatedRequest, res) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        customerId: true,
        status: true,
        paymentMethod: true,
        total: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.customerId !== req.user!.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
