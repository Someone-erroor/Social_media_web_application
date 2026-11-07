import {
  createChallenge as createChallengeService,
  listChallenges as listChallengesService,
  getChallengeById as getChallengeByIdService,
  submitAnswer as submitAnswerService
} from '../services/play.service.js';

export const createChallenge = async (req, res, next) => {
  try {
    let { gameType, title, description, gameData, answerKey, prompt, options, hint, expiresAt } = req.body;

    if (gameType === 'two_truths_and_a_lie') {
      gameType = 'two_truths_and_lie';
    }

    if (!gameData) {
      if (gameType === 'who_knows_me') {
        const opts = Array.isArray(options) ? options : [];
        gameData = { prompt, options: opts, questions: [{ question: prompt, options: opts }] };
        if (typeof answerKey === 'string' || typeof answerKey === 'number') {
          answerKey = { q0: Number(answerKey) || 0 };
        } else if (!answerKey) {
          answerKey = { q0: 0 };
        }
      } else if (gameType === 'two_truths_and_lie') {
        const statements = Array.isArray(options) ? options : [];
        gameData = { prompt, statements };
        answerKey = { lieIndex: Number(answerKey) || 0 };
      } else if (gameType === 'emoji_challenge') {
        gameData = { emojis: prompt, hint: hint || '' };
        answerKey = { answer: String(answerKey || '').trim() };
      } else if (gameType === 'picture_mystery') {
        gameData = { imageUrl: prompt, hint: hint || '' };
        answerKey = { answer: String(answerKey || '').trim() };
      }
    }

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
    let { userAnswers, selectedOption, textAnswer } = req.body;

    if (!userAnswers) {
      if (selectedOption !== undefined) {
        userAnswers = { q0: Number(selectedOption), lieIndex: Number(selectedOption) };
      } else if (textAnswer !== undefined) {
        userAnswers = { answer: String(textAnswer).trim() };
      }
    }

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

