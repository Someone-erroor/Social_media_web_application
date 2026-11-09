import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Post Schema for Looply
 * Represents community publications, thoughts, and creator discussions.
 */
const postSchema = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Post author reference is required']
    },
    postType: {
      type: String,
      enum: ['normal', 'splitReality'],
      default: 'normal'
    },
    content: {
      type: String,
      trim: true,
      maxlength: [1000, 'Post content cannot exceed 1000 characters'],
      default: ''
    },
    primaryMedia: {
      type: String,
      default: null,
      trim: true
    },
    realityMedia: {
      type: String,
      default: null,
      trim: true
    },
    circle: {
      type: Schema.Types.ObjectId,
      ref: 'Circle',
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
    },
    toObject: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Strict model-level validation for post types and required perspective media
postSchema.pre('validate', function () {
  if (this.postType === 'splitReality') {
    if (!this.primaryMedia || typeof this.primaryMedia !== 'string' || !this.primaryMedia.trim()) {
      this.invalidate('primaryMedia', 'Primary media ("The Final") is required for Split-Reality posts.');
    }
    if (!this.realityMedia || typeof this.realityMedia !== 'string' || !this.realityMedia.trim()) {
      this.invalidate('realityMedia', 'Reality media ("Behind the Reality") is required for Split-Reality posts.');
    }
  } else if (!this.postType || this.postType === 'normal') {
    if (!this.content || typeof this.content !== 'string' || !this.content.trim()) {
      this.invalidate('content', 'Post content is required for normal posts.');
    }
  }
});

// Index 1: Global feed chronological retrieval
postSchema.index({ createdAt: -1 });

// Index 2: Creator profile timeline retrieval (posts by author ordered chronologically)
postSchema.index({ author: 1, createdAt: -1 });

const Post = mongoose.models.Post || mongoose.model('Post', postSchema);

export default Post;

