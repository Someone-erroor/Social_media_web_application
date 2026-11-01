import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { User, ActivityLog, Notification } from '../models/index.js';
import { generateToken } from '../config/jwt.js';
import { sendVerificationEmail, sendPasswordResetEmail } from './email.service.js';
import { sendAdminNotification, sendNotificationToUser } from './socket.service.js';

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
  delete obj.verificationTokenHash;
  delete obj.verificationTokenExpiresAt;
  delete obj.resetPasswordTokenHash;
  delete obj.resetPasswordTokenExpiresAt;
  delete obj.tokenVersion;
  delete obj.__v;
  return obj;
};

/**
 * Registers a new user account with secure password hashing.
 * Strictly prevents role escalation by assigning role: 'user'.
 * Generates a SHA-256 hashed email verification token and dispatches a verification email.
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

  // 3. Generate cryptographically secure email verification token (SHA-256 hashed in database)
  const rawVerificationToken = crypto.randomBytes(32).toString('hex');
  const verificationTokenHash = crypto.createHash('sha256').update(rawVerificationToken).digest('hex');
  const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // 4. Create user with strictly enforced default role and status
  const user = new User({
    fullName,
    email,
    passwordHash,
    role: 'user', // Public registration is strictly role: 'user'
    isEmailVerified: false,
    verificationTokenHash,
    verificationTokenExpiresAt,
    tokenVersion: 0,
    accountStatus: 'active',
    profile: {
      bio: '',
      avatarUrl: ''
    }
  });

  await user.save();

  // 5. Send verification email via email service
  let emailDispatched = false;
  let deliveryMode = 'unavailable';
  try {
    const sendResult = await sendVerificationEmail({
      to: user.email,
      name: user.fullName,
      token: rawVerificationToken
    });
    emailDispatched = Boolean(sendResult?.success);
    deliveryMode = sendResult?.isTestOutbox ? 'preview' : (sendResult?.success ? 'smtp' : 'unavailable');
  } catch (emailErr) {
    console.error(`[Email Service Notice] Could not dispatch registration email: ${emailErr.message}`);
    emailDispatched = false;
    deliveryMode = 'unavailable';
  }

  // 6. Log security audit entry (never storing sensitive information in metadata)
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
    console.error(`[ActivityLog] Failed to record registration audit: ${auditErr.message}`);
  }

  return { user: toSafeUser(user), emailDispatched, deliveryMode };
};

/**
 * Provisions or registers an administrator account.
 * Immediately marks email verified and issues active admin clearance.
 *
 * @param {object} sanitizedInput - Validated input containing fullName, email, password
 * @returns {Promise<{ user: object, token: string }>} Safe user and signed JWT
 */
export const registerAdminUser = async ({ fullName, email, password }) => {
  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  let user = await User.findOne({ email });
  if (user) {
    user.fullName = fullName || user.fullName;
    user.passwordHash = passwordHash;
    user.role = 'admin';
    user.isEmailVerified = true;
    user.accountStatus = 'active';
    await user.save();
  } else {
    user = new User({
      fullName,
      email,
      passwordHash,
      role: 'admin',
      isEmailVerified: true,
      tokenVersion: 0,
      accountStatus: 'active',
      profile: {
        bio: 'Platform Administrator',
        avatarUrl: ''
      }
    });
    await user.save();
  }

  // Generate JWT token with admin claim
  const token = generateToken({
    userId: user._id.toString(),
    role: 'admin',
    tokenVersion: user.tokenVersion || 0
  });

  // Record admin account provisioning in audit log
  try {
    const auditLog = new ActivityLog({
      actor: user._id,
      action: 'admin_action',
      targetType: 'User',
      targetId: user._id,
      metadata: {
        operation: 'admin_registration',
        email: user.email,
        timestamp: new Date().toISOString()
      }
    });
    await auditLog.save();
  } catch (auditErr) {
    console.error(`[ActivityLog] Failed to record admin registration: ${auditErr.message}`);
  }

  return {
    user: toSafeUser(user),
    token
  };
};

/**
 * Validates a raw email verification token, updates user status, and clears token records.
 *
 * @param {string} rawToken - Unhashed verification token from URL
 * @returns {Promise<{ user: object }>} Updated user safe representation
 */
export const verifyEmail = async (rawToken) => {
  if (!rawToken || typeof rawToken !== 'string') {
    const error = new Error('Verification token is required.');
    error.status = 400;
    throw error;
  }

  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const user = await User.findOne({
    verificationTokenHash: tokenHash,
    verificationTokenExpiresAt: { $gt: new Date() }
  }).select('+verificationTokenHash +verificationTokenExpiresAt');

  if (!user) {
    const error = new Error('Invalid or expired verification token.');
    error.status = 400;
    throw error;
  }

  // Prevent duplicate verification actions if already marked verified
  if (user.isEmailVerified) {
    return { user: toSafeUser(user) };
  }

  user.isEmailVerified = true;
  user.verificationTokenHash = undefined;
  user.verificationTokenExpiresAt = undefined;
  await user.save();

  try {
    const auditLog = new ActivityLog({
      actor: user._id,
      action: 'email_verification',
      targetType: 'User',
      targetId: user._id,
      metadata: {
        verifiedAt: new Date().toISOString()
      }
    });
    await auditLog.save();
  } catch (auditErr) {
    console.error(`[ActivityLog] Failed to record verification audit: ${auditErr.message}`);
  }

  return { user: toSafeUser(user) };
};

/**
 * Resends an email verification message without exposing account existence.
 *
 * @param {string} email - Normalized email
 * @returns {Promise<{ message: string }>} Generic response message
 */
