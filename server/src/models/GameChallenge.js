import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Looply Play Game & Challenge Schema
 */
const gameChallengeSchema = new Schema(
  {
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    gameType: {
      type: String,
      required: true,
      enum: ['who_knows_me', 'two_truths_and_lie', 'emoji_challenge', 'picture_mystery']
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    // Game configuration payload:
    // For who_knows_me: questions array [{ question, options: [string] }]
    // For two_truths_and_lie: statements: [string, string, string]
    // For emoji_challenge: { emojis: string, hint: string, category: string }
    // For picture_mystery: { imageUrl: string, blurRadius: number, hint: string }
    gameData: {
      type: Schema.Types.Mixed,
      required: true
    },
    // Hidden answer verification data (excluded from normal public game payload)
    answerKey: {
      type: Schema.Types.Mixed,
      select: false,
      required: true
    },
    participants: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        score: {
          type: Number,
          default: 0
        },
        userAnswers: {
          type: Schema.Types.Mixed
        },
        completedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days default
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        delete ret.answerKey;
        return ret;
      }
    }
  }
);

gameChallengeSchema.index({ createdAt: -1 });
gameChallengeSchema.index({ creator: 1, createdAt: -1 });

const GameChallenge = mongoose.models.GameChallenge || mongoose.model('GameChallenge', gameChallengeSchema);

export default GameChallenge;

