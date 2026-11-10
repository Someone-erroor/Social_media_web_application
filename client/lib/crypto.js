/**
 * Client-Side Encryption Utility for Looply (AES-GCM 256-bit)
 * Built on native W3C Web Crypto API with cross-runtime support (Browser & Node.js).
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * Resolves the SubtleCrypto implementation in current environment.
 */
function getSubtleCrypto() {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    return window.crypto.subtle;
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    return globalThis.crypto.subtle;
  }
  throw new Error('Web Crypto API (subtle) is not supported in this environment.');
}

/**
 * Fills an array with cryptographically secure random values.
 */
function getRandomValues(array) {
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    return window.crypto.getRandomValues(array);
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    return globalThis.crypto.getRandomValues(array);
  }
  throw new Error('CSPRNG (getRandomValues) is not supported in this environment.');
}

/**
 * Converts a Uint8Array to a Base64 string safely across arbitrary buffer sizes.
 */
function uint8ArrayToBase64(bytes) {
  let binary = '';
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + chunkSize, len)));
  }
  const btoaFn = typeof window !== 'undefined' ? window.btoa : globalThis.btoa;
  return btoaFn(binary);
}

/**
 * Converts a Base64 string to a Uint8Array safely across arbitrary buffer sizes.
 */
function base64ToUint8Array(base64) {
  const atobFn = typeof window !== 'undefined' ? window.atob : globalThis.atob;
  const binary = atobFn(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derives an AES-GCM 256-bit key from a conversation secret string.
 *
 * @param {string} secret - Conversation secret (e.g., conversation ID)
 * @param {string} [saltString='looply_e2ee_salt_v1'] - Key derivation salt
 * @returns {Promise<CryptoKey>} Derived non-extractable AES-GCM key
 */
export async function deriveConversationKey(secret, saltString = 'looply_e2ee_salt_v1') {
  if (!secret || typeof secret !== 'string') {
    throw new Error('Derivation secret must be a non-empty string.');
  }

  const subtle = getSubtleCrypto();

  const keyMaterial = await subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(saltString || 'looply_e2ee_salt_v1'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a plaintext message string using AES-GCM 256-bit.
 * Generates a fresh cryptographically random 96-bit (12-byte) IV for each message.
 *
 * @param {string} plaintext
 * @param {CryptoKey} key
 * @returns {Promise<{ ciphertext: string, iv: string }>}
 */
export async function encryptMessage(plaintext, key) {
  if (typeof plaintext !== 'string') {
    throw new Error('Plaintext must be a string.');
  }
  if (!key) {
    throw new Error('A valid CryptoKey is required for encryption.');
  }

  const subtle = getSubtleCrypto();
  const iv = getRandomValues(new Uint8Array(12));
  const encoded = encoder.encode(plaintext);

  const cipherBuffer = await subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );

  return {
    ciphertext: uint8ArrayToBase64(new Uint8Array(cipherBuffer)),
    iv: uint8ArrayToBase64(iv)
  };
}

/**
 * Decrypts a base64 ciphertext string using AES-GCM and verifies the 128-bit authentication tag.
 *
 * @param {string} ciphertextBase64
 * @param {string} ivBase64
 * @param {CryptoKey} key
 * @returns {Promise<string>}
 */
export async function decryptMessage(ciphertextBase64, ivBase64, key) {
  if (!ciphertextBase64 || !ivBase64 || !key) {
    return '[Encrypted message — Decryption key mismatch]';
  }

  try {
    const subtle = getSubtleCrypto();
    const cipherBytes = base64ToUint8Array(ciphertextBase64);
    const ivBytes = base64ToUint8Array(ivBase64);

    const decryptedBuffer = await subtle.decrypt(
      { name: 'AES-GCM', iv: ivBytes },
      key,
      cipherBytes
    );

    return decoder.decode(decryptedBuffer);
  } catch (err) {
    console.warn('[E2EE Notice] Decryption failed or mismatched key.');
    return '[Encrypted message — Decryption key mismatch]';
  }
}


