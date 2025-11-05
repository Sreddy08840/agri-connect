import rateLimit from 'express-rate-limit';
import { redis } from '../config/redis';

// OTP rate limiting with Redis store
export const otpRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 OTP requests per window
  message: 'Too many OTP requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `otp:${req.body.phone}`,
  store: {
    async increment(key: string) {
      const current = await redis.get(key);
      if (current === null) {
        await redis.setex(key, 900, '1'); // 15 minutes
        return { totalHits: 1, resetTime: new Date(Date.now() + 900000) };
      }
      const newCount = parseInt(current) + 1;
      await redis.setex(key, 900, String(newCount));
      return { totalHits: newCount, resetTime: new Date(Date.now() + 900000) };
    },
    async decrement(key: string) {
      const current = await redis.get(key);
      if (current !== null) {
        const newCount = Math.max(0, parseInt(current) - 1);
        if (newCount === 0) {
          await redis.del(key);
        } else {
          await redis.setex(key, 900, String(newCount));
        }
      }
    },
    async resetKey(key: string) {
      await redis.del(key);
    },
  },
});

// General API rate limiting
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
