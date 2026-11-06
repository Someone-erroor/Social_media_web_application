import { TimeCapsule, User, Notification, ActivityLog } from '../models/index.js';
import { isValidObjectId } from '../validators/profile.validator.js';
import { sendNotificationToUser } from './socket.service.js';

/**
 * Creates a new time capsule sealed until unlockDate.
 */
export const createTimeCapsule = async ({ creatorId, title, message, mediaUrl = '', unlockDate, isShared = false, recipients = [] }) => {
  if (!title || title.trim().length < 2) {
    const error = new Error('Time capsule title is required.');
    error.status = 400;
    throw error;
  }

  if (!message || message.trim().length < 1) {
    const error = new Error('Time capsule message content cannot be empty.');
    error.status = 400;
    throw error;
  }

  if (!unlockDate) {
    const error = new Error('Unlock date is required.');
    error.status = 400;
    throw error;
  }

  const targetDate = new Date(unlockDate);
  if (Number.isNaN(targetDate.getTime())) {
    const error = new Error('Invalid unlock date format.');
    error.status = 400;
    throw error;
  }

  if (targetDate <= new Date()) {
    const error = new Error('Unlock date must be in the future.');
    error.status = 400;
    throw error;
  }

  const capsule = new TimeCapsule({
    creator: creatorId,
    title: title.trim(),
    message: message.trim(),
    mediaUrl: (mediaUrl || '').trim(),
    unlockDate: targetDate,
    isShared: Boolean(isShared),
    recipients: Array.isArray(recipients) ? recipients : [],
    status: 'sealed'
  });

  await capsule.save();

  // Audit record
  try {
    const auditLog = new ActivityLog({
      actor: creatorId,
      action: 'time_capsule_creation',
      targetType: 'TimeCapsule',
      targetId: capsule._id,
      metadata: { unlockDate: targetDate.toISOString(), title: capsule.title }
    });
    await auditLog.save();
  } catch (err) {
    console.error(`[ActivityLog] Capsule creation: ${err.message}`);
  }

  return {
    success: true,
    capsule: {
      _id: capsule._id,
      title: capsule.title,
      unlockDate: capsule.unlockDate,
      isShared: capsule.isShared,
      status: capsule.status
    },
    message: 'Time capsule sealed successfully! It will unlock automatically on the designated date.'
  };
};

/**
 * Lists all time capsules visible to the authenticated user.
 * Masks message content if capsule has not reached unlockDate.
 */
export const listTimeCapsules = async (currentUserId) => {
  const capsules = await TimeCapsule.find({
    $or: [
      { creator: currentUserId },
      { isShared: true, recipients: currentUserId }
    ]
  })
    .sort({ unlockDate: 1 })
    .populate('creator', '_id fullName profile.avatarUrl');

  const now = new Date();

  const formatted = capsules.map(c => {
    const isLocked = now < new Date(c.unlockDate);
    const isOwner = c.creator?._id.toString() === currentUserId.toString();

    return {
      _id: c._id,
      title: c.title,
      unlockDate: c.unlockDate,
      isLocked,
      isOwner,
      isShared: c.isShared,
      creator: c.creator,
      timeRemainingMs: isLocked ? Math.max(0, new Date(c.unlockDate).getTime() - now.getTime()) : 0,
      // Strictly prevent unsealed content from being transmitted before unlock time
      message: isLocked ? '[Locked Memory Vault — Unlocks on designated date]' : c.message,
      mediaUrl: isLocked ? '' : c.mediaUrl,
      createdAt: c.createdAt
    };
  });

  return { success: true, capsules: formatted };
};

/**
 * Retrieves a single time capsule with strict server-side unlock verification.
 */
export const getTimeCapsuleById = async (capsuleId, currentUserId) => {
  if (!isValidObjectId(capsuleId)) {
    const error = new Error('Invalid capsule ID.');
    error.status = 400;
    throw error;
  }

  const capsule = await TimeCapsule.findById(capsuleId)
    .populate('creator', '_id fullName profile.avatarUrl')
    .populate('recipients', '_id fullName profile.avatarUrl');

  if (!capsule) {
    const error = new Error('Time capsule not found.');
    error.status = 404;
    throw error;
  }

  const isOwner = capsule.creator?._id.toString() === currentUserId.toString();
  const isRecipient = (capsule.recipients || []).some(r => r._id.toString() === currentUserId.toString());

  if (!isOwner && !isRecipient) {
    const error = new Error('You do not have permission to view this capsule.');
    error.status = 403;
    throw error;
  }

  const now = new Date();
  const isLocked = now < new Date(capsule.unlockDate);

  if (isLocked) {
    return {
      success: true,
      capsule: {
        _id: capsule._id,
        title: capsule.title,
        unlockDate: capsule.unlockDate,
        isLocked: true,
        isOwner,
        isShared: capsule.isShared,
        creator: capsule.creator,
        timeRemainingMs: Math.max(0, new Date(capsule.unlockDate).getTime() - now.getTime()),
        message: `🔒 Sealed until ${new Date(capsule.unlockDate).toLocaleDateString()} at ${new Date(capsule.unlockDate).toLocaleTimeString()}`,
        mediaUrl: ''
      }
    };
  }

  // Capsule is unlocked
  if (capsule.status !== 'unlocked') {
    capsule.status = 'unlocked';
    await capsule.save();
  }

  return {
    success: true,
    capsule: {
      _id: capsule._id,
      title: capsule.title,
      unlockDate: capsule.unlockDate,
      isLocked: false,
      isOwner,
      isShared: capsule.isShared,
      creator: capsule.creator,
      recipients: capsule.recipients,
      message: capsule.message,
      mediaUrl: capsule.mediaUrl,
      createdAt: capsule.createdAt
    }
  };
};

/**
 * Deletes a time capsule (creator only).
 */
export const deleteTimeCapsule = async (capsuleId, currentUserId) => {
  if (!isValidObjectId(capsuleId)) {
    const error = new Error('Invalid capsule ID.');
    error.status = 400;
    throw error;
  }

  const capsule = await TimeCapsule.findById(capsuleId);
  if (!capsule) {
    const error = new Error('Time capsule not found.');
    error.status = 404;
    throw error;
  }

  if (capsule.creator.toString() !== currentUserId.toString()) {
    const error = new Error('Only the creator can delete this capsule.');
    error.status = 403;
    throw error;
  }

  await TimeCapsule.findByIdAndDelete(capsuleId);
  return { success: true, message: 'Time capsule deleted successfully.' };
};

