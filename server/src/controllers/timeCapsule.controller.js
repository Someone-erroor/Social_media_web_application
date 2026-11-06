import {
  createTimeCapsule as createTimeCapsuleService,
  listTimeCapsules as listTimeCapsulesService,
  getTimeCapsuleById as getTimeCapsuleByIdService,
  deleteTimeCapsule as deleteTimeCapsuleService
} from '../services/timeCapsule.service.js';

export const createCapsule = async (req, res, next) => {
  try {
    const { title, message, mediaUrl, unlockDate, isShared, recipients } = req.body;
    const result = await createTimeCapsuleService({
      creatorId: req.user._id,
      title,
      message,
      mediaUrl,
      unlockDate,
      isShared,
      recipients
    });
    return res.status(201).json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const listCapsules = async (req, res, next) => {
  try {
    const result = await listTimeCapsulesService(req.user._id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getCapsule = async (req, res, next) => {
  try {
    const { capsuleId } = req.params;
    const result = await getTimeCapsuleByIdService(capsuleId, req.user._id);
    return res.status(200).json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const deleteCapsule = async (req, res, next) => {
  try {
    const { capsuleId } = req.params;
    const result = await deleteTimeCapsuleService(capsuleId, req.user._id);
    return res.status(200).json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export default {
  createCapsule,
  listCapsules,
  getCapsule,
  deleteCapsule
};

