const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates user registration payload.
 *
 * @param {object} input - Raw request body
 * @returns {{ isValid: boolean, errors: string[], sanitized: object }}
 */
export const validateRegisterInput = (input = {}) => {
  const errors = [];
  const { fullName, email, password, confirmPassword } = input;

  // 1. Required fields presence check
  if (!fullName || typeof fullName !== 'string' || fullName.trim() === '') {
    errors.push('Full name is required.');
  }

  if (!email || typeof email !== 'string' || email.trim() === '') {
    errors.push('Email address is required.');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required.');
  }

  if (!confirmPassword || typeof confirmPassword !== 'string') {
    errors.push('Password confirmation is required.');
  }

  if (errors.length > 0) {
    return { isValid: false, errors, sanitized: null };
  }

  const trimmedName = fullName.trim();
  const normalizedEmail = email.trim().toLowerCase();

  // 2. Full name length check (2 to 70 characters)
  if (trimmedName.length < 2 || trimmedName.length > 70) {
    errors.push('Full name must be between 2 and 70 characters.');
  }

  // 3. Email format validation
  if (!EMAIL_REGEX.test(normalizedEmail) || normalizedEmail.length > 254) {
    errors.push('Please provide a valid email address.');
  }

  // 4. Password length validation (minimum 8 characters, maximum 128)
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  } else if (password.length > 128) {
    errors.push('Password cannot exceed 128 characters.');
  }

  // 5. Password matching validation
  if (password !== confirmPassword) {
    errors.push('Passwords do not match.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      fullName: trimmedName,
      email: normalizedEmail,
      password
    }
  };
};

/**
 * Validates user login payload.
 *
 * @param {object} input - Raw request body
 * @returns {{ isValid: boolean, errors: string[], sanitized: object }}
 */
export const validateLoginInput = (input = {}) => {
  const errors = [];
  const { email, password } = input;

  if (!email || typeof email !== 'string' || email.trim() === '') {
    errors.push('Email address is required.');
  }

  if (!password || typeof password !== 'string' || password === '') {
    errors.push('Password is required.');
  }

  if (errors.length > 0) {
    return { isValid: false, errors, sanitized: null };
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    errors.push('Please provide a valid email address.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      email: normalizedEmail,
      password
    }
  };
};

export default {
  validateRegisterInput,
  validateLoginInput
};

