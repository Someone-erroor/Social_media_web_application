import * as heistService from '../services/heist.service.js';

export const handleListHeists = async (req, res, next) => {
  try {
    const { page, limit, status, category, heistType, difficulty, search } = req.query;
    const result = await heistService.listHeists({
      page,
      limit,
      status,
      category,
      heistType,
      difficulty,
      search
    });

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    next(err);
  }
};

export const handleGetHeistById = async (req, res, next) => {
  try {
    const { heistId } = req.params;
    const heist = await heistService.getHeistById(heistId, req.user?._id);

    return res.status(200).json({
      success: true,
      heist
    });
  } catch (err) {
    next(err);
  }
};

export const handleCreateHeist = async (req, res, next) => {
  try {
    const heist = await heistService.createHeist(req.body, req.user._id);

    return res.status(201).json({
      success: true,
      message: 'Feed Heist mission initiated successfully.',
      heist
    });
  } catch (err) {
    next(err);
  }
};

export const handleJoinHeist = async (req, res, next) => {
  try {
    const { heistId } = req.params;
    const result = await heistService.joinHeist(heistId, req.user._id);

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const handleLeaveHeist = async (req, res, next) => {
  try {
    const { heistId } = req.params;
    const result = await heistService.leaveHeist(heistId, req.user._id);

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const handleSubmitHeistAnswer = async (req, res, next) => {
  try {
    const { heistId } = req.params;
    const { answer, note } = req.body;
    const result = await heistService.submitHeistAnswer(heistId, req.user._id, { answer, note });

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

