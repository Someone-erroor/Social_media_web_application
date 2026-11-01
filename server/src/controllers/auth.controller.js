import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { AUTH_COOKIE_NAME, getCookieOptions, getClearCookieOptions, verifyToken } from '../config/jwt.js';
import { User } from '../models/index.js';
import {
  validateRegisterInput,
  validateLoginInput,
  validateVerifyEmailInput,
  validateResendVerificationInput,
  validateForgotPasswordInput,
  validateResetPasswordInput
} from '../validators/auth.validator.js';
import {
  registerUser,
  verifyEmail as verifyEmailService,
  resendVerificationEmail as resendVerificationService,
  loginUser,
  forgotPassword as forgotPasswordService,
  resetPassword as resetPasswordService
} from '../services/auth.service.js';

/**
 * Handles user registration.
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  process.stdout.write(`\n[DEBUG REGISTER CONTROLLER] mongoose.connection.name: ${mongoose.connection.name} User.db.name: ${User.db?.name}\n`);
  try {
    const { isValid, errors, sanitized } = validateRegisterInput(req.body);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors[0] || 'Invalid registration data.',
        errors
      });
    }

    const { user, emailDispatched, deliveryMode } = await registerUser(sanitized);

    let message;
    if (deliveryMode === 'smtp') {
      message = 'Account created successfully. A verification email has been dispatched to your email address.';
    } else if (deliveryMode === 'preview') {
      message = 'Account created successfully. Verification email is available in the local development preview mailbox.';
    } else {
      message = 'Account created successfully. Email delivery is currently unavailable; please request a verification email later.';
    }

    return res.status(201).json({
      success: true,
      message,
      emailDispatched,
      deliveryMode,
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
 * Handles user email verification.
 * POST /api/auth/verify-email
 */
export const verifyEmail = async (req, res, next) => {
  try {
    const { isValid, errors, sanitized } = validateVerifyEmailInput(req.body);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors[0] || 'Invalid verification request.',
        errors
      });
    }

    const { user } = await verifyEmailService(sanitized.token);

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully. You can now sign in.',
      user
    });
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Handles resending verification email.
 * POST /api/auth/resend-verification
 */
export const resendVerification = async (req, res, next) => {
  try {
    const { isValid, errors, sanitized } = validateResendVerificationInput(req.body);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors[0] || 'Invalid request.',
        errors
      });
    }

    const result = await resendVerificationService(sanitized.email);

    return res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
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
 * Initiates forgot password procedure.
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { isValid, errors, sanitized } = validateForgotPasswordInput(req.body);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors[0] || 'Invalid request.',
        errors
      });
    }

    const result = await forgotPasswordService(sanitized.email);

    return res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Executes password reset with token.
 * POST /api/auth/reset-password
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { isValid, errors, sanitized } = validateResetPasswordInput(req.body);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors[0] || 'Invalid password reset data.',
        errors
      });
    }

    const result = await resetPasswordService(sanitized);

    return res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({
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
 * Handles user logout by invalidating the active session (incrementing tokenVersion)
 * and clearing the authentication cookie.
 * POST /api/auth/logout
 */
export const logout = async (req, res) => {
  try {
    let token = null;
    if (req.cookies && req.cookies[AUTH_COOKIE_NAME]) {
      token = req.cookies[AUTH_COOKIE_NAME];
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = verifyToken(token);
        if (decoded && decoded.userId) {
          await User.findByIdAndUpdate(decoded.userId, { $inc: { tokenVersion: 1 } });
        }
      } catch {
        // Token was expired or invalid; proceed with clearing cookie
      }
    }
  } catch (err) {
    // Non-blocking error handling to ensure cookie clear proceeds
  }

  res.clearCookie(AUTH_COOKIE_NAME, getClearCookieOptions(env.isProduction));

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
};

export default {
  register,
  verifyEmail,
  resendVerification,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  logout
};
