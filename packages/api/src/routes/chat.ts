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

const startChatSchema = z.object({
  farmerId: z.string(),
  productId: z.string().optional(),
  initialMessage: z.string().min(1).max(1000),
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

// Start a direct chat with farmer (from product page)
router.post('/start', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { farmerId, productId, initialMessage } = startChatSchema.parse(req.body);
    const customerId = req.user!.userId;

    if (req.user!.role !== 'CUSTOMER') {
      return res.status(403).json({ error: 'Only customers can start chats' });
    }

    // Check if chat already exists between customer and farmer
    let chat = await prisma.directChat.findFirst({
      where: {
        customerId,
        farmerId,
      },
    });

    // Create new chat if doesn't exist
    if (!chat) {
      chat = await prisma.directChat.create({
        data: {
          customerId,
          farmerId,
          productId,
        },
      });
    }

    // Create initial message
    const message = await prisma.directMessage.create({
      data: {
        chatId: chat.id,
        senderId: customerId,
        body: initialMessage,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Emit to Socket.IO
    io.to(`farmer:${farmerId}`).emit('chat:new', { chat, message });

    res.status(201).json({ chat, message });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data' });
    }
    console.error('Start chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all direct chats for current user
router.get('/direct/list', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;

    const chats = await prisma.directChat.findMany({
      where: role === 'CUSTOMER' ? { customerId: userId } : { farmerId: userId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        farmer: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            farmerProfile: {
              select: {
                businessName: true,
              },
            },
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            images: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(chats);
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get messages for a direct chat
router.get('/direct/:chatId/messages', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user!.userId;

    const chat = await prisma.directChat.findUnique({
      where: { id: chatId },
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Check authorization
    if (chat.customerId !== userId && chat.farmerId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const messages = await prisma.directMessage.findMany({
      where: { chatId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Mark messages as read
    await prisma.directMessage.updateMany({
      where: {
        chatId,
        senderId: { not: userId },
        read: false,
      },
      data: { read: true },
    });

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send message in direct chat
router.post('/direct/:chatId/messages', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { chatId } = req.params;
    const { body } = req.body;
    const userId = req.user!.userId;

    if (!body || body.trim().length === 0) {
      return res.status(400).json({ error: 'Message body is required' });
    }

    const chat = await prisma.directChat.findUnique({
      where: { id: chatId },
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Check authorization
    if (chat.customerId !== userId && chat.farmerId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const message = await prisma.directMessage.create({
      data: {
        chatId,
        senderId: userId,
        body: body.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    });

    // Update chat timestamp
    await prisma.directChat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    // Emit to Socket.IO
    const recipientId = chat.customerId === userId ? chat.farmerId : chat.customerId;
    const recipientRole = chat.customerId === userId ? 'FARMER' : 'CUSTOMER';
    io.to(`${recipientRole.toLowerCase()}:${recipientId}`).emit('message:new', message);

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get unread message count
router.get('/direct/unread/count', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;

    // Get all chats for user
    const chats = await prisma.directChat.findMany({
      where: role === 'CUSTOMER' ? { customerId: userId } : { farmerId: userId },
      select: { id: true },
    });

    const chatIds = chats.map(c => c.id);

    // Count unread messages
    const unreadCount = await prisma.directMessage.count({
      where: {
        chatId: { in: chatIds },
        senderId: { not: userId },
        read: false,
      },
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
