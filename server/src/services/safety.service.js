import { User, Report, Appeal, ActivityLog } from '../models/index.js';
import { isValidObjectId } from '../validators/profile.validator.js';

/**
 * Blocks a target user and severs all social ties.
 *
 * @param {string} currentUserId
 * @param {string} targetUserId
 * @returns {Promise<object>}
 */
export const blockUser = async (currentUserId, targetUserId) => {
  if (!isValidObjectId(targetUserId)) {
    const error = new Error('Invalid user ID format.');
    error.status = 400;
    throw error;
  }

  if (currentUserId.toString() === targetUserId.toString()) {
    const error = new Error('You cannot block yourself.');
    error.status = 400;
    throw error;
  }

  const [currentUser, targetUser] = await Promise.all([
    User.findById(currentUserId),
    User.findById(targetUserId)
  ]);

  if (!targetUser) {
    const error = new Error('Target user not found.');
    error.status = 404;
    throw error;
  }

  // 1. Add target to blockedUsers
  // 2. Sever all followers / following on both sides
  // 3. Clear any pending follow requests
  await Promise.all([
    User.findByIdAndUpdate(currentUserId, {
      $addToSet: { blockedUsers: targetUserId },
      $pull: {
        followers: targetUserId,
        following: targetUserId,
        followRequests: targetUserId,
        sentFollowRequests: targetUserId
      }
    }),
    User.findByIdAndUpdate(targetUserId, {
      $pull: {
        followers: currentUserId,
        following: currentUserId,
        followRequests: currentUserId,
        sentFollowRequests: currentUserId
      }
    })
  ]);

  // Audit record
  try {
    const auditLog = new ActivityLog({
      actor: currentUserId,
      action: 'block_user',
      targetType: 'User',
      targetId: targetUserId,
      metadata: { blockedAt: new Date().toISOString() }
    });
    await auditLog.save();
  } catch (err) {
    console.error(`[ActivityLog] Block user: ${err.message}`);
  }

  return {
    success: true,
    isBlocked: true,
    message: `Successfully blocked ${targetUser.fullName}.`
  };
};

/**
 * Unblocks a target user.
 *
 * @param {string} currentUserId
 * @param {string} targetUserId
 * @returns {Promise<object>}
 */
export const unblockUser = async (currentUserId, targetUserId) => {
  if (!isValidObjectId(targetUserId)) {
    const error = new Error('Invalid user ID format.');
    error.status = 400;
    throw error;
  }

  await User.findByIdAndUpdate(currentUserId, {
    $pull: { blockedUsers: targetUserId }
  });

  // Audit record
  try {
    const auditLog = new ActivityLog({
      actor: currentUserId,
      action: 'unblock_user',
      targetType: 'User',
      targetId: targetUserId,
      metadata: { unblockedAt: new Date().toISOString() }
    });
    await auditLog.save();
  } catch (err) {
    console.error(`[ActivityLog] Unblock user: ${err.message}`);
  }

  return {
    success: true,
    isBlocked: false,
    message: 'User unblocked successfully.'
  };
};

/**
 * Retrieves the list of users blocked by the authenticated user.
 *
 * @param {string} currentUserId
 * @returns {Promise<object>}
 */
export const getBlockedUsers = async (currentUserId) => {
  const user = await User.findById(currentUserId)
    .populate('blockedUsers', '_id fullName profile email');

  if (!user) {
    const error = new Error('User not found.');
    error.status = 404;
    throw error;
  }

  const blocked = (user.blockedUsers || []).map((u) => ({
    _id: u._id,
    fullName: u.fullName,
    profile: u.profile || { bio: '', avatarUrl: '' }
  }));

  return {
    success: true,
    blockedUsers: blocked,
    count: blocked.length
  };
};

/**
 * Creates a safety report against a user, post, comment, or message.
 *
 * @param {object} params
 * @param {string} params.reporterId
 * @param {string} params.reportedTarget
 * @param {string} params.targetType
 * @param {string} params.category
 * @param {string} params.explanation
 * @returns {Promise<object>}
 */
export const createReport = async ({ reporterId, reportedTarget, targetType, category, explanation }) => {
  if (!isValidObjectId(reportedTarget)) {
    const error = new Error('Invalid reported target ID.');
    error.status = 400;
    throw error;
  }

  const validTypes = ['User', 'Post', 'Comment', 'Message'];
  if (!validTypes.includes(targetType)) {
    const error = new Error(`Target type must be one of: ${validTypes.join(', ')}.`);
    error.status = 400;
    throw error;
  }

  const validCategories = ['harassment', 'bullying', 'spam', 'impersonation', 'hate_speech', 'threats', 'other'];
  if (!validCategories.includes(category)) {
    const error = new Error(`Category must be one of: ${validCategories.join(', ')}.`);
    error.status = 400;
    throw error;
  }

  // Prevent duplicate open reports for the exact same target by the same reporter
  const existingReport = await Report.findOne({
    reporter: reporterId,
    reportedTarget,
    status: { $in: ['pending', 'under_review'] }
  });

  if (existingReport) {
    return {
      success: true,
      reportId: existingReport._id,
      message: 'You have already submitted an active report for this item. Our moderation team is reviewing it.'
    };
  }

  const report = new Report({
    reporter: reporterId,
    reportedTarget,
    targetType,
    category,
    explanation: (explanation || '').trim()
  });

  await report.save();

  try {
    const auditLog = new ActivityLog({
      actor: reporterId,
      action: 'report_creation',
      targetType,
      targetId: reportedTarget,
      metadata: { reportId: report._id.toString(), category }
    });
    await auditLog.save();
  } catch (err) {
    console.error(`[ActivityLog] Report creation: ${err.message}`);
  }

  return {
    success: true,
    reportId: report._id,
    message: 'Report submitted successfully. Thank you for helping keep Looply safe.'
  };
};

/**
 * Submits an appeal against an administrative moderation action.
 *
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.actionType
 * @param {string} params.reason
 * @returns {Promise<object>}
 */
export const submitAppeal = async ({ userId, actionType, reason }) => {
  if (!reason || reason.trim().length < 10) {
    const error = new Error('Please provide a detailed appeal explanation (minimum 10 characters).');
    error.status = 400;
    throw error;
  }

  const appeal = new Appeal({
    user: userId,
    actionType: actionType || 'account_suspension',
    reason: reason.trim()
  });

  await appeal.save();

  try {
    const auditLog = new ActivityLog({
      actor: userId,
      action: 'appeal_submission',
      targetType: 'User',
      targetId: userId,
      metadata: { appealId: appeal._id.toString() }
    });
    await auditLog.save();
  } catch (err) {
    console.error(`[ActivityLog] Appeal submission: ${err.message}`);
  }

  return {
    success: true,
    appealId: appeal._id,
    message: 'Appeal submitted. An administrator will review your case.'
  };
};

