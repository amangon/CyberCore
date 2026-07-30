const ErrorResponse = require('../utils/errorResponse');

/**
 * Simple in-memory rate limiter middleware
 * Tracks requests per IP within a time window
 */
const rateLimiter = (windowMs = 15 * 60 * 1000, maxRequests = 100) => {
  const requests = new Map();

  // Clean up old entries every minute
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, data] of requests.entries()) {
      if (now - data.startTime > windowMs) {
        requests.delete(key);
      }
    }
  }, 60000);

  // Allow cleanup interval to not block process exit
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!requests.has(ip)) {
      requests.set(ip, {
        count: 1,
        startTime: now
      });
      return next();
    }

    const data = requests.get(ip);

    if (now - data.startTime > windowMs) {
      // Reset window
      data.count = 1;
      data.startTime = now;
      return next();
    }

    data.count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - data.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil((data.startTime + windowMs) / 1000));

    if (data.count > maxRequests) {
      const retryAfter = Math.ceil((data.startTime + windowMs - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return next(new ErrorResponse(`Too many requests. Please try again in ${retryAfter} seconds.`, 429));
    }

    next();
  };
};

module.exports = rateLimiter;

