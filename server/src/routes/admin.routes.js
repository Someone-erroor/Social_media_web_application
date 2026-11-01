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

export default router;
