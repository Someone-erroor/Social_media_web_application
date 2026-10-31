import jwt from 'jsonwebtoken';
import { env } from './env.js';

export const AUTH_COOKIE_NAME = 'looply_token';

/**
 * Returns standardized cookie options for setting the authentication JWT.
 * Configured for HTTP-only protection and appropriate SameSite/Secure settings.
 *
 * @param {boolean} isProduction - Whether environment is production
 * @returns {object} Express cookie options
 */
export const getCookieOptions = (isProduction = env.isProduction) => ({
  httpOnly: true,
  secure: Boolean(isProduction),
  sameSite: isProduction ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  path: '/'
});

/**
 * Returns matching options for clearing the authentication cookie upon logout.
 *
 * @param {boolean} isProduction - Whether environment is production
 * @returns {object} Express clearCookie options
 */
export const getClearCookieOptions = (isProduction = env.isProduction) => ({
  httpOnly: true,
  secure: Boolean(isProduction),
  sameSite: isProduction ? 'none' : 'lax',
  path: '/'
});

/**
 * Signs a new JSON Web Token with standardized payload and expiration.
 *
 * @param {object} payload - Claims to encode in the token (e.g. { userId, role })
 * @returns {string} Signed JWT string
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });
};

/**
 * Verifies a JSON Web Token against the configured JWT_SECRET.
 *
 * @param {string} token - Raw JWT string
 * @returns {object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};

export default {
  AUTH_COOKIE_NAME,
  getCookieOptions,
  getClearCookieOptions,
  generateToken,
  verifyToken
};

