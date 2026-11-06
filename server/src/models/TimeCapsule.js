import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Looply Time Capsule Schema
 * Future memory unsealed strictly on or after unlockDate.
 */
const timeCapsuleSchema = new Schema(
  {
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Time capsule title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    message: {
      type: String,
      required: [true, 'Capsule message is required'],
      trim: true,
      maxlength: [5000, 'Message cannot exceed 5000 characters']
    },
    mediaUrl: {
      type: String,
      default: ''
    },
    unlockDate: {
      type: Date,
      required: [true, 'Unlock date is required']
    },
    isShared: {
      type: Boolean,
      default: false
    },
    recipients: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    status: {
      type: String,
      enum: ['sealed', 'unlocked'],
      default: 'sealed'
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

timeCapsuleSchema.index({ creator: 1, unlockDate: 1 });
timeCapsuleSchema.index({ recipients: 1, unlockDate: 1 });

const TimeCapsule = mongoose.models.TimeCapsule || mongoose.model('TimeCapsule', timeCapsuleSchema);

export default TimeCapsule;

