import { User, Circle, GameChallenge, TimeCapsule, ActivityLog } from '../models/index.js';
import { isValidObjectId } from '../validators/profile.validator.js';

/**
 * Computes shared social milestones and friendship memories between two users.
 */
export const getFriendshipMemories = async (currentUserId, targetUserId) => {
  if (!isValidObjectId(targetUserId)) {
    const error = new Error('Invalid user ID format.');
    error.status = 400;
    throw error;
  }

  const [currentUser, targetUser] = await Promise.all([
    User.findById(currentUserId).select('fullName profile following blockedUsers createdAt'),
    User.findById(targetUserId).select('fullName profile followers blockedUsers isPrivate createdAt')
  ]);

  if (!targetUser) {
    const error = new Error('User not found.');
    error.status = 404;
    throw error;
  }

  // Safety block check
  if ((targetUser.blockedUsers || []).some(id => id.toString() === currentUserId.toString()) ||
      (currentUser.blockedUsers || []).some(id => id.toString() === targetUserId.toString())) {
    const error = new Error('Memories are not available for this profile.');
    error.status = 403;
    throw error;
  }

  // 1. Follow relationship status
  const isFollowing = (targetUser.followers || []).some(id => id.toString() === currentUserId.toString());
  const isFollower = (currentUser.following || []).some(id => id.toString() === targetUserId.toString());

  // 2. Mutual Circles
  const mutualCircles = await Circle.find({
    members: { $all: [currentUserId, targetUserId] }
  }).select('name slug avatarUrl category memberCount');

  // 3. Shared Looply Play challenges
  const sharedGames = await GameChallenge.find({
    $or: [
      { creator: currentUserId, 'participants.user': targetUserId },
      { creator: targetUserId, 'participants.user': currentUserId }
    ]
  }).select('title gameType createdAt');

  // 4. Shared Time Capsules
  const sharedCapsules = await TimeCapsule.find({
    $or: [
      { creator: currentUserId, isShared: true, recipients: targetUserId },
      { creator: targetUserId, isShared: true, recipients: currentUserId }
    ]
  }).select('title unlockDate status');

  const milestones = [];

  if (isFollowing) {
    milestones.push({
      type: 'connection',
      title: 'Connected on Looply',
      description: `You are connected with ${targetUser.fullName}.`,
      icon: 'users'
    });
  }

  if (mutualCircles.length > 0) {
    milestones.push({
      type: 'circles',
      title: `${mutualCircles.length} Shared Circle${mutualCircles.length > 1 ? 's' : ''}`,
      description: `Both members of: ${mutualCircles.map(c => c.name).join(', ')}`,
      icon: 'explore'
    });
  }

  if (sharedGames.length > 0) {
    milestones.push({
      type: 'games',
      title: `${sharedGames.length} Looply Play Game${sharedGames.length > 1 ? 's' : ''}`,
      description: `Participated in fun social challenges together`,
      icon: 'play'
    });
  }

  if (sharedCapsules.length > 0) {
    milestones.push({
      type: 'capsules',
      title: `${sharedCapsules.length} Shared Time Capsule${sharedCapsules.length > 1 ? 's' : ''}`,
      description: `Have sealed future memories waiting to be unlocked`,
      icon: 'vault'
    });
  }

  return {
    success: true,
    user: {
      _id: targetUser._id,
      fullName: targetUser.fullName,
      profile: targetUser.profile
    },
    isFollowing,
    mutualCirclesCount: mutualCircles.length,
    mutualCircles,
    sharedGamesCount: sharedGames.length,
    sharedCapsulesCount: sharedCapsules.length,
    milestones
  };
};

