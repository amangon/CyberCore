/**
 * Shared CORS configuration for the SentinelX AI backend.
 *
 * Used by both the Express HTTP layer (server.js) and the Socket.io layer
 * (sockets/index.js) so allowed origins stay consistent across the app.
 *
 * Allowed origins are read from the CLIENT_URL environment variable
 * (comma-separated list). In production this should point to the deployed
 * frontend, e.g.:
 *
 *   CLIENT_URL=https://cybercore-frontend-vuje.onrender.com
 *
 * localhost origins are only added outside of production for local
 * development. The known production frontend is always included as a
 * fallback so the app works even if CLIENT_URL is not configured.
 */

const PROD_FRONTEND_URL = 'https://cybercore-frontend-vuje.onrender.com';

function buildAllowedOrigins() {
  const origins = (process.env.CLIENT_URL || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  if (process.env.NODE_ENV !== 'production') {
    origins.push(
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000'
    );
  } else if (!origins.includes(PROD_FRONTEND_URL)) {
    origins.push(PROD_FRONTEND_URL);
  }

  return origins.length > 0 ? origins : [PROD_FRONTEND_URL];
}

const allowedOrigins = buildAllowedOrigins();

const corsOptions = {
  origin(origin, callback) {
    // Allow requests with no origin (curl, server-to-server, same-origin).
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

module.exports = { corsOptions, allowedOrigins, buildAllowedOrigins };
