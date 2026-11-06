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
    content: {
      type: String,
      required: [true, 'Post content is required'],
      trim: true,
      minlength: [1, 'Post content cannot be empty'],
      maxlength: [1000, 'Post content cannot exceed 1000 characters']
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

// Index 1: Global feed chronological retrieval
postSchema.index({ createdAt: -1 });

// Index 2: Creator profile timeline retrieval (posts by author ordered chronologically)
postSchema.index({ author: 1, createdAt: -1 });

const Post = mongoose.models.Post || mongoose.model('Post', postSchema);

export default Post;

