import { env } from './env.js';

// Parse allowed origins from validated environment configuration
const allowedOrigins = env.CLIENT_ORIGINS || (env.CLIENT_ORIGIN
  ? env.CLIENT_ORIGIN.split(',').map((origin) => origin.trim())
  : ['http://localhost:3000']);

export const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (such as mobile apps, curl, or same-origin) in development only
    if (!origin) {
      if (env.isDevelopment) {
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
