import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import {
  handleGetDashboardStats,
  handleGetDashboardActivity,
  handleGetAdminUsers,
  handleGetAdminUserById,
  handleUpdateUserStatus,
  handleUpdateUserRole,
  handleGetAdminPosts,
  handleAdminDeletePost,
  handleGetAdminComments,
  handleAdminDeleteComment
} from '../controllers/admin.controller.js';

const router = Router();

// Enforce authentication and administrator role clearance across all routes
router.use(requireAuth, requireRole('admin'));

/**
 * Administrative Overview / Status Endpoint
 * GET /api/admin/status
 */
router.get('/status', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Welcome to the administrative portal.',
    admin: req.user
  });
});

// Phase 11: Admin Dashboard Statistics & Activity
router.get('/stats', handleGetDashboardStats);
router.get('/dashboard/stats', handleGetDashboardStats);
router.get('/activity', handleGetDashboardActivity);
router.get('/dashboard/activity', handleGetDashboardActivity);

// Phase 12: User Management
router.get('/users', handleGetAdminUsers);
router.get('/users/:userId', handleGetAdminUserById);
router.patch('/users/:userId/status', handleUpdateUserStatus);
router.patch('/users/:userId/role', handleUpdateUserRole);

// Phase 12: Post Moderation
router.get('/posts', handleGetAdminPosts);
router.delete('/posts/:postId', handleAdminDeletePost);

// Phase 12: Comment Moderation
router.get('/comments', handleGetAdminComments);
router.delete('/comments/:commentId', handleAdminDeleteComment);

// Phase 4: Trust & Safety Admin Center
router.get('/reports', async (req, res, next) => {
  const { handleGetAdminReports } = await import('../controllers/admin.controller.js');
  return handleGetAdminReports(req, res, next);
});
router.patch('/reports/:reportId/status', async (req, res, next) => {
  const { handleUpdateReportStatus } = await import('../controllers/admin.controller.js');
  return handleUpdateReportStatus(req, res, next);
});
router.post('/moderation', async (req, res, next) => {
  const { handleApplyModerationAction } = await import('../controllers/admin.controller.js');
  return handleApplyModerationAction(req, res, next);
});
router.get('/appeals', async (req, res, next) => {
  const { handleGetAdminAppeals } = await import('../controllers/admin.controller.js');
  return handleGetAdminAppeals(req, res, next);
});
router.patch('/appeals/:appealId', async (req, res, next) => {
  const { handleReviewAdminAppeal } = await import('../controllers/admin.controller.js');
  return handleReviewAdminAppeal(req, res, next);
});

export default router;
