import mongoose from 'mongoose';

/**
 * Validates whether a media string is a valid web URL or data URI.
 *
 * @param {string} str
 * @returns {boolean}
 */
const isValidMedia = (str) => {
  if (typeof str !== 'string') return false;
  const trimmed = str.trim();
  if (!trimmed) return false;
  return /^https?:\/\/.+/i.test(trimmed) || /^data:image\/[a-zA-Z0-9+.-]+;base64,/i.test(trimmed) || /^\/uploads\/posts\/.+/i.test(trimmed);
};

/**
 * Validates post creation content and media.
 * Supports standard community thoughts ('normal') and signature dual-perspective ('splitReality') posts.
 *
 * @param {object} input - Request body
 * @returns {{ isValid: boolean, errors: string[], sanitized: object }}
 */
export const validateCreatePostInput = (input = {}) => {
  const errors = [];
  const { postType = 'normal', content, primaryMedia, realityMedia, circle } = input;

  if (postType !== 'normal' && postType !== 'splitReality') {
    errors.push('Post type must be either "normal" or "splitReality".');
  }

  if (postType === 'splitReality') {
    // 1. Primary/Final media validation
    if (!isValidMedia(primaryMedia)) {
      errors.push('Primary media ("The Final") is required and must be a valid image URL or image file.');
    }

    // 2. Reality/Behind-the-scenes media validation
    if (!isValidMedia(realityMedia)) {
      errors.push('Reality media ("Behind the Reality") is required and must be a valid image URL or image file.');
    }

    // 3. Caption validation (optional for Split-Reality, but bounded at 1000 chars)
    if (content && typeof content === 'string' && content.trim().length > 1000) {
      errors.push('Caption cannot exceed 1000 characters.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: {
        postType: 'splitReality',
        content: content && typeof content === 'string' ? content.trim() : '',
        primaryMedia: primaryMedia ? primaryMedia.trim() : null,
        realityMedia: realityMedia ? realityMedia.trim() : null,
        circle: circle || null
      }
    };
  }

  // Normal post validation
  if (!content || typeof content !== 'string' || content.trim() === '') {
    errors.push('Post content is required and cannot be empty.');
  } else {
    const trimmed = content.trim();
    if (trimmed.length > 1000) {
      errors.push('Post content cannot exceed 1000 characters.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      postType: 'normal',
      content: content ? content.trim() : '',
      primaryMedia: null,
      realityMedia: null,
      circle: circle || null
    }
  };
};

/**
 * Validates post update content.
 *
 * @param {object} input - Request body
 * @returns {{ isValid: boolean, errors: string[], sanitized: object }}
 */
export const validateUpdatePostInput = (input = {}) => {
  const errors = [];
  const { content } = input;

  if (content !== undefined) {
    if (typeof content !== 'string') {
      errors.push('Content must be a string.');
    } else if (content.trim().length > 1000) {
      errors.push('Content cannot exceed 1000 characters.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      content: content ? content.trim() : ''
    }
  };
};

/**
 * Validates and normalizes pagination query parameters.
 *
 * @param {object} query - Request query parameters
 * @returns {{ page: number, limit: number, skip: number }}
 */
export const validatePaginationQuery = (query = {}) => {
  let page = Number.parseInt(query.page, 10);
  let limit = Number.parseInt(query.limit, 10);

  if (Number.isNaN(page) || page < 1) {
    page = 1;
  }

  if (Number.isNaN(limit) || limit < 1) {
    limit = 10;
  } else if (limit > 50) {
    limit = 50; // Maximum upper bound
  }

  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Validates MongoDB ObjectId string.
 *
 * @param {string} id
 * @returns {boolean}
 */
export const isValidObjectId = (id) => {
  return Boolean(id && typeof id === 'string' && mongoose.Types.ObjectId.isValid(id));
};

export default {
  validateCreatePostInput,
  validateUpdatePostInput,
  validatePaginationQuery,
  isValidObjectId
};

