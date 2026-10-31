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
 * ActivityLog Schema for Looply
 * Secure, immutable audit ledger tracking authentication, content mutations, and administrative events.
 * Strictly forbids storing passwords, tokens, or credentials in metadata.
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
        validator: (val) => {
          if (!val || typeof val !== 'object') return true;
          // Guard against storing sensitive information in audit logs
          const disallowedKeys = ['password', 'passwordhash', 'token', 'jwt', 'secret', 'authtoken'];
          const keys = Object.keys(val).map((k) => k.toLowerCase());
          return !disallowedKeys.some((disallowed) => keys.includes(disallowed));
        },
        message: 'Security Violation: ActivityLog metadata must never contain passwords, tokens, or sensitive credentials.'
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

// Index 1: Global audit chronological retrieval
activityLogSchema.index({ createdAt: -1 });

// Index 2: Actor audit timeline retrieval
activityLogSchema.index({ actor: 1, createdAt: -1 });

const ActivityLog = mongoose.models.ActivityLog || mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;

