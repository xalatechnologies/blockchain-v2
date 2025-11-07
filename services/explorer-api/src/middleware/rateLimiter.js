import rateLimit from 'express-rate-limit';

export const createRateLimiter = (windowMs, maxRequests) => {
  return rateLimit({
    windowMs: windowMs || parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    max: maxRequests || parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
      status: 'error',
      message: 'Too many requests, please try again later.',
      code: 429
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS === 'true'
  });
};

export const defaultRateLimiter = createRateLimiter();
export const strictRateLimiter = createRateLimiter(60000, 10); // 10 requests per minute


