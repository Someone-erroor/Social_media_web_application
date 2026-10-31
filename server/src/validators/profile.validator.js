import mongoose from 'mongoose';

const URL_REGEX = /^https?:\/\/.+/i;

/**
 * Validates profile update payload.
 * Strictly prevents modifications to email, role, password, and sensitive account fields.
 *
 * @param {object} input - Request body
 * @returns {{ isValid: boolean, errors: string[], sanitized: object }}
 */
export const validateProfileUpdateInput = (input = {}) => {
  const errors = [];
  const protectedFields = [
    'email',
    'role',
    'password',
    'passwordHash',
    'accountStatus',
    'isEmailVerified',
    'tokenVersion',
    '_id',
    'id'
  ];

  // Disallow attempt to modify protected security attributes
  for (const field of protectedFields) {
    if (Object.prototype.hasOwnProperty.call(input, field)) {
      errors.push(`Modifying protected field "${field}" is not allowed.`);
    }
  }

  const sanitized = {};

  // Validate fullName if provided
  if (input.fullName !== undefined) {
    if (typeof input.fullName !== 'string' || input.fullName.trim() === '') {
      errors.push('Full name cannot be empty.');
    } else {
      const trimmed = input.fullName.trim();
      if (trimmed.length < 2 || trimmed.length > 70) {
        errors.push('Full name must be between 2 and 70 characters.');
      } else {
        sanitized.fullName = trimmed;
      }
    }
  }

  // Validate bio if provided
  if (input.bio !== undefined) {
    if (typeof input.bio !== 'string') {
      errors.push('Bio must be a string.');
    } else {
      const trimmed = input.bio.trim();
      if (trimmed.length > 250) {
        errors.push('Bio cannot exceed 250 characters.');
      } else {
        sanitized.bio = trimmed;
      }
    }
  }

  // Validate avatarUrl if provided
  if (input.avatarUrl !== undefined) {
    if (typeof input.avatarUrl !== 'string') {
      errors.push('Avatar URL must be a string.');
    } else {
      const trimmed = input.avatarUrl.trim();
      if (trimmed !== '' && !URL_REGEX.test(trimmed)) {
        errors.push('Please provide a valid avatar URL starting with http:// or https://.');
      } else {
        sanitized.avatarUrl = trimmed;
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  };
};

/**
 * Validates a MongoDB ObjectId parameter.
 *
 * @param {string} id - Id string
 * @returns {boolean}
 */
export const isValidObjectId = (id) => {
  return Boolean(id && typeof id === 'string' && mongoose.Types.ObjectId.isValid(id));
};

export default {
  validateProfileUpdateInput,
  isValidObjectId
};

