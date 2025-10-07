import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticateToken, requireFarmer, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { getIO } from '../config/socket';
import { redis } from '../config/redis';
import { indexProduct, updateProductDoc, deleteProductDoc } from '../services/search';

const router: import('express').Router = Router();

const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  price: z.number().positive(),
  unit: z.string().min(1).max(20),
  qualityGrade: z.string().optional(),
  stockQty: z.number().int().min(0),
  minOrderQty: z.number().int().min(1),
  categoryId: z.string(),
  images: z.array(z.string()).optional(),
});

// Admin: set featured flag
router.patch('/admin/:id/feature', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { featured } = (req.body || {}) as { featured?: boolean };
    if (typeof featured !== 'boolean') {
      return res.status(400).json({ error: 'featured boolean required' });
    }
    const updated = await prisma.product.update({ where: { id }, data: { featured } });
    res.json(mapProduct(updated));
  } catch (error) {
    console.error('Admin set featured error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: list products by status
router.get('/admin/list', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const statusParam = (req.query.status as string) || 'PENDING_REVIEW';
    const q = (req.query.q as string) || '';
    const category = (req.query.category as string) || '';
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Number(req.query.limit || 20), 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (statusParam && statusParam !== 'ALL') where.status = statusParam;
    if (q) where.name = { contains: q, mode: 'insensitive' };
    if (category) where.categoryId = category;

    const [productsRaw, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          farmer: {
            select: {
              id: true,
              name: true,
              phone: true,
              farmerProfile: { select: { businessName: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);
    res.json({
      products: productsRaw.map(mapProduct),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Admin list products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: pending count
router.get('/admin/pending/count', authenticateToken, requireAdmin, async (_req, res) => {
  try {
    const cacheKey = 'products:pending:count';
    const cached = await redis.get(cacheKey);
    if (cached !== null) {
      return res.json({ count: Number(cached) });
    }
    const count = await prisma.product.count({ where: { status: 'PENDING_REVIEW' } });
    await redis.set(cacheKey, String(count), 'EX', 15);
    res.json({ count });
  } catch (error) {
    console.error('Admin pending count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: bulk status update for products
router.patch('/admin/bulk-status', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const body = z.object({
      ids: z.array(z.string()).min(1),
      status: z.enum(['APPROVED', 'REJECTED']),
      reason: z.string().optional()
    }).parse(req.body);

    const products = await prisma.product.findMany({ where: { id: { in: body.ids } } });
    const io = getIO();

    for (const p of products) {
      const updated = await prisma.product.update({ where: { id: p.id }, data: { status: body.status } });
      // Audit log per product
      try {
        await prisma.adminAuditLog.create({
          data: {
            adminId: req.user!.userId,
            action: 'PRODUCT_STATUS_UPDATE',
            before: JSON.stringify({ productId: p.id, status: p.status }),
            after: JSON.stringify({ productId: p.id, status: body.status, reason: body.reason || null }),
          }
        });
      } catch (e) {
        console.warn('Audit log failed (bulk):', e);
      }
      // Emit events
      try {
        const mapped = mapProduct(updated);
        io?.to(`farmer:${updated.farmerId}`).emit('product:status', mapped);
        io?.to('admin').emit('product:status', mapped);
      } catch (e) {
        console.warn('Socket emit failed (bulk):', e);
      }
    }

    await redis.del('products:pending:count');
    res.json({ success: true, updated: products.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid bulk status payload' });
    }
    console.error('Bulk status update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get my products (Farmer only)
router.get('/mine/list', authenticateToken, requireFarmer, async (req: AuthenticatedRequest, res) => {
  try {
    const productsRaw = await prisma.product.findMany({
      where: { farmerId: req.user!.userId },
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ products: productsRaw.map(mapProduct) });
  } catch (error) {
    console.error('Get my products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const updateProductSchema = createProductSchema.partial().extend({
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED']).optional(),
});

const productQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  farmer: z.string().optional(),
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED']).optional(),
  sort: z.enum(['name', 'price', 'createdAt']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  featured: z.enum(['true','false']).optional(),
});

// Helper to map DB product to API product (parse JSON images string to array)
const mapProduct = (p: any) => {
  let images: string[] = [];

  if (p.images) {
    // Try to parse as JSON array first
    try {
      const parsed = JSON.parse(p.images);
      if (Array.isArray(parsed)) {
        images = parsed;
      } else {
        // If it's not an array, treat it as a single string and convert to array
        images = [String(parsed)];
      }
    } catch {
      // If JSON parsing fails, it might be a comma-separated string or single URL
      if (typeof p.images === 'string') {
        // Check if it contains commas (multiple URLs)
        if (p.images.includes(',')) {
          images = p.images.split(',').map(url => url.trim());
        } else {
          // Single URL
          images = [p.images];
        }
      } else {
        images = [];
      }
    }
  }

  return {
    ...p,
    images,
    // Provide a convenience single imageUrl (first image) for simpler clients
    imageUrl: images.length > 0 ? images[0] : null,
  };
};

// Get products with filters
router.get('/', async (req, res) => {
  try {
    const query = productQuerySchema.parse(req.query);
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {
      status: 'APPROVED', // Only show approved products to customers
    };

    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    if (query.category) {
      where.categoryId = query.category;
    }

    if (query.farmer) {
      where.farmerId = query.farmer;
    }

    if (query.status) {
      where.status = query.status;
    }
    if (query.featured) {
      where.featured = query.featured === 'true';
    }

    const orderBy: any = {};
    if (query.sort) {
      orderBy[query.sort] = query.order || 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [productsRaw, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          farmer: {
            select: {
              id: true,
              name: true,
              farmerProfile: {
                select: {
                  businessName: true,
                  ratingAvg: true,
                },
              },
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      products: productsRaw.map(mapProduct),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters' });
    }
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get farmer's own products
router.get('/my-products', authenticateToken, requireFarmer, async (req: AuthenticatedRequest, res) => {
  try {
    const farmerId = req.user!.userId;
    
    const products = await prisma.product.findMany({
      where: { farmerId },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const mappedProducts = products.map(mapProduct);
    res.json({ products: mappedProducts });
  } catch (error) {
    console.error('Get farmer products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get latest moderation log for a product
router.get('/:id/moderation-log', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const log = await prisma.adminAuditLog.findFirst({
      where: {
        action: 'PRODUCT_STATUS_UPDATE',
        after: { contains: id }
      },
      orderBy: { createdAt: 'desc' }
    });
    if (!log) return res.json({});
    let after: any = null; let before: any = null;
    try { after = log.after ? JSON.parse(log.after) : null; } catch {}
    try { before = log.before ? JSON.parse(log.before) : null; } catch {}
    res.json({
      id: log.id,
      productId: after?.productId || before?.productId || id,
      status: after?.status,
      reason: after?.reason || null,
      createdAt: log.createdAt
    });
  } catch (error) {
    console.error('Get moderation log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const productRaw = await prisma.product.findUnique({
      where: { id },
      include: {
        farmer: {
          select: {
            id: true,
            name: true,
            farmerProfile: {
              select: {
                businessName: true,
                ratingAvg: true,
                deliveryZones: true,
              },
            },
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!productRaw) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(mapProduct(productRaw));
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create product (Farmer only)
router.post('/', authenticateToken, requireFarmer, async (req: AuthenticatedRequest, res) => {
  try {
    const payload = createProductSchema.parse(req.body);

    // Rules-based auto-approval MVP
    const farmer = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { id: true, verified: true } });
    const hasImages = Array.isArray(payload.images) && payload.images.length > 0;
    const autoApprove = Boolean(farmer?.verified && hasImages);

    const product = await prisma.product.create({
      data: {
        name: payload.name,
        description: payload.description,
        price: payload.price,
        unit: payload.unit,
        stockQty: payload.stockQty,
        minOrderQty: payload.minOrderQty,
        categoryId: payload.categoryId,
        images: hasImages ? JSON.stringify(payload.images) : null,
        farmerId: req.user!.userId,
        status: autoApprove ? 'APPROVED' : 'PENDING_REVIEW',
      },
      include: {
        category: true,
      },
    });

    const io = getIO();

    if (autoApprove) {
      // Index approved product
      try {
        await indexProduct(mapProduct(product) as any);
      } catch (e) { console.warn('Meili index add failed (auto-approve):', e) }
      // Audit log for auto-approval (using farmer id for adminId placeholder)
      try {
        await prisma.adminAuditLog.create({
          data: {
            adminId: req.user!.userId,
            action: 'PRODUCT_AUTO_APPROVE',
            before: JSON.stringify({ productId: product.id, status: 'PENDING_REVIEW' }),
            after: JSON.stringify({ productId: product.id, status: 'APPROVED', reason: 'Auto-approved by rules' }),
          }
        });
      } catch (e) { console.warn('Audit (auto-approve) failed:', e); }

      try {
        const mapped = mapProduct(product);
        io?.to('admin').emit('product:status', mapped);
        io?.to(`farmer:${product.farmerId}`).emit('product:status', mapped);
      } catch (e) { console.warn('Socket emit failed (auto-approve):', e); }

      return res.status(201).json(mapProduct(product));
    }

    // Notify admins that a new product needs review
    const mappedNew = mapProduct(product);
    try {
      io?.to('admin').emit('product:new', mappedNew);
    } catch (e) {
      console.warn('Socket emit failed for new product', e);
    }

    try { await redis.del('products:pending:count'); } catch {}

    res.status(201).json(mappedNew);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid product data' });
    }
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update product (Farmer only, or Admin for status)
router.patch('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const data = updateProductSchema.parse(req.body);
    const user = req.user!;

    // Check if user owns the product or is admin
    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.farmerId !== user.userId && user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to update this product' });
    }

    // Only admins can change status
    if (data.status && user.role !== 'ADMIN') {
      delete data.status;
    }

    const patch: any = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.description !== undefined) patch.description = data.description;
    if (data.price !== undefined) patch.price = data.price;
    if (data.unit !== undefined) patch.unit = data.unit;
    if (data.stockQty !== undefined) patch.stockQty = data.stockQty;
    if (data.minOrderQty !== undefined) patch.minOrderQty = data.minOrderQty;
    if (data.categoryId !== undefined) patch.categoryId = data.categoryId;
    if (Array.isArray((data as any).images)) {
      patch.images = (data as any).images.length > 0 ? JSON.stringify((data as any).images) : null;
    }

    // If a farmer edits an APPROVED product, move back to PENDING_REVIEW
    const io = getIO();
    let movedToPending = false;
    if (user.role === 'FARMER' && product.status === 'APPROVED') {
      patch.status = 'PENDING_REVIEW';
      movedToPending = true;
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: patch,
      include: { category: true },
    });

    // Update Meili index based on status
    try {
      await updateProductDoc(mapProduct(updatedProduct) as any);
    } catch (e) { console.warn('Meili index update failed:', e) }

    // Low-stock automation (MVP)
    try {
      const io = getIO();
      if (updatedProduct.stockQty <= 0) {
        // Unfeature and notify out-of-stock
        await prisma.product.update({ where: { id }, data: { featured: false } });
        io?.to(`farmer:${updatedProduct.farmerId}`).emit('product:out-of-stock', mapProduct(updatedProduct));
        io?.to('admin').emit('product:out-of-stock', mapProduct(updatedProduct));
      } else if (updatedProduct.stockQty < 5) {
        // Low stock notify and unfeature to avoid promoting low-stock items
        await prisma.product.update({ where: { id }, data: { featured: false } });
        io?.to(`farmer:${updatedProduct.farmerId}`).emit('product:low-stock', mapProduct(updatedProduct));
        io?.to('admin').emit('product:low-stock', mapProduct(updatedProduct));
      }
    } catch (e) { console.warn('Low-stock automation failed:', e); }

    // Audit + notify admins if moved to review
    if (movedToPending) {
      try {
        await prisma.adminAuditLog.create({
          data: {
            adminId: user.userId,
            action: 'PRODUCT_EDIT_PENDING_REVIEW',
            before: JSON.stringify({ productId: product.id, status: product.status }),
            after: JSON.stringify({ productId: product.id, status: 'PENDING_REVIEW' })
          }
        });
      } catch (e) { console.warn('Audit log failed (edit pending):', e); }
      try {
        const mapped = mapProduct(updatedProduct);
        io?.to('admin').emit('product:new', mapped);
        io?.to('admin').emit('product:status', mapped);
      } catch (e) { console.warn('Socket emit failed (edit pending):', e); }
      try { await redis.del('products:pending:count'); } catch {}
    }

    res.json(mapProduct(updatedProduct));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid product data' });
    }
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update product status (Admin only)
router.patch('/:id/status', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body as { status: 'APPROVED' | 'REJECTED'; reason?: string };

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Product not found' });

    const product = await prisma.product.update({
      where: { id },
      data: { status },
      include: { farmer: true, category: true },
    });

    // Audit log
    try {
      await prisma.adminAuditLog.create({
        data: {
          adminId: req.user!.userId,
          action: 'PRODUCT_STATUS_UPDATE',
          before: JSON.stringify({ productId: existing.id, status: existing.status }),
          after: JSON.stringify({ productId: existing.id, status, reason: reason || null })
        }
      });
    } catch (e) { console.warn('Audit log failed:', e); }

    // Emit real-time updates
    const mapped = mapProduct(product);
    try {
      const io = getIO();
      io?.to(`farmer:${product.farmerId}`).emit('product:status', mapped);
      io?.to('admin').emit('product:status', mapped);
    } catch (e) {
      console.warn('Socket emit failed for product status update', e);
    }

    // Sync search index on status change
    try {
      await updateProductDoc(mapped as any);
    } catch (e) { console.warn('Meili index update (status) failed:', e) }

    try { await redis.del('products:pending:count'); } catch {}
    res.json(mapped);
  } catch (error) {
    console.error('Update product status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete product (Farmer only)
router.delete('/:id', authenticateToken, requireFarmer, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if user owns the product (farmerId is userId for products)
    if (product.farmerId !== req.user!.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this product' });
    }

    // Delete associated order items first
    try {
      await prisma.orderItem.deleteMany({
        where: { productId: id }
      });
    } catch (e) {
      console.warn('Failed to delete order items:', e);
    }

    await prisma.product.delete({
      where: { id },
    });

    try { await deleteProductDoc(id) } catch {}

    // Notify via socket
    try {
      const io = getIO();
      io?.to(`farmer:${req.user!.userId}`).emit('product:deleted', { productId: id });
    } catch {}

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
