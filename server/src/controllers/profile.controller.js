import {
  validateProfileUpdateInput,
  isValidObjectId
} from '../validators/profile.validator.js';
import {
  getMyProfile as getMyProfileService,
  updateMyProfile as updateMyProfileService,
  getPublicProfileById as getPublicProfileService
} from '../services/profile.service.js';

/**
 * Returns the currently authenticated user's profile.
 * GET /api/profile/me
 */
export const getMyProfile = async (req, res, next) => {
  try {
    const profile = await getMyProfileService(req.user._id);
    return res.status(200).json({
      success: true,
      user: profile
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Updates the currently authenticated user's profile.
 * PATCH /api/profile/me
 */
export const updateMyProfile = async (req, res, next) => {
  try {
    const { isValid, errors, sanitized } = validateProfileUpdateInput(req.body);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors[0] || 'Invalid profile update request.',
        errors
      });
    }

    const updatedUser = await updateMyProfileService(req.user._id, sanitized);

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves public profile information for a specified user ID.
 * GET /api/profiles/:userId
 */
export const getPublicProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format.'
      });
    }

    const publicProfile = await getPublicProfileService(userId, req.user?._id || null);

    return res.status(200).json({
      success: true,
      profile: publicProfile
    });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

export default {
  getMyProfile,
  updateMyProfile,
  getPublicProfile
};

