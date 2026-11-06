import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Appeal Schema for Moderation Decisions
 */
const appealSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required']
    },
    actionType: {
      type: String,
      required: [true, 'Action type is required'],
      enum: ['account_suspension', 'content_removal', 'warning', 'other']
    },
    reason: {
      type: String,
      required: [true, 'Appeal explanation is required'],
      trim: true,
      minlength: [10, 'Appeal explanation must be at least 10 characters'],
      maxlength: [1000, 'Appeal explanation cannot exceed 1000 characters']
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewNotes: {
      type: String,
      trim: true,
      default: ''
    },
    reviewedAt: {
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

appealSchema.index({ user: 1, status: 1 });
appealSchema.index({ status: 1, createdAt: -1 });

const Appeal = mongoose.models.Appeal || mongoose.model('Appeal', appealSchema);

export default Appeal;

