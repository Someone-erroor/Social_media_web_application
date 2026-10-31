import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * User Schema for Looply
 * Represents registered users and platform administrators.
 */
const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters long'],
      maxlength: [70, 'Full name cannot exceed 70 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address']
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false // Excluded from normal query projections by default
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'admin'],
        message: 'Role must be either "user" or "admin"'
      },
      default: 'user'
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    profile: {
      bio: {
        type: String,
        default: '',
        trim: true,
        maxlength: [250, 'Bio cannot exceed 250 characters']
      },
      avatarUrl: {
        type: String,
        default: '',
        trim: true
      }
    },
    accountStatus: {
      type: String,
      enum: {
        values: ['active', 'suspended'],
        message: 'Account status must be either "active" or "suspended"'
      },
      default: 'active'
    },
    verificationTokenHash: {
      type: String,
      select: false
    },
    verificationTokenExpiresAt: {
      type: Date,
      select: false
    },
    resetPasswordTokenHash: {
      type: String,
      select: false
    },
    resetPasswordTokenExpiresAt: {
      type: Date,
      select: false
    },
    tokenVersion: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        delete ret.passwordHash;
        delete ret.verificationTokenHash;
        delete ret.resetPasswordTokenHash;
        return ret;
      }
    },
    toObject: {
      transform: (doc, ret) => {
        delete ret.__v;
        delete ret.passwordHash;
        delete ret.verificationTokenHash;
        delete ret.resetPasswordTokenHash;
        return ret;
      }
    }
  }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;

