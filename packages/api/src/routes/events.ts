import express from 'express';
import { prisma } from '../config/database';

const router = express.Router();

// POST /events
router.post('/', async (req, res) => {
  try {
    const { userId, productId, type, value = null, meta = null } = req.body;
    
    // Validate required field
    if (!type) {
      return res.status(400).json({ error: 'type is required' });
    }

    // Create event in database
    const event = await prisma.event.create({
      data: {
        userId: userId || null,
        productId: productId || null,
        type,
        value: value !== null ? parseFloat(value) : null,
        meta: meta ? (typeof meta === 'string' ? meta : JSON.stringify(meta)) : null,
      },
    });

    return res.status(201).json(event);
  } catch (err: any) {
    console.error('POST /events error:', err);
    console.error('Error details:', {
      message: err.message,
      code: err.code,
      meta: err.meta,
      stack: err.stack
    });
    return res.status(500).json({ 
      error: 'internal_server_error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// GET /events - Optional: Retrieve events with filtering
router.get('/', async (req, res) => {
  try {
    const { userId, productId, type, limit = '100' } = req.query;
    
    const where: any = {};
    if (userId) where.userId = userId as string;
    if (productId) where.productId = productId as string;
    if (type) where.type = type as string;

    const events = await prisma.event.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
    });

    return res.status(200).json(events);
  } catch (err) {
    console.error('GET /events error:', err);
    return res.status(500).json({ error: 'internal_server_error' });
  }
});

export default router;
