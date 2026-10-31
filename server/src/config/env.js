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
 * Must be one of: 'development', 'production', 'test'.
 * Defaults to 'development' if omitted or empty.
 *
 * @param {string|undefined} rawEnv - Value of process.env.NODE_ENV
 * @returns {string} Validated NODE_ENV string
 */
const validateNodeEnv = (rawEnv) => {
  if (rawEnv === undefined || rawEnv === null || String(rawEnv).trim() === '') {
    return 'development';
  }

  const trimmed = String(rawEnv).trim();
  if (!ALLOWED_NODE_ENVS.includes(trimmed)) {
    throw new Error(
      `Configuration Error: Invalid NODE_ENV "${rawEnv}". Allowed values are: ${ALLOWED_NODE_ENVS.join(', ')}.`
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

const nodeEnv = validateNodeEnv(process.env.NODE_ENV);
const port = validatePort(process.env.PORT);
const clientOrigins = validateClientOrigins(process.env.CLIENT_ORIGIN);

export const env = {
  NODE_ENV: nodeEnv,
  PORT: port,
  CLIENT_ORIGIN: clientOrigins.join(','),
  CLIENT_ORIGINS: clientOrigins,
  isProduction: nodeEnv === 'production',
  isDevelopment: nodeEnv === 'development',
  isTest: nodeEnv === 'test'
};
