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
  registerAdminUser,
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
 * Handles administrator registration/provisioning directly from the UI.
 * POST /api/auth/register-admin
 */
export const registerAdmin = async (req, res, next) => {
  try {
    const { isValid, errors, sanitized } = validateRegisterInput(req.body);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors[0] || 'Invalid administrator registration data.',
        errors
      });
    }

    const { user, token } = await registerAdminUser(sanitized);

    // Set JWT in secure HTTP-only cookie
    res.cookie(AUTH_COOKIE_NAME, token, getCookieOptions(env.isProduction));

    return res.status(201).json({
      success: true,
      message: 'Administrator account created successfully. Welcome to the Admin Console.',
      token,
      user
    });
  } catch (error) {
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

    const { user, alreadyVerified } = await verifyEmailService(sanitized.token, sanitized.email);

    return res.status(200).json({
      success: true,
      alreadyVerified: Boolean(alreadyVerified),
      message: alreadyVerified
        ? 'Your email is already verified. You can now sign in.'
        : 'Email verified successfully. You can now sign in.',
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
      alreadyVerified: Boolean(result.alreadyVerified),
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles instant demo verification for evaluation and test accounts.
 * POST /api/auth/demo-verify
 */
export const demoVerify = async (req, res, next) => {
  try {
    const email = req.body?.email?.trim()?.toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email address.' });
    }

    user.isEmailVerified = true;
    user.verificationTokenHash = undefined;
    user.verificationTokenExpiresAt = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Account successfully verified! You can now sign in to Looply.'
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
      token,
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
    user: req.user,
    token: req.token || undefined
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
