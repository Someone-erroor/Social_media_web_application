import {
  validateGeneratePostInput,
  validateImprovePostInput,
  validateSummarizePostInput
} from '../validators/ai.validator.js';
import { generatePost, improvePost, summarizeDiscussion } from '../services/ai.service.js';
import { Post, Comment } from '../models/index.js';

/**
 * Standardized error responder for AI controller endpoints.
 * Preserves accurate provider HTTP status (429, 403, 404, 503, 504) and sets Retry-After header.
 *
 * @param {any} error
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const handleAiControllerError = (error, res, next) => {
  if (error.status) {
    if (error.retryAfter) {
      res.setHeader('Retry-After', String(error.retryAfter));
    }
    return res.status(error.status).json({
      success: false,
      message: error.message,
      code: error.code || 'AI_PROVIDER_ERROR',
      category: error.category || undefined,
      retryAfter: error.retryAfter || undefined
    });
  }
  next(error);
};

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
    handleAiControllerError(error, res, next);
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
    handleAiControllerError(error, res, next);
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

    // Bounded query for discussion comments (up to 30 comments)
    const comments = await Comment.find({ post: sanitized.postId })
      .sort({ createdAt: 1 })
      .limit(30)
      .populate('author', 'fullName');

    const result = await summarizeDiscussion({ post, comments });

    const commentsAnalyzedCount = Math.min(comments.length, 30);

    return res.status(200).json({
      success: true,
      message: result.hasComments
        ? 'Discussion summarized successfully.'
        : 'Discussion analyzed successfully.',
      hasComments: result.hasComments,
      summary: result.summary,
      metadata: {
        postId: sanitized.postId,
        commentsAnalyzed: result.commentsAnalyzed !== undefined ? result.commentsAnalyzed : commentsAnalyzedCount,
        provider: result.provider,
        model: result.model
      }
    });
  } catch (error) {
    handleAiControllerError(error, res, next);
  }
};