export const resendVerificationEmail = async (email) => {
  const genericMessage = 'If an account exists with this email, a verification link has been sent.';

  const user = await User.findOne({ email }).select('+verificationTokenHash +verificationTokenExpiresAt');
  if (!user || user.isEmailVerified || user.accountStatus === 'suspended') {
    return { message: genericMessage };
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  user.verificationTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  user.verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();

  try {
    await sendVerificationEmail({
      to: user.email,
      name: user.fullName,
      token: rawToken
    });
  } catch (emailErr) {
    console.error(`[Email Service Notice] Could not dispatch resend email: ${emailErr.message}`);
  }

  return { message: genericMessage };
};

/**
 * Authenticates user credentials, verifies email verification status, and generates a JWT.
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

  // 4. Verify email ownership has been confirmed (Phase 5 requirement)
  if (!user.isEmailVerified) {
    const error = new Error('Please verify your email address before signing in.');
    error.status = 403;
    throw error;
  }

  // 5. Generate JWT with tokenVersion claim for session invalidation (Phase 6)
  const token = generateToken({
    userId: user._id.toString(),
    role: user.role,
    tokenVersion: user.tokenVersion || 0
  });

  // 6. Record successful login in audit log
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

  // 7. Critical Phase 13 Requirement: Create persistent admin notification when normal user logs in
  if (user.role === 'user') {
    try {
      const admins = await User.find({ role: 'admin' }).select('_id');
      const safeActor = {
        _id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        profile: {
          avatarUrl: user.profile?.avatarUrl || ''
        }
      };

      for (const admin of admins) {
        const notifDoc = await Notification.create({
          recipient: admin._id,
          actor: user._id,
          type: 'login_alert',
          message: `${user.fullName} (${user.email}) successfully logged in.`,
          resourceType: 'User',
          resourceId: user._id
        });

        // Canonical real-time notification payload including genuine document _id
        const populatedNotification = {
          _id: notifDoc._id.toString(),
          recipient: admin._id.toString(),
          actor: safeActor,
          type: 'login_alert',
          message: notifDoc.message,
          resourceType: 'User',
          resourceId: user._id.toString(),
          readAt: null,
          createdAt: notifDoc.createdAt ? notifDoc.createdAt.toISOString() : new Date().toISOString()
        };

        // Dispatch single canonical event to this administrator's authenticated room
        sendNotificationToUser(admin._id, populatedNotification, 'admin_login_alert');
      }
    } catch (notifErr) {
      console.error(`[Notification] Failed to create admin login alert: ${notifErr.message}`);
    }
  }

  return {
    user: toSafeUser(user),
    token
  };
};

/**
 * Initiates forgot-password workflow.
 * Uses a generic response regardless of whether the email exists to avoid enumeration.
 *
 * @param {string} email - Normalized user email
 * @returns {Promise<{ message: string }>} Safe generic message
 */
export const forgotPassword = async (email) => {
  const genericMessage = 'If an account exists with this email, password reset instructions have been sent.';

  const user = await User.findOne({ email });
  if (!user || user.accountStatus === 'suspended') {
    return { message: genericMessage };
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const tokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes expiration

  user.resetPasswordTokenHash = tokenHash;
  user.resetPasswordTokenExpiresAt = tokenExpiresAt;
  await user.save();

  try {
    await sendPasswordResetEmail({
      to: user.email,
      name: user.fullName,
      token: rawToken
    });
  } catch (emailErr) {
    console.error(`[Email Service Notice] Could not dispatch reset email: ${emailErr.message}`);
  }

  try {
    const auditLog = new ActivityLog({
      actor: user._id,
      action: 'password_reset_request',
      targetType: 'User',
      targetId: user._id,
      metadata: {
        requestedAt: new Date().toISOString()
      }
    });
    await auditLog.save();
  } catch (auditErr) {
    console.error(`[ActivityLog] Failed to record reset request audit: ${auditErr.message}`);
  }

  return { message: genericMessage };
};

/**
 * Resets user password using a valid SHA-256 hashed reset token.
 * Clears token and increments tokenVersion to invalidate existing sessions.
 *
 * @param {object} params
 * @param {string} params.token - Raw reset token
 * @param {string} params.password - New plain text password
 * @returns {Promise<{ message: string }>} Success message
 */
export const resetPassword = async ({ token: rawToken, password }) => {
  if (!rawToken || typeof rawToken !== 'string') {
    const error = new Error('Password reset token is required.');
    error.status = 400;
    throw error;
  }

  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const user = await User.findOne({
    resetPasswordTokenHash: tokenHash,
    resetPasswordTokenExpiresAt: { $gt: new Date() }
  }).select('+passwordHash +resetPasswordTokenHash +resetPasswordTokenExpiresAt +tokenVersion');

  if (!user) {
    const error = new Error('Invalid or expired password reset token.');
    error.status = 400;
    throw error;
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  // Update credentials, clear token, and invalidate existing JWT sessions via tokenVersion
  user.passwordHash = newPasswordHash;
  user.resetPasswordTokenHash = undefined;
  user.resetPasswordTokenExpiresAt = undefined;
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();

  try {
    const auditLog = new ActivityLog({
      actor: user._id,
      action: 'password_reset',
      targetType: 'User',
      targetId: user._id,
      metadata: {
        resetAt: new Date().toISOString()
      }
    });
    await auditLog.save();
  } catch (auditErr) {
    console.error(`[ActivityLog] Failed to record password reset audit: ${auditErr.message}`);
  }

  return {
    message: 'Password has been reset successfully. You can now sign in with your new password.'
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
  verifyEmail,
  resendVerificationEmail,
  loginUser,
  forgotPassword,
  resetPassword,
  getUserById
};
