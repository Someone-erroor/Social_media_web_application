import { User, ActivityLog } from '../models/index.js';
import { toSafeUser } from './auth.service.js';

/**
 * Retrieves the authenticated user's private full profile.
 *
 * @param {string} userId - User primary ID
 * @returns {Promise<object>} Safe user profile
 */
export const getMyProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found.');
    error.status = 404;
    throw error;
  }
  return toSafeUser(user);
};

/**
 * Updates profile fields (fullName, bio, avatarUrl) for the authenticated user.
 * Strictly prevents role escalation or email modification.
 *
 * @param {string} userId - Authenticated user ID
 * @param {object} updates - Validated profile fields
 * @returns {Promise<object>} Updated safe user profile
 */
export const updateMyProfile = async (userId, updates = {}) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found.');
    error.status = 404;
    throw error;
  }

  if (updates.fullName !== undefined) {
    user.fullName = updates.fullName;
  }

  if (updates.bio !== undefined) {
    user.profile.bio = updates.bio;
  }

  if (updates.avatarUrl !== undefined) {
    user.profile.avatarUrl = updates.avatarUrl;
  }

  await user.save();

  try {
    const auditLog = new ActivityLog({
      actor: user._id,
      action: 'profile_update',
      targetType: 'User',
      targetId: user._id,
      metadata: {
        updatedAt: new Date().toISOString()
      }
    });
    await auditLog.save();
  } catch (auditErr) {
    console.error(`[ActivityLog] Failed to record profile update: ${auditErr.message}`);
  }

  return toSafeUser(user);
};

/**
 * Retrieves a public profile by user ID.
 * Returns only public attributes: _id, fullName, profile (bio, avatarUrl), and createdAt.
 * Strictly excludes email, passwordHash, and account credentials.
 *
 * @param {string} targetUserId - Target user ID
 * @returns {Promise<object>} Public profile representation
 */
export const getPublicProfileById = async (targetUserId) => {
  const user = await User.findById(targetUserId);
  if (!user || user.accountStatus === 'suspended') {
    const error = new Error('User profile not found.');
    error.status = 404;
    throw error;
  }

  return {
    _id: user._id,
    fullName: user.fullName,
    profile: {
      bio: user.profile?.bio || '',
      avatarUrl: user.profile?.avatarUrl || ''
    },
    createdAt: user.createdAt
  };
};

export default {
  getMyProfile,
  updateMyProfile,
  getPublicProfileById
};

