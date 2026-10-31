import { env } from '../config/env.js';
import { AUTH_COOKIE_NAME, getCookieOptions, getClearCookieOptions } from '../config/jwt.js';
import { validateRegisterInput, validateLoginInput } from '../validators/auth.validator.js';
import { registerUser, loginUser } from '../services/auth.service.js';

/**
 * Handles user registration.
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { isValid, errors, sanitized } = validateRegisterInput(req.body);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors[0] || 'Invalid registration data.',
        errors
      });
    }

    const { user } = await registerUser(sanitized);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully. You can now sign in.',
      user
    });
  } catch (error) {
    if (error.status === 409) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Handles user authentication, token issuance, and HTTP-only cookie setting.
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { isValid, errors, sanitized } = validateLoginInput(req.body);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors[0] || 'Invalid login credentials.',
        errors
      });
    }

    const { user, token } = await loginUser(sanitized);

    // Set JWT in secure HTTP-only cookie
    res.cookie(AUTH_COOKIE_NAME, token, getCookieOptions(env.isProduction));

    return res.status(200).json({
      success: true,
      message: 'Signed in successfully.',
      user
    });
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Returns current authenticated user profile.
 * GET /api/auth/me
 */
export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user
  });
};

/**
 * Handles user logout by clearing the authentication cookie.
 * POST /api/auth/logout
 */
export const logout = async (req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, getClearCookieOptions(env.isProduction));

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
};

export default {
  register,
  login,
  getMe,
  logout
};

