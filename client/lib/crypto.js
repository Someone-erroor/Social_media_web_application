/**
 * Client-Side End-to-End Encryption (E2EE) Utility for Looply
 * Built on native W3C Web Crypto API (AES-GCM 256-bit).
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * Derives an AES-GCM 256-bit key from a conversation secret string.
 *
 * @param {string} secret
 * @param {string} saltString
 * @returns {Promise<CryptoKey>}
 */
export async function deriveConversationKey(secret, saltString = 'looply_e2ee_salt_v1') {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    throw new Error('Web Crypto API is not supported in this environment.');
  }

  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(saltString),
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
 * Encrypts a plaintext message string using AES-GCM.
 *
 * @param {string} plaintext
 * @param {CryptoKey} key
 * @returns {Promise<{ ciphertext: string, iv: string }>}
 */
export async function encryptMessage(plaintext, key) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = encoder.encode(plaintext);

  const cipherBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );

  const ciphertextBase64 = btoa(String.fromCharCode(...new Uint8Array(cipherBuffer)));
  const ivBase64 = btoa(String.fromCharCode(...iv));

  return {
    ciphertext: ciphertextBase64,
    iv: ivBase64
  };
}

/**
 * Decrypts a base64 ciphertext string using AES-GCM and the base64 IV.
 *
 * @param {string} ciphertextBase64
 * @param {string} ivBase64
 * @param {CryptoKey} key
 * @returns {Promise<string>}
 */
export async function decryptMessage(ciphertextBase64, ivBase64, key) {
  try {
    const cipherBytes = Uint8Array.from(atob(ciphertextBase64), c => c.charCodeAt(0));
    const ivBytes = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));

    const decryptedBuffer = await window.crypto.subtle.decrypt(
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

