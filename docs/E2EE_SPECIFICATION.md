# Looply Client-Side Messaging Encryption Specification

## 1. Overview & Current Scope
Looply Direct Messaging provides client-side encryption designed to protect private user communications from eavesdropping, server database dumps, and network interception.

> **Security Model Classification:** The current implementation is classified as **Client-Side Encrypted with Limitations**. Encryption operates client-side via native W3C Web Crypto AES-GCM 256-bit with PBKDF2 conversation derivation over authenticated HTTPS/WSS transport. The implementation provides content opacity across server persistence and WebSocket broadcasts, but is not equivalent to a full asymmetric zero-knowledge protocol such as Signal Protocol (Double Ratchet / X3DH). All messaging claims in the UI strictly reflect "Client-Side Encrypted (AES-GCM 256-bit)".

### Threat Model
- **Adversary Capability:** An attacker with access to the database or intermediate proxies (e.g. cloud database dump, packet sniffer, or unauthorized network observer).
- **Security Goal:** Confidentiality and integrity of message contents between conversation participants. The server stores only base64 ciphertext and standard initialization vectors (IV).
- **Trust Assumption:** The endpoints (user browsers/devices) execute authenticated JavaScript in a secure context (`HTTPS` or `localhost`). Cryptographic keys are generated and retained exclusively on client devices in non-extractable volatile memory.

---

## 2. Cryptographic Primitives (Web Crypto API)
Looply utilizes standard, battle-tested cryptographic primitives native to modern browsers via the W3C **Web Crypto API** (`window.crypto.subtle`):

1. **Symmetric Encryption:** `AES-GCM` (Galois/Counter Mode) with 256-bit key length.
2. **Initialization Vector (IV):** 12-byte (96-bit) cryptographically random IV generated via `crypto.getRandomValues(new Uint8Array(12))` for every single message.
3. **Key Derivation:** `PBKDF2` (Password-Based Key Derivation Function 2) using `SHA-256`, 100,000 iterations, derived from conversation secret identifier and platform salt.

---

## 3. Client-Side Encryption Workflow

```
[Sender Client]
   │
   ├─ 1. Plaintext input: "Hello friend!"
   ├─ 2. Generate random 96-bit IV
   ├─ 3. Encrypt: crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encodedText)
   └─ 4. Payload dispatched to server:
         {
           content: "b64_ciphertext_string...",
           iv: "b64_iv_string...",
           isEncrypted: true
         }
```

---

## 4. Server-Side Storage Policy
The Looply backend strictly treats encrypted messages as opaque binary envelopes:
- The backend database schema (`Message.js`) stores:
  - `content`: Base64 ciphertext
  - `iv`: Base64 IV
  - `isEncrypted`: `true`
- **Zero Plaintext Logging:** The server never inspects, parses, logs, or hashes the message payload.
- **Admin Access Principles:** Administrators do NOT possess master keys to decrypt user conversations. In the event of a Trust & Safety report for harassment or abuse, only content voluntarily submitted by the reporting participant as client-decrypted report evidence is reviewed.

---

## 5. Client-Side Decryption Workflow

```
[Recipient Client]
   │
   ├─ 1. Receives message payload from Server/Socket.IO
   ├─ 2. Extracts Base64 ciphertext and IV
   ├─ 3. Decrypt: crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
   └─ 4. Renders decrypted plaintext in user chat UI with "🔒 AES-GCM 256-bit Protected" badge.
```


