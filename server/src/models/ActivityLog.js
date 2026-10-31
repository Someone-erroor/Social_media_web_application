import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Valid action types tracked in the Looply platform audit ledger.
 */
export const ACTIVITY_ACTIONS = [
  'user_registration',
  'successful_login',
  'post_creation',
  'post_update',
  'post_deletion',
  'comment_creation',
  'like_creation',
  'admin_action'
];

/**
 * Sensitive field keys strictly prohibited anywhere inside audit log metadata payloads.
 * Checked case-insensitively across top-level keys and nested objects/arrays.
 */
export const SENSITIVE_METADATA_KEYS = [
  'password',
  'passwordhash',
  'token',
  'accesstoken',
  'refreshtoken',
  'jwt',
  'secret',
  'apikey',
  'authorization',
  'credentials',
  'privatekey'
];

/**
 * Recursively inspects metadata payloads to verify that no sensitive keys
 * exist at any nesting depth within objects or arrays.
 *
 * @param {*} data - The metadata payload to inspect
 * @param {WeakSet} [visited] - WeakSet of visited objects to prevent circular reference cycles
 * @returns {boolean} True if payload is clean and contains no sensitive keys; false otherwise
 */
export const hasNoSensitiveKeys = (data, visited = new WeakSet()) => {
  if (!data || typeof data !== 'object') {
    return true;
  }

  if (visited.has(data)) {
    return true;
  }
  visited.add(data);

  if (Array.isArray(data)) {
    for (const item of data) {
      if (!hasNoSensitiveKeys(item, visited)) {
        return false;
      }
    }
    return true;
  }

  for (const [key, value] of Object.entries(data)) {
    const normalizedKey = String(key).toLowerCase().trim();
    if (SENSITIVE_METADATA_KEYS.includes(normalizedKey)) {
      return false;
    }
    if (typeof value === 'object' && value !== null) {
      if (!hasNoSensitiveKeys(value, visited)) {
        return false;
      }
    }
  }

  return true;
};

/**
 * ActivityLog Schema for Looply
 * Secure, immutable audit ledger tracking authentication, content mutations, and administrative events.
 * Strictly forbids storing passwords, tokens, API keys, or credentials anywhere in metadata.
 */
const activityLogSchema = new Schema(
  {
    actor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null // Optional: null for system events or registration before user ID is assigned
    },
    action: {
      type: String,
      required: [true, 'Audit action is required'],
      enum: {
        values: ACTIVITY_ACTIONS,
        message: 'Invalid activity action type'
      }
    },
    targetType: {
      type: String,
      default: null,
      trim: true
    },
    targetId: {
      type: Schema.Types.ObjectId,
      default: null
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
      validate: {
        validator: (val) => hasNoSensitiveKeys(val),
        message: 'Security Violation: ActivityLog metadata must never contain sensitive keys (passwords, tokens, secrets, or credentials).'
      }
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      }
    },
    toObject: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Pre-validation middleware explicitly enforcing recursive metadata security
activityLogSchema.pre('validate', function () {
  if (this.metadata && typeof this.metadata === 'object') {
    if (!hasNoSensitiveKeys(this.metadata)) {
      this.invalidate(
        'metadata',
        'Security Violation: ActivityLog metadata must never contain sensitive keys (passwords, tokens, secrets, or credentials).'
      );
    }
  }
});

// Index 1: Global audit chronological retrieval
activityLogSchema.index({ createdAt: -1 });

// Index 2: Actor audit timeline retrieval
activityLogSchema.index({ actor: 1, createdAt: -1 });

const ActivityLog = mongoose.models.ActivityLog || mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;
