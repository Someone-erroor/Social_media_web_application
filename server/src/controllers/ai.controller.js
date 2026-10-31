import {
  validateGeneratePostInput,
  validateImprovePostInput
} from '../validators/ai.validator.js';
import { generatePost, improvePost } from '../services/ai.service.js';

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

