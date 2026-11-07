import {
  blockUser as blockUserService,
  unblockUser as unblockUserService,
  getBlockedUsers as getBlockedUsersService,
  createReport as createReportService,
  submitAppeal as submitAppealService
} from '../services/safety.service.js';

export const blockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const result = await blockUserService(req.user._id, userId);
    return res.status(200).json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const unblockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const result = await unblockUserService(req.user._id, userId);
    return res.status(200).json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const getBlockedUsers = async (req, res, next) => {
  try {
    const result = await getBlockedUsersService(req.user._id);
    return res.status(200).json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const createReport = async (req, res, next) => {
  try {
    const { reportedTarget, targetType, category, explanation } = req.body;
    const result = await createReportService({
      reporterId: req.user._id,
      reportedTarget,
      targetType,
      category,
      explanation
    });
    return res.status(201).json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const submitAppeal = async (req, res, next) => {
  try {
    const { actionType, reason } = req.body;
    const result = await submitAppealService({
      userId: req.user._id,
      actionType,
      reason
    });
    return res.status(201).json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export default {
  blockUser,
  unblockUser,
  getBlockedUsers,
  createReport,
  submitAppeal
};

