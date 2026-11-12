import FeedHeist from '../models/FeedHeist.js';
import Notification from '../models/Notification.js';
import ActivityLog from '../models/ActivityLog.js';
import { sendNotificationToUser } from './socket.service.js';

/**
 * Normalizes answer string for case and punctuation-tolerant comparison.
 */
const normalizeAnswer = (str = '') => {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '');
};

/**
 * Lists platform Feed Heists with real server-backed time logic.
 */
export const listHeists = async ({
  page = 1,
  limit = 10,
  status = '',
  category = '',
  heistType = '',
  difficulty = '',
  search = ''
} = {}) => {
  const now = new Date();

  // Auto-expire past-due active missions
  await FeedHeist.updateMany(
    { status: 'active', endAt: { $lt: now } },
    { $set: { status: 'expired' } }
  );

  const query = {};

  if (status) {
    query.status = status;
  } else {
    // Default to active, upcoming and completed
    query.status = { $in: ['active', 'upcoming', 'completed', 'expired'] };
  }

  if (category) query.category = category;
  if (heistType) query.heistType = heistType;
  if (difficulty) query.difficulty = difficulty;

  if (search && search.trim()) {
    query.$or = [
      { title: { $regex: search.trim(), $options: 'i' } },
      { shortDescription: { $regex: search.trim(), $options: 'i' } }
    ];
  }

  const numericPage = Math.max(1, parseInt(page, 10) || 1);
  const numericLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (numericPage - 1) * numericLimit;

  const [heists, total] = await Promise.all([
    FeedHeist.find(query)
      .populate('creator', 'fullName email profile.avatarUrl')
      .populate('solvedBy', 'fullName profile.avatarUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(numericLimit)
      .lean(),
    FeedHeist.countDocuments(query)
  ]);

  return {
    heists,
    pagination: {
      page: numericPage,
      limit: numericLimit,
      total,
      totalPages: Math.ceil(total / numericLimit) || 1
    }
  };
};

/**
 * Retrieves a single Feed Heist by ID with participant-gated clue reveals.
 */
export const getHeistById = async (heistId, currentUserId) => {
  const heist = await FeedHeist.findById(heistId)
    .populate('creator', 'fullName email profile.avatarUrl')
    .populate('solvedBy', 'fullName profile.avatarUrl')
    .populate('participants.user', 'fullName profile.avatarUrl email');

  if (!heist) {
    const error = new Error('Feed Heist not found.');
    error.status = 404;
    throw error;
  }

  // Check and apply expiration
  if (heist.status === 'active' && new Date(heist.endAt) < new Date()) {
    heist.status = 'expired';
    await heist.save();
  }

  const heistObj = heist.toObject();

  // Determine current user participation
  const isParticipant = currentUserId
    ? heist.participants.some(
        (p) => p.user && (p.user._id?.toString() === currentUserId.toString() || p.user.toString() === currentUserId.toString())
      )
    : false;

  // Mask clues that have not met their community participant threshold
  heistObj.clues = (heistObj.clues || []).map((clue) => {
    const isUnlocked =
      heist.status === 'completed' ||
      (clue.unlockParticipantThreshold || 0) <= (heist.participantsCount || 0);

    return {
      order: clue.order,
      hint: clue.hint,
      unlockParticipantThreshold: clue.unlockParticipantThreshold || 0,
      isUnlocked,
      clueText: isUnlocked
        ? clue.clueText
        : `[ENCRYPTED SIGNAL — Unlocks at ${clue.unlockParticipantThreshold} community operatives]`
    };
  });

  heistObj.isParticipant = isParticipant;

  // Filter submissions to show only the user's own submissions (prevent cheating)
  if (currentUserId) {
    heistObj.userSubmissions = (heist.submissions || []).filter(
      (s) => s.user?.toString() === currentUserId.toString()
    );
  } else {
    heistObj.userSubmissions = [];
  }

  // Exclude raw submissions array from response to preserve puzzle integrity
  delete heistObj.submissions;

  return heistObj;
};

/**
 * Creates a new Feed Heist.
 */
export const createHeist = async (heistData, creatorUserId) => {
  const {
    title,
    shortDescription,
    missionPrompt,
    heistType = 'community_code',
    difficulty = 'medium',
    category = 'cipher',
    clues = [],
    targetSolution,
    endAt,
    rewardBadge = 'Loop Heist Operative'
  } = heistData;

  if (!title || !title.trim()) {
    const error = new Error('Heist title is required.');
    error.status = 400;
    throw error;
  }

  if (!shortDescription || !shortDescription.trim()) {
    const error = new Error('Short mission summary is required.');
    error.status = 400;
    throw error;
  }

  if (!missionPrompt || !missionPrompt.trim()) {
    const error = new Error('Mission prompt explanation is required.');
    error.status = 400;
    throw error;
  }

  if (!targetSolution || !targetSolution.trim()) {
    const error = new Error('Target solution cipher is required.');
    error.status = 400;
    throw error;
  }

  if (!endAt) {
    const error = new Error('Heist expiration date is required.');
    error.status = 400;
    throw error;
  }

  const parsedEndAt = new Date(endAt);
  if (isNaN(parsedEndAt.getTime()) || parsedEndAt <= new Date()) {
    const error = new Error('Expiry deadline must be a valid future timestamp.');
    error.status = 400;
    throw error;
  }

  // Format clues
  const formattedClues = Array.isArray(clues)
    ? clues.map((c, idx) => ({
        order: c.order || idx + 1,
        clueText: c.clueText || c.text || '',
        hint: c.hint || '',
        unlockParticipantThreshold: parseInt(c.unlockParticipantThreshold, 10) || 0
      }))
    : [];

  const heist = new FeedHeist({
    title: title.trim(),
    shortDescription: shortDescription.trim(),
    missionPrompt: missionPrompt.trim(),
    heistType,
    difficulty,
    category,
    clues: formattedClues,
    targetSolution: targetSolution.trim(),
    endAt: parsedEndAt,
    creator: creatorUserId,
    status: 'active',
    rewardBadge: rewardBadge.trim(),
    participants: [
      {
        user: creatorUserId,
        joinedAt: new Date(),
        contributionsCount: 0
      }
    ],
    participantsCount: 1
  });

  await heist.save();

  // Audit Log
  try {
    const log = new ActivityLog({
      actor: creatorUserId,
      action: 'feed_heist_creation',
      targetType: 'FeedHeist',
      targetId: heist._id,
      metadata: { title: heist.title, heistType: heist.heistType }
    });
    await log.save();
  } catch (err) {
    console.error(`[ActivityLog] feed_heist_creation error: ${err.message}`);
  }

  return heist;
};

/**
 * Joins a Feed Heist.
 */
export const joinHeist = async (heistId, userId) => {
  const heist = await FeedHeist.findById(heistId);
  if (!heist) {
    const error = new Error('Feed Heist not found.');
    error.status = 404;
    throw error;
  }

  // Server-side time enforcement
  if (heist.status === 'active' && new Date(heist.endAt) < new Date()) {
    heist.status = 'expired';
    await heist.save();
    const error = new Error('This Feed Heist has expired.');
    error.status = 400;
    throw error;
  }

  if (heist.status !== 'active') {
    const error = new Error(`Cannot join a heist with status "${heist.status}".`);
    error.status = 400;
    throw error;
  }

  // Duplicate join prevention
  const userIdStr = userId.toString();
  const alreadyJoined = heist.participants.some(
    (p) => p.user && p.user.toString() === userIdStr
  );

  if (alreadyJoined) {
    const error = new Error('You are already an active operative in this heist.');
    error.status = 400;
    throw error;
  }

  heist.participants.push({
    user: userId,
    joinedAt: new Date(),
    contributionsCount: 0
  });
  heist.participantsCount = heist.participants.length;

  await heist.save();

  // Notify creator if join is by another user
  if (heist.creator?.toString() !== userIdStr) {
    try {
      const notification = new Notification({
        recipient: heist.creator,
        actor: userId,
        type: 'feed_heist',
        message: 'A new operative has joined your Feed Heist mission.',
        resourceType: 'FeedHeist',
        resourceId: heist._id
      });
      await notification.save();
      sendNotificationToUser(heist.creator, notification);
    } catch (err) {
      console.error(`[Notification] Heist join notice error: ${err.message}`);
    }
  }

  // Audit Log
  try {
    const log = new ActivityLog({
      actor: userId,
      action: 'feed_heist_join',
      targetType: 'FeedHeist',
      targetId: heist._id
    });
    await log.save();
  } catch (err) {
    console.error(`[ActivityLog] feed_heist_join error: ${err.message}`);
  }

  return {
    success: true,
    message: 'Operative credentials verified. You have joined the heist.',
    participantsCount: heist.participantsCount
  };
};

/**
 * Leaves a Feed Heist.
 */
export const leaveHeist = async (heistId, userId) => {
  const heist = await FeedHeist.findById(heistId);
  if (!heist) {
    const error = new Error('Feed Heist not found.');
    error.status = 404;
    throw error;
  }

  if (heist.status === 'completed') {
    const error = new Error('Cannot leave a completed heist.');
    error.status = 400;
    throw error;
  }

  const userIdStr = userId.toString();
  const initialLength = heist.participants.length;
  heist.participants = heist.participants.filter(
    (p) => p.user && p.user.toString() !== userIdStr
  );

  if (heist.participants.length === initialLength) {
    const error = new Error('You are not currently enrolled in this heist.');
    error.status = 400;
    throw error;
  }

  heist.participantsCount = heist.participants.length;
  await heist.save();

  return {
    success: true,
    message: 'You have withdrawn your operative presence from this heist.',
    participantsCount: heist.participantsCount
  };
};

/**
 * Submits an answer or decryption attempt for a Feed Heist.
 */
export const submitHeistAnswer = async (heistId, userId, { answer, note = '' }) => {
  if (!answer || !answer.trim()) {
    const error = new Error('Submission answer is required.');
    error.status = 400;
    throw error;
  }

  const heist = await FeedHeist.findById(heistId).select('+targetSolution');
  if (!heist) {
    const error = new Error('Feed Heist not found.');
    error.status = 404;
    throw error;
  }

  // Server-side expiration check
  if (heist.status === 'active' && new Date(heist.endAt) < new Date()) {
    heist.status = 'expired';
    await heist.save();
    const error = new Error('This Feed Heist has expired. Submissions are no longer accepted.');
    error.status = 400;
    throw error;
  }

  if (heist.status === 'completed') {
    const error = new Error('This Feed Heist has already been completed.');
    error.status = 400;
    throw error;
  }

  if (heist.status !== 'active') {
    const error = new Error(`Heist is not active (current status: ${heist.status}).`);
    error.status = 400;
    throw error;
  }

  const userIdStr = userId.toString();

  // Ensure user is enrolled (or auto-enroll)
  let participant = heist.participants.find(
    (p) => p.user && p.user.toString() === userIdStr
  );
  if (!participant) {
    participant = { user: userId, joinedAt: new Date(), contributionsCount: 0 };
    heist.participants.push(participant);
    heist.participantsCount = heist.participants.length;
  }

  // Max submission attempt limit (prevent brute-force spamming)
  const userSubmissions = (heist.submissions || []).filter(
    (s) => s.user && s.user.toString() === userIdStr
  );
  if (userSubmissions.length >= 15) {
    const error = new Error('Maximum attempt threshold reached (15 submissions). Security lock engaged.');
    error.status = 429;
    throw error;
  }

  // Compare solution
  const normalizedInput = normalizeAnswer(answer);
  const normalizedTarget = normalizeAnswer(heist.targetSolution);

  const isMatch = normalizedInput.length > 0 && normalizedInput === normalizedTarget;

  participant.contributionsCount = (participant.contributionsCount || 0) + 1;

  if (isMatch) {
    heist.status = 'completed';
    heist.solvedBy = userId;
    heist.solvedAt = new Date();
    heist.solutionSummary = (note || 'Target cipher cracked successfully!').trim();

    heist.submissions.push({
      user: userId,
      answer: answer.trim(),
      isCorrect: true,
      submittedAt: new Date(),
      contributionNote: (note || '').trim()
    });

    await heist.save();

    // Notify creator
    if (heist.creator?.toString() !== userIdStr) {
      try {
        const notification = new Notification({
          recipient: heist.creator,
          actor: userId,
          type: 'feed_heist',
          message: `Mission Solved! An operative cracked the cipher for "${heist.title}".`,
          resourceType: 'FeedHeist',
          resourceId: heist._id
        });
        await notification.save();
        sendNotificationToUser(heist.creator, notification);
      } catch (err) {
        console.error(`[Notification] Heist completion notice error: ${err.message}`);
      }
    }

    // Audit Log
    try {
      const log = new ActivityLog({
        actor: userId,
        action: 'feed_heist_solve',
        targetType: 'FeedHeist',
        targetId: heist._id,
        metadata: { title: heist.title, rewardBadge: heist.rewardBadge }
      });
      await log.save();
    } catch (err) {
      console.error(`[ActivityLog] feed_heist_solve error: ${err.message}`);
    }

    return {
      success: true,
      isCorrect: true,
      message: 'Heist Objective Solved! The community cipher has been cracked.',
      status: 'completed',
      rewardBadge: heist.rewardBadge
    };
  }

  // Incorrect attempt
  heist.submissions.push({
    user: userId,
    answer: answer.trim(),
    isCorrect: false,
    submittedAt: new Date(),
    contributionNote: (note || '').trim()
  });

  await heist.save();

  return {
    success: true,
    isCorrect: false,
    message: 'Decryption failed: Signal does not match the target cipher. Clues remain active.',
    remainingAttempts: 15 - (userSubmissions.length + 1)
  };
};

