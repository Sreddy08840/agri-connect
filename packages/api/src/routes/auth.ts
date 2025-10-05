import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { otpService } from '../services/otpService';
import { generateTokens, verifyToken } from '../utils/jwt';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { otpRateLimit } from '../middleware/rateLimit-simple';
import bcrypt from 'bcryptjs';
import { createPendingSession, getPendingSession, deletePendingSession } from '../services/pendingSessionStore';
import { OAuth2Client } from 'google-auth-library';

const router = Router();

const otpRequestSchema = z.object({
  phone: z
    .string()
    .regex(/^\+[1-9]\d{7,14}$/, 'Phone must be in international E.164 format, e.g., +14155551234'),
});

// Password reset schemas
const passwordForgotSchema = z.object({
  phone: z
    .string()
    .regex(/^\+[1-9]\d{7,14}$/, 'Phone must be in international E.164 format, e.g., +14155551234'),
});

const passwordResetSchema = z.object({
  pendingSessionId: z.string().min(10),
  code: z.string().length(6),
  newPassword: z.string().min(6).max(100),
});

// Forgot password (Step 1: request OTP for existing user)
router.post('/password/forgot', otpRateLimit, async (req, res) => {
  try {
    const { phone } = passwordForgotSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { otpStore } = await import('../services/otpStore');
    const code = await otpStore.storeOTP(phone);
    const sent = await otpService.sendOTP(phone, code);
    if (!sent) {
      return res.status(500).json({ error: 'Failed to send OTP' });
    }

    const pending = createPendingSession({ phone, userId: user.id });
    res.json({ 
      success: true, 
      pendingSessionId: pending.id,
      ...(process.env.NODE_ENV === 'development' && { code })
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data' });
    }
    console.error('password/forgot error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset password (Step 2: verify OTP and set new password)
router.post('/password/reset', async (req, res) => {
  try {
    const { pendingSessionId, code, newPassword } = passwordResetSchema.parse(req.body);

    const pending = getPendingSession(pendingSessionId);
    if (!pending) {
      return res.status(400).json({ error: 'Session expired, please request OTP again' });
    }

    const { otpStore } = await import('../services/otpStore');
    const isValid = await otpStore.verifyOTP(pending.phone, code);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: pending.userId! }, data: { passwordHash } });

    deletePendingSession(pendingSessionId);

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data' });
    }
    console.error('password/reset error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Simple registration for mobile app (no OTP required)
router.post('/register', async (req, res) => {
  try {
    const { name, phone, email, password, role, businessName } = req.body;
    
    // Validation
    if (!name || !phone || !password) {
      return res.status(400).json({ error: 'Name, phone, and password are required' });
    }
    
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      return res.status(400).json({ error: 'Phone already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    const userData: any = {
      name,
      phone,
      email: email || undefined,
      passwordHash,
      role: role || 'CUSTOMER',
      verified: true, // Auto-verify for mobile
    };

    if (role === 'FARMER' && businessName) {
      userData.farmerProfile = {
        create: { businessName }
      };
    }

    const user = await prisma.user.create({
      data: userData,
      include: { farmerProfile: true }
    });

    const tokens = generateTokens({ userId: user.id, role: user.role });
    
    res.json({
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        verified: user.verified,
        avatarUrl: user.avatarUrl,
        farmerProfile: user.farmerProfile
      },
      ...tokens
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Simple login for mobile app (no OTP required)
router.post('/login', async (req, res) => {
  try {
    const { phone, password, role } = req.body;
    
    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone and password are required' });
    }
    
    const user = await prisma.user.findUnique({
      where: { phone },
      include: { farmerProfile: true }
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (role && user.role !== role) {
      return res.status(403).json({ error: 'Invalid role for this login' });
    }

    const tokens = generateTokens({ userId: user.id, role: user.role });
    
    res.json({
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        verified: user.verified,
        avatarUrl: user.avatarUrl,
        farmerProfile: user.farmerProfile
      },
      ...tokens
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Register with password (Step 1: credentials -> send OTP)
router.post('/register-password', otpRateLimit, async (req, res) => {
  try {
    const { name, phone, password, role } = registerPasswordSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing?.passwordHash) {
      return res.status(400).json({ error: 'User already exists. Please login.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = existing
      ? await prisma.user.update({ where: { phone }, data: { name, passwordHash, role } })
      : await prisma.user.create({ data: { name, phone, passwordHash, role } });

    const { otpStore } = await import('../services/otpStore');
    const code = await otpStore.storeOTP(phone);
    const sent = await otpService.sendOTP(phone, code);
    if (!sent) {
      return res.status(500).json({ error: 'Failed to send OTP' });
    }

    const pending = createPendingSession({ phone, userId: user.id });
    res.json({ success: true, pendingSessionId: pending.id, ...(process.env.NODE_ENV === 'development' && { code }) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data' });
    }
    console.error('register-password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login with password (Step 1: verify password -> send OTP)
router.post('/login-password', otpRateLimit, async (req, res) => {
  try {
    const { phone, password } = loginPasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { otpStore } = await import('../services/otpStore');
    const code = await otpStore.storeOTP(phone);
    const sent = await otpService.sendOTP(phone, code);
    if (!sent) {
      return res.status(500).json({ error: 'Failed to send OTP' });
    }

    const pending = createPendingSession({ phone, userId: user.id });
    res.json({ success: true, pendingSessionId: pending.id, ...(process.env.NODE_ENV === 'development' && { code }) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data' });
    }
    console.error('login-password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify OTP (Step 2: complete 2FA and issue tokens)
router.post('/otp/verify-2fa', async (req, res) => {
  try {
    const { pendingSessionId, code } = otpVerify2FASchema.parse(req.body);
    const pending = getPendingSession(pendingSessionId);
    if (!pending) {
      return res.status(400).json({ error: 'Session expired, please login again' });
    }

    const { otpStore } = await import('../services/otpStore');
    const isValid = await otpStore.verifyOTP(pending.phone, code);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    const user = await prisma.user.findUnique({ where: { id: pending.userId! } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const tokens = generateTokens({
      userId: user.id,
      role: user.role as 'CUSTOMER' | 'FARMER' | 'ADMIN',
      phone: user.phone,
    });

    deletePendingSession(pendingSessionId);

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
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data' });
    }
    console.error('otp verify 2fa error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const otpVerifySchema = z.object({
  phone: z
    .string()
    .regex(/^\+[1-9]\d{7,14}$/, 'Phone must be in international E.164 format, e.g., +14155551234'),
  code: z.string().length(6),
  name: z.string().min(2).max(100).optional(),
});

// Two-step auth schemas
const registerPasswordSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z
    .string()
    .regex(/^\+[1-9]\d{7,14}$/, 'Phone must be in international E.164 format, e.g., +14155551234'),
  password: z.string().min(6).max(100),
  role: z.enum(['CUSTOMER', 'FARMER']).default('CUSTOMER'),
});

const loginPasswordSchema = z.object({
  phone: z
    .string()
    .regex(/^\+[1-9]\d{7,14}$/, 'Phone must be in international E.164 format, e.g., +14155551234'),
  password: z.string().min(6).max(100),
});

const otpVerify2FASchema = z.object({
  pendingSessionId: z.string().min(10),
  code: z.string().length(6),
});

const googleAuthSchema = z.object({
  credential: z.string().optional(), // For web Google Identity Services
  accessToken: z.string().optional(), // For mobile Expo Auth Session
}).refine(data => data.credential || data.accessToken, {
  message: 'Either credential or accessToken must be provided',
});

// Request OTP
router.post('/otp/request', otpRateLimit, async (req, res) => {
  try {
    const { phone } = otpRequestSchema.parse(req.body);

    const { otpStore } = await import('../services/otpStore');
    const code = await otpStore.storeOTP(phone);
    
    const success = await otpService.sendOTP(phone, code);
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to send OTP' });
    }

    res.json({ 
      success: true, 
      message: 'OTP sent successfully',
      ...(process.env.NODE_ENV === 'development' && { code }) // Include code in development
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }
    console.error('OTP request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify OTP and login/register
router.post('/otp/verify', async (req, res) => {
  try {
    const { phone, code, name } = otpVerifySchema.parse(req.body);
    
    console.log(`[AUTH] Verifying OTP for ${phone} with code ${code}`);

    const { otpStore } = await import('../services/otpStore');
    const isValid = await otpStore.verifyOTP(phone, code);
    console.log(`[AUTH] OTP verification result: ${isValid}`);
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      if (!name) {
        return res.status(400).json({ error: 'Name is required for new users' });
      }

      user = await prisma.user.create({
        data: {
          phone,
          name,
          role: 'CUSTOMER',
        },
      });
    }

    // Generate tokens
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
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data' });
    }
    console.error('OTP verify error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const decoded = verifyToken(refreshToken);

    if (!decoded) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

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
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Google authentication
router.post('/google', async (req, res) => {
  try {
    const { credential, accessToken } = googleAuthSchema.parse(req.body);

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || '565912943332-bdga9vs4f19r91hr8r99baqng47cqo24.apps.googleusercontent.com');

    let ticket;
    if (credential) {
      // Web: Verify JWT credential
      ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID || '565912943332-bdga9vs4f19r91hr8r99baqng47cqo24.apps.googleusercontent.com',
      });
    } else if (accessToken) {
      // Mobile: Get user info with access token
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        return res.status(400).json({ error: 'Invalid access token' });
      }

      const userInfo = await response.json();

      // Create a mock ticket object for mobile
      ticket = {
        getPayload: () => ({
          sub: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
        }),
      };
    }

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({ error: 'Invalid Google token' });
    }

    const { sub: googleId, email, name, picture } = payload;

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { googleId },
        ],
      },
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          name: name || 'Google User',
          email,
          googleId,
          avatarUrl: picture,
          role: 'CUSTOMER',
          verified: true, // Google accounts are pre-verified
          phone: `GOOGLE_${googleId}`, // Temporary phone for Google users
        },
      });
    } else {
      // Update existing user with Google info if not present
      if (!user.googleId || !user.avatarUrl) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: user.googleId || googleId,
            avatarUrl: user.avatarUrl || picture,
            verified: true,
          },
        });
      }
    }

    // Generate tokens
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
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        verified: user.verified,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data' });
    }
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Google authentication failed' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        farmerProfile: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      role: user.role,
      name: user.name,
      phone: user.phone,
      email: user.email,
      avatarUrl: user.avatarUrl,
      address: user.address,
      verified: user.verified,
      farmerProfile: user.farmerProfile,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
