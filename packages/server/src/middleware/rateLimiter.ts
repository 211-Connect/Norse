import rateLimit from 'express-rate-limit';

export function rateLimiter() {
  return rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5,
  });
}
