import { GlobalEvent, User, ActivityLog } from '../models/index.js';
import { isValidObjectId } from '../validators/profile.validator.js';

/**
 * Retrieves the currently active global mystery events.
 */
export const getActiveEvents = async (currentUserId = null) => {
  const events = await GlobalEvent.find({
    isActive: true,
    endDate: { $gt: new Date() }
  }).sort({ createdAt: -1 });

  const formatted = events.map(e => {
    const userSub = currentUserId
      ? e.submissions.find(s => s.user.toString() === currentUserId.toString())
      : null;

    return {
      _id: e._id,
      title: e.title,
      description: e.description,
      bannerUrl: e.bannerUrl,
      clues: e.clues,
      startDate: e.startDate,
      endDate: e.endDate,
      solvedCount: e.submissions.filter(s => s.isCorrect).length,
      hasSolved: userSub ? userSub.isCorrect : false,
      userSubmission: userSub
        ? {
            answer: userSub.answer,
            isCorrect: userSub.isCorrect,
            pointsAwarded: userSub.pointsAwarded,
            submittedAt: userSub.submittedAt
          }
        : null
    };
  });

  return { success: true, events: formatted };
};

/**
 * Retrieves event details including leaderboard.
 */
export const getEventById = async (eventId, currentUserId = null) => {
  if (!isValidObjectId(eventId)) {
    const error = new Error('Invalid event ID format.');
    error.status = 400;
    throw error;
  }

  const event = await GlobalEvent.findById(eventId)
    .populate('submissions.user', '_id fullName profile.avatarUrl');

  if (!event) {
    const error = new Error('Global event not found.');
    error.status = 404;
    throw error;
  }

  const leaderboard = event.submissions
    .filter(s => s.isCorrect)
    .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt))
    .slice(0, 10)
    .map((s, idx) => ({
      rank: idx + 1,
      user: s.user,
      points: s.pointsAwarded,
      solvedAt: s.submittedAt
    }));

  const userSub = currentUserId
    ? event.submissions.find(s => s.user?._id.toString() === currentUserId.toString())
    : null;

  return {
    success: true,
    event: {
      _id: event._id,
      title: event.title,
      description: event.description,
      bannerUrl: event.bannerUrl,
      clues: event.clues,
      startDate: event.startDate,
      endDate: event.endDate,
      isActive: event.isActive,
      hasSolved: userSub ? userSub.isCorrect : false,
      userSubmission: userSub
    },
    leaderboard
  };
};

/**
 * Submits an answer to the mystery event.
 */
export const submitEventAnswer = async (eventId, currentUserId, answer) => {
  if (!isValidObjectId(eventId)) {
    const error = new Error('Invalid event ID format.');
    error.status = 400;
    throw error;
  }

  if (!answer || !answer.trim()) {
    const error = new Error('Please enter a mystery answer.');
    error.status = 400;
    throw error;
  }

  const event = await GlobalEvent.findById(eventId).select('+solution');
  if (!event || !event.isActive || (event.endDate && event.endDate < new Date())) {
    const error = new Error('This mystery event is not currently active.');
    error.status = 400;
    throw error;
  }

  // Check if already solved
  const existingSub = event.submissions.find(
    s => s.user.toString() === currentUserId.toString() && s.isCorrect
  );

  if (existingSub) {
    return {
      success: true,
      isCorrect: true,
      message: 'You have already solved this mystery event!'
    };
  }

  const cleanCorrect = String(event.solution || '').trim().toLowerCase();
  const cleanAttempt = String(answer || '').trim().toLowerCase();
  const isCorrect = cleanAttempt === cleanCorrect;
  const pointsAwarded = isCorrect ? 100 : 0;

  // Add submission
  event.submissions.push({
    user: currentUserId,
    answer: answer.trim(),
    isCorrect,
    pointsAwarded,
    submittedAt: new Date()
  });

  await event.save();

  return {
    success: true,
    isCorrect,
    pointsAwarded,
    message: isCorrect
      ? '🎉 Brilliant deduction! You solved the global mystery event!'
      : 'That is not the correct solution. Review the clues and try again!'
  };
};

/**
 * Administrative creation of a mystery event.
 */
export const adminCreateEvent = async ({ adminUserId, title, description, bannerUrl = '', clues, solution, startDate, endDate }) => {
  if (!title || !description || !solution) {
    const error = new Error('Event title, description, and solution are required.');
    error.status = 400;
    throw error;
  }

  const event = new GlobalEvent({
    title: title.trim(),
    description: description.trim(),
    bannerUrl: (bannerUrl || '').trim(),
    clues: Array.isArray(clues) ? clues : [],
    solution: solution.trim(),
    startDate: startDate ? new Date(startDate) : new Date(),
    endDate: endDate ? new Date(endDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
  });

  await event.save();

  try {
    const auditLog = new ActivityLog({
      actor: adminUserId,
      action: 'global_event_creation',
      targetType: 'GlobalEvent',
      targetId: event._id,
      metadata: { title: event.title }
    });
    await auditLog.save();
  } catch (err) {
    console.error(`[ActivityLog] Event creation: ${err.message}`);
  }

  return { success: true, event, message: 'Global Mystery Event published!' };
};

