import {
  createChallenge as createChallengeService,
  listChallenges as listChallengesService,
  getChallengeById as getChallengeByIdService,
  submitAnswer as submitAnswerService
} from '../services/play.service.js';

export const createChallenge = async (req, res, next) => {
  try {
    const { gameType, title, description, gameData, answerKey, expiresAt } = req.body;
    const result = await createChallengeService({
      creatorId: req.user._id,
      gameType,
      title,
      description,
      gameData,
      answerKey,
      expiresAt
    });
    return res.status(201).json(result);
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const listChallenges = async (req, res, next) => {
  try {
    const { gameType, page, limit } = req.query;
    const result = await listChallengesService({ gameType, page, limit });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getChallenge = async (req, res, next) => {
  try {
    const { challengeId } = req.params;
    const result = await getChallengeByIdService(challengeId, req.user?._id || null);
    return res.status(200).json(result);
  } catch (error) {
    if (error.status === 404 || error.status === 400) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const submitAnswer = async (req, res, next) => {
  try {
    const { challengeId } = req.params;
    const { userAnswers } = req.body;
    const result = await submitAnswerService(challengeId, req.user._id, userAnswers);
    return res.status(200).json(result);
  } catch (error) {
    if (error.status === 400 || error.status === 404) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export default {
  createChallenge,
  listChallenges,
  getChallenge,
  submitAnswer
};

