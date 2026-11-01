import { env } from './env.js';

// In production, strictly enforce configured origins.
// In development and testing, permit both localhost and loopback variations to prevent dev origin mismatch.
const defaultOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
const configuredOrigins = env.CLIENT_ORIGINS || (env.CLIENT_ORIGIN
  ? env.CLIENT_ORIGIN.split(',').map((origin) => origin.trim())
  : []);
const allowedOrigins = env.isProduction
  ? configuredOrigins
  : [...new Set([...defaultOrigins, ...configuredOrigins])];

export const corsOptions = {
  origin: (origin, callback) => {
    // Requests without an Origin header (e.g. curl, test runners, mobile apps)
    // are allowed only in development and test environments.
    // In production, they are strictly rejected with HTTP 403 Forbidden.
    if (!origin) {
      if (env.isDevelopment || env.isTest) {
        return callback(null, true);
      }
      const error = new Error('CORS policy violation: Requests without an Origin header are not allowed in production.');
      error.status = 403;
      return callback(error, false);
    }

    if (allowedOrigins.includes(origin) || (!env.isProduction && (origin.includes('localhost') || origin.includes('127.0.0.1')))) {
      return callback(null, true);
    }

    const error = new Error(`CORS policy violation: origin ${origin} is not allowed.`);
    error.status = 403;
    return callback(error, false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
};
