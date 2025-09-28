import { Router } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import sharp from 'sharp';

const router: import('express').Router = Router();

// Create uploads directories if they don't exist
const avatarsDir = path.join(process.cwd(), 'uploads', 'avatars');
const productsDir = path.join(process.cwd(), 'uploads', 'products');

if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}
if (!fs.existsSync(productsDir)) {
  fs.mkdirSync(productsDir, { recursive: true });
}

// Multer configuration for product images
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, productsDir);
  },
  filename: (req, file, cb) => {
    const userId = (req as AuthenticatedRequest).user?.userId || 'unknown';
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `product_${userId}_${uniqueSuffix}${ext}`);
  }
});

const uploadProduct = multer({
  storage: productStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  }
});

// Simple file upload handler without multer
router.post('/avatar', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    
    // Check if request has file data
    if (!req.body.image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Parse base64 image data
    const imageData = req.body.image;
    const matches = imageData.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    
    if (!matches) {
      return res.status(400).json({ error: 'Invalid image format' });
    }

    const imageType = matches[1];
    const base64Data = matches[2];
    
    // Validate image type
    const allowedTypes = ['jpeg', 'jpg', 'png', 'gif', 'webp'];
    if (!allowedTypes.includes(imageType.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid image type. Allowed: JPEG, PNG, GIF, WebP' });
    }

    // Generate unique filename
    const filename = `${userId}_${crypto.randomBytes(8).toString('hex')}.${imageType}`;
    const filepath = path.join(avatarsDir, filename);

    // Save image file
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Check file size (max 5MB)
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image too large. Maximum size is 5MB' });
    }

    fs.writeFileSync(filepath, buffer);

    // Generate URL for the image
    const imageUrl = `/uploads/avatars/${filename}`;

    // Update user's avatar URL in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: imageUrl },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
      }
    });

    res.json({
      success: true,
      message: 'Profile photo updated successfully',
      user: updatedUser,
      avatarUrl: imageUrl
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: 'Failed to upload profile photo' });
  }
});

// Delete avatar
router.delete('/avatar', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true }
    });

    if (user?.avatarUrl) {
      // Delete file from filesystem
      const filename = path.basename(user.avatarUrl);
      const filepath = path.join(avatarsDir, filename);
      
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    }

    // Remove avatar URL from database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
      }
    });

    res.json({
      success: true,
      message: 'Profile photo removed successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Avatar delete error:', error);
    res.status(500).json({ error: 'Failed to remove profile photo' });
  }
});

// Upload product images using Multer with validation & thumbnails
router.post('/product-images', authenticateToken, uploadProduct.array('images', 5), async (req: AuthenticatedRequest, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }

    const results: any[] = [];
    for (const file of files) {
      const absPath = file.path;
      // Validate dimensions and basic properties using sharp metadata
      const img = sharp(absPath);
      const meta = await img.metadata();
      if (!meta.width || !meta.height) {
        fs.unlinkSync(absPath);
        return res.status(400).json({ error: 'Invalid image (no dimensions)' });
      }
      if (meta.width < 300 || meta.height < 300) {
        fs.unlinkSync(absPath);
        return res.status(400).json({ error: 'Image too small. Minimum 300x300 required' });
      }

      // Optional: basic NSFW/content moderation stub (placeholder)
      // In production, integrate with a moderation API/model and reject if flagged.

      // Generate thumbnail (e.g., 300x300, webp)
      const baseName = path.parse(file.filename).name;
      const thumbName = `${baseName}_thumb.webp`;
      const thumbPath = path.join(productsDir, thumbName);
      await img.resize({ width: 300, height: 300, fit: 'cover' }).webp({ quality: 82 }).toFile(thumbPath);

      results.push({
        originalUrl: `/uploads/products/${file.filename}`,
        thumbnailUrl: `/uploads/products/${thumbName}`,
        width: meta.width,
        height: meta.height,
        format: meta.format,
        size: file.size
      });
    }

    res.json({
      success: true,
      message: `${results.length} product image(s) processed successfully`,
      images: results
    });
  } catch (error) {
    console.error('Product images upload error:', error);
    res.status(500).json({ error: 'Failed to upload product images' });
  }
});

// Keep the old single image endpoint for backward compatibility
router.post('/product-image', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    
    // Check if request has file data
    if (!req.body.image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Parse base64 image data
    const imageData = req.body.image;
    const matches = imageData.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    
    if (!matches) {
      return res.status(400).json({ error: 'Invalid image format' });
    }

    const imageType = matches[1];
    const base64Data = matches[2];
    
    // Validate image type
    const allowedTypes = ['jpeg', 'jpg', 'png', 'gif', 'webp'];
    if (!allowedTypes.includes(imageType.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid image type. Allowed: JPEG, PNG, GIF, WebP' });
    }

    // Generate unique filename
    const filename = `product_${userId}_${crypto.randomBytes(8).toString('hex')}.${imageType}`;
    const filepath = path.join(productsDir, filename);

    // Save image file
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Check file size (max 10MB for product images)
    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image too large. Maximum size is 10MB' });
    }

    fs.writeFileSync(filepath, buffer);

    // Generate URL for the image
    const imageUrl = `/uploads/products/${filename}`;

    res.json({
      success: true,
      message: 'Product image uploaded successfully',
      imageUrl: imageUrl
    });
  } catch (error) {
    console.error('Product image upload error:', error);
    res.status(500).json({ error: 'Failed to upload product image' });
  }
});

export default router;
