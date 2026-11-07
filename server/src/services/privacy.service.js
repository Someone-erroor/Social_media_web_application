import { User, Notification, ActivityLog } from '../models/index.js';
import { isValidObjectId } from '../validators/profile.validator.js';
import { sendNotificationToUser } from './socket.service.js';

/**
 * Retrieves a user's current privacy settings.
 *
 * @param {string} userId
 * @returns {Promise<object>}
 */
export const getPrivacySettings = async (userId) => {
  const user = await User.findById(userId).select('isPrivate');
  if (!user) {
    const error = new Error('User not found.');
    error.status = 404;
    throw error;
  }

  return {
    success: true,
    settings: {
      isPrivate: Boolean(user.isPrivate)
    }
  };
};

/**
 * Updates a user's privacy settings.
 *
 * @param {string} userId
 * @param {{ isPrivate: boolean }} settings
 * @returns {Promise<object>}
 */
export const updatePrivacySettings = async (userId, { isPrivate }) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found.');
    error.status = 404;
    throw error;
  }

  user.isPrivate = Boolean(isPrivate);
  await user.save();

  return {
    success: true,
    isPrivate: user.isPrivate,
    settings: {
      isPrivate: user.isPrivate
    },
    message: `Account is now ${user.isPrivate ? 'private' : 'public'}.`
  };
};

/**
 * Sends a follow request to a private account.
 *
 * @param {string} currentUserId
 * @param {string} targetUserId
 * @returns {Promise<object>}
 */
