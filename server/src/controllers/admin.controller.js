import { isValidObjectId } from '../validators/comment.validator.js';
import {
  getDashboardStats,
  getDashboardActivity,
  getAdminUsers,
  getAdminUserById,
  updateUserStatus,
  getAdminPosts,
  adminDeletePost,
  getAdminComments,
  adminDeleteComment
} from '../services/admin.service.js';

/**
 * Retrieves platform statistics.
 * GET /api/admin/dashboard/stats
 */
export const handleGetDashboardStats = async (req, res, next) => {
  try {
    const stats = await getDashboardStats();
    return res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves platform audit events.
 * GET /api/admin/dashboard/activity
 */
export const handleGetDashboardActivity = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const activities = await getDashboardActivity(limit);
    return res.status(200).json({
      success: true,
      activities
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lists user accounts for administrative management.
 * GET /api/admin/users
 */
export const handleGetAdminUsers = async (req, res, next) => {
  try {
    const { page, limit, search, accountStatus, role } = req.query;
    const result = await getAdminUsers({ page, limit, search, accountStatus, role });
    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves details for a specific user.
 * GET /api/admin/users/:userId
 */
export const handleGetAdminUserById = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format.'
      });
    }

    const user = await getAdminUserById(userId);
    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Updates a user's account status (suspend/activate).
 * PATCH /api/admin/users/:userId/status
 */
export const handleUpdateUserStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format.'
      });
    }

    const { accountStatus } = req.body;
    if (!accountStatus || !['active', 'suspended'].includes(accountStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Valid accountStatus ("active" or "suspended") is required.'
      });
    }

    const updatedUser = await updateUserStatus({
      targetUserId: userId,
      accountStatus,
      adminUserId: req.user._id
    });

    return res.status(200).json({
      success: true,
      message: `User account has been successfully ${accountStatus === 'suspended' ? 'suspended' : 'activated'}.`,
      user: updatedUser
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Lists all posts for administration.
 * GET /api/admin/posts
 */
export const handleGetAdminPosts = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const result = await getAdminPosts({ page, limit, search });
    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deletes a post as administrator.
 * DELETE /api/admin/posts/:postId
 */
export const handleAdminDeletePost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    if (!isValidObjectId(postId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID format.'
      });
    }

    await adminDeletePost({
      postId,
      adminUserId: req.user._id
    });

    return res.status(200).json({
      success: true,
      message: 'Post and associated interactions deleted by administrator.'
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Lists platform comments for administration.
 * GET /api/admin/comments
 */
export const handleGetAdminComments = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const result = await getAdminComments({ page, limit, search });
    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deletes a comment as administrator.
 * DELETE /api/admin/comments/:commentId
 */
export const handleAdminDeleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    if (!isValidObjectId(commentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid comment ID format.'
      });
    }

    await adminDeleteComment({
      commentId,
      adminUserId: req.user._id
    });

    return res.status(200).json({
      success: true,
      message: 'Comment deleted by administrator.'
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

