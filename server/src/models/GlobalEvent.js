import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Looply Global Mystery Events Schema
 */
const globalEventSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    bannerUrl: {
      type: String,
      default: ''
    },
    clues: [
      {
        order: { type: Number, required: true },
        clueText: { type: String, required: true },
        hint: { type: String, default: '' },
        points: { type: Number, default: 10 }
      }
    ],
    solution: {
      type: String,
      required: true,
      select: false // Never exposed publicly
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    submissions: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        answer: {
          type: String,
          required: true
        },
        isCorrect: {
          type: Boolean,
          default: false
        },
        pointsAwarded: {
          type: Number,
          default: 0
        },
        submittedAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        delete ret.solution;
        return ret;
      }
    }
  }
);

globalEventSchema.index({ isActive: 1, endDate: -1 });

const GlobalEvent = mongoose.models.GlobalEvent || mongoose.model('GlobalEvent', globalEventSchema);

export default GlobalEvent;

