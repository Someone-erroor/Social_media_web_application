import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { Post } from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base directory for local media storage: server/uploads/posts/
export const UPLOADS_DIR = path.resolve(__dirname, '../../uploads/posts');

// Ensure upload directory exists synchronously on module initialization
try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch (err) {
  console.error(`[MediaService] Failed to create uploads directory: ${err.message}`);
}

// Supported image formats and their magic byte signatures
const MAGIC_SIGNATURES = {
  jpeg: [
    [0xff, 0xd8, 0xff]
  ],
  png: [
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  ],
  gif: [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]  // GIF89a
  ]
};

/**
 * Validates buffer headers against binary magic byte signatures.
 * Detects real content types regardless of client-supplied MIME or file extensions.
 *
 * @param {Buffer} buffer
 * @returns {string|null} Detected extension ('jpg', 'png', 'gif', 'webp') or null if invalid
 */
export const detectImageFormat = (buffer) => {
  if (!buffer || buffer.length < 12) return null;

  // Check JPEG
  for (const sig of MAGIC_SIGNATURES.jpeg) {
    if (sig.every((byte, i) => buffer[i] === byte)) return 'jpg';
  }

  // Check PNG
  for (const sig of MAGIC_SIGNATURES.png) {
    if (sig.every((byte, i) => buffer[i] === byte)) return 'png';
  }

  // Check GIF
  for (const sig of MAGIC_SIGNATURES.gif) {
    if (sig.every((byte, i) => buffer[i] === byte)) return 'gif';
  }

  // Check WebP: RIFF at byte 0-3, WEBP at byte 8-11
  const isRiff = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
  const isWebp = buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
  if (isRiff && isWebp) return 'webp';

  return null;
};

/**
 * Validates an external URL for SSRF vulnerabilities and protocol security.
 *
 * @param {string} urlString
 * @returns {{ isValid: boolean, error?: string }}
 */
export const validateExternalUrl = (urlString) => {
  if (typeof urlString !== 'string' || !urlString.trim()) {
    return { isValid: false, error: 'Media URL cannot be empty.' };
  }

  const trimmed = urlString.trim();

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch (err) {
    return { isValid: false, error: 'Invalid media URL format.' };
  }

  // Strictly enforce HTTP or HTTPS protocols
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { isValid: false, error: 'Media URL must use http: or https: protocol.' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // SSRF Protection: block loopback, local, and metadata endpoints
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '0.0.0.0' ||
    hostname === '169.254.169.254' ||
    hostname === 'metadata.google.internal' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local')
  ) {
    return { isValid: false, error: 'Private and loopback network addresses are not permitted.' };
  }

  // Block private RFC 1918 / RFC 3927 IPv4 address blocks
  if (/^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|169\.254\.|127\.|0\.)/.test(hostname)) {
    return { isValid: false, error: 'Private network addresses are not permitted.' };
  }

  return { isValid: true };
};

/**
 * Processes and persists an uploaded media input.
 * Supports:
 * 1. Base64 data URIs: validated, decoded, inspected for magic bytes, saved to local disk, returning a safe URL.
 * 2. External HTTP/HTTPS URLs: validated against SSRF and protocol exploits.
 * 3. Existing safe upload paths: (/uploads/posts/...)
 *
 * @param {string} mediaInput - URL or base64 data URI
 * @param {object} [options]
 * @param {number} [options.maxSizeBytes=5242880] - Maximum allowed file size (default: 5MB)
 * @returns {Promise<{ mediaUrl: string, isLocal: boolean, filePath?: string }>}
 */
