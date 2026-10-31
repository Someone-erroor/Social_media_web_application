import mongoose from 'mongoose';

/**
 * Validates post creation content.
 *
 * @param {object} input - Request body
 * @returns {{ isValid: boolean, errors: string[], sanitized: object }}
 */
export const validateCreatePostInput = (input = {}) => {
  const errors = [];
  const { content } = input;

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
      content: content ? content.trim() : ''
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
  return validateCreatePostInput(input);
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

