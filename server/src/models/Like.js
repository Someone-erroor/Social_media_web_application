import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Like Schema for Looply
 * Represents post appreciations by registered users.
 * Enforces one like per user per post via unique compound index.
 */
const likeSchema = new Schema(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: [true, 'Target post reference is required']
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required']
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

// Unique compound index: prevents duplicate likes by the same user on the same post
likeSchema.index({ post: 1, user: 1 }, { unique: true });

const Like = mongoose.models.Like || mongoose.model('Like', likeSchema);

export default Like;

