import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Comment Schema for Looply
 * Represents discussion replies and feedback on published posts.
 */
const commentSchema = new Schema(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: [true, 'Target post reference is required']
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Comment author reference is required']
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      minlength: [1, 'Comment content cannot be empty'],
      maxlength: [500, 'Comment content cannot exceed 500 characters']
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

// Compound index for retrieving comments under a specific post ordered by creation date
commentSchema.index({ post: 1, createdAt: -1 });

const Comment = mongoose.models.Comment || mongoose.model('Comment', commentSchema);

export default Comment;

