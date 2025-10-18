import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticateToken, requireCustomer, requireFarmer, AuthenticatedRequest } from '../middleware/auth';
import { io } from '../index';
import { emailService } from '../services/emailService';

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
    
    // Get user ID for review check
    const userId = req.user!.userId;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.order.count({ where }),
    ]);
    
    // Check if orders have been reviewed (for customers only)
    if (req.user!.role === 'CUSTOMER') {
      const orderIds = orders.map(order => order.id);
      const reviewedOrders = await prisma.productReview.findMany({
        where: {
          userId,
          orderId: { in: orderIds }
        },
        select: {
          orderId: true
        }
      });
      
      const reviewedOrderIds = new Set(reviewedOrders.map(review => review.orderId));
      
      // Add reviewed flag to each order
      orders.forEach(order => {
        (order as any).reviewed = reviewedOrderIds.has(order.id);
      });
    }

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
  status: z.enum(['CONFIRMED', 'ACCEPTED', 'REJECTED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
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
      // Get farmer profile ID for the current user
      const farmerProfile = await prisma.farmerProfile.findUnique({
        where: { userId: req.user!.userId }
      });
      
      if (!farmerProfile) {
        return res.json({ orders: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } });
      }
      
      where.farmerId = farmerProfile.id; // Use farmer profile ID, not user ID
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

// Cancel order (customer) - only allowed before order is shipped
router.post('/:id/cancel', authenticateToken, requireCustomer, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({ where: { id } });
    
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.customerId !== req.user!.userId) return res.status(403).json({ error: 'Not authorized' });
    
    // Check if order can be cancelled (only before shipping)
    if (['SHIPPED', 'DELIVERED'].includes(order.status)) {
      return res.status(400).json({ 
        error: 'Cannot cancel order', 
        message: 'Orders cannot be cancelled after they have been shipped' 
      });
    }
    
    const updated = await prisma.order.update({ where: { id }, data: { status: 'CANCELLED' } });
    try { io.to(`order:${id}`).emit('order-update', updated); } catch {}
    
    // Send notification to farmer about cancellation
    try {
      io.to(`farmer:${order.farmerId}`).emit('order-cancelled', {
        orderId: order.id,
        message: 'An order has been cancelled by the customer'
      });
    } catch (e) {
      console.error('Failed to send cancellation notification:', e);
    }
    
    res.json(updated);
  } catch (error) {
    console.error('Cancel order error:', error);
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
    if (req.user!.role === 'FARMER') {
      // Get farmer profile for current user
      const farmerProfile = await prisma.farmerProfile.findUnique({
        where: { userId: req.user!.userId }
      });
      if (!farmerProfile || order.farmerId !== farmerProfile.id) {
        return res.status(403).json({ error: 'Not authorized to access this order' });
      }
    }
    
    // If customer is viewing their own order, check if they've already reviewed all products
    if (req.user?.role === 'CUSTOMER' && order) {
      // Get all product IDs from order items
      const productIds = order.items.map(item => item.product.id);
      
      if (productIds.length > 0) {
        // Find all reviews by this user for these products
        const reviews = await prisma.productReview.findMany({
          where: {
            userId: req.user.userId,
            productId: { in: productIds }
          },
          select: {
            productId: true
          }
        });
        
        const reviewedProductIds = new Set(reviews.map(r => r.productId));
        
        // Mark each item as reviewed or not
        order.items = order.items.map(item => ({
          ...item,
          reviewed: reviewedProductIds.has(item.product.id)
        }));
        
        // Add a flag to indicate if all products in the order have been reviewed
        (order as any).reviewed = reviewedProductIds.size >= productIds.length;
      } else {
        (order as any).reviewed = false;
      }
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

      // Get or create farmer profile if it doesn't exist
      let farmerProfileId = product.farmer.farmerProfile?.id;
      
      if (!farmerProfileId) {
        // Create farmer profile if it doesn't exist
        const newFarmerProfile = await prisma.farmerProfile.create({
          data: {
            userId: product.farmerId,
            businessName: product.farmer.name ? `${product.farmer.name}'s Farm` : 'Farm',
          }
        });
        farmerProfileId = newFarmerProfile.id;
      }

      orderItems.push({
        productId: item.productId,
        qty: item.qty,
        unitPrice: product.price, // Use current product price
      });

      totalAmount += product.price * item.qty;
      farmerIds.add(farmerProfileId); // Use farmerProfile.id
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
        status: 'CONFIRMED',
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

    // Get customer and farmer details for email
    const customer = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { name: true, email: true }
    });

    const farmer = await prisma.farmerProfile.findUnique({
      where: { id: farmerId },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    // Send order confirmation emails
    if (customer && farmer) {
      // Calculate estimated delivery (3-5 business days from now)
      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + 4);
      const estimatedDeliveryStr = estimatedDelivery.toLocaleDateString('en-IN', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      // Format address for email
      const addressObj = JSON.parse(order.addressSnapshot);
      const formattedAddress = `${addressObj.street}, ${addressObj.city}, ${addressObj.state} - ${addressObj.pincode}${addressObj.landmark ? ', Near ' + addressObj.landmark : ''}`;

      // Prepare order details for email
      const orderDetails = {
        orderNumber: order.orderNumber,
        customerName: customer.name,
        customerEmail: customer.email || '',
        farmerName: farmer.businessName || farmer.user.name,
        farmerEmail: farmer.user.email || '',
        items: createdItems.map(item => ({
          productName: item.product.name,
          quantity: item.qty,
          unitPrice: item.unitPrice,
          unit: 'unit' // You may want to fetch this from product
        })),
        totalAmount: order.total,
        deliveryAddress: formattedAddress,
        estimatedDelivery: estimatedDeliveryStr,
        paymentMethod: order.paymentMethod
      };

      // Send emails asynchronously (don't wait for completion)
      if (customer.email) {
        emailService.sendBuyerConfirmation(orderDetails).catch(err => 
          console.error('Failed to send buyer confirmation email:', err)
        );
      }

      if (farmer.user.email) {
        emailService.sendSellerNotification(orderDetails).catch(err => 
          console.error('Failed to send seller notification email:', err)
        );
      }
    }

    // TODO: Create payment intent if payment method is ONLINE
    // Note: Cart clearing is handled on the frontend

    // Notify interested clients that a new order is created (optional)
    try { io.to(`order.id`).emit('order-update', completeOrder); } catch {}
    res.status(201).json(completeOrder);
  } catch (error: any) {
    console.error('Create order error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name
    });
    
    if (error instanceof z.ZodError) {
      const errorDetails = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return res.status(400).json({ 
        error: 'Invalid request data', 
        details: errorDetails 
      });
    }
    
    // Handle specific database errors
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Duplicate order detected' });
    }
    
    if (error.code === 'P2025') {
      return res.status(400).json({ error: 'Product not found or unavailable' });
    }
    
    // Return the actual error message for debugging
    if (error.message) {
      return res.status(400).json({ 
        error: error.message,
        timestamp: new Date().toISOString()
      });
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
