import { isValidObjectId, validateCommentInput } from '../validators/comment.validator.js';
import {
  createComment,
  getPostComments,
  updateComment,
  deleteComment
} from '../services/comment.service.js';

/**
 * Creates a new comment under a post.
 * POST /api/posts/:postId/comments
 */
export const handleCreateComment = async (req, res, next) => {
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
        message: 'Please verify your email address to comment on posts.'
      });
    }

    const { isValid, errors, sanitized } = validateCommentInput(req.body);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors[0] || 'Invalid comment input.',
        errors
      });
    }

    const comment = await createComment({
      postId,
      authorId: req.user._id,
      user: req.user,
      content: sanitized.content
    });

    return res.status(201).json({
      success: true,
      message: 'Comment posted successfully.',
      comment
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
 * Retrieves comments for a post with pagination.
 * GET /api/posts/:postId/comments
 */
export const handleGetPostComments = async (req, res, next) => {
  try {
    const { postId } = req.params;

    if (!isValidObjectId(postId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID format.'
      });
    }

    const { page, limit } = req.query;

    const result = await getPostComments({
      postId,
      page,
      limit
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

/**
 * Updates a comment.
 * PATCH /api/comments/:commentId
 */
export const handleUpdateComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid comment ID format.'
      });
    }

    const { isValid, errors, sanitized } = validateCommentInput(req.body);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors[0] || 'Invalid comment input.',
        errors
      });
    }

    const updated = await updateComment({
      commentId,
      authorId: req.user._id,
      content: sanitized.content
    });

    return res.status(200).json({
      success: true,
      message: 'Comment updated successfully.',
      comment: updated
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
 * Deletes a comment.
 * DELETE /api/comments/:commentId
 */
export const handleDeleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid comment ID format.'
      });
    }

    await deleteComment({
      commentId,
      authorId: req.user._id,
      isAdmin: req.user.role === 'admin'
    });

    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully.'
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

