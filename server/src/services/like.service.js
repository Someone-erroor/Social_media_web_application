import { Post, Like, User, Notification, ActivityLog } from '../models/index.js';
import { sendNotificationToUser } from './socket.service.js';

/**
 * Likes a post.
 * Uses atomic/index constraints to prevent duplicate likes and race conditions.
 *
 * @param {object} params
 * @param {string} params.postId - Post ObjectId
 * @param {string} params.userId - Authenticated user ObjectId
 * @param {object} params.user - Authenticated user object
 * @returns {Promise<{ likesCount: number, hasLiked: boolean }>}
 */
export const likePost = async ({ postId, userId, user }) => {
  // 1. Verify post exists and is not from a suspended user
  const post = await Post.findById(postId).populate('author', 'accountStatus');
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

  // 2. Check if already liked to provide clean feedback
  const existingLike = await Like.findOne({ post: postId, user: userId });
  if (existingLike) {
    const error = new Error('You have already liked this post.');
    error.status = 409;
    throw error;
  }

  // 3. Create Like document (enforced at DB level by compound index)
  try {
    await Like.create({ post: postId, user: userId });
  } catch (err) {
    if (err.code === 11000) {
      const error = new Error('You have already liked this post.');
      error.status = 409;
      throw error;
    }
    throw err;
  }

  // 4. Record Activity Log
  try {
    const auditLog = new ActivityLog({
      actor: userId,
      action: 'like_creation',
      targetType: 'Post',
      targetId: postId,
      metadata: {
        postId: postId.toString(),
        likedAt: new Date().toISOString()
      }
    });
    await auditLog.save();
  } catch (auditErr) {
    console.error(`[ActivityLog] Failed to log like: ${auditErr.message}`);
  }

  // 5. Create persistent notification for post author (if not self-like)
  const authorId = post.author._id || post.author;
  if (authorId.toString() !== userId.toString()) {
    try {
      const notification = await Notification.create({
        recipient: authorId,
        actor: userId,
        type: 'post_like',
        message: `${user.fullName} liked your post.`,
        resourceType: 'Post',
        resourceId: postId
      });

      // Populate actor for real-time delivery
      await notification.populate('actor', 'fullName profile.avatarUrl');

      // Dispatch real-time Socket.IO event
      sendNotificationToUser(authorId, notification);
    } catch (notifErr) {
      console.error(`[Notification] Failed to create post_like notification: ${notifErr.message}`);
    }
  }

  // 6. Get updated like count
  const likesCount = await Like.countDocuments({ post: postId });

  return {
    likesCount,
    hasLiked: true
  };
};

/**
 * Unlikes a post.
 *
 * @param {object} params
 * @param {string} params.postId - Post ObjectId
 * @param {string} params.userId - Authenticated user ObjectId
 * @returns {Promise<{ likesCount: number, hasLiked: boolean }>}
 */
export const unlikePost = async ({ postId, userId }) => {
  const post = await Post.findById(postId);
  if (!post) {
    const error = new Error('Post not found.');
    error.status = 404;
    throw error;
  }

  const deletedLike = await Like.findOneAndDelete({ post: postId, user: userId });
  if (!deletedLike) {
    const error = new Error('You have not liked this post.');
    error.status = 404;
    throw error;
  }

  const likesCount = await Like.countDocuments({ post: postId });

  return {
    likesCount,
    hasLiked: false
  };
};

/**
 * Retrieves like count and user like status for a post.
 *
 * @param {object} params
 * @param {string} params.postId - Post ObjectId
 * @param {string} [params.userId] - Optional authenticated user ObjectId
 * @returns {Promise<{ likesCount: number, hasLiked: boolean }>}
 */
export const getPostLikes = async ({ postId, userId }) => {
  const post = await Post.findById(postId);
  if (!post) {
    const error = new Error('Post not found.');
    error.status = 404;
    throw error;
  }

  const [likesCount, userLike] = await Promise.all([
    Like.countDocuments({ post: postId }),
    userId ? Like.findOne({ post: postId, user: userId }) : Promise.resolve(null)
  ]);

  return {
    likesCount,
    hasLiked: Boolean(userLike)
  };
};

