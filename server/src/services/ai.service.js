import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';

let forceMockMode = false;
let simulateAiFailure = false;
let simulateAiTimeout = false;

/**
 * Toggles test mock mode explicitly for testing.
 *
 * @param {boolean} val
 */
export const setForceAiMock = (val) => {
  forceMockMode = Boolean(val);
};

/**
 * Simulates upstream AI provider failure for error resilience testing.
 *
 * @param {boolean} val
 */
export const setSimulateAiFailure = (val) => {
  simulateAiFailure = Boolean(val);
};

/**
 * Simulates upstream AI provider timeout for resilience testing.
 *
 * @param {boolean} val
 */
export const setSimulateAiTimeout = (val) => {
  simulateAiTimeout = Boolean(val);
};

/**
 * Determines whether mock fallback mode is active.
 * Strictly permitted ONLY in a test environment with an explicit test switch.
 * Never silently falls back to mock responses in production or development.
 *
 * @returns {boolean}
 */
export const isAiMockMode = () => {
  const isTest = (process.env.NODE_ENV === 'test' || env.isTest);
  return Boolean(isTest && forceMockMode);
};

/**
 * Generates mock post content based on topic, tone, and length.
 */
const generateMockPost = ({ topic, context, tone, length }) => {
  const tonePrefix = {
    casual: 'Hey everyone! Just thinking about',
    professional: 'In today’s landscape, a key focus area is',
    inspiring: 'Every challenge is an opportunity when you embrace',
    humorous: 'Nobody warns you about the wild ride of',
    informative: 'Key insight breakdown regarding'
  }[tone] || 'Sharing some thoughts on';

  const contextSnippet = context ? ` Specifically: "${context}".` : '';

  let body = `${tonePrefix} ${topic}.${contextSnippet} What are your thoughts on this? Let's discuss in the comments below! #Looply #Connect`;

  if (length === 'short') {
    body = `${tonePrefix} ${topic}.${context ? ' ' + context : ''} What do you think? #Looply`;
  } else if (length === 'long') {
    body = `${tonePrefix} ${topic}.${contextSnippet}\n\nOver the past few weeks, I’ve been reflecting on how crucial this is for creators, engineers, and community members alike. When we collaborate openly and share our real-world learnings, the entire community moves forward together.\n\nDrop your perspective below! #Looply #Growth`;
  }

  // Enforce max 1000 characters
  return body.slice(0, 1000).trim();
};

/**
 * Generates mock improved content based on original text and tone.
 */
const generateMockImprovedPost = ({ content, tone, instructions }) => {
  // Polish text by trimming and normalizing
  let polished = content
    .replace(/\s+/g, ' ')
    .replace(/\bi\b/g, 'I')
    .replace(/([.!?])\s*([a-z])/g, (_, p1, p2) => `${p1} ${p2.toUpperCase()}`);

  if (tone === 'professional') {
    polished = `Refining with focus: ${polished} I welcome industry feedback and perspectives.`;
  } else if (tone === 'inspiring') {
    polished = `Remember: ${polished} Keep pushing boundaries every day!`;
  } else if (tone === 'humorous') {
    polished = `${polished} (Yes, really! 😄)`;
  } else if (tone === 'informative') {
    polished = `Key takeaway: ${polished} Follow along for more insights.`;
  }

  if (instructions) {
    polished += ` [Refined based on: "${instructions}"]`;
  }

  return polished.slice(0, 1000).trim();
};

/**
 * Generates a social media post draft using Google Gemini.
 *
 * @param {object} params
 * @param {string} params.topic
 * @param {string} [params.context]
 * @param {string} [params.tone='casual']
 * @param {string} [params.length='medium']
 * @returns {Promise<{ generatedContent: string, provider: string, model: string }>}
 */
