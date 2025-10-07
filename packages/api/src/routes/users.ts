import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticateToken, AuthenticatedRequest, requireAdmin } from '../middleware/auth';
import { Prisma } from '@prisma/client';
import { generateTokens } from '../utils/jwt';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const router: import('express').Router = Router();

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.union([z.string().email(), z.literal('')]).optional().transform(val => val === '' ? undefined : val),
  address: z.string().optional().transform(val => val === '' ? undefined : val),
  farmerProfile: z.object({
    businessName: z.string().min(2).max(200).optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
    description: z.string().optional().transform(val => val === '' ? undefined : val),
    address: z.string().optional().transform(val => val === '' ? undefined : val),
  }).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const twoFactorSchema = z.object({
  token: z.string().min(6, 'Token must be 6 digits').max(6, 'Token must be 6 digits'),
});

const forgotPasswordSchema = z.object({
  identifier: z.string().min(1, 'Email or phone number is required'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const bulkUserActionSchema = z.object({
  userIds: z.array(z.string()).min(1, 'At least one user ID is required'),
  action: z.enum(['verify', 'unverify', 'delete']),
});

// Simple TOTP implementation (basic version without external dependencies)
function generateSecret(): string {
  return crypto.randomBytes(20).toString('hex').toUpperCase();
}

function base32Decode(encoded: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  let output = '';
  
  for (let i = 0; i < encoded.length; i++) {
    const char = encoded[i];
    if (char === '=') break;
    
    const index = alphabet.indexOf(char.toUpperCase());
    if (index === -1) continue;
    
    value = (value << 5) | index;
    bits += 5;
    
    if (bits >= 8) {
      output += String.fromCharCode((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  
  return Buffer.from(output, 'binary');
}

function generateTOTP(secret: string, window = 0): string {
  const epoch = Math.round(new Date().getTime() / 1000.0);
  const time = Math.floor(epoch / 30) + window;
  
  // For simplicity, use hex secret instead of base32
  const secretBuffer = Buffer.from(secret, 'hex');
  const hmac = crypto.createHmac('sha1', secretBuffer);
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeUInt32BE(0, 0);
  timeBuffer.writeUInt32BE(time, 4);
  
  const hash = hmac.update(timeBuffer).digest();
  const offset = hash[hash.length - 1] & 0xf;
  const code = (hash.readUInt32BE(offset) & 0x7fffffff) % 1000000;
  
  return code.toString().padStart(6, '0');
}

function verifyTOTP(token: string, secret: string): boolean {
  // Check current window and ±1 window for clock drift
  for (let i = -1; i <= 1; i++) {
    if (generateTOTP(secret, i) === token) {
      return true;
    }
  }
  return false;
}

function generateBackupCodes(): string[] {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  return codes;
}

// Audit logging function
async function logAuditEvent(adminId: string, action: string, before: any = null, after: any = null) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminId,
        action,
        before: before ? JSON.stringify(before) : null,
        after: after ? JSON.stringify(after) : null,
      }
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

// Update current user and farmer profile (if role is FARMER)
router.patch('/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    console.log('Profile update request body:', JSON.stringify(req.body, null, 2));
    const data = updateSchema.parse(req.body);
    const userId = req.user!.userId;

    const userUpdate: any = {};
    if (data.name !== undefined) userUpdate.name = data.name;
    if (data.email !== undefined) userUpdate.email = data.email;
    if (data.address !== undefined) userUpdate.address = data.address;

    const user = await prisma.user.update({
      where: { id: userId },
      data: userUpdate,
    });

    let farmerProfile = null as any;
    if (data.farmerProfile) {
      // Ensure farmer profile exists
      const existing = await prisma.farmerProfile.findUnique({ where: { userId } });
      if (!existing) {
        farmerProfile = await prisma.farmerProfile.create({
          data: {
            userId,
            businessName: data.farmerProfile.businessName || `${user.name}'s Farm`,
            description: data.farmerProfile.description,
            address: data.farmerProfile.address,
          },
        });
      } else {
        farmerProfile = await prisma.farmerProfile.update({
          where: { userId },
          data: {
            ...(data.farmerProfile.businessName !== undefined && { businessName: data.farmerProfile.businessName }),
            ...(data.farmerProfile.description !== undefined && { description: data.farmerProfile.description }),
            ...(data.farmerProfile.address !== undefined && { address: data.farmerProfile.address }),
          },
        });
      }
    }

    res.json({ success: true, user: { ...user }, farmerProfile });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      return res.status(400).json({ 
        error: 'Invalid data',
        details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      });
    }
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password
router.patch('/me/password', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const data = changePasswordSchema.parse(req.body);
    const userId = req.user!.userId;

    // Get current user with password hash
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true }
    });

    if (!user || !user.passwordHash) {
      return res.status(400).json({ error: 'User not found or no password set' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(data.newPassword, saltRounds);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash }
    });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid data', 
        details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      });
    }
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: impersonate a user (issue tokens for target user)
router.post('/:id/impersonate', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const tokens = generateTokens({
      userId: user.id,
      role: user.role as 'CUSTOMER' | 'FARMER' | 'ADMIN',
      phone: user.phone,
    });

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        role: user.role,
        name: user.name,
        phone: user.phone,
        verified: user.verified,
      },
    });
  } catch (error) {
    console.error('Impersonate error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Setup 2FA - Generate secret and QR code
router.post('/me/2fa/setup', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA is already enabled' });
    }

    const secret = generateSecret();
    const appName = 'Agri-Connect';
    const accountName = user.phone;
    
    // Generate manual entry key (formatted secret)
    const manualEntryKey = secret.match(/.{1,4}/g)?.join(' ') || secret;
    
    // For QR code, we'll return the otpauth URL
    const otpauthUrl = `otpauth://totp/${encodeURIComponent(appName)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(appName)}`;

    // Store the secret temporarily (not enabled yet)
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret }
    });

    res.json({
      secret,
      manualEntryKey,
      qrCodeUrl: otpauthUrl,
      backupCodes: generateBackupCodes()
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Enable 2FA - Verify token and enable
router.post('/me/2fa/enable', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { token } = twoFactorSchema.parse(req.body);
    const userId = req.user!.userId;
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ error: 'No 2FA setup found. Please setup 2FA first.' });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA is already enabled' });
    }

    // Verify the token
    if (!verifyTOTP(token, user.twoFactorSecret)) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes();

    // Enable 2FA
    await prisma.user.update({
      where: { id: userId },
      data: { 
        twoFactorEnabled: true,
        backupCodes: JSON.stringify(backupCodes)
      }
    });

    // Log audit event
    await logAuditEvent(userId, 'ENABLE_2FA', null, { twoFactorEnabled: true });

    res.json({ 
      success: true, 
      message: '2FA enabled successfully',
      backupCodes 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid token format' });
    }
    console.error('2FA enable error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Disable 2FA
router.post('/me/2fa/disable', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { token } = twoFactorSchema.parse(req.body);
    const userId = req.user!.userId;
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({ error: '2FA is not enabled' });
    }

    // Verify the token or backup code
    let isValid = verifyTOTP(token, user.twoFactorSecret);
    
    if (!isValid && user.backupCodes) {
      const backupCodes = JSON.parse(user.backupCodes);
      isValid = backupCodes.includes(token.toUpperCase());
    }

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid token or backup code' });
    }

    // Disable 2FA
    await prisma.user.update({
      where: { id: userId },
      data: { 
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: null
      }
    });

    res.json({ success: true, message: '2FA disabled successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid token format' });
    }
    console.error('2FA disable error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send email verification
router.post('/me/email/send-verification', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.email) {
      return res.status(400).json({ error: 'No email address found. Please add an email first.' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with verification token
    await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerificationToken: token,
        emailVerificationExpires: expires
      }
    });

    // In a real app, you would send an email here
    // For now, we'll just return the token for testing
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/verify-email?token=${token}`;
    
    console.log(`Email verification URL for ${user.email}: ${verificationUrl}`);

    res.json({ 
      success: true, 
      message: 'Verification email sent successfully',
      // Remove this in production - only for testing
      verificationUrl: process.env.NODE_ENV === 'development' ? verificationUrl : undefined
    });
  } catch (error) {
    console.error('Send email verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify email
router.post('/email/verify', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    // Mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null
      }
    });

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get email verification status
router.get('/me/email/status', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      select: { email: true, emailVerified: true }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      email: user.email,
      emailVerified: user.emailVerified,
      hasEmail: !!user.email
    });
  } catch (error) {
    console.error('Email status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get 2FA status
router.get('/me/2fa/status', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      select: { twoFactorEnabled: true }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ twoFactorEnabled: user.twoFactorEnabled });
  } catch (error) {
    console.error('2FA status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Forgot password - Send reset link
router.post('/forgot-password', async (req, res) => {
  try {
    const { identifier } = forgotPasswordSchema.parse(req.body);
    
    // Check if identifier is email or phone
    const isEmail = identifier.includes('@');
    
    const user = await prisma.user.findFirst({ 
      where: isEmail 
        ? { email: identifier } 
        : { phone: identifier }
    });
    
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ 
        success: true, 
        message: 'If an account exists, a password reset link has been sent.' 
      });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    // Generate a 6-digit OTP for easier development testing
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Update user with reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpires: expires
      }
    });

    // In a real app, you would send an SMS or email here
    // For now, we'll just log it for testing
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/reset-password?token=${token}`;
    
    console.log('='.repeat(60));
    console.log(`🔐 PASSWORD RESET REQUEST`);
    console.log(`📧 User: ${user.email || user.phone}`);
    console.log(`🔑 Reset Token: ${token}`);
    console.log(`🔢 OTP Code (for UI): ${otp}`);
    console.log(`🔗 Reset URL: ${resetUrl}`);
    console.log(`⏰ Expires: ${expires.toLocaleString()}`);
    console.log('='.repeat(60));

    res.json({ 
      success: true, 
      message: 'If an account exists, a password reset link has been sent.',
      // Remove this in production - only for testing
      resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined,
      otp: process.env.NODE_ENV === 'development' ? otp : undefined,
      token: process.env.NODE_ENV === 'development' ? token : undefined
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid data', 
        details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      });
    }
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);
    
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        passwordResetToken: null,
        passwordResetExpires: null
      }
    });

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid data', 
        details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      });
    }
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: update user (including verification status)
router.patch('/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { verified, name, email, role } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updateData: any = {};
    if (typeof verified === 'boolean') updateData.verified = verified;
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        verified: true,
        createdAt: true,
      },
    });

    // Log audit event for verification changes
    if (typeof verified === 'boolean' && user.verified !== verified) {
      await logAuditEvent(req.user!.userId, 'USER_VERIFICATION', { verified: user.verified }, { verified });
    }

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: toggle user verification status (alternative endpoint)
router.patch('/:id/verify', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { verified } = req.body;

    if (typeof verified !== 'boolean') {
      return res.status(400).json({ error: 'Verified field must be a boolean' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { verified },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        verified: true,
        createdAt: true,
      },
    });

    // Log audit event
    await logAuditEvent(req.user!.userId, 'USER_VERIFICATION', { verified: !verified }, { verified });

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Toggle verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: list users
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role, q, page = 1, limit = 20 } = req.query as any;
    const where: any = {};
    if (role) where.role = role;
    if (q) {
      where.OR = [
        { name: { contains: String(q), mode: 'insensitive' } },
        { phone: { contains: String(q), mode: 'insensitive' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
        select: {
          id: true,
          name: true,
          phone: true,
          role: true,
          verified: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Admin list users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: bulk user operations
router.post('/bulk-action', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { userIds, action } = bulkUserActionSchema.parse(req.body);
    const adminId = req.user!.userId;
    
    let results = { success: 0, failed: 0, errors: [] as string[] };

    for (const userId of userIds) {
      try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        
        if (!user) {
          results.failed++;
          results.errors.push(`User ${userId} not found`);
          continue;
        }

        switch (action) {
          case 'verify':
            await prisma.user.update({
              where: { id: userId },
              data: { verified: true }
            });
            await logAuditEvent(adminId, 'BULK_USER_VERIFY', { verified: false }, { verified: true });
            results.success++;
            break;

          case 'unverify':
            await prisma.user.update({
              where: { id: userId },
              data: { verified: false }
            });
            await logAuditEvent(adminId, 'BULK_USER_UNVERIFY', { verified: true }, { verified: false });
            results.success++;
            break;

          case 'delete':
            // Delete dependent records first
            try { await prisma.order.deleteMany({ where: { userId } as any }); } catch {}
            try { await prisma.cartItem.deleteMany({ where: { userId } as any }); } catch {}
            try { await prisma.farmerProfile.delete({ where: { userId } }); } catch {}
            
            await prisma.user.delete({ where: { id: userId } });
            await logAuditEvent(adminId, 'BULK_USER_DELETE', { userId, name: user.name }, null);
            results.success++;
            break;
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to ${action} user ${userId}: ${error}`);
      }
    }

    res.json({
      success: true,
      message: `Bulk ${action} completed`,
      results
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid data', 
        details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      });
    }
    console.error('Bulk user action error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: get audit logs
router.get('/audit-logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, action } = req.query as any;
    const where: any = {};
    if (action) where.action = action;

    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              phone: true,
            }
          }
        }
      }),
      prisma.adminAuditLog.count({ where }),
    ]);

    res.json({
      logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Admin audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get farmer dashboard stats
router.get('/farmer/stats', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    
    // Get or create farmer profile
    let farmerProfile = await prisma.farmerProfile.findUnique({
      where: { userId }
    });

    if (!farmerProfile) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      try {
        farmerProfile = await prisma.farmerProfile.create({
          data: {
            userId,
            businessName: user.name ? `${user.name}'s Farm` : 'My Farm',
          }
        });
      } catch (createError: any) {
        // If profile creation fails, return default stats
        console.error('Failed to create farmer profile:', createError);
        return res.json({
          totalRevenue: 0,
          totalOrders: 0,
          activeProducts: 0,
          avgRating: 0,
          recentOrders: []
        });
      }
    }

    // Get total revenue from delivered orders
    const orders = await prisma.order.findMany({
      where: { farmerId: farmerProfile.id },
      select: {
        id: true,
        total: true,
        status: true,
        createdAt: true,
      }
    });

    const totalRevenue = orders
      .filter(order => order.status === 'DELIVERED')
      .reduce((sum, order) => sum + Number(order.total), 0);

    const totalOrders = orders.length;

    // Get active products count
    const activeProducts = await prisma.product.count({
      where: { 
        farmerId: userId,
        status: 'APPROVED'
      }
    });

    // Get recent orders (last 5)
    const recentOrders = orders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(order => ({
        id: order.id,
        total: Number(order.total),
        status: order.status,
        createdAt: order.createdAt
      }));

    // Calculate average rating (placeholder - implement when reviews are added)
    const avgRating = 4.5; // TODO: Calculate from actual reviews

    res.json({
      totalRevenue,
      totalOrders,
      activeProducts,
      avgRating,
      recentOrders
    });
  } catch (error) {
    console.error('Farmer stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get farmer analytics (detailed)
router.get('/farmer/analytics', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    
    // Get or create farmer profile
    let farmerProfile = await prisma.farmerProfile.findUnique({
      where: { userId }
    });

    // Create default profile if doesn't exist
    if (!farmerProfile) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      try {
        farmerProfile = await prisma.farmerProfile.create({
          data: {
            userId,
            businessName: user.name ? `${user.name}'s Farm` : 'My Farm',
          }
        });
      } catch (createError: any) {
        // If profile creation fails, return default stats
        console.error('Failed to create farmer profile:', createError);
        return res.json({
          totalRevenue: 0,
          totalOrders: 0,
          pendingOrders: 0,
          completedOrders: 0,
          activeProducts: 0,
          outOfStockProducts: 0,
          avgRating: 0
        });
      }
    }

    // Get orders
    const orders = await prisma.order.findMany({
      where: { farmerId: farmerProfile.id },
      select: {
        id: true,
        total: true,
        status: true,
        createdAt: true,
      }
    });

    const totalRevenue = orders
      .filter(order => order.status === 'DELIVERED')
      .reduce((sum, order) => sum + Number(order.total), 0);

    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => ['PLACED', 'ACCEPTED'].includes(o.status)).length;
    const completedOrders = orders.filter(o => o.status === 'DELIVERED').length;

    // Get products stats
    const [activeProducts, outOfStockProducts] = await Promise.all([
      prisma.product.count({
        where: { 
          farmerId: userId,
          status: 'APPROVED',
          stockQty: { gt: 0 }
        }
      }),
      prisma.product.count({
        where: { 
          farmerId: userId,
          stockQty: 0
        }
      })
    ]);

    // Calculate average rating
    const avgRating = farmerProfile.ratingAvg || 0;

    res.json({
      totalRevenue,
      totalOrders,
      pendingOrders,
      completedOrders,
      activeProducts,
      outOfStockProducts,
      avgRating
    });
  } catch (error) {
    console.error('Farmer analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

// Delete current user account
router.delete('/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;

    // Attempt to delete dependent records that may block user deletion
    // These deletes are best-effort and ignore if tables/relations are absent
    
    // Delete orders where user is the customer
    try { await prisma.order.deleteMany({ where: { customerId: userId } }); } catch {}
    
    // If user is a farmer, delete orders assigned to their farmer profile
    try { 
      const farmerProfile = await prisma.farmerProfile.findUnique({ where: { userId } });
      if (farmerProfile) {
        await prisma.order.deleteMany({ where: { farmerId: farmerProfile.id } });
      }
    } catch {}
    
    // Delete cart items by first finding the user's cart
    try { 
      const userCart = await prisma.cart.findUnique({ where: { userId } });
      if (userCart) {
        await prisma.cartItem.deleteMany({ where: { cartId: userCart.id } });
      }
    } catch {}
    
    // Delete user's products if they are a farmer
    try { await prisma.product.deleteMany({ where: { farmerId: userId } }); } catch {}
    
    // Delete farmer profile if exists (this will cascade delete payouts)
    try { await prisma.farmerProfile.delete({ where: { userId } }); } catch {}
    
    // Delete user's cart
    try { await prisma.cart.delete({ where: { userId } }); } catch {}
    
    // Delete messages sent by the user
    try { await prisma.message.deleteMany({ where: { senderId: userId } }); } catch {}
    
    // Delete admin audit logs if user is admin
    try { await prisma.adminAuditLog.deleteMany({ where: { adminId: userId } }); } catch {}

    await prisma.user.delete({ where: { id: userId } });

    res.json({ success: true });
  } catch (error) {
    if ((error as any)?.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
