const ALLOWED_TONES = ['casual', 'professional', 'inspiring', 'humorous', 'informative', 'insightful'];
const ALLOWED_LENGTHS = ['short', 'medium', 'long'];

/**
 * Validates AI post generation input.
 *
 * @param {object} body
 * @returns {{ isValid: boolean, errors: string[], sanitized: object }}
 */
export const validateGeneratePostInput = (body = {}) => {
  const errors = [];
  const rawTopic = body?.topic !== undefined ? String(body.topic).trim() : '';
  const rawContext = body?.context !== undefined ? String(body.context).trim() : '';
  const rawTone = body?.tone !== undefined ? String(body.tone).toLowerCase().trim() : 'casual';
  const rawLength = body?.length !== undefined ? String(body.length).toLowerCase().trim() : 'medium';

  if (!rawTopic) {
    errors.push('Topic is required for post generation.');
  } else if (rawTopic.length < 2) {
    errors.push('Topic must be at least 2 characters long.');
  } else if (rawTopic.length > 200) {
    errors.push('Topic cannot exceed 200 characters.');
  }

  if (rawContext && rawContext.length > 500) {
    errors.push('Optional context cannot exceed 500 characters.');
  }

  if (rawTone && !ALLOWED_TONES.includes(rawTone)) {
    errors.push(`Tone must be one of: ${ALLOWED_TONES.join(', ')}.`);
  }

  if (rawLength && !ALLOWED_LENGTHS.includes(rawLength)) {
    errors.push(`Length must be one of: ${ALLOWED_LENGTHS.join(', ')}.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      topic: rawTopic,
      context: rawContext,
      tone: ALLOWED_TONES.includes(rawTone) ? rawTone : 'casual',
      length: ALLOWED_LENGTHS.includes(rawLength) ? rawLength : 'medium'
    }
  };
};

/**
 * Validates AI post improvement input.
 *
 * @param {object} body
 * @returns {{ isValid: boolean, errors: string[], sanitized: object }}
 */
export const validateImprovePostInput = (body = {}) => {
  const errors = [];
  const rawContent = body?.content !== undefined ? String(body.content).trim() : '';
  const rawTone = body?.tone !== undefined ? String(body.tone).toLowerCase().trim() : '';
  const rawInstructions = body?.instructions !== undefined ? String(body.instructions).trim() : '';

  if (!rawContent) {
    errors.push('Content is required for improvement.');
  } else if (rawContent.length < 5) {
    errors.push('Content must be at least 5 characters long.');
  } else if (rawContent.length > 1000) {
    errors.push('Content cannot exceed 1000 characters.');
  }

  if (rawTone && !ALLOWED_TONES.includes(rawTone)) {
    errors.push(`Tone must be one of: ${ALLOWED_TONES.join(', ')}.`);
  }

  if (rawInstructions && rawInstructions.length > 300) {
    errors.push('Instructions cannot exceed 300 characters.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      content: rawContent,
      tone: rawTone && ALLOWED_TONES.includes(rawTone) ? rawTone : 'casual',
      instructions: rawInstructions
    }
  };
};