export const processAndStoreMedia = async (mediaInput, { maxSizeBytes = 5 * 1024 * 1024 } = {}) => {
  if (!mediaInput || typeof mediaInput !== 'string') {
    const error = new Error('Media input must be a non-empty string.');
    error.status = 400;
    throw error;
  }

  const trimmed = mediaInput.trim();

  // Case 1: Base64 Data URI
  if (trimmed.startsWith('data:image/')) {
    const match = trimmed.match(/^data:image\/[a-zA-Z0-9+.-]+;base64,(.+)$/i);
    if (!match || !match[1]) {
      const error = new Error('Malformed base64 image data URI.');
      error.status = 400;
      throw error;
    }

    const base64Data = match[1];
    const buffer = Buffer.from(base64Data, 'base64');

    // 1. File size enforcement (5MB limit)
    if (buffer.length > maxSizeBytes) {
      const error = new Error(`Image file size (${(buffer.length / 1024 / 1024).toFixed(2)}MB) exceeds the 5MB limit.`);
      error.status = 400;
      throw error;
    }

    // 2. Binary magic byte validation
    const detectedExt = detectImageFormat(buffer);
    if (!detectedExt) {
      const error = new Error('Invalid image binary content. Only JPEG, PNG, WebP, and GIF images are supported.');
      error.status = 400;
      throw error;
    }

    // 3. Generate high-entropy filename
    const filename = `${Date.now()}-${crypto.randomBytes(12).toString('hex')}.${detectedExt}`;
    const filePath = path.join(UPLOADS_DIR, filename);

    // 4. Save to local storage
    await fs.promises.writeFile(filePath, buffer);

    const mediaUrl = `/uploads/posts/${filename}`;
    return { mediaUrl, isLocal: true, filePath };
  }

  // Case 2: Existing local upload reference
  if (trimmed.startsWith('/uploads/posts/')) {
    return { mediaUrl: trimmed, isLocal: true };
  }

  // Case 3: External HTTP/HTTPS URL
  const validation = validateExternalUrl(trimmed);
  if (!validation.isValid) {
    const error = new Error(validation.error || 'Invalid external media URL.');
    error.status = 400;
    throw error;
  }

  return { mediaUrl: trimmed, isLocal: false };
};

/**
 * Safely deletes a local media file from disk with path-traversal prevention.
 *
 * @param {string} mediaUrl - e.g. /uploads/posts/abc123.jpg
 * @returns {Promise<boolean>}
 */
export const deleteMediaFile = async (mediaUrl) => {
  if (!mediaUrl || typeof mediaUrl !== 'string') return false;

  const normalized = mediaUrl.trim();
  if (!normalized.startsWith('/uploads/posts/')) return false;

  const filename = path.basename(normalized);
  const filePath = path.join(UPLOADS_DIR, filename);

  // Security: prevent directory traversal
  if (!filePath.startsWith(UPLOADS_DIR)) {
    console.warn(`[MediaService] Blocked directory traversal attempt: ${mediaUrl}`);
    return false;
  }

  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
  } catch (err) {
    console.error(`[MediaService] Error deleting file ${filePath}: ${err.message}`);
  }

  return false;
};

/**
 * Cleans up a list of media URLs if they are local uploads and not referenced by other posts.
 *
 * @param {string[]} mediaUrls
 * @param {string} [excludePostId] - Optional post ID being deleted
 * @returns {Promise<void>}
 */
export const cleanupMediaFiles = async (mediaUrls = [], excludePostId = null) => {
  for (const url of mediaUrls) {
    if (!url || typeof url !== 'string') continue;
    if (url.startsWith('/uploads/posts/')) {
      try {
        // Check if another post shares this media reference
        const filter = {
          $or: [{ primaryMedia: url }, { realityMedia: url }]
        };
        if (excludePostId) {
          filter._id = { $ne: excludePostId };
        }
        const isReferenced = await Post.exists(filter);
        if (!isReferenced) {
          await deleteMediaFile(url);
        }
      } catch (err) {
        console.error(`[MediaService] Cleanup error for ${url}: ${err.message}`);
      }
    }
  }
};

export default {
  UPLOADS_DIR,
  detectImageFormat,
  validateExternalUrl,
  processAndStoreMedia,
  deleteMediaFile,
  cleanupMediaFiles
};

