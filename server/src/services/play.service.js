import { GameChallenge, User, Notification, ActivityLog } from '../models/index.js';
import { isValidObjectId } from '../validators/profile.validator.js';
import { sendNotificationToUser } from './socket.service.js';

/**
 * Creates a new Looply Play game challenge.
 */
export const createChallenge = async ({ creatorId, gameType, title, description, gameData, answerKey, expiresAt }) => {
  const validGames = ['who_knows_me', 'two_truths_and_lie', 'emoji_challenge', 'picture_mystery'];
  if (!validGames.includes(gameType)) {
    const error = new Error(`Game type must be one of: ${validGames.join(', ')}.`);
    error.status = 400;
    throw error;
  }

  if (!title || title.trim().length < 3) {
    const error = new Error('Game title must be at least 3 characters.');
    error.status = 400;
    throw error;
  }

  if (!gameData || !answerKey) {
    const error = new Error('Game data and answer key are required.');
    error.status = 400;
    throw error;
  }

  const challenge = new GameChallenge({
    creator: creatorId,
    gameType,
    title: title.trim(),
    description: (description || '').trim(),
    gameData,
    answerKey,
    expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  await challenge.save();

  try {
    const auditLog = new ActivityLog({
      actor: creatorId,
      action: 'game_challenge_creation',
      targetType: 'GameChallenge',
      targetId: challenge._id,
      metadata: { gameType, title: challenge.title }
    });
    await auditLog.save();
  } catch (err) {
    console.error(`[ActivityLog] Play creation: ${err.message}`);
  }

  return { success: true, challenge, message: 'Looply Play game challenge published!' };
};

/**
 * Lists available game challenges.
 */
export const listChallenges = async ({ gameType, page = 1, limit = 20 }) => {
  const query = { expiresAt: { $gt: new Date() } };
  if (gameType && gameType !== 'all') {
    query.gameType = gameType;
  }

  const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, Number.parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [challenges, total] = await Promise.all([
    GameChallenge.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('creator', '_id fullName profile.avatarUrl')
      .populate('participants.user', '_id fullName profile.avatarUrl'),
    GameChallenge.countDocuments(query)
  ]);

  return {
    success: true,
    challenges,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1
    }
  };
};

/**
 * Retrieves a single challenge details.
 */
export const getChallengeById = async (challengeId, currentUserId = null) => {
  if (!isValidObjectId(challengeId)) {
    const error = new Error('Invalid challenge ID format.');
    error.status = 400;
    throw error;
  }

  const challenge = await GameChallenge.findById(challengeId)
    .populate('creator', '_id fullName profile.avatarUrl')
    .populate('participants.user', '_id fullName profile.avatarUrl');

  if (!challenge) {
    const error = new Error('Game challenge not found.');
    error.status = 404;
    throw error;
  }

  const userParticipation = currentUserId
    ? challenge.participants.find(p => p.user?._id.toString() === currentUserId.toString())
    : null;

  return {
    success: true,
    challenge,
    hasParticipated: Boolean(userParticipation),
    userScore: userParticipation ? userParticipation.score : null
  };
};

/**
 * Submits an answer to a challenge and computes results.
 */
export const submitAnswer = async (challengeId, currentUserId, userAnswers) => {
  if (!isValidObjectId(challengeId)) {
    const error = new Error('Invalid challenge ID format.');
    error.status = 400;
    throw error;
  }

  const challenge = await GameChallenge.findById(challengeId).select('+answerKey');
  if (!challenge) {
    const error = new Error('Game challenge not found.');
    error.status = 404;
    throw error;
  }

  if (challenge.expiresAt && challenge.expiresAt < new Date()) {
    const error = new Error('This game challenge has expired.');
    error.status = 400;
    throw error;
  }

  // Prevent duplicate submission
  const alreadyAnswered = challenge.participants.some(
    p => p.user.toString() === currentUserId.toString()
  );

  if (alreadyAnswered) {
    const existing = challenge.participants.find(p => p.user.toString() === currentUserId.toString());
    return {
      success: true,
      score: existing.score,
      message: 'You have already played this challenge!'
    };
  }

  let score = 0;
  let maxScore = 0;

  if (challenge.gameType === 'who_knows_me') {
    const key = challenge.answerKey || {}; // { q0: 1, q1: 2, ... }
    maxScore = Object.keys(key).length;
    for (const [qKey, correctVal] of Object.entries(key)) {
      if (userAnswers[qKey] === correctVal) score += 1;
    }
  } else if (challenge.gameType === 'two_truths_and_lie') {
    maxScore = 1;
    // key is the index of the lie (0, 1, or 2)
    if (Number(userAnswers.lieIndex) === Number(challenge.answerKey.lieIndex)) {
      score = 1;
    }
  } else if (challenge.gameType === 'emoji_challenge') {
    maxScore = 1;
    const cleanCorrect = String(challenge.answerKey.answer || '').trim().toLowerCase();
    const cleanUser = String(userAnswers.answer || '').trim().toLowerCase();
    if (cleanUser === cleanCorrect) {
      score = 1;
    }
  } else if (challenge.gameType === 'picture_mystery') {
    maxScore = 1;
    const cleanCorrect = String(challenge.answerKey.answer || '').trim().toLowerCase();
    const cleanUser = String(userAnswers.answer || '').trim().toLowerCase();
    if (cleanUser === cleanCorrect) {
      score = 1;
    }
  }

  // Record participation
  challenge.participants.push({
    user: currentUserId,
    score,
    userAnswers,
    completedAt: new Date()
  });

  await challenge.save();

  // Notify challenge creator
  try {
    const player = await User.findById(currentUserId).select('fullName');
    const notification = new Notification({
      recipient: challenge.creator,
      actor: currentUserId,
      type: 'game_challenge',
      message: `${player?.fullName || 'A friend'} played your Looply Play game "${challenge.title}" and scored ${score}/${maxScore}!`,
      resourceType: 'GameChallenge',
      resourceId: challenge._id
    });
    await notification.save();
    sendNotificationToUser(challenge.creator, notification);
  } catch (err) {
    console.error(`[Notification] Game played: ${err.message}`);
  }

  return {
    success: true,
    score,
    maxScore,
    message: score === maxScore ? '🎉 Perfect score! You nailed it!' : `You scored ${score} out of ${maxScore}!`
  };
};

