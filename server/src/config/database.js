import mongoose from 'mongoose';
import { env } from './env.js';

/**
 * Redacts username and password credentials from a MongoDB URI for safe logging.
 *
 * @param {string} uri - Raw MongoDB connection string
 * @returns {string} Sanitized connection string with masked credentials
 */
export const sanitizeMongoUri = (uri) => {
  if (!uri || typeof uri !== 'string') {
    return '[EMPTY_OR_INVALID_URI]';
  }
  return uri.replace(/\/\/(.*?):(.*?)@/, '//$1:***@');
};

/**
 * Validates a MongoDB connection URI structure.
 * Requires mongodb:// or mongodb+srv:// protocol scheme.
 *
 * @param {string} uri - Raw connection string
 * @throws {Error} If URI is missing or does not start with valid scheme
 */
export const validateMongoUri = (uri) => {
  if (!uri || String(uri).trim() === '') {
    throw new Error('Configuration Error: MONGODB_URI is required but was not provided.');
  }

  const trimmed = String(uri).trim();
  if (!trimmed.startsWith('mongodb://') && !trimmed.startsWith('mongodb+srv://')) {
    throw new Error(
      'Configuration Error: Invalid MONGODB_URI format. Connection string must begin with "mongodb://" or "mongodb+srv://".'
    );
  }

  return trimmed;
};

// Track connection promise to prevent race conditions during concurrent connection attempts
let connectionPromise = null;
let listenersAttached = false;

/**
 * Attaches standard connection lifecycle event listeners once to Mongoose connection.
 */
const attachConnectionListeners = () => {
  if (listenersAttached) return;

  mongoose.connection.on('connected', () => {
    console.log('[Database] MongoDB connection established successfully.');
  });

  mongoose.connection.on('error', (err) => {
    console.error(`[Database] Connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database] MongoDB disconnected unexpectedly.');
  });

  listenersAttached = true;
};

/**
 * Connects to MongoDB using Mongoose with duplicate connection protection,
 * credential masking in logs, and lifecycle event handling.
 *
 * @param {string} [customUri] - Optional override connection URI
 * @param {object} [options] - Additional mongoose connection options
 * @returns {Promise<typeof mongoose>} Active mongoose instance
 */
export const connectDatabase = async (customUri, options = {}) => {
  const uriToUse = customUri !== undefined ? customUri : env.MONGODB_URI;
  const validatedUri = validateMongoUri(uriToUse);

  // 1. Prevent duplicate connections if already connected
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  // 2. Prevent duplicate in-flight connection attempts
  if (mongoose.connection.readyState === 2 && connectionPromise) {
    return connectionPromise;
  }

  attachConnectionListeners();

  const sanitized = sanitizeMongoUri(validatedUri);
  console.log(`[Database] Connecting to MongoDB: ${sanitized}`);

  const defaultOptions = {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    ...options
  };

  try {
    connectionPromise = mongoose.connect(validatedUri, defaultOptions);
    await connectionPromise;
    return mongoose;
  } catch (error) {
    console.error(`[Database] Failed to connect to MongoDB: ${error.message}`);
    throw new Error(`Database Connection Error: Failed to connect to MongoDB (${error.message})`);
  } finally {
    connectionPromise = null;
  }
};

/**
 * Checks if MongoDB is currently in an active, connected readyState (1).
 *
 * @returns {boolean} True if readyState === 1
 */
export const isDatabaseConnected = () => {
  return mongoose.connection.readyState === 1;
};

/**
 * Gracefully disconnects from MongoDB.
 *
 * @returns {Promise<void>}
 */
export const disconnectDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close(false);
    console.log('[Database] MongoDB connection closed.');
  }
};

export default {
  connectDatabase,
  disconnectDatabase,
  isDatabaseConnected,
  sanitizeMongoUri,
  validateMongoUri
};

