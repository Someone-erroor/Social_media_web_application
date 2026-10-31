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
 * - Prevents internal server error messages from being exposed in production.
 * - Returns a generic "Internal Server Error" message for HTTP 500 errors in production.
 * - Preserves appropriate client-facing 4xx messages.
 * - Keeps stack traces development-only.
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
    // Hide internal details in production; show real error in development
    message = env.isProduction ? 'Internal Server Error' : (err.message || 'Internal Server Error');
  } else {
    // Preserve client-facing 4xx error messages across all environments
    message = err.message || 'An error occurred';
  }

  const response = {
    success: false,
    message
  };

  // Stack traces are strictly development-only
  if (env.isDevelopment && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
