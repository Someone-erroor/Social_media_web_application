import { env } from '../config/env.js';

/**
 * 404 Not Found Middleware
 * Intercepts requests to undefined routes.
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`
  });
};

/**
 * Global Error Handling Middleware
 * Provides consistent error response payload.
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;
  
  const response = {
    success: false,
    message: err.message || 'Internal Server Error'
  };

  // Include stack trace only in development mode
  if (env.isDevelopment && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