export const sendFollowRequest = async (currentUserId, targetUserId) => {
  if (!isValidObjectId(targetUserId)) {
    const error = new Error('Invalid user ID format.');
    error.status = 400;
    throw error;
  }

  if (currentUserId.toString() === targetUserId.toString()) {
    const error = new Error('You cannot send a follow request to yourself.');
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

  // Check if target has blocked current user
  if ((targetUser.blockedUsers || []).some(id => id.toString() === currentUserId.toString())) {
    const error = new Error('Unable to send follow request.');
    error.status = 403;
    throw error;
  }

  // Check if current user has blocked target
  if ((currentUser.blockedUsers || []).some(id => id.toString() === targetUserId.toString())) {
    const error = new Error('You have blocked this user. Unblock them first.');
    error.status = 400;
    throw error;
  }

  // Already following check
  if ((targetUser.followers || []).some(id => id.toString() === currentUserId.toString())) {
    return {
      success: true,
      isFollowing: true,
      isPending: false,
      message: 'You are already following this user.'
    };
  }

  // Check if already requested
  const alreadyRequested = (targetUser.followRequests || []).some(
    id => id.toString() === currentUserId.toString()
  );

  if (alreadyRequested) {
    return {
      success: true,
      isFollowing: false,
      isPending: true,
      message: 'Follow request is already pending.'
    };
  }

  // Atomic addition to both sides
  await Promise.all([
    User.findByIdAndUpdate(targetUserId, {
      $addToSet: { followRequests: currentUserId }
    }),
    User.findByIdAndUpdate(currentUserId, {
      $addToSet: { sentFollowRequests: targetUserId }
    })
  ]);

  // Create notification for target user
  try {
    const notification = new Notification({
      recipient: targetUserId,
      actor: currentUserId,
      type: 'follow_request',
      message: `${currentUser.fullName} requested to follow you.`,
      resourceType: 'User',
      resourceId: currentUserId
    });
    await notification.save();
    sendNotificationToUser(targetUserId, notification);
  } catch (notifErr) {
    console.error(`[Notification Error] Follow request: ${notifErr.message}`);
  }

  return {
    success: true,
    isFollowing: false,
    isPending: true,
    message: 'Follow request sent successfully.'
  };
};

/**
 * Cancels a pending follow request.
 *
 * @param {string} currentUserId
 * @param {string} targetUserId
 * @returns {Promise<object>}
 */
export const cancelFollowRequest = async (currentUserId, targetUserId) => {
  if (!isValidObjectId(targetUserId)) {
    const error = new Error('Invalid user ID format.');
    error.status = 400;
    throw error;
  }

  await Promise.all([
    User.findByIdAndUpdate(targetUserId, {
      $pull: { followRequests: currentUserId }
    }),
    User.findByIdAndUpdate(currentUserId, {
      $pull: { sentFollowRequests: targetUserId }
    })
  ]);

  return {
    success: true,
    isFollowing: false,
    isPending: false,
    message: 'Follow request cancelled.'
  };
};

/**
 * Accepts a follow request from a private account owner.
 *
 * @param {string} currentUserId - The private account owner accepting the request
 * @param {string} requesterId - The user who sent the follow request
 * @returns {Promise<object>}
 */
export const acceptFollowRequest = async (currentUserId, requesterId) => {
  if (!isValidObjectId(requesterId)) {
    const error = new Error('Invalid user ID format.');
    error.status = 400;
    throw error;
  }

  const [currentUser, requester] = await Promise.all([
    User.findById(currentUserId),
    User.findById(requesterId)
  ]);

  if (!currentUser || !requester) {
    const error = new Error('User not found.');
    error.status = 404;
    throw error;
  }

  // Remove from requests, add to followers and following
  const [updatedCurrent, updatedRequester] = await Promise.all([
    User.findByIdAndUpdate(
      currentUserId,
      {
        $pull: { followRequests: requesterId },
        $addToSet: { followers: requesterId }
      },
      { returnDocument: 'after' }
    ),
    User.findByIdAndUpdate(
      requesterId,
      {
        $pull: { sentFollowRequests: currentUserId },
        $addToSet: { following: currentUserId }
      },
      { returnDocument: 'after' }
    )
  ]);

  // Notify the requester that their request was accepted
  try {
    const notification = new Notification({
      recipient: requesterId,
      actor: currentUserId,
      type: 'follow_request_accepted',
      message: `${currentUser.fullName} accepted your follow request.`,
      resourceType: 'User',
      resourceId: currentUserId
    });
    await notification.save();
    sendNotificationToUser(requesterId, notification);
  } catch (notifErr) {
    console.error(`[Notification Error] Follow request accepted: ${notifErr.message}`);
  }

  return {
    success: true,
    message: `Accepted follow request from ${requester.fullName}.`,
    followersCount: updatedCurrent.followers?.length || 0
  };
};

/**
 * Rejects a follow request.
 *
 * @param {string} currentUserId - The private account owner rejecting the request
 * @param {string} requesterId - The user who sent the request
 * @returns {Promise<object>}
 */
export const rejectFollowRequest = async (currentUserId, requesterId) => {
  if (!isValidObjectId(requesterId)) {
    const error = new Error('Invalid user ID format.');
    error.status = 400;
    throw error;
  }

  await Promise.all([
    User.findByIdAndUpdate(currentUserId, {
      $pull: { followRequests: requesterId }
    }),
    User.findByIdAndUpdate(requesterId, {
      $pull: { sentFollowRequests: currentUserId }
    })
  ]);

  return {
    success: true,
    message: 'Follow request rejected.'
  };
};

/**
 * Retrieves all pending follow requests for the authenticated user.
 *
 * @param {string} currentUserId
 * @returns {Promise<object>}
 */
export const getPendingFollowRequests = async (currentUserId) => {
  const user = await User.findById(currentUserId)
    .populate('followRequests', '_id fullName email profile');

  if (!user) {
    const error = new Error('User not found.');
    error.status = 404;
    throw error;
  }

  const requests = (user.followRequests || []).map(reqUser => ({
    _id: reqUser._id,
    fullName: reqUser.fullName,
    profile: reqUser.profile || { bio: '', avatarUrl: '' }
  }));

  return {
    success: true,
    requests,
    totalRequests: requests.length
  };
};

