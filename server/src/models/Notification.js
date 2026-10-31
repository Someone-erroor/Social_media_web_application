import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Notification Schema for Looply
 * Stores activity alerts, login notifications, community interactions, and system broadcasts.
 */
const notificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient reference is required']
    },
    actor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null // Optional: null for platform and system notifications
    },
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: {
        values: ['login_alert', 'post_like', 'post_comment', 'system'],
        message: 'Notification type must be one of: login_alert, post_like, post_comment, system'
      }
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: [300, 'Notification message cannot exceed 300 characters']
    },
    resourceType: {
      type: String,
      enum: ['Post', 'Comment', 'User', 'System', null],
      default: null
    },
    resourceId: {
      type: Schema.Types.ObjectId,
      default: null
    },
    readAt: {
      type: Date,
      default: null
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

// Index 1: Fast chronological retrieval of user notifications
notificationSchema.index({ recipient: 1, createdAt: -1 });

// Index 2: Efficient query for unread notifications (readAt: null)
notificationSchema.index({ recipient: 1, readAt: 1 });

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

export default Notification;

