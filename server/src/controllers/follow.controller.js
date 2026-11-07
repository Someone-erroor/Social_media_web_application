import {
  followUser as followUserService,
  unfollowUser as unfollowUserService,
  getFollowers as getFollowersService,
  getFollowing as getFollowingService,
  getFollowStatus as getFollowStatusService
} from '../services/follow.service.js';

/**
 * Follow a user.
 * POST /api/profiles/:userId/follow
 */
export const followUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const result = await followUserService(req.user._id, userId);
    return res.status(200).json(result);
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
 * Unfollow a user.
 * POST /api/profiles/:userId/unfollow
 * DELETE /api/profiles/:userId/follow
 */
export const unfollowUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const result = await unfollowUserService(req.user._id, userId);
    return res.status(200).json(result);
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
 * Retrieve a user's followers list.
 * GET /api/profiles/:userId/followers
 */
export const getFollowers = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const result = await getFollowersService(userId, req.user?._id || null);
    return res.status(200).json(result);
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
 * Retrieve a user's following list.
 * GET /api/profiles/:userId/following
 */
export const getFollowing = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const result = await getFollowingService(userId, req.user?._id || null);
    return res.status(200).json(result);
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
 * Retrieve follow relationship status.
 * GET /api/profiles/:userId/follow-status
 */
export const getFollowStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const result = await getFollowStatusService(userId, req.user?._id || null);
    return res.status(200).json(result);
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

export default {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getFollowStatus
};

