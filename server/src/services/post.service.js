import { Post, Comment, Like, ActivityLog } from '../models/index.js';

const SAFE_AUTHOR_FIELDS = 'fullName profile.avatarUrl createdAt';

/**
 * Creates a new community post.
 * Authoritatively assigns the authenticated user ID as author.
 *
 * @param {object} params
 * @param {string} params.authorId - Authenticated user ObjectId
 * @param {string} params.content - Validated post content
 * @returns {Promise<object>} Created post populated with author details
 */
export const createPost = async ({ authorId, content }) => {
  const post = new Post({
    author: authorId,
    content
  });

  await post.save();

  // Populate safe author attributes for immediate UI display
  await post.populate('author', SAFE_AUTHOR_FIELDS);

  try {
    const auditLog = new ActivityLog({
      actor: authorId,
      action: 'post_creation',
      targetType: 'Post',
      targetId: post._id,
      metadata: {
        contentLength: content.length,
        createdAt: new Date().toISOString()
      }
    });
    await auditLog.save();
  } catch (auditErr) {
    console.error(`[ActivityLog] Failed to record post creation: ${auditErr.message}`);
  }

  return post;
};

/**
 * Retrieves a single post by ID with populated author details.
 *
 * @param {string} postId - Post ID
 * @returns {Promise<object>} Populated post document
 */
export const getPostById = async (postId) => {
  const post = await Post.findById(postId).populate('author', SAFE_AUTHOR_FIELDS);
  if (!post) {
    const error = new Error('Post not found.');
    error.status = 404;
    throw error;
  }
  return post;
};

/**
 * Retrieves posts authored by the authenticated user with pagination.
 *
 * @param {object} params
 * @param {string} params.authorId - Authenticated user ID
 * @param {number} params.page - Current page
 * @param {number} params.limit - Page size
 * @param {number} params.skip - Query offset
 * @returns {Promise<{ posts: object[], pagination: object }>}
 */
export const getMyPosts = async ({ authorId, page, limit, skip }) => {
  const filter = { author: authorId };

  const [posts, total] = await Promise.all([
    Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', SAFE_AUTHOR_FIELDS),
    Post.countDocuments(filter)
  ]);

  return {
    posts,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
};

/**
 * Retrieves posts authored by a specific user (for public profile timeline).
 *
 * @param {object} params
 * @param {string} params.userId - Target user ID
 * @param {number} params.page - Current page
 * @param {number} params.limit - Page size
 * @param {number} params.skip - Query offset
 * @returns {Promise<{ posts: object[], pagination: object }>}
 */
export const getUserPosts = async ({ userId, page, limit, skip }) => {
  const filter = { author: userId };

  const [posts, total] = await Promise.all([
    Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', SAFE_AUTHOR_FIELDS),
    Post.countDocuments(filter)
  ]);

  return {
    posts,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
};

/**
 * Retrieves the global social media feed ordered chronologically (newest first).
 *
 * @param {object} params
 * @param {number} params.page - Current page
 * @param {number} params.limit - Page size
 * @param {number} params.skip - Query offset
 * @returns {Promise<{ posts: object[], pagination: object }>}
 */
export const getFeed = async ({ page, limit, skip }) => {
  const [posts, total] = await Promise.all([
    Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', SAFE_AUTHOR_FIELDS),
    Post.countDocuments()
  ]);

  return {
    posts,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
};

/**
 * Retrieves recent public posts for the explore/discovery view.
 *
 * @param {object} params
 * @param {number} params.page - Current page
 * @param {number} params.limit - Page size
 * @param {number} params.skip - Query offset
 * @returns {Promise<{ posts: object[], pagination: object }>}
 */
export const getExplorePosts = async ({ page, limit, skip }) => {
  return getFeed({ page, limit, skip });
};

/**
 * Updates an existing post's content.
 * Strictly verifies author ownership before updating.
 *
 * @param {object} params
 * @param {string} params.postId - Target post ID
 * @param {string} params.authorId - Current authenticated user ID
 * @param {string} params.content - New content
 * @returns {Promise<object>} Updated post
 */
export const updatePost = async ({ postId, authorId, content }) => {
  const post = await Post.findById(postId);
  if (!post) {
    const error = new Error('Post not found.');
    error.status = 404;
    throw error;
  }

  // Author ownership verification
  if (post.author.toString() !== authorId.toString()) {
    const error = new Error('You do not have permission to edit this post.');
    error.status = 403;
    throw error;
  }

  post.content = content;
  await post.save();
  await post.populate('author', SAFE_AUTHOR_FIELDS);

  try {
    const auditLog = new ActivityLog({
      actor: authorId,
      action: 'post_update',
      targetType: 'Post',
      targetId: post._id,
      metadata: {
        updatedAt: new Date().toISOString()
      }
    });
    await auditLog.save();
  } catch (auditErr) {
    console.error(`[ActivityLog] Failed to record post update: ${auditErr.message}`);
  }

  return post;
};

/**
 * Deletes a post and cleans up associated comments and likes.
 * Strictly verifies author ownership before deletion.
 *
 * @param {object} params
 * @param {string} params.postId - Target post ID
 * @param {string} params.authorId - Current authenticated user ID
 * @returns {Promise<boolean>} Success flag
 */
export const deletePost = async ({ postId, authorId }) => {
  const post = await Post.findById(postId);
  if (!post) {
    const error = new Error('Post not found.');
    error.status = 404;
    throw error;
  }

  // Author ownership verification
  if (post.author.toString() !== authorId.toString()) {
    const error = new Error('You do not have permission to delete this post.');
    error.status = 403;
    throw error;
  }

  // Safe cleanup of related interaction records
  await Promise.all([
    Post.findByIdAndDelete(postId),
    Comment.deleteMany({ post: postId }),
    Like.deleteMany({ post: postId })
  ]);

  try {
    const auditLog = new ActivityLog({
      actor: authorId,
      action: 'post_deletion',
      targetType: 'Post',
      targetId: postId,
      metadata: {
        deletedAt: new Date().toISOString()
      }
    });
    await auditLog.save();
  } catch (auditErr) {
    console.error(`[ActivityLog] Failed to record post deletion: ${auditErr.message}`);
  }

  return true;
};

export default {
  createPost,
  getPostById,
  getMyPosts,
  getUserPosts,
  getFeed,
  getExplorePosts,
  updatePost,
  deletePost
};

