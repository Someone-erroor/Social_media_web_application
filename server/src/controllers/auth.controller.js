import { env } from '../config/env.js';
import { AUTH_COOKIE_NAME, getCookieOptions, getClearCookieOptions } from '../config/jwt.js';
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
  try {
    const { isValid, errors, sanitized } = validateRegisterInput(req.body);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors[0] || 'Invalid registration data.',
        errors
      });
    }

    const { user, emailDispatched } = await registerUser(sanitized);

    return res.status(201).json({
      success: true,
      message: emailDispatched
        ? 'Account created successfully. Please check your email to verify your account.'
        : 'Account created successfully. Verification email could not be dispatched immediately; please use resend verification.',
      emailDispatched,
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
  verifyEmail,
  resendVerification,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  logout
};
