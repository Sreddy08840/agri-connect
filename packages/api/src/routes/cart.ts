import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticateToken, requireCustomer, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

const addToCartSchema = z.object({
  productId: z.string(),
  qty: z.number().int().min(1),
});

const updateCartItemSchema = z.object({
  qty: z.number().int().min(1),
});

// Helper to ensure product.images is an array (parsing DB JSON string)
const normalizeProductImages = (product: any) => {
  if (!product) return product;
  return {
    ...product,
    images: product.images ? (() => {
      try { return JSON.parse(product.images); } catch { return []; }
    })() : [],
  };
};

// Helper to normalize cart structure's nested product images
const normalizeCartResponse = (cart: any) => {
  if (!cart?.items) return cart;
  return {
    ...cart,
    items: cart.items.map((item: any) => ({
      ...item,
      product: normalizeProductImages(item.product),
    })),
  };
};

// Get user's cart
router.get('/', authenticateToken, requireCustomer, async (req: AuthenticatedRequest, res) => {
  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user!.userId },
      include: {
        items: {
          include: {
            product: {
              include: {
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
            },
          },
        },
      },
    });

    if (!cart) {
      // Create empty cart if it doesn't exist
      const newCart = await prisma.cart.create({
        data: { userId: req.user!.userId },
        include: {
          items: {
            include: {
              product: {
                include: {
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
              },
            },
          },
        },
      });
      return res.json(normalizeCartResponse(newCart));
    }

    res.json(normalizeCartResponse(cart));
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add item to cart
router.post('/items', authenticateToken, requireCustomer, async (req: AuthenticatedRequest, res) => {
  try {
    const { productId, qty } = addToCartSchema.parse(req.body);

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: req.user!.userId },
      });
    }

    // Get product details
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.status !== 'APPROVED') {
      return res.status(400).json({ error: 'Product not available for purchase' });
    }

    if (product.stockQty < qty) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: productId,
        },
      },
    });

    if (existingItem) {
      // Update quantity
      const updatedItem = await prisma.cartItem.update({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId: productId,
          },
        },
        data: {
          qty: existingItem.qty + qty,
          unitPriceSnapshot: product.price,
        },
        include: {
          product: {
            include: {
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
          },
        },
      });
      // Normalize nested product images before sending
      return res.json({
        ...updatedItem,
        product: normalizeProductImages(updatedItem.product),
      });
    }

    // Add new item to cart
    const cartItem = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: productId,
        qty: qty,
        unitPriceSnapshot: product.price,
      },
      include: {
        product: {
          include: {
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
        },
      },
    });
    // Normalize nested product images before sending
    res.status(201).json({
      ...cartItem,
      product: normalizeProductImages(cartItem.product),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data' });
    }
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update cart item quantity
router.patch('/items/:id', authenticateToken, requireCustomer, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { qty } = updateCartItemSchema.parse(req.body);

    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      include: { cart: true },
    });

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    if (cartItem.cart.userId !== req.user!.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id },
      data: { qty },
      include: {
        product: {
          include: {
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
        },
      },
    });

    res.json(updatedItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data' });
    }
    console.error('Update cart item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove item from cart
router.delete('/items/:id', authenticateToken, requireCustomer, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      include: { cart: true },
    });

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    if (cartItem.cart.userId !== req.user!.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.cartItem.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Remove cart item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Clear cart
router.delete('/', authenticateToken, requireCustomer, async (req: AuthenticatedRequest, res) => {
  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user!.userId },
    });

    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
