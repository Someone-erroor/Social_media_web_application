import mongoose from 'mongoose';

/**
 * Validates whether a string is a valid 24-character hex MongoDB ObjectId.
 *
 * @param {string} id - The ID to validate
 * @returns {boolean} True if valid ObjectId
 */
export const isValidObjectId = (id) => {
  if (!id || typeof id !== 'string') return false;
  return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
};

/**
 * Validates comment creation or update input.
 *
 * @param {object} body - Request body
 * @returns {{ isValid: boolean, errors: string[], sanitized: { content: string } }}
 */
export const validateCommentInput = (body = {}) => {
  const errors = [];
  const rawContent = body?.content !== undefined ? String(body.content).trim() : '';

  if (!rawContent) {
    errors.push('Comment content cannot be empty.');
  } else if (rawContent.length > 500) {
    errors.push('Comment content cannot exceed 500 characters.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      content: rawContent
    }
  };
};

