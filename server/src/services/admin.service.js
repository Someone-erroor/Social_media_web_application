import mongoose from 'mongoose';
import { User, Post, Comment, Like, Notification, ActivityLog } from '../models/index.js';

const SAFE_USER_FIELDS = 'fullName email role accountStatus isEmailVerified profile.avatarUrl profile.bio createdAt updatedAt';

/**
 * Computes platform-wide statistics from real database collections. (Phase 11)
 *
 * @returns {Promise<object>} Dashboard metrics summary
 */
export const getDashboardStats = async () => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - 7);
  startOfWeek.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    activeUsers,
    suspendedUsers,
    verifiedUsers,
    newRegistrationsToday,
    newRegistrationsThisWeek,
    totalPosts,
    totalComments,
    totalLikes
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ accountStatus: 'active' }),
    User.countDocuments({ accountStatus: 'suspended' }),
    User.countDocuments({ isEmailVerified: true }),
    User.countDocuments({ createdAt: { $gte: startOfDay } }),
    User.countDocuments({ createdAt: { $gte: startOfWeek } }),
    Post.countDocuments({}),
    Comment.countDocuments({}),
    Like.countDocuments({})
  ]);

  const dbState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  return {
    users: {
      total: totalUsers,
      active: activeUsers,
      suspended: suspendedUsers,
      verified: verifiedUsers,
      newToday: newRegistrationsToday,
      newThisWeek: newRegistrationsThisWeek
    },
    content: {
      posts: totalPosts,
      comments: totalComments,
      likes: totalLikes
    },
    system: {
      databaseStatus: dbState,
      databaseName: mongoose.connection.name || 'looply',
      serverTime: new Date().toISOString()
    }
  };
};

/**
 * Retrieves recent platform audit activity from ActivityLog. (Phase 11)
 *
 * @param {number} [limit=20] - Number of events to retrieve
 * @returns {Promise<object[]>} Safe activity events
 */
export const getDashboardActivity = async (limit = 20) => {
  const safeLimit = Math.min(50, Math.max(1, Number.parseInt(limit, 10) || 20));

  const logs = await ActivityLog.find({})
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .populate('actor', 'fullName email role profile.avatarUrl accountStatus');

  return logs.map((log) => {
    const actorObj = log.actor || null;
    return {
      _id: log._id,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      metadata: log.metadata || {},
      createdAt: log.createdAt,
      actor: actorObj
        ? {
            _id: actorObj._id,
            fullName: actorObj.fullName,
            email: actorObj.email,
            role: actorObj.role,
            avatarUrl: actorObj.profile?.avatarUrl || ''
          }
        : null
    };
  });
};

/**
 * Retrieves paginated user accounts with optional search and status filtering. (Phase 12)
 *
 * @param {object} params
 * @param {number} [params.page=1]
 * @param {number} [params.limit=10]
 * @param {string} [params.search]
 * @param {string} [params.accountStatus]
 * @param {string} [params.role]
 * @returns {Promise<{ users: object[], pagination: object }>}
 */
export const getAdminUsers = async ({ page = 1, limit = 10, search = '', accountStatus, role }) => {
  const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, Number.parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const query = {};

  if (search && search.trim()) {
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { fullName: { $regex: escaped, $options: 'i' } },
      { email: { $regex: escaped, $options: 'i' } }
    ];
  }

  if (accountStatus && ['active', 'suspended'].includes(accountStatus)) {
    query.accountStatus = accountStatus;
  }

  if (role && ['user', 'admin'].includes(role)) {
    query.role = role;
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .select(SAFE_USER_FIELDS)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    User.countDocuments(query)
  ]);

  return {
    users,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1
    }
  };
};

/**
 * Retrieves safe details for a specific user including content counts. (Phase 12)
 *
 * @param {string} userId
 * @returns {Promise<object>}
 */
export const getAdminUserById = async (userId) => {
  const user = await User.findById(userId).select(SAFE_USER_FIELDS);
  if (!user) {
    const error = new Error('User not found.');
    error.status = 404;
    throw error;
  }

  const [postsCount, commentsCount] = await Promise.all([
    Post.countDocuments({ author: userId }),
    Comment.countDocuments({ author: userId })
  ]);

  const userObj = user.toObject();
  userObj.postsCount = postsCount;
  userObj.commentsCount = commentsCount;

  return userObj;
};

/**
 * Modifies a user's account status (suspend or activate). (Phase 12)
 * Rejects self-suspension by the requesting administrator.
 *
 * @param {object} params
 * @param {string} params.targetUserId
 * @param {string} params.accountStatus - 'active' | 'suspended'
 * @param {string} params.adminUserId - Requesting admin ID
 * @returns {Promise<object>} Updated safe user
 */
export const updateUserStatus = async ({ targetUserId, accountStatus, adminUserId }) => {
  if (targetUserId.toString() === adminUserId.toString()) {
    const error = new Error('Administrators cannot suspend their own account.');
    error.status = 400;
    throw error;
  }

  if (!['active', 'suspended'].includes(accountStatus)) {
    const error = new Error('Invalid account status. Allowed values: active, suspended.');
    error.status = 400;
    throw error;
  }

  const user = await User.findById(targetUserId);
  if (!user) {
    const error = new Error('User not found.');
    error.status = 404;
    throw error;
  }

  user.accountStatus = accountStatus;

  // If suspended, invalidate all existing sessions immediately
  if (accountStatus === 'suspended') {
    user.tokenVersion = (user.tokenVersion || 0) + 1;
  }

  await user.save();

  // Record audit log
  try {
    const auditLog = new ActivityLog({
      actor: adminUserId,
      action: 'admin_action',
      targetType: 'User',
      targetId: targetUserId,
      metadata: {
        action: `user_status_${accountStatus}`,
        previousStatus: user.accountStatus,
        newStatus: accountStatus,
        timestamp: new Date().toISOString()
      }
    });
    await auditLog.save();
  } catch (auditErr) {
    console.error(`[ActivityLog] Failed to log user status change: ${auditErr.message}`);
  }

  const safe = user.toObject();
  delete safe.passwordHash;
  delete safe.verificationTokenHash;
  delete safe.resetPasswordTokenHash;
  delete safe.tokenVersion;

  return safe;
};

