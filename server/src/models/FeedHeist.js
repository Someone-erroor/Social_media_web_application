import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Feed Heist Schema for Looply
 * Collaborative, time-sensitive social missions with real server-backed time logic.
 */
const clueSchema = new Schema(
  {
    order: {
      type: Number,
      required: true
    },
    clueText: {
      type: String,
      required: [true, 'Clue text is required'],
      trim: true,
      maxlength: [500, 'Clue text cannot exceed 500 characters']
    },
    hint: {
      type: String,
      trim: true,
      maxlength: [200, 'Hint cannot exceed 200 characters'],
      default: ''
    },
    unlockParticipantThreshold: {
      type: Number,
      default: 0 // 0 means immediately unlocked
    }
  },
  { _id: false }
);

const submissionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    answer: {
      type: String,
      required: true,
      trim: true,
      maxlength: [300, 'Answer cannot exceed 300 characters']
    },
    isCorrect: {
      type: Boolean,
      default: false
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    contributionNote: {
      type: String,
      trim: true,
      maxlength: [200, 'Contribution note cannot exceed 200 characters'],
      default: ''
    }
  },
  { _id: true }
);

const feedHeistSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Heist title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    shortDescription: {
      type: String,
      required: [true, 'Short description is required'],
      trim: true,
      maxlength: [240, 'Short description cannot exceed 240 characters']
    },
    missionPrompt: {
      type: String,
      required: [true, 'Mission prompt is required'],
      trim: true,
      maxlength: [1000, 'Mission prompt cannot exceed 1000 characters']
    },
    heistType: {
      type: String,
      required: true,
      enum: {
        values: ['community_code', 'perspective_heist', 'signal_hunt'],
        message: 'Invalid heist type'
      },
      default: 'community_code'
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required']
    },
    status: {
      type: String,
      enum: {
        values: ['upcoming', 'active', 'completed', 'expired', 'archived'],
        message: 'Invalid heist status'
      },
      default: 'active'
    },
    visibility: {
      type: String,
      enum: ['public', 'circle', 'unlisted'],
      default: 'public'
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'master'],
      default: 'medium'
    },
    category: {
      type: String,
      enum: ['cipher', 'visual_puzzle', 'lore', 'signal_hunt', 'community_challenge'],
      default: 'cipher'
    },
    clues: {
      type: [clueSchema],
      default: []
    },
    // The target solution is hidden from public client queries by default
    targetSolution: {
      type: String,
      required: [true, 'Target solution is required'],
      trim: true,
      select: false
    },
    startAt: {
      type: Date,
      default: Date.now
    },
    endAt: {
      type: Date,
      required: [true, 'Expiry deadline is required']
    },
    participants: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        joinedAt: {
          type: Date,
          default: Date.now
        },
        contributionsCount: {
          type: Number,
          default: 0
        }
      }
    ],
    participantsCount: {
      type: Number,
      default: 0,
      min: 0
    },
    submissions: {
      type: [submissionSchema],
      default: []
    },
    solvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    solvedAt: {
      type: Date,
      default: null
    },
    solutionSummary: {
      type: String,
      trim: true,
      default: ''
    },
    rewardBadge: {
      type: String,
      trim: true,
      default: 'Loop Heist Operative'
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        delete ret.targetSolution;
        return ret;
      }
    }
  }
);

feedHeistSchema.index({ status: 1, endAt: -1 });
feedHeistSchema.index({ creator: 1, createdAt: -1 });
feedHeistSchema.index({ 'participants.user': 1 });

const FeedHeist = mongoose.models.FeedHeist || mongoose.model('FeedHeist', feedHeistSchema);

export default FeedHeist;

