import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { AUTH_COOKIE_NAME } from '../config/jwt.js';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import MoodOrbitRoom from '../models/MoodOrbitRoom.js';
import { corsOptions } from '../config/cors.js';

let ioInstance = null;
const onlineUsersMap = new Map(); // userId (string) -> Set of active socket IDs

/**
 * Returns array of currently connected online user IDs.
 *
 * @returns {string[]}
 */
export const getOnlineUserIds = () => Array.from(onlineUsersMap.keys());

/**
 * Extracts authentication token from socket handshake (cookie or auth object/header).
 *
 * @param {object} handshake - Socket.IO handshake object
 * @returns {string|null} JWT token or null
 */
const extractSocketToken = (handshake) => {
  // 1. Check handshake.auth
  if (handshake.auth && handshake.auth.token) {
    const raw = handshake.auth.token;
    return raw.startsWith('Bearer ') ? raw.slice(7).trim() : raw.trim();
  }

  // 2. Check Authorization header
  if (handshake.headers && handshake.headers.authorization) {
    const authHeader = handshake.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7).trim();
    }
  }

  // 3. Check Cookie header
  if (handshake.headers && handshake.headers.cookie) {
    const cookieHeader = handshake.headers.cookie;
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${AUTH_COOKIE_NAME}=([^;]+)`));
    if (match && match[1]) {
      return decodeURIComponent(match[1].trim());
    }
  }

  return null;
};

/**
 * Socket.IO Authentication Middleware.
 * Validates JWT, verifies tokenVersion, and confirms accountStatus === 'active'.
 */
export const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = extractSocketToken(socket.handshake);

    if (!token) {
      return next(new Error('Authentication error: Missing token.'));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (jwtErr) {
      return next(new Error('Authentication error: Invalid or expired token.'));
    }

    if (!decoded || !decoded.userId) {
      return next(new Error('Authentication error: Invalid session payload.'));
    }

    // Strict tokenVersion verification
    if (typeof decoded.tokenVersion !== 'number' || !Number.isInteger(decoded.tokenVersion)) {
      return next(new Error('Authentication error: Invalid session format.'));
    }

    // Retrieve fresh user from MongoDB
    const user = await User.findById(decoded.userId).select('+passwordHash');
    if (!user) {
      return next(new Error('Authentication error: User account not found.'));
    }

    // Check accountStatus
    if (user.accountStatus === 'suspended') {
      return next(new Error('Authentication error: Account suspended.'));
    }

    // Check tokenVersion match
    const currentTokenVersion = user.tokenVersion || 0;
    if (currentTokenVersion !== decoded.tokenVersion) {
      return next(new Error('Authentication error: Session has been invalidated.'));
    }

    // Attach safe user to socket data
    socket.data.user = {
      _id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      accountStatus: user.accountStatus,
      isEmailVerified: user.isEmailVerified
    };

    next();
  } catch (err) {
    return next(new Error(`Authentication error: ${err.message}`));
  }
};

/**
 * Initializes the Socket.IO server on top of an existing Node.js HTTP server.
 *
 * @param {import('http').Server} httpServer - Active HTTP server
 * @returns {SocketIOServer} Configured Socket.IO server
 */
export const initSocketServer = (httpServer) => {
  if (ioInstance) {
    return ioInstance;
  }

  ioInstance = new SocketIOServer(httpServer, {
    cors: corsOptions,
    pingTimeout: 20000,
    pingInterval: 25000
  });

  // Apply authentication middleware
  ioInstance.use(socketAuthMiddleware);

  ioInstance.on('connection', (socket) => {
    const user = socket.data.user;
    const userIdStr = user._id.toString();
    const userRoom = `user_${userIdStr}`;

    // Join personal notification room
    socket.join(userRoom);

    // Online Presence Tracking: Register active socket
    const existingSockets = onlineUsersMap.get(userIdStr);
    if (!existingSockets) {
      onlineUsersMap.set(userIdStr, new Set([socket.id]));
      // Notify all connected clients of newly online user
      ioInstance.emit('user_status_change', { userId: userIdStr, status: 'online' });
    } else {
      existingSockets.add(socket.id);
    }

    // Send current list of online users to the freshly connected socket
    socket.emit('online_users_list', Array.from(onlineUsersMap.keys()));

    socket.on('get_online_users', () => {
      socket.emit('online_users_list', Array.from(onlineUsersMap.keys()));
    });

    // Join admin room strictly if authoritative role is admin
    if (user.role === 'admin') {
      socket.join('admin_room');
    }

    const parseConvId = (data) => {
      if (!data) return null;
      if (typeof data === 'string') return data.trim();
      if (typeof data === 'object') {
        const id = data.conversationId || data.id || data._id;
        return id ? id.toString().trim() : null;
      }
      return null;
    };

    // Prevent client from joining administrative or protected user/conversation rooms manually
    socket.on('join_room', (roomName) => {
      if (typeof roomName !== 'string') return;
      if (roomName === 'admin_room' && user.role !== 'admin') {
        socket.emit('error', { message: 'Unauthorized room subscription attempt.' });
        return;
      }
      if (roomName && roomName.startsWith('user_') && roomName !== userRoom) {
        socket.emit('error', { message: 'Unauthorized user room subscription attempt.' });
        return;
      }
      if (roomName && roomName.startsWith('conversation_')) {
        socket.emit('error', { message: 'Direct conversation room join forbidden. Use join_conversation.' });
        return;
      }
      if (roomName && roomName.startsWith('mood_orbit_')) {
        socket.emit('error', { message: 'Direct mood orbit room join forbidden. Use mood_orbit:join.' });
        return;
      }
      socket.join(roomName);
    });

    // Mood-Orbit Ephemeral Room Presence & Subscriptions
    socket.on('mood_orbit:join', async (data) => {
      try {
        const roomId = typeof data === 'string' ? data.trim() : data?.roomId?.toString().trim();
        if (!roomId || !mongoose.isValidObjectId(roomId)) {
          socket.emit('error', { message: 'Invalid Mood-Orbit room ID format.' });
          return;
        }

        const room = await MoodOrbitRoom.findById(roomId);
        if (!room) {
          socket.emit('error', { message: 'Mood-Orbit room does not exist.' });
          return;
        }

        if (room.status === 'expired' || new Date(room.expiresAt) < new Date()) {
          socket.emit('error', { message: 'Cannot join expired Mood-Orbit room.' });
          return;
        }

        socket.join(`mood_orbit_${roomId}`);
        socket.to(`mood_orbit_${roomId}`).emit('mood_orbit:user_joined', {
          roomId,
          user: {
            _id: user._id,
            fullName: user.fullName
          }
        });
      } catch (err) {
        socket.emit('error', { message: 'Failed to subscribe to Mood-Orbit room.' });
      }
    });

    socket.on('mood_orbit:leave', (data) => {
      const roomId = typeof data === 'string' ? data.trim() : data?.roomId?.toString().trim();
      if (roomId) {
        socket.leave(`mood_orbit_${roomId}`);
        socket.to(`mood_orbit_${roomId}`).emit('mood_orbit:user_left', {
          roomId,
          userId: user._id
        });
      }
    });

    socket.on('mood_orbit:message', async (data) => {
      try {
        const roomId = data?.roomId?.toString().trim();
        const content = data?.content?.toString().trim();

        if (!roomId || !content) return;
        if (!socket.rooms.has(`mood_orbit_${roomId}`)) {
          socket.emit('error', { message: 'Access denied: You have not joined this Mood-Orbit room.' });
          return;
        }

        const { postRoomMessage } = await import('./moodOrbit.service.js');
        await postRoomMessage(roomId, user._id, { content });
      } catch (err) {
        socket.emit('error', { message: err.message || 'Failed to send room message.' });
      }
    });

    // Conversation Room & Real-Time Messaging Events with Authoritative Membership Verification
    socket.on('join_conversation', async (data) => {
      try {
        const convId = parseConvId(data);
        if (!convId || !mongoose.isValidObjectId(convId)) {
          socket.emit('error', { message: 'Invalid conversation ID format.' });
          return;
        }

        // Authoritative membership check: verify user is an active participant in this conversation
        const isParticipant = await Conversation.exists({
          _id: convId,
          participants: user._id
        });

        if (!isParticipant) {
          socket.emit('error', { message: 'Access denied: You are not a participant in this conversation.' });
          return;
        }

        socket.join(`conversation_${convId}`);
      } catch (err) {
        socket.emit('error', { message: 'Failed to verify conversation membership.' });
      }
    });

    socket.on('leave_conversation', (data) => {
      const convId = parseConvId(data);
      if (convId) {
        socket.leave(`conversation_${convId}`);
      }
    });

    // Ephemeral typing indicators (broadcast only if socket is verified member of conversation)
    socket.on('typing_start', (data) => {
      const convId = parseConvId(data);
      if (convId && socket.rooms.has(`conversation_${convId}`)) {
        const payload = {
          conversationId: convId,
          userId: user._id,
          fullName: user.fullName
        };
        socket.to(`conversation_${convId}`).emit('user_typing', payload);
        socket.to(`conversation_${convId}`).emit('typing_start', payload);
      }
    });

    socket.on('typing_stop', (data) => {
      const convId = parseConvId(data);
      if (convId && socket.rooms.has(`conversation_${convId}`)) {
        const payload = {
          conversationId: convId,
          userId: user._id
        };
        socket.to(`conversation_${convId}`).emit('user_stopped_typing', payload);
        socket.to(`conversation_${convId}`).emit('typing_stop', payload);
      }
    });

    socket.on('disconnect', () => {
      // Online Presence Tracking: Deregister disconnecting socket
      const userSockets = onlineUsersMap.get(userIdStr);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsersMap.delete(userIdStr);
          // User is fully offline (all sessions/tabs closed)
          ioInstance?.emit('user_status_change', { userId: userIdStr, status: 'offline' });
        }
      }
    });
  });

  return ioInstance;
};

/**
 * Returns active Socket.IO instance or null if not yet initialized.
 *
 * @returns {SocketIOServer|null}
 */
export const getIO = () => ioInstance;

/**
 * Closes the active Socket.IO server instance.
 */
export const closeSocketServer = async () => {
  onlineUsersMap.clear();
  if (ioInstance) {
    await new Promise((resolve) => {
      ioInstance.close(() => {
        ioInstance = null;
        resolve();
      });
    });
  }
};

/**
 * Emits a real-time notification to a specific user.
 *
 * @param {string|object} userId - Recipient ObjectId
 * @param {object} notification - Notification payload
 * @param {string} [eventName='notification'] - Canonical event name
 */
export const sendNotificationToUser = (userId, notification, eventName = 'notification') => {
  if (!ioInstance) return;
  const targetId = userId && userId._id ? userId._id.toString() : userId ? userId.toString() : '';
  if (!targetId) return;

  ioInstance.to(`user_${targetId}`).emit(eventName, notification);
};

/**
 * Emits a real-time notification to the administrator room.
 * Uses a single canonical event delivery and strictly avoids duplicate generic event emission.
 *
 * @param {object} notification - Admin notification payload
 * @param {string} [eventName='admin_login_alert'] - Event name
 */
export const sendAdminNotification = (notification, eventName = 'admin_login_alert') => {
  if (!ioInstance) return;
  ioInstance.to('admin_room').emit(eventName, notification);
};

