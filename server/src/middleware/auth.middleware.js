import { AUTH_COOKIE_NAME, verifyToken } from '../config/jwt.js';
import { User } from '../models/index.js';
import { toSafeUser } from '../services/auth.service.js';

/**
 * Reusable authentication middleware (requireAuth).
 * Verifies JWT signature and expiration, retrieves fresh user from MongoDB,
 * checks accountStatus (rejecting suspended users), validates tokenVersion
 * to enforce session invalidation, and attaches the authoritative safe user to req.user.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next handler
 */
export const requireAuth = async (req, res, next) => {
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
    const user = await User.findById(decoded.userId).select('+tokenVersion');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account no longer exists.'
      });
    }

    // 4. Strict tokenVersion verification (Session Invalidation check)
    // Never silently accept a token with a missing or non-integer tokenVersion claim
    if (typeof decoded.tokenVersion !== 'number' || !Number.isInteger(decoded.tokenVersion)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session token version. Please sign in again.'
      });
    }

    const dbTokenVersion = typeof user.tokenVersion === 'number' ? user.tokenVersion : 0;
    if (decoded.tokenVersion !== dbTokenVersion) {
      return res.status(401).json({
        success: false,
        message: 'Your session has been invalidated. Please sign in again.'
      });
    }

    // 5. Reject suspended accounts immediately
    if (user.accountStatus === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact platform support.'
      });
    }

    // 6. Attach authoritative user and session token from database to request
    req.user = toSafeUser(user);
    req.token = token;
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

/**
 * Backward compatibility alias for requireAuth.
 */
export const authenticate = requireAuth;

/**
 * Reusable role-based authorization middleware (requireRole).
 * Enforces authoritative database role checks on protected endpoints.
 * Never trusts role claims supplied by client headers or body.
 *
 * @param {...string|string[]} allowedRoles - Role or array of roles permitted to access the route
 * @returns {import('express').RequestHandler}
 */
export const requireRole = (...allowedRoles) => {
  const roles = allowedRoles.flat();

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please sign in to continue.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Administrator privileges required.'
      });
    }

    next();
  };
};

/**
 * Optional authentication middleware (optionalAuth).
 * If a valid token is provided, attaches req.user.
 * If no token or invalid token, proceeds with req.user = null.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next handler
 */
export const optionalAuth = async (req, res, next) => {
  try {
    let token = null;
    if (req.cookies && req.cookies[AUTH_COOKIE_NAME]) {
      token = req.cookies[AUTH_COOKIE_NAME];
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      req.user = null;
      return next();
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      req.user = null;
      return next();
    }

    if (!decoded || !decoded.userId) {
      req.user = null;
      return next();
    }

    const user = await User.findById(decoded.userId).select('+tokenVersion');
    if (!user || user.accountStatus === 'suspended') {
      req.user = null;
      return next();
    }

    const currentTokenVersion = typeof user.tokenVersion === 'number' ? user.tokenVersion : 0;
    const tokenVersionInJwt = typeof decoded.tokenVersion === 'number' ? decoded.tokenVersion : -1;
    if (tokenVersionInJwt !== currentTokenVersion) {
      req.user = null;
      return next();
    }

    req.user = toSafeUser(user);
    next();
  } catch {
    req.user = null;
    next();
  }
};

export default {
  requireAuth,
  authenticate,
  requireRole,
  optionalAuth
};
