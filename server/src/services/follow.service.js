import { User, ActivityLog } from '../models/index.js';
import { isValidObjectId } from '../validators/profile.validator.js';

/**
 * Follow a target user.
 *
 * @param {string} currentUserId - The authenticated user performing the follow
 * @param {string} targetUserId - The target user to be followed
 * @returns {Promise<object>} Result of the follow operation with updated counts and status
 */
export const followUser = async (currentUserId, targetUserId) => {
  if (!isValidObjectId(targetUserId)) {
    const error = new Error('Invalid user ID format.');
    error.status = 400;
    throw error;
  }

  if (currentUserId.toString() === targetUserId.toString()) {
    const error = new Error('You cannot follow yourself.');
    error.status = 400;
    throw error;
  }

  const [targetUser, currentUser] = await Promise.all([
    User.findById(targetUserId),
    User.findById(currentUserId)
  ]);

  if (!targetUser || targetUser.accountStatus === 'suspended') {
    const error = new Error('User not found.');
    error.status = 404;
    throw error;
  }

  if (!currentUser || currentUser.accountStatus === 'suspended') {
    const error = new Error('Current user account not found or suspended.');
    error.status = 404;
    throw error;
  }

  // Safety check: blocking relationships
  if ((targetUser.blockedUsers || []).some((id) => id.toString() === currentUserId.toString())) {
    const error = new Error('Unable to follow this user.');
    error.status = 403;
    throw error;
  }

  if ((currentUser.blockedUsers || []).some((id) => id.toString() === targetUserId.toString())) {
    const error = new Error('You have blocked this user. Unblock them first.');
    error.status = 400;
    throw error;
  }

  const alreadyFollowing = (targetUser.followers || []).some(
    (id) => id.toString() === currentUserId.toString()
  );

  if (alreadyFollowing) {
    return {
      success: true,
      isFollowing: true,
      followersCount: targetUser.followers?.length || 0,
      followingCount: currentUser.following?.length || 0,
      message: 'You are already following this user.'
    };
  }

  // Phase 2: If target account is private, create a follow request instead of immediate following
  if (targetUser.isPrivate) {
    const { sendFollowRequest } = await import('./privacy.service.js');
    return sendFollowRequest(currentUserId, targetUserId);
  }

  // Atomic update to guarantee dual-sided relationship consistency
  const [updatedTarget, updatedCurrent] = await Promise.all([
    User.findByIdAndUpdate(
      targetUserId,
      { $addToSet: { followers: currentUserId } },
      { returnDocument: 'after' }
    ),
    User.findByIdAndUpdate(
      currentUserId,
      { $addToSet: { following: targetUserId } },
      { returnDocument: 'after' }
    )
  ]);

  // Record activity audit log
  try {
    const auditLog = new ActivityLog({
      actor: currentUserId,
      action: 'follow_user',
      targetType: 'User',
      targetId: targetUserId,
      metadata: { followedAt: new Date().toISOString() }
    });
    await auditLog.save();
  } catch (auditErr) {
    console.error(`[ActivityLog Error] Failed to log follow action: ${auditErr.message}`);
  }

  return {
    success: true,
    isFollowing: true,
    followersCount: updatedTarget.followers?.length || 0,
    followingCount: updatedCurrent.following?.length || 0,
    message: 'Successfully followed user.'
  };
};

/**
 * Unfollow a target user.
 *
 * @param {string} currentUserId - The authenticated user performing the unfollow
 * @param {string} targetUserId - The target user to be unfollowed
 * @returns {Promise<object>} Result of the unfollow operation with updated counts and status
 */
export const unfollowUser = async (currentUserId, targetUserId) => {
  if (!isValidObjectId(targetUserId)) {
    const error = new Error('Invalid user ID format.');
    error.status = 400;
    throw error;
  }

  if (currentUserId.toString() === targetUserId.toString()) {
    const error = new Error('You cannot unfollow yourself.');
    error.status = 400;
    throw error;
  }

  const [targetUser, currentUser] = await Promise.all([
    User.findById(targetUserId),
    User.findById(currentUserId)
  ]);

  if (!targetUser || targetUser.accountStatus === 'suspended') {
    const error = new Error('User not found.');
    error.status = 404;
    throw error;
  }

  if (!currentUser || currentUser.accountStatus === 'suspended') {
    const error = new Error('Current user account not found or suspended.');
    error.status = 404;
    throw error;
  }

  const isCurrentlyFollowing = (targetUser.followers || []).some(
    (id) => id.toString() === currentUserId.toString()
  );

  if (!isCurrentlyFollowing) {
    return {
      success: true,
      isFollowing: false,
      followersCount: targetUser.followers?.length || 0,
      followingCount: currentUser.following?.length || 0,
      message: 'You are not following this user.'
    };
  }

  // Atomic dual-sided removal
  const [updatedTarget, updatedCurrent] = await Promise.all([
    User.findByIdAndUpdate(
      targetUserId,
      { $pull: { followers: currentUserId } },
      { returnDocument: 'after' }
    ),
    User.findByIdAndUpdate(
      currentUserId,
      { $pull: { following: targetUserId } },
      { returnDocument: 'after' }
    )
  ]);

  // Record activity audit log
  try {
    const auditLog = new ActivityLog({
      actor: currentUserId,
      action: 'unfollow_user',
      targetType: 'User',
      targetId: targetUserId,
      metadata: { unfollowedAt: new Date().toISOString() }
    });
    await auditLog.save();
  } catch (auditErr) {
    console.error(`[ActivityLog Error] Failed to log unfollow action: ${auditErr.message}`);
  }

  return {
    success: true,
    isFollowing: false,
    followersCount: updatedTarget.followers?.length || 0,
    followingCount: updatedCurrent.following?.length || 0,
    message: 'Successfully unfollowed user.'
  };
};

