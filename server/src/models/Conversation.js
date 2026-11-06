import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Conversation Schema for 1-to-1 Direct Messaging
 */
const conversationSchema = new Schema(
  {
    participants: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'User'
        }
      ],
      validate: [val => val.length === 2, 'Conversation must have exactly 2 participants'],
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'pending_request', 'declined'],
      default: 'active'
    },
    initiatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      default: null
    },
    lastMessageAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      }
    }
  }
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });

const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);

export default Conversation;

