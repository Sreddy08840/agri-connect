import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticateToken, requireCustomer, requireFarmer, AuthenticatedRequest } from '../middleware/auth';
import { io } from '../index';

const router: import('express').Router = Router();

// Test endpoint to check if orders API is working
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Orders API is working', 
    timestamp: new Date().toISOString() 
  });
});

const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    qty: z.number().int().min(1),
  })).min(1),
  paymentMethod: z.enum(['ONLINE', 'COD']),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().min(1),
    landmark: z.string().optional(),
  }),
  deliverySlot: z.object({
    date: z.string(),
    timeSlot: z.string(),
  }).optional(),
  voucherCode: z.string().optional(),
});

// Convenience: get current user's orders (customer only)
router.get('/my', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { page = 1, limit = 20 } = req.query as any;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (req.user!.role === 'CUSTOMER') where.customerId = req.user!.userId;
    if (req.user!.role === 'FARMER') where.farmerId = req.user!.userId;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      orders,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const updateOrderStatusSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  reason: z.string().optional(),
});

// Get orders (role-based)
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let where: any = {};
    
    if (req.user!.role === 'CUSTOMER') {
      where.customerId = req.user!.userId;
    } else if (req.user!.role === 'FARMER') {
      where.farmerId = req.user!.userId;
    }

    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  images: true,
                },
              },
            },
          },
          customer: {
            select: {
              name: true,
              phone: true,
            },
          },
          farmer: {
            select: {
              businessName: true,
              user: {
                select: {
                  name: true,
                  phone: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get farmer orders
router.get('/farmer-orders', authenticateToken, requireFarmer, async (req: AuthenticatedRequest, res) => {
  try {
    // Get farmer profile ID from user
    const farmer = await prisma.farmerProfile.findUnique({
      where: { userId: req.user!.userId }
    });
    
    if (!farmer) {
      return res.status(400).json({ error: 'Farmer profile not found' });
    }

    const farmerId = farmer.id;

    const { page = '1', limit = '10' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { farmerId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  images: true,
                },
              },
            },
          },
          customer: {
            select: {
              name: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.order.count({ where: { farmerId } }),
    ]);

    res.json({
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get farmer orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Confirm order (customer) - used for COD confirmation
router.post('/:id/confirm', authenticateToken, requireCustomer, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.customerId !== req.user!.userId) return res.status(403).json({ error: 'Not authorized' });

    const updated = await prisma.order.update({ where: { id }, data: { status: 'CONFIRMED' } });
    try { io.to(`order:${id}`).emit('order-update', updated); } catch {}
    res.json(updated);
  } catch (error) {
    console.error('Confirm order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get order by ID
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                images: true,
                unit: true,
              },
            },
          },
        },
        customer: {
          select: {
            name: true,
            phone: true,
            address: true,
          },
        },
        farmer: {
          select: {
            businessName: true,
            user: { select: { name: true, phone: true } },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check authorization
    if (req.user!.role === 'CUSTOMER' && order.customerId !== req.user!.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (req.user!.role === 'FARMER' && order.farmerId !== req.user!.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create order from cart
router.post('/', authenticateToken, requireCustomer, async (req: AuthenticatedRequest, res) => {
  try {
    console.log('Creating order for user:', req.user?.userId);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const data = createOrderSchema.parse(req.body);

    if (!data.items || data.items.length === 0) {
      return res.status(400).json({ error: 'No items provided' });
    }

    console.log('Validated order data:', data);

    // Validate products and calculate totals (using client-side cart data)
    const orderItems = [];
    let totalAmount = 0;
    const farmerIds = new Set();

    for (const item of data.items) {
      // Get product details from database with farmer profile
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { 
          farmer: {
            select: {
              id: true,
              name: true,
              farmerProfile: {
                select: {
                  id: true,
                  businessName: true
                }
              }
            }
          }
        }
      });

      if (!product) {
        return res.status(400).json({ error: `Product ${item.productId} not found` });
      }

      if (product.status !== 'APPROVED') {
        return res.status(400).json({ error: `Product ${product.name} is not available` });
      }

      if (product.stockQty < item.qty) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      }

      if (!product.farmer.farmerProfile) {
        return res.status(400).json({ error: `Farmer profile not found for product ${product.name}` });
      }

      orderItems.push({
        productId: item.productId,
        qty: item.qty,
        unitPrice: product.price, // Use current product price
      });

      totalAmount += product.price * item.qty;
      farmerIds.add(product.farmer.farmerProfile.id); // Use farmerProfile.id instead of farmer.id
    }

    // For simplicity, we'll create one order per farmer
    // In a real app, you might want to group by farmer
    const farmerId = String(Array.from(farmerIds)[0] || '');
    
    if (!farmerId) {
      return res.status(400).json({ error: 'No valid farmer found for the products' });
    }

    console.log('Creating order with:', {
      customerId: req.user!.userId,
      farmerId: farmerId,
      totalAmount: totalAmount,
      orderItems: orderItems
    });

    // Create order with simplified structure
    const order = await prisma.order.create({
      data: {
        customerId: req.user!.userId,
        farmerId: farmerId,
        orderNumber: `ORD-${Date.now()}`,
        total: totalAmount,
        status: 'PLACED',
        paymentMethod: data.paymentMethod,
        addressSnapshot: JSON.stringify(data.address),
        deliverySlot: data.deliverySlot ? JSON.stringify(data.deliverySlot) : null,
      }
    });

    console.log('Order created successfully:', order.id);

    // Create order items separately to avoid relation issues
    const createdItems = [];
    for (const item of orderItems) {
      const orderItem = await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          qty: item.qty,
          unitPrice: item.unitPrice,
        },
        include: {
          product: {
            select: {
              name: true,
              images: true,
            },
          },
        },
      });
      createdItems.push(orderItem);
    }

    // Return order with items
    const completeOrder = {
      ...order,
      items: createdItems,
    };

    // TODO: Create payment intent if payment method is ONLINE
    // TODO: Send notifications
    // Note: Cart clearing is handled on the frontend

    // Notify interested clients that a new order is created (optional)
    try { io.to(`order.id`).emit('order-update', completeOrder); } catch {}
    res.status(201).json(completeOrder);
  } catch (error) {
    console.error('Create order error:', error);
    
    if (error instanceof z.ZodError) {
      const errorDetails = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return res.status(400).json({ 
        error: 'Invalid request data', 
        details: errorDetails 
      });
    }
    
    // Handle specific database errors
    if ((error as any)?.code === 'P2002') {
      return res.status(400).json({ error: 'Duplicate order detected' });
    }
    
    if ((error as any)?.code === 'P2025') {
      return res.status(400).json({ error: 'Product not found or unavailable' });
    }
    
    // Generic server error
    res.status(500).json({ 
      error: 'Failed to create order. Please try again.',
      timestamp: new Date().toISOString()
    });
  }
});

// Update order status (farmer only)
router.patch('/:id/status', authenticateToken, requireFarmer, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = updateOrderStatusSchema.parse(req.body);

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get farmer profile to check authorization
    const farmer = await prisma.farmerProfile.findUnique({
      where: { userId: req.user!.userId }
    });
    
    if (!farmer || order.farmerId !== farmer.id) {
      return res.status(403).json({ error: 'Not authorized to update this order' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                images: true,
              },
            },
          },
        },
        customer: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    // Emit live update to order room
    try { io.to(`order:${id}`).emit('order-update', updatedOrder); } catch {}

    res.json(updatedOrder);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data' });
    }
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
