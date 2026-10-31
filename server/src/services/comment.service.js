import { Post, Comment, User, Notification, ActivityLog } from '../models/index.js';
import { sendNotificationToUser } from './socket.service.js';

const SAFE_AUTHOR_FIELDS = 'fullName profile.avatarUrl role createdAt accountStatus';

/**
 * Creates a new comment under a post.
 *
 * @param {object} params
 * @param {string} params.postId - Target post ObjectId
 * @param {string} params.authorId - Comment creator ObjectId
 * @param {object} params.user - Current user object
 * @param {string} params.content - Validated comment content
 * @returns {Promise<object>} Created comment populated with author details
 */
export const createComment = async ({ postId, authorId, user, content }) => {
  const post = await Post.findById(postId).populate('author', 'accountStatus fullName');
  if (!post) {
    const error = new Error('Post not found.');
    error.status = 404;
    throw error;
  }

  if (post.author && post.author.accountStatus === 'suspended') {
    const error = new Error('Post content is unavailable.');
    error.status = 404;
    throw error;
  }

  const comment = new Comment({
    post: postId,
    author: authorId,
    content
  });

  await comment.save();
  await comment.populate('author', SAFE_AUTHOR_FIELDS);

  // Record Activity Log
  try {
    const auditLog = new ActivityLog({
      actor: authorId,
      action: 'comment_creation',
      targetType: 'Post',
      targetId: postId,
      metadata: {
        commentId: comment._id.toString(),
        contentLength: content.length,
        createdAt: new Date().toISOString()
      }
    });
    await auditLog.save();
  } catch (auditErr) {
    console.error(`[ActivityLog] Failed to log comment: ${auditErr.message}`);
  }

  // Create persistent notification for post author (if not self-comment)
  const targetAuthorId = post.author._id || post.author;
  if (targetAuthorId.toString() !== authorId.toString()) {
    try {
      const preview = content.length > 50 ? `${content.slice(0, 50)}...` : content;
      const notification = await Notification.create({
        recipient: targetAuthorId,
        actor: authorId,
        type: 'post_comment',
        message: `${user.fullName} commented on your post: "${preview}"`,
        resourceType: 'Post',
        resourceId: postId
      });

      await notification.populate('actor', 'fullName profile.avatarUrl');
      sendNotificationToUser(targetAuthorId, notification);
    } catch (notifErr) {
      console.error(`[Notification] Failed to create post_comment notification: ${notifErr.message}`);
    }
  }

  return comment;
};

/**
 * Retrieves paginated comments for a specific post.
 * Excludes comments from suspended authors.
 *
 * @param {object} params
 * @param {string} params.postId - Post ObjectId
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.limit=10] - Comments per page
 * @returns {Promise<{ comments: object[], pagination: object }>}
 */
export const getPostComments = async ({ postId, page = 1, limit = 10 }) => {
  const post = await Post.findById(postId);
  if (!post) {
    const error = new Error('Post not found.');
    error.status = 404;
    throw error;
  }

  const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, Number.parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  // Retrieve comments with populated author
  const rawComments = await Comment.find({ post: postId })
    .sort({ createdAt: -1 })
    .populate('author', SAFE_AUTHOR_FIELDS);

  // Filter out comments from suspended authors
  const activeComments = rawComments.filter(
    (c) => c.author && c.author.accountStatus !== 'suspended'
  );

  const total = activeComments.length;
  const paginated = activeComments.slice(skip, skip + limitNum);

  return {
    comments: paginated,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1
    }
  };
};

/**
 * Updates a comment's content.
 * Enforces author ownership.
 *
 * @param {object} params
 * @param {string} params.commentId - Comment ObjectId
 * @param {string} params.authorId - Requesting user ObjectId
 * @param {string} params.content - New comment content
 * @returns {Promise<object>} Updated comment
 */
export const updateComment = async ({ commentId, authorId, content }) => {
  const comment = await Comment.findById(commentId);
  if (!comment) {
    const error = new Error('Comment not found.');
    error.status = 404;
    throw error;
  }

  // Author ownership check
  if (comment.author.toString() !== authorId.toString()) {
    const error = new Error('Access denied. You do not have permission to edit this comment.');
    error.status = 403;
    throw error;
  }

  comment.content = content;
  await comment.save();
  await comment.populate('author', SAFE_AUTHOR_FIELDS);

  return comment;
};

/**
 * Deletes a comment.
 * Enforces author ownership unless requested by an administrator.
 *
 * @param {object} params
 * @param {string} params.commentId - Comment ObjectId
 * @param {string} params.authorId - Requesting user ObjectId
 * @param {boolean} [params.isAdmin=false] - Whether requester is admin
 * @returns {Promise<void>}
 */
export const deleteComment = async ({ commentId, authorId, isAdmin = false }) => {
  const comment = await Comment.findById(commentId);
  if (!comment) {
    const error = new Error('Comment not found.');
    error.status = 404;
    throw error;
  }

  // Ownership check
  if (!isAdmin && comment.author.toString() !== authorId.toString()) {
    const error = new Error('Access denied. You do not have permission to delete this comment.');
    error.status = 403;
    throw error;
  }

  await Comment.findByIdAndDelete(commentId);

  // Record audit log
  try {
    const auditLog = new ActivityLog({
      actor: authorId,
      action: isAdmin ? 'admin_action' : 'post_deletion',
      targetType: 'Comment',
      targetId: commentId,
      metadata: {
        commentId: commentId.toString(),
        deletedByAdmin: isAdmin,
        deletedAt: new Date().toISOString()
      }
    });
    await auditLog.save();
  } catch (auditErr) {
    console.error(`[ActivityLog] Failed to log comment deletion: ${auditErr.message}`);
  }
};