export const generatePost = async ({ topic, context = '', tone = 'casual', length = 'medium' }) => {
  // Test simulation checks
  if (simulateAiFailure) {
    const error = new Error('AI Provider Failure: Upstream Gemini service temporarily unavailable.');
    error.status = 502;
    throw error;
  }

  if (simulateAiTimeout) {
    const error = new Error('AI Provider Timeout: Gemini request timed out after 15 seconds.');
    error.status = 504;
    throw error;
  }

  // Deterministic mock allowed ONLY in test mode when explicitly enabled
  if (isAiMockMode()) {
    const generatedContent = generateMockPost({ topic, context, tone, length });
    return {
      generatedContent,
      provider: 'mock-gemini',
      model: 'mock-gemini-2.5-flash'
    };
  }

  // Reject when GEMINI_API_KEY is missing outside test mock mode (HTTP 503)
  const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const error = new Error('AI service is not configured. Please contact the administrator.');
    error.status = 503;
    throw error;
  }

  // Live Google Gemini API Integration
  const client = new GoogleGenAI({ apiKey });
  const modelName = env.GEMINI_MODEL || 'gemini-2.5-flash';

  const lengthInstructions = {
    short: 'Keep it concise and punchy (1-2 sentences, under 150 characters).',
    medium: 'A standard social media post (2-4 sentences, under 400 characters).',
    long: 'A detailed, engaging post (under 800 characters).'
  }[length] || 'Keep it under 500 characters.';

  const prompt = `You are an AI assistant helping a user write an engaging post for Looply, a social media platform.
Topic: "${topic}"
${context ? `Additional Context: "${context}"` : ''}
Tone: ${tone}
Length Guidelines: ${lengthInstructions}

Important constraints:
- Return ONLY the draft post content.
- Do NOT include markdown code blocks, quotes around the whole text, or conversational preambles.
- Never exceed 1000 characters.`;

  let modelToUse = modelName;
  try {
    let response;
    try {
      response = await client.models.generateContent({
        model: modelToUse,
        contents: prompt
      });
    } catch (primaryErr) {
      if (primaryErr?.message?.includes('gemini-3.8-flash') || primaryErr?.status === 404) {
        modelToUse = 'gemini-3.8-flash';
        response = await client.models.generateContent({
          model: modelToUse,
          contents: prompt
        });
      } else {
        throw primaryErr;
      }
    }

    let text = response.text ? String(response.text).trim() : '';

    // Strip wrapping quotes or markdown if Gemini included them
    if (text.startsWith('"') && text.endsWith('"')) {
      text = text.slice(1, -1).trim();
    }

    if (!text) {
      throw new Error('AI Provider returned an empty response.');
    }

    // Strict boundary enforcement: max 1000 chars
    if (text.length > 1000) {
      text = text.slice(0, 1000).trim();
    }

    return {
      generatedContent: text,
      provider: 'google-gemini',
      model: modelToUse
    };
  } catch (err) {
    const error = new Error('AI generation failed. Please try again.');
    error.status = 502;
    throw error;
  }
};

/**
 * Improves an existing social media post using Google Gemini.
 *
 * @param {object} params
 * @param {string} params.content
 * @param {string} [params.tone='casual']
 * @param {string} [params.instructions='']
 * @returns {Promise<{ improvedContent: string, provider: string, model: string }>}
 */
export const improvePost = async ({ content, tone = 'casual', instructions = '' }) => {
  // Test simulation checks
  if (simulateAiFailure) {
    const error = new Error('AI Provider Failure: Upstream Gemini service temporarily unavailable.');
    error.status = 502;
    throw error;
  }

  if (simulateAiTimeout) {
    const error = new Error('AI Provider Timeout: Gemini request timed out after 15 seconds.');
    error.status = 504;
    throw error;
  }

  // Deterministic mock allowed ONLY in test mode when explicitly enabled
  if (isAiMockMode()) {
    const improvedContent = generateMockImprovedPost({ content, tone, instructions });
    return {
      improvedContent,
      provider: 'mock-gemini',
      model: 'mock-gemini-2.5-flash'
    };
  }

  // Reject when GEMINI_API_KEY is missing outside test mock mode (HTTP 503)
  const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const error = new Error('AI service is not configured. Please contact the administrator.');
    error.status = 503;
    throw error;
  }

  // Live Google Gemini API Integration
  const client = new GoogleGenAI({ apiKey });
  const modelName = env.GEMINI_MODEL || 'gemini-2.5-flash';

  const prompt = `You are an AI assistant improving a user's social media post on Looply.
Original Content: "${content}"
Target Tone: ${tone}
${instructions ? `Specific Instructions: "${instructions}"` : ''}

Refine the post to improve:
- Grammar and punctuation
- Clarity and readability
- Engagement and tone
- Flow and vocabulary

Important constraints:
- Preserve the core meaning of the original post.
- Return ONLY the improved text without conversational explanations, quotes, or markdown wrappers.
- Never exceed 1000 characters.`;

  let modelToUse = modelName;
  try {
    let response;
    try {
      response = await client.models.generateContent({
        model: modelToUse,
        contents: prompt
      });
    } catch (primaryErr) {
      if (primaryErr?.message?.includes('gemini-3.8-flash') || primaryErr?.status === 404) {
        modelToUse = 'gemini-3.8-flash';
        response = await client.models.generateContent({
          model: modelToUse,
          contents: prompt
        });
      } else {
        throw primaryErr;
      }
    }

    let text = response.text ? String(response.text).trim() : '';

    if (text.startsWith('"') && text.endsWith('"')) {
      text = text.slice(1, -1).trim();
    }

    if (!text) {
      throw new Error('AI Provider returned an empty response.');
    }

    if (text.length > 1000) {
      text = text.slice(0, 1000).trim();
    }

    return {
      improvedContent: text,
      provider: 'google-gemini',
      model: modelToUse
    };
  } catch (err) {
    const error = new Error('AI generation failed. Please try again.');
    error.status = 502;
    throw error;
  }
};

