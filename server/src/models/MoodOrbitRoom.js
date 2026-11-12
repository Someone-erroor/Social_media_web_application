import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Mood-Orbit Room Schema for Looply
 * Ephemeral, mood-based social spaces organized by emotional atmosphere or intention.
 * Supported Moods: creative, curious, chill, energized, focused, reflective.
 */
const roomMessageSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    senderName: {
      type: String,
      required: true,
      trim: true
    },
    senderAvatar: {
      type: String,
      default: ''
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [500, 'Room message cannot exceed 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const moodOrbitRoomSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Room name is required'],
      trim: true,
      maxlength: [100, 'Room name cannot exceed 100 characters']
    },
    mood: {
      type: String,
      required: [true, 'Mood is required'],
      enum: {
        values: ['creative', 'curious', 'chill', 'energized', 'focused', 'reflective'],
        message: 'Invalid mood category'
      }
    },
    intention: {
      type: String,
      required: [true, 'Room intention is required'],
      trim: true,
      maxlength: [300, 'Intention cannot exceed 300 characters']
    },
    prompt: {
      type: String,
      trim: true,
      maxlength: [300, 'Prompt cannot exceed 300 characters'],
      default: ''
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator reference is required']
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'full', 'closed', 'expired'],
        message: 'Invalid room status'
      },
      default: 'active'
    },
    visibility: {
      type: String,
      enum: ['public', 'circle', 'unlisted'],
      default: 'public'
    },
    maxParticipants: {
      type: Number,
      default: 25,
      min: [2, 'Minimum 2 participants required'],
      max: [100, 'Maximum 100 participants permitted']
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
        lastActiveAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    participantsCount: {
      type: Number,
      default: 0,
      min: 0
    },
    expiresAt: {
      type: Date,
      required: [true, 'Room expiration date is required'],
      default: () => new Date(Date.now() + 4 * 60 * 60 * 1000) // 4 hours default
    },
    messages: {
      type: [roomMessageSchema],
      default: []
    },
    settings: {
      ambientTheme: {
        type: String,
        enum: ['aurora', 'deep_space', 'ember', 'forest', 'twilight'],
        default: 'twilight'
      },
      allowMicroPrompts: {
        type: Boolean,
        default: true
      }
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

moodOrbitRoomSchema.index({ status: 1, mood: 1, expiresAt: -1 });
moodOrbitRoomSchema.index({ creator: 1, createdAt: -1 });
moodOrbitRoomSchema.index({ 'participants.user': 1 });

const MoodOrbitRoom = mongoose.models.MoodOrbitRoom || mongoose.model('MoodOrbitRoom', moodOrbitRoomSchema);

export default MoodOrbitRoom;

