import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { io } from '../index';

const router = Router();

const sendMessageSchema = z.object({
  orderId: z.string(),
  body: z.string().min(1).max(1000),
  attachments: z.array(z.string().url()).optional(),
});

// Get chat for an order
router.get('/:orderId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check authorization
    if (req.user!.role === 'CUSTOMER' && order.userId !== req.user!.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (req.user!.role === 'FARMER' && order.farmerId !== req.user!.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const chat = await prisma.chat.findUnique({
      where: { orderId },
      include: {
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        customer: {
          select: {
            name: true,
          },
        },
        farmer: {
          select: {
            name: true,
            farmerProfile: {
              select: {
                businessName: true,
              },
            },
          },
        },
      },
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    res.json(chat);
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send message
router.post('/messages', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { orderId, body, attachments } = sendMessageSchema.parse(req.body);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check authorization
    if (req.user!.role === 'CUSTOMER' && order.userId !== req.user!.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (req.user!.role === 'FARMER' && order.farmerId !== req.user!.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Get or create chat
    let chat = await prisma.chat.findUnique({
      where: { orderId },
    });

    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          orderId,
          customerId: order.userId,
          farmerId: order.farmerId,
        },
      });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        chatId: chat.id,
        senderId: req.user!.userId,
        body,
        attachments,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    // Emit to Socket.IO room
    io.to(`order:${orderId}`).emit('message:new', message);

    res.status(201).json(message);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data' });
    }
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get messages for a chat
router.get('/:orderId/messages', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { orderId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check authorization
    if (req.user!.role === 'CUSTOMER' && order.userId !== req.user!.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (req.user!.role === 'FARMER' && order.farmerId !== req.user!.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const chat = await prisma.chat.findUnique({
      where: { orderId },
    });

    if (!chat) {
      return res.json({ messages: [], pagination: { page: 1, limit: 50, total: 0, pages: 0 } });
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { chatId: chat.id },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.message.count({ where: { chatId: chat.id } }),
    ]);

    res.json({
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
