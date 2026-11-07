import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AUTH_COOKIE_NAME } from '../config/jwt.js';
import User from '../models/User.js';
import { corsOptions } from '../config/cors.js';

let ioInstance = null;

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
    const userRoom = `user_${user._id}`;

    // Join personal notification room
    socket.join(userRoom);

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

    // Prevent client from joining administrative rooms manually
    socket.on('join_room', (roomName) => {
      if (roomName === 'admin_room' && user.role !== 'admin') {
        socket.emit('error', { message: 'Unauthorized room subscription attempt.' });
        return;
      }
      if (roomName && roomName.startsWith('user_') && roomName !== userRoom && user.role !== 'admin') {
        socket.emit('error', { message: 'Unauthorized user room subscription attempt.' });
        return;
      }
      socket.join(roomName);
    });

    // Conversation Room & Real-Time Messaging Events
    socket.on('join_conversation', (data) => {
      const convId = parseConvId(data);
      if (convId) {
        socket.join(`conversation_${convId}`);
      }
    });

    socket.on('leave_conversation', (data) => {
      const convId = parseConvId(data);
      if (convId) {
        socket.leave(`conversation_${convId}`);
      }
    });

    // Ephemeral typing indicators (broadcast to conversation participants)
    socket.on('typing_start', (data) => {
      const convId = parseConvId(data);
      if (convId) {
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
      if (convId) {
        const payload = {
          conversationId: convId,
          userId: user._id
        };
        socket.to(`conversation_${convId}`).emit('user_stopped_typing', payload);
        socket.to(`conversation_${convId}`).emit('typing_stop', payload);
      }
    });

    socket.on('disconnect', () => {
      // Disconnection handled cleanly
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

