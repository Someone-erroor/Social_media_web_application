import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const ALLOWED_NODE_ENVS = ['development', 'production', 'test'];

/**
 * Validates the NODE_ENV environment variable.
 * Allowed values: 'development', 'production', 'test'.
 * Rejects invalid values and stops startup.
 * Defaults to 'development' if process.env.NODE_ENV is undefined.
 *
 * @param {string|undefined} rawEnv - Value of process.env.NODE_ENV
 * @returns {string} Validated NODE_ENV string
 */
const validateNodeEnv = (rawEnv) => {
  if (rawEnv === undefined) {
    return 'development';
  }

  const trimmed = String(rawEnv).trim();
  if (!ALLOWED_NODE_ENVS.includes(trimmed)) {
    throw new Error(
      `Configuration Error: Invalid NODE_ENV "${rawEnv}". Allowed values: ${ALLOWED_NODE_ENVS.join(', ')}.`
    );
  }

  return trimmed;
};

/**
 * Validates the PORT environment variable.
 * Must be an integer between 1 and 65535.
 *
 * @param {string|number|undefined} rawPort - Value of process.env.PORT
 * @returns {number} Validated port integer
 */
const validatePort = (rawPort) => {
  if (rawPort === undefined || rawPort === null || String(rawPort).trim() === '') {
    return 5000;
  }

  const trimmed = String(rawPort).trim();

  // Ensure raw value is composed strictly of digits
  if (!/^\d+$/.test(trimmed)) {
    throw new Error(
      `Configuration Error: PORT must be an integer between 1 and 65535. Received: "${rawPort}".`
    );
  }

  const port = Number.parseInt(trimmed, 10);
  if (port < 1 || port > 65535) {
    throw new Error(
      `Configuration Error: PORT must be an integer between 1 and 65535. Received: ${port}.`
    );
  }

  return port;
};

/**
 * Validates CLIENT_ORIGIN environment variable.
 * Supports a single URL or multiple comma-separated URLs.
 * Validates URL structure, http/https protocol, and disallows paths/queries.
 *
 * @param {string|undefined} rawOrigins - Value of process.env.CLIENT_ORIGIN
 * @returns {string[]} Array of normalized allowed origin strings
 */
const validateClientOrigins = (rawOrigins) => {
  if (rawOrigins === undefined || rawOrigins === null || String(rawOrigins).trim() === '') {
    return ['http://localhost:3000'];
  }

  const entries = String(rawOrigins)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (entries.length === 0) {
    throw new Error(
      `Configuration Error: CLIENT_ORIGIN must contain at least one valid origin URL.`
    );
  }

  return entries.map((origin) => {
    let parsedUrl;
    try {
      parsedUrl = new URL(origin);
    } catch (urlErr) {
      throw new Error(
        `Configuration Error: Invalid CLIENT_ORIGIN URL "${origin}". Must be a valid absolute URL (e.g. http://localhost:3000).`
      );
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error(
        `Configuration Error: Invalid CLIENT_ORIGIN URL "${origin}". Protocol must be "http:" or "https:".`
      );
    }

    // Origins should not contain path subdirectories (other than root /), search params, or hashes
    if ((parsedUrl.pathname && parsedUrl.pathname !== '/') || parsedUrl.search || parsedUrl.hash) {
      throw new Error(
        `Configuration Error: Invalid CLIENT_ORIGIN URL "${origin}". Origins must not contain path, query, or hash fragments.`
      );
    }

    // Return canonical origin without trailing slash (e.g. http://localhost:3000)
    return parsedUrl.origin;
  });
};

/**
 * Validates the JWT_SECRET environment variable.
 * Must be at least 32 characters in production, and at least 16 in development/test.
 *
 * @param {string|undefined} rawSecret - process.env.JWT_SECRET
 * @param {string} currentEnv - Current NODE_ENV
 * @returns {string} Validated JWT secret
 */
const validateJwtSecret = (rawSecret, currentEnv) => {
  const secret = rawSecret ? String(rawSecret).trim() : '';
  const minLength = currentEnv === 'production' ? 32 : 16;

  if (!secret) {
    if (currentEnv === 'test') {
      return 'test_jwt_secret_must_be_sufficiently_strong_32_chars';
    }
    throw new Error('Configuration Error: JWT_SECRET is required but was not provided.');
  }

  if (secret.length < minLength) {
    throw new Error(
      `Configuration Error: JWT_SECRET is too short. Minimum length is ${minLength} characters.`
    );
  }

  return secret;
};

