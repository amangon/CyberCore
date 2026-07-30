/**
 * Request sanitization middleware
 * Strips potentially dangerous content from request body
 */

// Patterns to sanitize against
const SENSITIVE_PATTERNS = [
  /\$\{[^}]*\}/g,                     // Template injection
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script tags
  /on\w+\s*=\s*['"][^'"]*['"]/gi,    // Event handlers
  /javascript\s*:/gi,                 // javascript: protocol
  /data\s*:\s*text\/html/gi,          // data:text/html
  /vbscript\s*:/gi                    // vbscript: protocol
];

/**
 * Deep sanitize an object's string values
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Sanitize a single string value
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return str;

  let sanitized = str;
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  // Strip null bytes
  sanitized = sanitized.replace(/\0/g, '');

  return sanitized.trim();
}

/**
 * Sanitize request body middleware
 */
const sanitize = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    for (const key of Object.keys(req.query)) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key]);
      }
    }
  }

  // Sanitize URL params
  if (req.params) {
    for (const key of Object.keys(req.params)) {
      if (typeof req.params[key] === 'string') {
        req.params[key] = sanitizeString(req.params[key]);
      }
    }
  }

  next();
};

module.exports = sanitize;

