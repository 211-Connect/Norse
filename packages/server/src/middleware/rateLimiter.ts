import rateLimit from 'express-rate-limit';

/**
 *
 * @param maxReqPerSecond Max requests per minute
 * @returns
 */
export function rateLimiter(maxReq: number) {
  return rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: maxReq,
  });
}