/**
 * Modifies a user's role (promotes to admin or sets to standard user).
 * Rejects revoking own admin privileges.
 *
 * @param {object} params
 * @param {string} params.targetUserId
 * @param {string} params.role - 'user' | 'admin'
 * @param {string} params.adminUserId - Requesting admin ID
 * @returns {Promise<object>} Updated safe user
 */
export const updateUserRole = async ({ targetUserId, role, adminUserId }) => {
  if (targetUserId.toString() === adminUserId.toString() && role !== 'admin') {
    const error = new Error('Administrators cannot revoke their own admin privileges.');
    error.status = 400;
    throw error;
  }

  if (!['user', 'admin'].includes(role)) {
    const error = new Error('Invalid role. Allowed values: user, admin.');
    error.status = 400;
    throw error;
  }

  const user = await User.findById(targetUserId);
  if (!user) {
    const error = new Error('User not found.');
    error.status = 404;
    throw error;
  }

  user.role = role;
  await user.save();

  try {
    const auditLog = new ActivityLog({
      actor: adminUserId,
      action: 'admin_action',
      targetType: 'User',
      targetId: user._id,
      metadata: {
        operation: 'role_update',
        targetEmail: user.email,
        newRole: role,
        timestamp: new Date().toISOString()
      }
    });
    await auditLog.save();
  } catch (auditErr) {
    console.error(`[ActivityLog] Failed to record role update audit: ${auditErr.message}`);
  }

  const safe = user.toObject();
  delete safe.passwordHash;
  delete safe.verificationTokenHash;
  delete safe.resetPasswordTokenHash;
  delete safe.tokenVersion;

  return safe;
};

/**
 * Retrieves all platform posts for administrative moderation. (Phase 12)
 *
 * @param {object} params
 * @param {number} [params.page=1]
 * @param {number} [params.limit=10]
 * @param {string} [params.search='']
 * @returns {Promise<{ posts: object[], pagination: object }>}
 */
export const getAdminPosts = async ({ page = 1, limit = 10, search = '' }) => {
  const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, Number.parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const query = {};
  if (search && search.trim()) {
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.content = { $regex: escaped, $options: 'i' };
  }

  const [posts, total] = await Promise.all([
    Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('author', 'fullName email role profile.avatarUrl accountStatus'),
    Post.countDocuments(query)
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
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1
    }
  };
};

/**
 * Administrative post deletion with atomic cascade cleanup of comments, likes, and notifications. (Phase 12)
 *
 * @param {object} params
 * @param {string} params.postId
 * @param {string} params.adminUserId
 * @returns {Promise<void>}
 */
export const adminDeletePost = async ({ postId, adminUserId }) => {
  const post = await Post.findById(postId);
  if (!post) {
    const error = new Error('Post not found.');
    error.status = 404;
    throw error;
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    await Post.findByIdAndDelete(postId, { session });
    await Comment.deleteMany({ post: postId }, { session });
    await Like.deleteMany({ post: postId }, { session });
    await Notification.deleteMany({ resourceType: 'Post', resourceId: postId }, { session });

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }

  // Record audit log
  try {
    const auditLog = new ActivityLog({
      actor: adminUserId,
      action: 'admin_action',
      targetType: 'Post',
      targetId: postId,
      metadata: {
        action: 'admin_post_deletion',
        deletedAt: new Date().toISOString()
      }
    });
    await auditLog.save();
  } catch (auditErr) {
    console.error(`[ActivityLog] Failed to log admin post deletion: ${auditErr.message}`);
  }
};

/**
 * Retrieves all platform comments for administrative moderation. (Phase 12)
 *
 * @param {object} params
 * @param {number} [params.page=1]
 * @param {number} [params.limit=10]
 * @param {string} [params.search='']
 * @returns {Promise<{ comments: object[], pagination: object }>}
 */
export const getAdminComments = async ({ page = 1, limit = 10, search = '' }) => {
  const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, Number.parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const query = {};
  if (search && search.trim()) {
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.content = { $regex: escaped, $options: 'i' };
  }

  const [comments, total] = await Promise.all([
    Comment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('author', 'fullName email role profile.avatarUrl')
      .populate('post', 'content author'),
    Comment.countDocuments(query)
  ]);

  return {
    comments,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1
    }
  };
};

/**
 * Administrative comment deletion. (Phase 12)
 *
 * @param {object} params
 * @param {string} params.commentId
 * @param {string} params.adminUserId
 * @returns {Promise<void>}
 */
export const adminDeleteComment = async ({ commentId, adminUserId }) => {
  const comment = await Comment.findById(commentId);
  if (!comment) {
    const error = new Error('Comment not found.');
    error.status = 404;
    throw error;
  }

  await Comment.findByIdAndDelete(commentId);

  // Record audit log
  try {
    const auditLog = new ActivityLog({
      actor: adminUserId,
      action: 'admin_action',
      targetType: 'Comment',
      targetId: commentId,
      metadata: {
        action: 'admin_comment_deletion',
        deletedAt: new Date().toISOString()
      }
    });
    await auditLog.save();
  } catch (auditErr) {
    console.error(`[ActivityLog] Failed to log admin comment deletion: ${auditErr.message}`);
  }
};
