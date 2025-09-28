import rateLimit from 'express-rate-limit';

// Simple in-memory rate limiting for development
export const otpRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 OTP requests per minute (more lenient for development)
  message: 'Too many OTP requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `otp:${req.body.phone || req.ip}`,
});

// General API rate limiting
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window (very lenient for development)
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
