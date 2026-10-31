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
 * - Prevents internal server error messages from being exposed in production or test.
 * - Returns a generic "Internal Server Error" message for HTTP 500 errors unless explicitly development.
 * - Preserves appropriate client-facing 4xx messages.
 * - Development stack traces are exposed ONLY when NODE_ENV is explicitly development.
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode =
    typeof err.status === 'number' && err.status >= 400 && err.status <= 599
      ? err.status
      : typeof err.statusCode === 'number' && err.statusCode >= 400 && err.statusCode <= 599
        ? err.statusCode
        : 500;

  // Determine appropriate client-facing message
  let message;
  if (statusCode >= 500) {
    // Expose internal details ONLY when NODE_ENV is explicitly development
    message = env.NODE_ENV === 'development' ? (err.message || 'Internal Server Error') : 'Internal Server Error';
  } else {
    // Preserve client-facing 4xx error messages across all environments
    message = err.message || 'An error occurred';
  }

  const response = {
    success: false,
    message
  };

  // Stack traces are exposed ONLY when NODE_ENV is explicitly development
  if (env.NODE_ENV === 'development' && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
