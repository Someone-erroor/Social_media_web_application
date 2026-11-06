import {
  updatePrivacySettings as updatePrivacySettingsService,
  sendFollowRequest as sendFollowRequestService,
  cancelFollowRequest as cancelFollowRequestService,
  acceptFollowRequest as acceptFollowRequestService,
  rejectFollowRequest as rejectFollowRequestService,
  getPendingFollowRequests as getPendingFollowRequestsService
} from '../services/privacy.service.js';

export const updatePrivacy = async (req, res, next) => {
  try {
    const { isPrivate } = req.body;
    const result = await updatePrivacySettingsService(req.user._id, { isPrivate });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const sendFollowRequest = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const result = await sendFollowRequestService(req.user._id, userId);
    return res.status(200).json(result);
  } catch (error) {
    if (error.status === 400 || error.status === 403 || error.status === 404) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const cancelFollowRequest = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const result = await cancelFollowRequestService(req.user._id, userId);
    return res.status(200).json(result);
  } catch (error) {
    if (error.status === 400 || error.status === 404) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const acceptFollowRequest = async (req, res, next) => {
  try {
    const { requesterId } = req.params;
    const result = await acceptFollowRequestService(req.user._id, requesterId);
    return res.status(200).json(result);
  } catch (error) {
    if (error.status === 400 || error.status === 404) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const rejectFollowRequest = async (req, res, next) => {
  try {
    const { requesterId } = req.params;
    const result = await rejectFollowRequestService(req.user._id, requesterId);
    return res.status(200).json(result);
  } catch (error) {
    if (error.status === 400 || error.status === 404) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const getPendingRequests = async (req, res, next) => {
  try {
    const result = await getPendingFollowRequestsService(req.user._id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export default {
  updatePrivacy,
  sendFollowRequest,
  cancelFollowRequest,
  acceptFollowRequest,
  rejectFollowRequest,
  getPendingRequests
};

