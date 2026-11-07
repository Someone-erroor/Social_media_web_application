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

  const postObj = post.toObject ? post.toObject() : { ...post };
  postObj.likesCount = 0;
  postObj.commentsCount = 0;

  return postObj;
};

/**
 * Retrieves a single post by ID with populated author details.
 *
 * @param {string} postId - Post ID
 * @returns {Promise<object>} Populated post document
 */
export const getPostById = async (postId, viewerId = null, viewerRole = null) => {
  const post = await Post.findById(postId).populate('author', SAFE_AUTHOR_FIELDS);
  if (!post || !post.author) {
    const error = new Error('Post not found.');
    error.status = 404;
    throw error;
  }

  // Ensure author account is active and retrieve privacy/blocking configuration
  const authorUser = await User.findById(post.author._id || post.author).select('accountStatus isPrivate followers blockedUsers');
  if (!authorUser || authorUser.accountStatus === 'suspended') {
    const error = new Error('Post not found.');
    error.status = 404;
    throw error;
  }

  // Blocking relationship check: posts are invisible across blocked relationships
  if (viewerId) {
    const authorBlockedViewer = (authorUser.blockedUsers || []).some(
      (id) => id.toString() === viewerId.toString()
    );
    if (authorBlockedViewer) {
      const error = new Error('Post not found.');
      error.status = 404;
      throw error;
    }

    const viewerUser = await User.findById(viewerId).select('blockedUsers');
    const viewerBlockedAuthor = (viewerUser?.blockedUsers || []).some(
      (id) => id.toString() === authorUser._id.toString()
    );
    if (viewerBlockedAuthor) {
      const error = new Error('Post not found.');
      error.status = 404;
      throw error;
    }
  }

  // Privacy protection: enforce follower access for private accounts
  if (authorUser.isPrivate) {
    const isAuthor = viewerId && authorUser._id.toString() === viewerId.toString();
    const isAdmin = viewerRole === 'admin';
    const isFollower = viewerId && (authorUser.followers || []).some(
      (id) => id.toString() === viewerId.toString()
    );

    if (!isAuthor && !isAdmin && !isFollower) {
      const error = new Error('This account is private. Follow this user to see their posts.');
      error.status = 403;
      throw error;
    }
  }

  const [likesCount, commentsCount] = await Promise.all([
    Like.countDocuments({ post: postId }),
    Comment.countDocuments({ post: postId })
  ]);

  const postObj = post.toObject ? post.toObject() : { ...post };
  postObj.likesCount = likesCount;
  postObj.commentsCount = commentsCount;

  return postObj;
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

  const enrichedPosts = await Promise.all(
    posts.map(async (p) => {
      const [likesCount, commentsCount] = await Promise.all([
        Like.countDocuments({ post: p._id }),
        Comment.countDocuments({ post: p._id })
      ]);
      const obj = p.toObject ? p.toObject() : { ...p };
      obj.likesCount = likesCount;
      obj.commentsCount = commentsCount;
      return obj;
    })
  );

  return {
    posts: enrichedPosts,
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
export const getUserPosts = async ({ userId, viewerId = null, page = 1, limit = 10, skip = 0 }) => {
  // 1. Verify author account exists, is active, and privacy allows viewing
  const targetUser = await User.findById(userId).select('accountStatus isPrivate followers blockedUsers');
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

  // Blocking restriction
  if (viewerId && (targetUser.blockedUsers || []).some((id) => id.toString() === viewerId.toString())) {
    return {
      posts: [],
      isBlocked: true,
      pagination: { total: 0, page: Number(page), limit: Number(limit), totalPages: 1 }
    };
  }

  // Privacy enforcement: private accounts require following or ownership
  const isOwn = viewerId && viewerId.toString() === userId.toString();
  const isFollower = viewerId && (targetUser.followers || []).some((id) => id.toString() === viewerId.toString());
  if (targetUser.isPrivate && !isOwn && !isFollower) {
    return {
      posts: [],
      isPrivate: true,
      canViewPosts: false,
      message: 'This account is private. Follow this account to see their posts.',
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

  const enrichedPosts = await Promise.all(
    posts.map(async (p) => {
      const [likesCount, commentsCount] = await Promise.all([
        Like.countDocuments({ post: p._id }),
        Comment.countDocuments({ post: p._id })
      ]);
      const obj = p.toObject ? p.toObject() : { ...p };
      obj.likesCount = likesCount;
      obj.commentsCount = commentsCount;
      return obj;
    })
  );

  return {
    posts: enrichedPosts,
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
export const getFeed = async ({ userId = null, mode = 'latest', page = 1, limit = 10, skip = 0 }) => {
  let currentUser = null;
  let followingIds = [];
  let blockedIds = [];

  if (userId) {
    currentUser = await User.findById(userId).select('following blockedUsers');
    if (currentUser) {
      followingIds = (currentUser.following || []).map((id) => id);
      blockedIds = (currentUser.blockedUsers || []).map((id) => id);
    }
  }

  const matchConditions = {
    'authorDoc.accountStatus': 'active'
  };

  if (blockedIds.length > 0) {
    matchConditions['authorDoc._id'] = { $nin: blockedIds };
  }

  // User-Controlled Feed modes:
  if (mode === 'following') {
    matchConditions['authorDoc._id'] = { $in: followingIds };
  } else if (mode === 'explore') {
    matchConditions['authorDoc.isPrivate'] = { $ne: true };
  } else {
    // 'latest' mode: hide private accounts unless viewer is author or following them
    if (userId) {
      matchConditions.$or = [
        { 'authorDoc.isPrivate': { $ne: true } },
        { 'authorDoc._id': new mongoose.Types.ObjectId(userId) },
        { 'authorDoc._id': { $in: followingIds } }
      ];
    } else {
      matchConditions['authorDoc.isPrivate'] = { $ne: true };
    }
  }

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
    { $match: matchConditions }
  ];

  const sortStage = mode === 'explore'
    ? { $sort: { likesCount: -1, commentsCount: -1, createdAt: -1 } }
    : { $sort: { createdAt: -1 } };

  const [countResult, rawPosts] = await Promise.all([
    Post.aggregate([...matchStages, { $count: 'total' }]),
    Post.aggregate([
      ...matchStages,
      {
        $lookup: {
          from: 'likes',
          localField: '_id',
          foreignField: 'post',
          as: 'likes'
        }
      },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'post',
          as: 'comments'
        }
      },
      {
        $project: {
          _id: 1,
          content: 1,
          circle: 1,
          createdAt: 1,
          updatedAt: 1,
          likesCount: { $size: '$likes' },
          commentsCount: { $size: '$comments' },
          author: {
            _id: '$authorDoc._id',
            fullName: '$authorDoc.fullName',
            role: '$authorDoc.role',
            isPrivate: '$authorDoc.isPrivate',
            profile: {
              avatarUrl: '$authorDoc.profile.avatarUrl',
              bio: '$authorDoc.profile.bio'
            },
            createdAt: '$authorDoc.createdAt'
          }
        }
      },
      sortStage,
      { $skip: skip },
      { $limit: limit }
    ])
  ]);

  const total = countResult.length > 0 ? countResult[0].total : 0;

  const reasonMap = {
    following: 'Following — Chronological from creators you follow',
    explore: 'Explore — Trending discussions across Looply',
    latest: 'Latest — Real-time community timeline'
  };

  const posts = rawPosts.map((p) => ({
    ...p,
    feedMode: mode,
    recommendationReason: reasonMap[mode] || reasonMap.latest
  }));

  return {
    posts,
    mode,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit) || 1
    }
  };
};

export const getExplorePosts = async ({ userId = null, page, limit, skip }) => {
  return getFeed({ userId, mode: 'explore', page, limit, skip });
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

  const [likesCount, commentsCount] = await Promise.all([
    Like.countDocuments({ post: postId }),
    Comment.countDocuments({ post: postId })
  ]);

  const postObj = post.toObject ? post.toObject() : { ...post };
  postObj.likesCount = likesCount;
  postObj.commentsCount = commentsCount;

  return postObj;
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

