import bcrypt from 'bcryptjs';
import { User, ActivityLog } from '../models/index.js';
import { generateToken } from '../config/jwt.js';

const BCRYPT_SALT_ROUNDS = 12;

/**
 * Transforms a User Mongoose document into a safe user object,
 * guaranteeing passwordHash and internal version keys are never exposed.
 *
 * @param {object} user - User Mongoose document or plain object
 * @returns {object} Safe user object
 */
export const toSafeUser = (user) => {
  if (!user) return null;
  const obj = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

/**
 * Registers a new user account with secure password hashing.
 * Strictly prevents role escalation by assigning role: 'user'.
 *
 * @param {object} sanitizedInput - Validated input containing fullName, email, password
 * @returns {Promise<{ user: object }>} Created user safe representation
 */
export const registerUser = async ({ fullName, email, password }) => {
  // 1. Check for existing email conflict
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error('An account with this email address already exists.');
    error.status = 409;
    throw error;
  }

  // 2. Hash password with bcrypt
  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  // 3. Create user with strictly enforced default role and status
  const user = new User({
    fullName,
    email,
    passwordHash,
    role: 'user', // Public registration is strictly role: 'user'
    isEmailVerified: false,
    accountStatus: 'active',
    profile: {
      bio: '',
      avatarUrl: ''
    }
  });

  await user.save();

  // 4. Log security audit entry (never storing sensitive information in metadata)
  try {
    const auditLog = new ActivityLog({
      actor: user._id,
      action: 'user_registration',
      targetType: 'User',
      targetId: user._id,
      metadata: {
        registrationMethod: 'password',
        registeredAt: new Date().toISOString()
      }
    });
    await auditLog.save();
  } catch (auditErr) {
    // Non-blocking audit failure
    console.error(`[ActivityLog] Failed to record registration audit: ${auditErr.message}`);
  }

  return { user: toSafeUser(user) };
};

/**
 * Authenticates user credentials, verifies account status, and generates a JWT.
 *
 * @param {object} sanitizedInput - Validated input containing email, password
 * @returns {Promise<{ user: object, token: string }>} Safe user and signed JWT
 */
export const loginUser = async ({ email, password }) => {
  // 1. Find user including passwordHash for comparison
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    const error = new Error('Invalid email or password.');
    error.status = 401;
    throw error;
  }

  // 2. Verify password with bcrypt
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.status = 401;
    throw error;
  }

  // 3. Verify account is not suspended
  if (user.accountStatus === 'suspended') {
    const error = new Error('Your account has been suspended. Please contact platform support.');
    error.status = 403;
    throw error;
  }

  // 4. Generate JWT
  const token = generateToken({
    userId: user._id.toString(),
    role: user.role
  });

  // 5. Record successful login in audit log
  try {
    const auditLog = new ActivityLog({
      actor: user._id,
      action: 'successful_login',
      targetType: 'User',
      targetId: user._id,
      metadata: {
        role: user.role,
        loginAt: new Date().toISOString()
      }
    });
    await auditLog.save();
  } catch (auditErr) {
    console.error(`[ActivityLog] Failed to record login audit: ${auditErr.message}`);
  }

  return {
    user: toSafeUser(user),
    token
  };
};

/**
 * Retrieves a user by their unique ObjectId, excluding credentials.
 *
 * @param {string} userId - User primary ID
 * @returns {Promise<object>} Safe user representation
 */
export const getUserById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found.');
    error.status = 404;
    throw error;
  }

  if (user.accountStatus === 'suspended') {
    const error = new Error('Your account has been suspended. Please contact platform support.');
    error.status = 403;
    throw error;
  }

  return toSafeUser(user);
};

export default {
  toSafeUser,
  registerUser,
  loginUser,
  getUserById
};

