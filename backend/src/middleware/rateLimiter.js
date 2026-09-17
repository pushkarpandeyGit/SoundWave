const rateLimit = require('express-rate-limit');

/**
 * General API Rate Limiter
 * Limits incoming requests to 150 requests per 15 minutes per IP.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP address, please try again after 15 minutes.'
  }
});

/**
 * Strict Auth Rate Limiter
 * Protects login and register endpoints against brute-force attacks.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.'
  }
});

module.exports = { apiLimiter, authLimiter };
