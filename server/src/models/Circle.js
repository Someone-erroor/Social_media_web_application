import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Looply Circles Schema (Interest-based communities)
 */
const circleSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Circle name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters']
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Description cannot exceed 300 characters'],
      default: ''
    },
    category: {
      type: String,
      required: true,
      enum: ['Gaming', 'Photography', 'Movies', 'Music', 'Technology', 'Travel', 'College', 'Art', 'Other'],
      default: 'Other'
    },
    avatarUrl: {
      type: String,
      default: ''
    },
    coverUrl: {
      type: String,
      default: ''
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isPrivate: {
      type: Boolean,
      default: false
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    memberCount: {
      type: Number,
      default: 1
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

circleSchema.index({ category: 1 });
circleSchema.index({ memberCount: -1 });

const Circle = mongoose.models.Circle || mongoose.model('Circle', circleSchema);

export default Circle;

