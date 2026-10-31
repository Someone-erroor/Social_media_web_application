import mongoose from 'mongoose';
import { User, Post, Comment, Like, ActivityLog } from '../models/index.js';

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
  if (!post || !post.author) {
    const error = new Error('Post not found.');
    error.status = 404;
    throw error;
  }

  // Ensure author account is active and not suspended
  const authorUser = await User.findById(post.author._id || post.author).select('accountStatus');
  if (!authorUser || authorUser.accountStatus === 'suspended') {
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
 * Excludes posts from suspended accounts or deleted users.
 *
 * @param {object} params
 * @param {string} params.userId - Target user ID
 * @param {number} params.page - Current page
 * @param {number} params.limit - Page size
 * @param {number} params.skip - Query offset
 * @returns {Promise<{ posts: object[], pagination: object }>}
 */
export const getUserPosts = async ({ userId, page = 1, limit = 10, skip = 0 }) => {
  // 1. Verify author account exists and is active (not suspended or deleted)
  const targetUser = await User.findById(userId).select('accountStatus');
  if (!targetUser || targetUser.accountStatus === 'suspended') {
    return {
      posts: [],
      pagination: {
        total: 0,
        page: Number(page),
        limit: Number(limit),
        totalPages: 1
      }
    };
  }

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
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit) || 1
    }
  };
};

/**
 * Retrieves the global social media feed ordered chronologically (newest first).
 * Excludes posts from suspended accounts or deleted users via database aggregation.
 *
 * @param {object} params
 * @param {number} params.page - Current page
 * @param {number} params.limit - Page size
 * @param {number} params.skip - Query offset
 * @returns {Promise<{ posts: object[], pagination: object }>}
 */
export const getFeed = async ({ page = 1, limit = 10, skip = 0 }) => {
  const matchStages = [
    {
      $lookup: {
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        as: 'authorDoc'
      }
    },
    { $unwind: '$authorDoc' },
    {
      $match: {
        'authorDoc.accountStatus': 'active'
      }
    }
  ];

  const [countResult, posts] = await Promise.all([
    Post.aggregate([...matchStages, { $count: 'total' }]),
    Post.aggregate([
      ...matchStages,
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          content: 1,
          createdAt: 1,
          updatedAt: 1,
          author: {
            _id: '$authorDoc._id',
            fullName: '$authorDoc.fullName',
            role: '$authorDoc.role',
            profile: {
              avatarUrl: '$authorDoc.profile.avatarUrl',
              bio: '$authorDoc.profile.bio'
            },
            createdAt: '$authorDoc.createdAt'
          }
        }
      }
    ])
  ]);

  const total = countResult.length > 0 ? countResult[0].total : 0;

  return {
    posts,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit) || 1
    }
  };
};

/**
 * Retrieves recent public posts for the explore/discovery view.
 * Excludes posts from suspended accounts or deleted users.
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
 * Deletes a post and cleans up associated comments and likes atomically using MongoDB transactions.
 * Strictly verifies author ownership before deletion.
 *
 * @param {object} params
 * @param {string} params.postId - Target post ID
 * @param {string} params.authorId - Current authenticated user ID
 * @param {boolean} [params._forceFailForTest] - Test hook to simulate mid-transaction failure
 * @returns {Promise<boolean>} Success flag
 */
export const deletePost = async ({ postId, authorId, _forceFailForTest = false }) => {
  // 1. Start a Mongoose session
  const session = await mongoose.startSession();
  // 2. Start a transaction
  session.startTransaction();

  try {
    // 3. Retrieve the target post inside the transaction
    const post = await Post.findById(postId).session(session);
    if (!post) {
      const error = new Error('Post not found.');
      error.status = 404;
      throw error;
    }

    // 4. Verify that the authenticated user owns the post
    if (post.author.toString() !== authorId.toString()) {
      const error = new Error('You do not have permission to delete this post.');
      error.status = 403;
      throw error;
    }

    // 5. Delete the post using the transaction session
    await Post.findByIdAndDelete(postId, { session });

    // 6. Delete associated comments sequentially using the same session
    await Comment.deleteMany({ post: postId }, { session });

    // 7. Delete associated likes sequentially using the same session
    await Like.deleteMany({ post: postId }, { session });

    // Test hook: simulate transaction failure to verify rollback
    if (_forceFailForTest) {
      throw new Error('Simulated failure during atomic post deletion');
    }

    // 8. Commit the transaction
    await session.commitTransaction();
  } catch (err) {
    // Abort the transaction and preserve original data if any operation fails
    await session.abortTransaction();
    throw err;
  } finally {
    // 9. End the session in finally
    await session.endSession();
  }

  // Preserve ActivityLog functionality outside the transaction (non-blocking)
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

