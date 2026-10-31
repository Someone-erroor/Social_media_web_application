import { isValidObjectId } from '../validators/comment.validator.js';
import { likePost, unlikePost, getPostLikes } from '../services/like.service.js';

/**
 * Likes a post.
 * POST /api/posts/:postId/like
 */
export const handleLikePost = async (req, res, next) => {
  try {
    const { postId } = req.params;

    if (!isValidObjectId(postId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID format.'
      });
    }

    if (!req.user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address to interact with posts.'
      });
    }

    const result = await likePost({
      postId,
      userId: req.user._id,
      user: req.user
    });

    return res.status(201).json({
      success: true,
      message: 'Post liked successfully.',
      ...result
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
 * Unlikes a post.
 * DELETE /api/posts/:postId/like
 */
export const handleUnlikePost = async (req, res, next) => {
  try {
    const { postId } = req.params;

    if (!isValidObjectId(postId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID format.'
      });
    }

    const result = await unlikePost({
      postId,
      userId: req.user._id
    });

    return res.status(200).json({
      success: true,
      message: 'Post unliked successfully.',
      ...result
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
 * Retrieves like count and user like status for a post.
 * GET /api/posts/:postId/likes
 */
export const handleGetPostLikes = async (req, res, next) => {
  try {
    const { postId } = req.params;

    if (!isValidObjectId(postId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID format.'
      });
    }

    const result = await getPostLikes({
      postId,
      userId: req.user ? req.user._id : null
    });

    return res.status(200).json({
      success: true,
      ...result
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

