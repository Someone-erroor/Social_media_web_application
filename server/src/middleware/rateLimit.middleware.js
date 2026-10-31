import { env } from '../config/env.js';

/**
 * Creates a lightweight in-memory sliding window rate limiter middleware.
 *
 * @param {object} options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum allowed requests within windowMs
 * @param {string} options.message - Error message when rate limit is exceeded
 * @param {boolean} [options.skipInTest=true] - Whether to bypass limiter in test environment
 * @returns {import('express').RequestHandler}
 */
export const createRateLimiter = ({
  windowMs = 60 * 1000,
  max = 60,
  message = 'Too many requests. Please slow down and try again later.',
  skipInTest = true
}) => {
  const requests = new Map();

  // Periodic cleanup of expired window entries every 2 minutes
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of requests.entries()) {
      const active = timestamps.filter((t) => now - t < windowMs);
      if (active.length === 0) {
        requests.delete(key);
      } else {
        requests.set(key, active);
      }
    }
  }, 2 * 60 * 1000);

  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }

  return (req, res, next) => {
    // Bypass in test environment to avoid interfering with automated test assertions
    if (skipInTest && (env.isTest || process.env.NODE_ENV === 'test')) {
      return next();
    }

    const key = req.user?._id
      ? `user_${req.user._id}`
      : req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

    const now = Date.now();
    const timestamps = requests.get(key) || [];
    const validTimestamps = timestamps.filter((time) => now - time < windowMs);

    if (validTimestamps.length >= max) {
      const oldest = validTimestamps[0];
      const retryAfterSeconds = Math.ceil((windowMs - (now - oldest)) / 1000);

      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({
        success: false,
        message,
        retryAfter: retryAfterSeconds
      });
    }

    validTimestamps.push(now);
    requests.set(key, validTimestamps);
    next();
  };
};

/**
 * Sensitive auth endpoints rate limiter (login, register, forgot-password)
 * 30 attempts per minute per IP.
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many authentication attempts. Please try again after 60 seconds.'
});

/**
 * AI generation and summarization rate limiter
 * 20 calls per minute per user/IP.
 */
export const aiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Too many AI requests. Please slow down and try again in a minute.'
});

