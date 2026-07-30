const logger = require('../utils/logger');

/**
 * API Error Handler for scan routes
 * Handles specific error types and returns standardized error responses
 */
const apiErrorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log the error
  logger.error(`API Error: ${err.message}`, {
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
    body: sanitizeBody(req.body)
  });

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: 'File too large. Maximum file size is 50MB'
    });
  }

  // Multer unexpected file field
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      error: 'Unexpected file field'
    });
  }

  // Axios timeout errors
  if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
    return res.status(504).json({
      success: false,
      error: 'External API request timed out. Please try again.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // Axios connection errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ERR_CONNECTION_REFUSED') {
    return res.status(502).json({
      success: false,
      error: 'Unable to connect to external threat intelligence service.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // Rate limiting errors from external APIs
  if (err.response?.status === 429 || err.message.includes('rate limit')) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded for external threat intelligence service. Please wait and try again.'
    });
  }

  // Invalid API key errors
  if (err.response?.status === 401 || err.response?.status === 403) {
    return res.status(502).json({
      success: false,
      error: 'Invalid or expired API key for external threat intelligence service.',
      service: req.apiService
    });
  }

  // Default to 500
  const statusCode = err.statusCode || err.response?.status || 500;
  res.status(statusCode).json({
    success: false,
    error: error.message || 'Internal scan error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Sanitize request body for logging (remove sensitive data)
 */
function sanitizeBody(body) {
  if (!body) return {};
  const sanitized = { ...body };
  // Remove sensitive fields
  delete sanitized.password;
  delete sanitized.token;
  delete sanitized.apiKey;
  delete sanitized.secret;
  return sanitized;
}

module.exports = apiErrorHandler;