/**
 * Retrieves the followers for a specified user.
 *
 * @param {string} targetUserId - Target user ID
 * @param {string|null} currentUserId - Authenticated viewer user ID (optional)
 * @returns {Promise<object>} Public safe followers list and count
 */
export const getFollowers = async (targetUserId, currentUserId = null) => {
  if (!isValidObjectId(targetUserId)) {
    const error = new Error('Invalid user ID format.');
    error.status = 400;
    throw error;
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser || targetUser.accountStatus === 'suspended') {
    const error = new Error('User not found.');
    error.status = 404;
    throw error;
  }

  const followersList = await User.find({
    _id: { $in: targetUser.followers || [] },
    accountStatus: { $ne: 'suspended' }
  }).select('_id fullName profile createdAt followers');

  return {
    success: true,
    count: followersList.length,
    followers: followersList.map((u) => ({
      _id: u._id,
      fullName: u.fullName,
      profile: {
        bio: u.profile?.bio || '',
        avatarUrl: u.profile?.avatarUrl || ''
      },
      createdAt: u.createdAt,
      isFollowing: currentUserId
        ? (u.followers || []).some((f) => f.toString() === currentUserId.toString())
        : false,
      isSelf: currentUserId ? u._id.toString() === currentUserId.toString() : false
    }))
  };
};

/**
 * Retrieves the list of users that a specified user is following.
 *
 * @param {string} targetUserId - Target user ID
 * @param {string|null} currentUserId - Authenticated viewer user ID (optional)
 * @returns {Promise<object>} Public safe following list and count
 */
export const getFollowing = async (targetUserId, currentUserId = null) => {
  if (!isValidObjectId(targetUserId)) {
    const error = new Error('Invalid user ID format.');
    error.status = 400;
    throw error;
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser || targetUser.accountStatus === 'suspended') {
    const error = new Error('User not found.');
    error.status = 404;
    throw error;
  }

  const followingList = await User.find({
    _id: { $in: targetUser.following || [] },
    accountStatus: { $ne: 'suspended' }
  }).select('_id fullName profile createdAt followers');

  return {
    success: true,
    count: followingList.length,
    following: followingList.map((u) => ({
      _id: u._id,
      fullName: u.fullName,
      profile: {
        bio: u.profile?.bio || '',
        avatarUrl: u.profile?.avatarUrl || ''
      },
      createdAt: u.createdAt,
      isFollowing: currentUserId
        ? (u.followers || []).some((f) => f.toString() === currentUserId.toString())
        : false,
      isSelf: currentUserId ? u._id.toString() === currentUserId.toString() : false
    }))
  };
};

/**
 * Determines relationship status between authenticated viewer and target user.
 *
 * @param {string} targetUserId - Target user ID
 * @param {string|null} currentUserId - Authenticated viewer user ID (optional)
 * @returns {Promise<object>} Status object containing isFollowing, isOwnProfile, canFollow, counts
 */
export const getFollowStatus = async (targetUserId, currentUserId = null) => {
  if (!isValidObjectId(targetUserId)) {
    const error = new Error('Invalid user ID format.');
    error.status = 400;
    throw error;
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser || targetUser.accountStatus === 'suspended') {
    const error = new Error('User not found.');
    error.status = 404;
    throw error;
  }

  const followersCount = targetUser.followers?.length || 0;
  const followingCount = targetUser.following?.length || 0;

  if (!currentUserId) {
    return {
      success: true,
      isFollowing: false,
      isOwnProfile: false,
      canFollow: false,
      followersCount,
      followingCount
    };
  }

  const isOwnProfile = currentUserId.toString() === targetUserId.toString();
  const isFollowing =
    !isOwnProfile &&
    (targetUser.followers || []).some((id) => id.toString() === currentUserId.toString());
  const isPending =
    !isOwnProfile &&
    (targetUser.followRequests || []).some((id) => id.toString() === currentUserId.toString());

  const currentUser = currentUserId ? await User.findById(currentUserId).select('blockedUsers') : null;
  const isBlocked = currentUser ? (currentUser.blockedUsers || []).some((id) => id.toString() === targetUserId.toString()) : false;

  return {
    success: true,
    isFollowing,
    isPending,
    isOwnProfile,
    canFollow: !isOwnProfile && !isBlocked,
    isPrivate: Boolean(targetUser.isPrivate),
    isBlocked,
    followersCount,
    followingCount
  };
};

export default {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getFollowStatus
};

