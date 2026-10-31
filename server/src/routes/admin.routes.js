import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * Administrative Overview / Status Endpoint
 * GET /api/admin/status
 * Strictly requires active authenticated session with role: 'admin'.
 */
router.get('/status', requireAuth, requireRole('admin'), (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Welcome to the administrative portal.',
    admin: req.user
  });
});

export default router;

