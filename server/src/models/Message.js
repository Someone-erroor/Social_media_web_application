import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Message Schema with Client-Side Encrypted Ciphertext Support
 */
const messageSchema = new Schema(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [5000, 'Message cannot exceed 5000 characters']
    },
    isEncrypted: {
      type: Boolean,
      default: false
    },
    iv: {
      type: String, // Base64 initialization vector for AES-GCM client encryption
      default: null
    },
    readAt: {
      type: Date,
      default: null
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

messageSchema.index({ conversation: 1, createdAt: 1 });
messageSchema.index({ recipient: 1, readAt: 1 });

const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

export default Message;

