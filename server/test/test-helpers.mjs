import fs from 'fs';
import path from 'path';

/**
 * Validates that a MongoDB connection URI strictly targets a dedicated test database
 * and rejects production or primary application databases.
 *
 * @param {string} uri - MongoDB connection string
 * @returns {string} The validated database name (strictly 'looply_test')
 * @throws {Error} If URI is invalid or targets a non-test database
 */
export function validateTestDatabaseSafety(uri) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SAFETY CHECK REJECTED: Automated test suites cannot execute when NODE_ENV is set to production.');
  }

  if (!uri || typeof uri !== 'string' || uri.trim() === '') {
    throw new Error('SAFETY CHECK REJECTED: MONGODB_TEST_URI is required for automated test execution.');
  }

  const cleanUri = uri.trim();

  // Reject production identifiers in URI
  if (/(production|prod-db|looply-prod)/i.test(cleanUri)) {
    throw new Error('SAFETY CHECK REJECTED: Production database URI indicator detected. Aborting test execution.');
  }

  // Extract database name from URI (handling query params and trailing slashes)
  // Format: mongodb://host:port/dbname?options or mongodb+srv://user:pass@host/dbname?options
  const pathWithoutQuery = cleanUri.split('?')[0];
  const dbName = pathWithoutQuery.split('/').pop();

  if (!dbName || dbName !== 'looply_test') {
    throw new Error(
      `SAFETY CHECK REJECTED: Tests must connect strictly to dedicated "looply_test" database. Detected database: "${dbName}". Modifying primary application database (looply) or other non-test database is strictly prohibited.`
    );
  }

  return dbName;
}

/**
 * Retrieves and validates the required MONGODB_TEST_URI environment variable.
 * Never falls back to MONGODB_URI.
 *
 * @returns {string} Validated test database URI targeting looply_test
 * @throws {Error} If MONGODB_TEST_URI is missing or targets an unsafe database
 */
export function getTestMongoUri() {
  const testUri = process.env.MONGODB_TEST_URI;

  if (!testUri || typeof testUri !== 'string' || testUri.trim() === '') {
    throw new Error(
      'Configuration Error: MONGODB_TEST_URI is required for automated testing. Never fall back to MONGODB_URI to ensure primary database isolation. Please configure MONGODB_TEST_URI in server/.env with target database "looply_test".'
    );
  }

  validateTestDatabaseSafety(testUri);
  return testUri.trim();
}

/**
 * Finds a portable path to an installed Google Chrome or Chromium executable
 * across Windows, macOS, and Linux environments.
 *
 * @returns {string} Absolute path to chrome executable
 * @throws {Error} If no compatible Chrome executable is found
 */
export function findChromeExecutable() {
  // 1. Check custom environment override
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }
  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  if (process.env.CHROME_BIN && fs.existsSync(process.env.CHROME_BIN)) {
    return process.env.CHROME_BIN;
  }

  // 2. Platform-specific default discovery paths
  const platform = process.platform;
  const candidates = [];

  if (platform === 'win32') {
    const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
    const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
    const localAppData = process.env['LocalAppData'] || (process.env['USERPROFILE'] ? path.join(process.env['USERPROFILE'], 'AppData', 'Local') : '');

    candidates.push(
      path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(programFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(programFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      path.join(programFilesX86, 'Microsoft', 'Edge', 'Application', 'msedge.exe')
    );
  } else if (platform === 'darwin') {
    candidates.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
    );
  } else {
    // Linux and BSD
    candidates.push(
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/snap/bin/chromium'
    );
  }

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    'Unable to locate a Google Chrome or Chromium executable. Set CHROME_PATH environment variable to specify the browser path.'
  );
}

export default {
  validateTestDatabaseSafety,
  getTestMongoUri,
  findChromeExecutable
};

