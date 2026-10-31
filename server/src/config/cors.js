import { env } from './env.js';

// Parse allowed origins from validated environment configuration
const allowedOrigins = env.CLIENT_ORIGINS || (env.CLIENT_ORIGIN
  ? env.CLIENT_ORIGIN.split(',').map((origin) => origin.trim())
  : ['http://localhost:3000']);

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

    if (allowedOrigins.includes(origin)) {
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
