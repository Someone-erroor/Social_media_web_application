import { Router } from 'express';
import {
  register,
  registerAdmin,
  verifyEmail,
  resendVerification,
  demoVerify,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  logout
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

// Public Authentication & Registration Endpoints
router.post('/register', authRateLimiter, register);
router.post('/register-admin', authRateLimiter, registerAdmin);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/demo-verify', demoVerify);
router.post('/login', authRateLimiter, login);
router.post('/forgot-password', authRateLimiter, forgotPassword);
router.post('/reset-password', authRateLimiter, resetPassword);
router.post('/logout', logout);

// Authenticated Session Verification Endpoint
router.get('/me', authenticate, getMe);

export default router;
