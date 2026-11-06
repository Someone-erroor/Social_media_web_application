import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Report Schema for Trust & Safety
 */
const reportSchema = new Schema(
  {
    reporter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter reference is required']
    },
    reportedTarget: {
      type: Schema.Types.ObjectId,
      required: [true, 'Reported target ID is required']
    },
    targetType: {
      type: String,
      required: [true, 'Target type is required'],
      enum: {
        values: ['User', 'Post', 'Comment', 'Message'],
        message: 'Target type must be User, Post, Comment, or Message'
      }
    },
    category: {
      type: String,
      required: [true, 'Report category is required'],
      enum: {
        values: ['harassment', 'bullying', 'spam', 'impersonation', 'hate_speech', 'threats', 'other'],
        message: 'Invalid report category'
      }
    },
    explanation: {
      type: String,
      trim: true,
      maxlength: [1000, 'Explanation cannot exceed 1000 characters'],
      default: ''
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'under_review', 'resolved', 'dismissed'],
        message: 'Invalid report status'
      },
      default: 'pending'
    },
    resolutionNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Resolution notes cannot exceed 1000 characters'],
      default: ''
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    resolvedAt: {
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

reportSchema.index({ reporter: 1, reportedTarget: 1, status: 1 });
reportSchema.index({ status: 1, createdAt: -1 });

const Report = mongoose.models.Report || mongoose.model('Report', reportSchema);

export default Report;

