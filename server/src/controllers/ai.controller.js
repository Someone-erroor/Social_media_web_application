import {
  validateGeneratePostInput,
  validateImprovePostInput,
  validateSummarizePostInput
} from '../validators/ai.validator.js';
import { generatePost, improvePost, summarizeDiscussion } from '../services/ai.service.js';
import { Post, Comment } from '../models/index.js';

/**
 * Generates a post draft using Gemini AI.
 * POST /api/ai/posts/generate
 */
export const handleGeneratePost = async (req, res, next) => {
  try {
    if (!req.user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address to use AI generation tools.'
      });
    }

    const { isValid, errors, sanitized } = validateGeneratePostInput(req.body);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors[0] || 'Invalid input for AI generation.',
        errors
      });
    }

    const result = await generatePost(sanitized);

    return res.status(200).json({
      success: true,
      message: 'Post draft generated successfully.',
      generatedContent: result.generatedContent,
      metadata: {
        topic: sanitized.topic,
        tone: sanitized.tone,
        length: sanitized.length,
        provider: result.provider,
        model: result.model
      }
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Improves an existing post using Gemini AI.
 * POST /api/ai/posts/improve
 */
export const handleImprovePost = async (req, res, next) => {
  try {
    if (!req.user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address to use AI improvement tools.'
      });
    }

    const { isValid, errors, sanitized } = validateImprovePostInput(req.body);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors[0] || 'Invalid input for AI improvement.',
        errors
      });
    }

    const result = await improvePost(sanitized);

    return res.status(200).json({
      success: true,
      message: 'Post improved successfully.',
      improvedContent: result.improvedContent,
      metadata: {
        originalLength: sanitized.content.length,
        improvedLength: result.improvedContent.length,
        tone: sanitized.tone,
        provider: result.provider,
        model: result.model
      }
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Summarizes a post discussion and its comments using Gemini AI.
 * POST /api/ai/posts/:postId/summarize
 */
export const handleSummarizeDiscussion = async (req, res, next) => {
  try {
    if (!req.user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address to use AI summarization tools.'
      });
    }

    const { isValid, errors, sanitized } = validateSummarizePostInput(req.params);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors[0] || 'Invalid post ID.',
        errors
      });
    }

    // Retrieve post
    const post = await Post.findById(sanitized.postId).populate('author', 'fullName profile.avatarUrl');
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found.'
      });
    }

    // Bounded query for discussion comments (up to 50 comments)
    const comments = await Comment.find({ post: sanitized.postId })
      .sort({ createdAt: 1 })
      .limit(50)
      .populate('author', 'fullName');

    const result = await summarizeDiscussion({ post, comments });

    return res.status(200).json({
      success: true,
      message: result.hasComments
        ? 'Discussion summarized successfully.'
        : 'Discussion analyzed successfully.',
      hasComments: result.hasComments,
      summary: result.summary,
      metadata: {
        postId: sanitized.postId,
        commentsAnalyzed: comments.length,
        provider: result.provider,
        model: result.model
      }
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

