import MoodOrbitRoom from '../models/MoodOrbitRoom.js';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import { getIO } from './socket.service.js';

const VALID_MOODS = ['creative', 'curious', 'chill', 'energized', 'focused', 'reflective'];

const DEFAULT_PROMPTS = {
  creative: 'What are you making or imagining today?',
  curious: 'What is an intriguing question on your mind right now?',
  chill: 'What is bringing you a moment of calm today?',
  energized: 'What are you most excited to accomplish right now?',
  focused: 'What is your primary focus for this session?',
  reflective: 'What recent moment gave you perspective?'
};

/**
 * Lists active Mood-Orbit rooms with mood filtering and server-side expiration.
 */
export const listRooms = async ({
  mood = '',
  status = 'active',
  page = 1,
  limit = 12
} = {}) => {
  const now = new Date();

  // Auto-expire past-due rooms
  await MoodOrbitRoom.updateMany(
    { status: { $in: ['active', 'full'] }, expiresAt: { $lt: now } },
    { $set: { status: 'expired' } }
  );

  const query = {};

  if (status) {
    query.status = status;
  } else {
    query.status = { $in: ['active', 'full'] };
  }

  if (mood && VALID_MOODS.includes(mood.toLowerCase())) {
    query.mood = mood.toLowerCase();
  }

  const numericPage = Math.max(1, parseInt(page, 10) || 1);
  const numericLimit = Math.min(30, Math.max(1, parseInt(limit, 10) || 12));
  const skip = (numericPage - 1) * numericLimit;

  const [rooms, total] = await Promise.all([
    MoodOrbitRoom.find(query)
      .populate('creator', 'fullName email profile.avatarUrl')
      .populate('participants.user', 'fullName profile.avatarUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(numericLimit)
      .lean(),
    MoodOrbitRoom.countDocuments(query)
  ]);

  return {
    rooms,
    pagination: {
      page: numericPage,
      limit: numericLimit,
      total,
      totalPages: Math.ceil(total / numericLimit) || 1
    }
  };
};

/**
 * Retrieves details for a specific Mood-Orbit room.
 */
export const getRoomById = async (roomId, currentUserId) => {
  const room = await MoodOrbitRoom.findById(roomId)
    .populate('creator', 'fullName email profile.avatarUrl')
    .populate('participants.user', 'fullName email profile.avatarUrl');

  if (!room) {
    const error = new Error('Mood-Orbit room not found.');
    error.status = 404;
    throw error;
  }

  // Auto-expire if deadline passed
  if ((room.status === 'active' || room.status === 'full') && new Date(room.expiresAt) < new Date()) {
    room.status = 'expired';
    await room.save();
  }

  const roomObj = room.toObject();

  // Check if current user is participant
  const isParticipant = currentUserId
    ? room.participants.some(
        (p) => p.user && (p.user._id?.toString() === currentUserId.toString() || p.user.toString() === currentUserId.toString())
      )
    : false;

  roomObj.isParticipant = isParticipant;

  // Include recent 50 messages
  roomObj.messages = (roomObj.messages || []).slice(-50);

  return roomObj;
};

/**
 * Creates a new Mood-Orbit room.
 */
export const createRoom = async (roomData, creatorUserId) => {
  const {
    name,
    mood,
    intention,
    prompt,
    maxParticipants = 25,
    durationHours = 4,
    settings = {}
  } = roomData;

  if (!name || !name.trim()) {
    const error = new Error('Room name is required.');
    error.status = 400;
    throw error;
  }

  const normalizedMood = (mood || '').toLowerCase().trim();
  if (!VALID_MOODS.includes(normalizedMood)) {
    const error = new Error(`Invalid mood. Must be one of: ${VALID_MOODS.join(', ')}.`);
    error.status = 400;
    throw error;
  }

  if (!intention || !intention.trim()) {
    const error = new Error('Room atmosphere intention is required.');
    error.status = 400;
    throw error;
  }

  const parsedDuration = Math.min(24, Math.max(1, parseFloat(durationHours) || 4));
  const parsedMax = Math.min(100, Math.max(2, parseInt(maxParticipants, 10) || 25));

  const expiresAt = new Date(Date.now() + parsedDuration * 60 * 60 * 1000);

  const room = new MoodOrbitRoom({
    name: name.trim(),
    mood: normalizedMood,
    intention: intention.trim(),
    prompt: (prompt || DEFAULT_PROMPTS[normalizedMood] || '').trim(),
    creator: creatorUserId,
    status: 'active',
    maxParticipants: parsedMax,
    expiresAt,
    participants: [
      {
        user: creatorUserId,
        joinedAt: new Date(),
        lastActiveAt: new Date()
      }
    ],
    participantsCount: 1,
    settings: {
      ambientTheme: settings.ambientTheme || 'twilight',
      allowMicroPrompts: settings.allowMicroPrompts !== false
    }
  });

  await room.save();

  // Audit Log
  try {
    const log = new ActivityLog({
      actor: creatorUserId,
      action: 'mood_orbit_room_creation',
      targetType: 'MoodOrbitRoom',
      targetId: room._id,
      metadata: { mood: room.mood, name: room.name }
    });
    await log.save();
  } catch (err) {
    console.error(`[ActivityLog] mood_orbit_room_creation error: ${err.message}`);
  }

  return room;
};

/**
 * Joins an active Mood-Orbit room.
 */
export const joinRoom = async (roomId, userId) => {
  const room = await MoodOrbitRoom.findById(roomId);
  if (!room) {
    const error = new Error('Mood-Orbit room not found.');
    error.status = 404;
    throw error;
  }

  // Server-side expiry check
  if ((room.status === 'active' || room.status === 'full') && new Date(room.expiresAt) < new Date()) {
    room.status = 'expired';
    await room.save();
    const error = new Error('This Mood-Orbit room has expired and closed.');
    error.status = 400;
    throw error;
  }

  if (room.status === 'closed' || room.status === 'expired') {
    const error = new Error(`Cannot join room with status "${room.status}".`);
    error.status = 400;
    throw error;
  }

  const userIdStr = userId.toString();
  const alreadyParticipant = room.participants.some(
    (p) => p.user && p.user.toString() === userIdStr
  );

  if (alreadyParticipant) {
    return {
      success: true,
      message: 'You are already in this Mood-Orbit room.',
      room
    };
  }

  // Capacity enforcement
  if (room.participants.length >= room.maxParticipants) {
    room.status = 'full';
    await room.save();
    const error = new Error(`Room has reached maximum capacity (${room.maxParticipants} participants).`);
    error.status = 400;
    throw error;
  }

  room.participants.push({
    user: userId,
    joinedAt: new Date(),
    lastActiveAt: new Date()
  });
  room.participantsCount = room.participants.length;

  if (room.participants.length >= room.maxParticipants) {
    room.status = 'full';
  }

  await room.save();

  // Audit Log
  try {
    const log = new ActivityLog({
      actor: userId,
      action: 'mood_orbit_room_join',
      targetType: 'MoodOrbitRoom',
      targetId: room._id
    });
    await log.save();
  } catch (err) {
    console.error(`[ActivityLog] mood_orbit_room_join error: ${err.message}`);
  }

  return {
    success: true,
    message: 'Entered Mood-Orbit room.',
    room
  };
};

/**
 * Leaves a Mood-Orbit room.
 */
export const leaveRoom = async (roomId, userId) => {
  const room = await MoodOrbitRoom.findById(roomId);
  if (!room) {
    const error = new Error('Mood-Orbit room not found.');
    error.status = 404;
    throw error;
  }

  const userIdStr = userId.toString();
  const initialCount = room.participants.length;

  room.participants = room.participants.filter(
    (p) => p.user && p.user.toString() !== userIdStr
  );

  if (room.participants.length === initialCount) {
    return {
      success: true,
      message: 'You are not in this room.'
    };
  }

  room.participantsCount = room.participants.length;
  if (room.status === 'full' && room.participants.length < room.maxParticipants) {
    room.status = 'active';
  }

  await room.save();

  return {
    success: true,
    message: 'Left Mood-Orbit room.',
    participantsCount: room.participantsCount
  };
};

/**
 * Appends a message to a Mood-Orbit room conversation and emits real-time event.
 */
export const postRoomMessage = async (roomId, userId, { content }) => {
  if (!content || !content.trim()) {
    const error = new Error('Message content is required.');
    error.status = 400;
    throw error;
  }

  if (content.trim().length > 500) {
    const error = new Error('Message cannot exceed 500 characters.');
    error.status = 400;
    throw error;
  }

  const room = await MoodOrbitRoom.findById(roomId);
  if (!room) {
    const error = new Error('Mood-Orbit room not found.');
    error.status = 404;
    throw error;
  }

  // Server-side expiry check
  if ((room.status === 'active' || room.status === 'full') && new Date(room.expiresAt) < new Date()) {
    room.status = 'expired';
    await room.save();
    const error = new Error('This Mood-Orbit room has expired. Further messages are blocked.');
    error.status = 400;
    throw error;
  }

  if (room.status === 'closed' || room.status === 'expired') {
    const error = new Error(`Cannot send messages to a ${room.status} room.`);
    error.status = 400;
    throw error;
  }

  const userIdStr = userId.toString();
  const isParticipant = room.participants.some(
    (p) => p.user && p.user.toString() === userIdStr
  );

  if (!isParticipant) {
    const error = new Error('You must be a joined participant in this room to post messages.');
    error.status = 403;
    throw error;
  }

  const senderUser = await User.findById(userId).select('fullName profile.avatarUrl');
  const messageData = {
    sender: userId,
    senderName: senderUser?.fullName || 'Operative',
    senderAvatar: senderUser?.profile?.avatarUrl || '',
    content: content.trim(),
    createdAt: new Date()
  };

  room.messages.push(messageData);

  // Keep array within 200 recent messages
  if (room.messages.length > 200) {
    room.messages = room.messages.slice(-200);
  }

  await room.save();

  const persistedMessage = room.messages[room.messages.length - 1];

  // Real-time broadcast to room subscribers
  const io = getIO();
  if (io) {
    io.to(`mood_orbit_${roomId}`).emit('mood_orbit:new_message', {
      roomId,
      message: persistedMessage
    });
  }

  return persistedMessage;
};

