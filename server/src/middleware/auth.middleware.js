import { AUTH_COOKIE_NAME, verifyToken } from '../config/jwt.js';
import { getUserById } from '../services/auth.service.js';

/**
 * Reusable authentication middleware.
 * Verifies the JWT from the HTTP-only cookie (or Authorization header),
 * validates the user from the database, ensures the account is active,
 * and attaches the authenticated user to the request.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next handler
 */
export const authenticate = async (req, res, next) => {
  try {
    // 1. Extract token from HTTP-only cookie or Authorization header fallback
    let token = null;

    if (req.cookies && req.cookies[AUTH_COOKIE_NAME]) {
      token = req.cookies[AUTH_COOKIE_NAME];
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please sign in to continue.'
      });
    }

    // 2. Verify JWT signature & expiration
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Your session has expired. Please sign in again.'
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token. Please sign in again.'
      });
    }

    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload.'
      });
    }

    // 3. Retrieve user from MongoDB to guarantee account is valid and active
    const user = await getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account no longer exists.'
      });
    }

    // 4. Attach safe user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.status === 403) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

export default {
  authenticate
};

