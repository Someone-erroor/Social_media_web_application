import { env } from './env.js';

// Parse allowed origins from comma-separated list or single URL
const allowedOrigins = env.CLIENT_ORIGIN
  ? env.CLIENT_ORIGIN.split(',').map((origin) => origin.trim())
  : ['http://localhost:3000'];

export const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (such as mobile apps, curl, or same-origin) in development
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
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
