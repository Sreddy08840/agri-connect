import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole } from '../../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/admin/cleanup/orphaned-products - Check for orphaned products
router.get('/orphaned-products', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    // Find all products with their farmer information
    const products = await prisma.product.findMany({
      include: {
        farmer: {
          include: {
            farmerProfile: true
          }
        }
      }
    });

    // Find orphaned products (farmer exists but no farmer profile)
    const orphanedProducts = products.filter((product: any) => 
      product.farmer && product.farmer.role === 'FARMER' && !product.farmer.farmerProfile
    );

    const orphanedDetails = orphanedProducts.map((product: any) => ({
      productId: product.id,
      productName: product.name,
      farmerId: product.farmer.id,
      farmerName: product.farmer.name,
      farmerPhone: product.farmer.phone,
      createdAt: product.createdAt
    }));

    res.json({
      success: true,
      totalProducts: products.length,
      orphanedCount: orphanedProducts.length,
      orphanedProducts: orphanedDetails
    });

  } catch (error) {
    console.error('Error checking orphaned products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check orphaned products'
    });
  }
});

// POST /api/admin/cleanup/fix-orphaned-products - Fix orphaned products by creating farmer profiles
router.post('/fix-orphaned-products', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    // Find orphaned products
    const products = await prisma.product.findMany({
      include: {
        farmer: {
          include: {
            farmerProfile: true
          }
        }
      }
    });

    const orphanedProducts = products.filter(product => 
      product.farmer && product.farmer.role === 'FARMER' && !product.farmer.farmerProfile
    );

    if (orphanedProducts.length === 0) {
      return res.json({
        success: true,
        message: 'No orphaned products found',
        fixed: 0
      });
    }

    // Get unique farmers from orphaned products
    const uniqueFarmers = [...new Map(
      orphanedProducts.map(p => [p.farmer.id, p.farmer])
    ).values()];

    // Create farmer profiles for each unique farmer
    const createdProfiles = [];
    for (const farmer of uniqueFarmers) {
      const businessName = farmer.name ? `${farmer.name}'s Farm` : `Farm ${farmer.phone}`;
      
      const farmerProfile = await prisma.farmerProfile.create({
        data: {
          userId: farmer.id,
          businessName: businessName,
          description: 'Auto-generated farmer profile',
          isActive: true,
        }
      });

      createdProfiles.push({
        farmerId: farmer.id,
        farmerName: farmer.name,
        businessName: businessName
      });
    }

    res.json({
      success: true,
      message: `Fixed ${orphanedProducts.length} orphaned products by creating ${createdProfiles.length} farmer profiles`,
      fixed: orphanedProducts.length,
      createdProfiles: createdProfiles
    });

  } catch (error) {
    console.error('Error fixing orphaned products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fix orphaned products'
    });
  }
});

// DELETE /api/admin/cleanup/remove-orphaned-products - Remove orphaned products entirely
router.delete('/remove-orphaned-products', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    // Find orphaned products
    const products = await prisma.product.findMany({
      include: {
        farmer: {
          include: {
            farmerProfile: true
          }
        }
      }
    });

    const orphanedProducts = products.filter(product => 
      product.farmer && product.farmer.role === 'FARMER' && !product.farmer.farmerProfile
    );

    if (orphanedProducts.length === 0) {
      return res.json({
        success: true,
        message: 'No orphaned products to remove',
        removed: 0
      });
    }

    // Remove orphaned products
    const orphanedIds = orphanedProducts.map(p => p.id);
    
    const result = await prisma.product.deleteMany({
      where: {
        id: {
          in: orphanedIds
        }
      }
    });

    res.json({
      success: true,
      message: `Removed ${result.count} orphaned products`,
      removed: result.count,
      removedProducts: orphanedProducts.map(p => ({
        id: p.id,
        name: p.name,
        farmerName: p.farmer.name || p.farmer.phone
      }))
    });

  } catch (error) {
    console.error('Error removing orphaned products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove orphaned products'
    });
  }
});

export default router;