/**
 * Validates JWT_EXPIRES_IN string (e.g. '7d', '24h', '3600s').
 * Defaults to '7d' if not provided.
 *
 * @param {string|undefined} rawExpiresIn - process.env.JWT_EXPIRES_IN
 * @returns {string} Validated expiration string
 */
const validateJwtExpiresIn = (rawExpiresIn) => {
  if (!rawExpiresIn || String(rawExpiresIn).trim() === '') {
    return '7d';
  }
  return String(rawExpiresIn).trim();
};

const nodeEnv = validateNodeEnv(process.env.NODE_ENV);
const port = validatePort(process.env.PORT);
const clientOrigins = validateClientOrigins(process.env.CLIENT_ORIGIN);
const mongodbUri = process.env.MONGODB_URI ? String(process.env.MONGODB_URI).trim() : '';
const mongodbTestUri = process.env.MONGODB_TEST_URI ? String(process.env.MONGODB_TEST_URI).trim() : '';
const jwtSecret = validateJwtSecret(process.env.JWT_SECRET, nodeEnv);
const jwtExpiresIn = validateJwtExpiresIn(process.env.JWT_EXPIRES_IN);

// SMTP and Client URL Configuration (Phase 5)
const smtpHost = process.env.SMTP_HOST ? String(process.env.SMTP_HOST).trim() : '';
const smtpPort = process.env.SMTP_PORT ? Number.parseInt(String(process.env.SMTP_PORT).trim(), 10) : 587;
const smtpSecure = process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === '1';
const smtpUser = process.env.SMTP_USER ? String(process.env.SMTP_USER).trim() : '';
const smtpPass = process.env.SMTP_PASS ? String(process.env.SMTP_PASS).trim() : '';
const smtpFrom = process.env.SMTP_FROM ? String(process.env.SMTP_FROM).trim() : 'Looply <noreply@looply.net>';
const clientUrl = process.env.CLIENT_URL ? String(process.env.CLIENT_URL).trim() : (clientOrigins[0] || 'http://localhost:3000');

// AI / Gemini Configuration (Phase 14)
const geminiApiKey = process.env.GEMINI_API_KEY ? String(process.env.GEMINI_API_KEY).trim() : '';
const geminiModel = process.env.GEMINI_MODEL ? String(process.env.GEMINI_MODEL).trim() : 'gemini-3.8-flash';

// Development Email Preview Configuration
const devEmailPreviewEnabled = process.env.DEV_EMAIL_PREVIEW_ENABLED ? process.env.DEV_EMAIL_PREVIEW_ENABLED === 'true' : true;

export const env = {
  NODE_ENV: nodeEnv,
  PORT: port,
  CLIENT_ORIGIN: clientOrigins.join(','),
  CLIENT_ORIGINS: clientOrigins,
  CLIENT_URL: clientUrl,
  MONGODB_URI: mongodbUri,
  MONGODB_TEST_URI: mongodbTestUri,
  JWT_SECRET: jwtSecret,
  JWT_EXPIRES_IN: jwtExpiresIn,
  SMTP_HOST: smtpHost,
  SMTP_PORT: smtpPort,
  SMTP_SECURE: smtpSecure,
  SMTP_USER: smtpUser,
  SMTP_PASS: smtpPass,
  SMTP_FROM: smtpFrom,
  isSmtpConfigured: Boolean(smtpHost && smtpUser && smtpPass),
  DEV_EMAIL_PREVIEW_ENABLED: devEmailPreviewEnabled,
  isDevEmailPreviewAllowed: (nodeEnv === 'development') && devEmailPreviewEnabled,
  GEMINI_API_KEY: geminiApiKey,
  GEMINI_MODEL: geminiModel,
  isGeminiConfigured: Boolean(geminiApiKey),
  isDevelopment: nodeEnv === 'development',
  isProduction: nodeEnv === 'production',
  isTest: nodeEnv === 'test'
};
