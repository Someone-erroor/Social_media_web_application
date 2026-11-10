import http from 'http';
import app from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { initSocketServer, closeSocketServer } from '../src/services/socket.service.js';
import { io as Client } from 'socket.io-client';
import User from '../src/models/User.js';
import Conversation from '../src/models/Conversation.js';
import Message from '../src/models/Message.js';
import { generateToken } from '../src/config/jwt.js';
import {
  deriveConversationKey,
  encryptMessage,
  decryptMessage
} from '../../client/lib/crypto.js';

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`✓ ${label}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${label}`);
    failed++;
  }
}

async function runCryptographicAudit() {
  console.log('================================================================');
  console.log('LOOPLY — CLIENT-SIDE MESSAGING CRYPTOGRAPHIC INTEGRITY AUDIT');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // [PART 1] Cryptographic Primitives & Derivation Material Audit
  // -------------------------------------------------------------
  console.log('[SECTION 1] Key Derivation Material & Determinism');

  const testConvId1 = '672d11112222333344445555';
  const testConvId2 = '672d99998888777766665555';

  const keyParticipantA = await deriveConversationKey(testConvId1);
  const keyParticipantB = await deriveConversationKey(testConvId1);
  const keyParticipantDiffConv = await deriveConversationKey(testConvId2);

  assert(keyParticipantA instanceof CryptoKey, 'Participant A derived valid CryptoKey');
  assert(keyParticipantA.algorithm.name === 'AES-GCM', 'Derived key algorithm is AES-GCM');
  assert(keyParticipantA.algorithm.length === 256, 'Derived key length is 256 bits');
  assert(keyParticipantA.extractable === false, 'Derived key is strictly non-extractable (memory isolated)');

  // Determinism test: Participant A and B derive identical keys for the same conversation
  const samplePlaintext = 'Confidential message: Verify key equivalence!';
  const sampleEnc = await encryptMessage(samplePlaintext, keyParticipantA);
  const decByB = await decryptMessage(sampleEnc.ciphertext, sampleEnc.iv, keyParticipantB);
  assert(decByB === samplePlaintext, 'Participant B successfully decrypts message encrypted by Participant A');

  // Isolation test: Conversation 2 cannot decrypt Conversation 1
  const decByOther = await decryptMessage(sampleEnc.ciphertext, sampleEnc.iv, keyParticipantDiffConv);
  assert(
    decByOther === '[Encrypted message — Decryption key mismatch]',
    'Conversation 2 key strictly fails to decrypt Conversation 1 ciphertext (safe fallback)'
  );

  // -------------------------------------------------------------
  // [SECTION 2] IV Freshness & Anti-Collision Audit (No IV Reuse)
  // -------------------------------------------------------------
  console.log('\n[SECTION 2] IV Freshness & CSPRNG Nonce Generation');

  const identicalPlaintext = 'Repeated sensitive payload';
  const encResults = [];
  const ivSet = new Set();
  const ciphertextSet = new Set();

  for (let i = 0; i < 30; i++) {
    const res = await encryptMessage(identicalPlaintext, keyParticipantA);
    encResults.push(res);
    ivSet.add(res.iv);
    ciphertextSet.add(res.ciphertext);
  }

  assert(ivSet.size === 30, '30 successive encryptions produced 30 unique, cryptographically random IVs');
  assert(ciphertextSet.size === 30, 'Identical plaintext produced 30 distinct ciphertexts (no IV reuse / semantic security)');

  // Verify all 30 decrypt back to identical plaintext
  let allDecryptedMatch = true;
  for (const res of encResults) {
    const dec = await decryptMessage(res.ciphertext, res.iv, keyParticipantB);
    if (dec !== identicalPlaintext) {
      allDecryptedMatch = false;
      break;
    }
  }
  assert(allDecryptedMatch, 'All 30 unique ciphertexts decrypt back to identical original plaintext');

  // -------------------------------------------------------------
  // [SECTION 3] Unicode, Emojis, Multi-byte & Large Payload Audit
  // -------------------------------------------------------------
  console.log('\n[SECTION 3] UTF-8 Unicode, Emojis & Arbitrary Payload Integrity');

  const complexPayload = '🚀 Looply Encryption Test: 🔒 🌟 \n\nArabic: مرحبا بالعالم\nChinese: 你好，世界\nHindi: नमस्ते दुनिया\nSpecial: <script>alert("xss")</script> & "quotes" \'escapes\'';
  const complexEnc = await encryptMessage(complexPayload, keyParticipantA);
  const complexDec = await decryptMessage(complexPayload.ciphertext || complexEnc.ciphertext, complexEnc.iv, keyParticipantB);
  assert(complexDec === complexPayload, 'Complex Unicode, multi-line, script-tags and emojis decrypted flawlessly');

  // Large payload (4,000 characters)
  const largePlaintext = 'A'.repeat(4000);
  const largeEnc = await encryptMessage(largePlaintext, keyParticipantA);
  const largeDec = await decryptMessage(largeEnc.ciphertext, largeEnc.iv, keyParticipantB);
  assert(largeDec === largePlaintext, 'Large 4,000 character payload encrypted and decrypted without call stack overflow');

  // -------------------------------------------------------------
  // [SECTION 4] AES-GCM Authentication Tag & Tamper Defense
  // -------------------------------------------------------------
  console.log('\n[SECTION 4] AES-GCM AEAD Authentication Tag & Tamper Resistance');

  const pristineEnc = await encryptMessage('Secret transaction details', keyParticipantA);

  // 1. Bit-flip in ciphertext base64
  const rawCipherBytes = Buffer.from(pristineEnc.ciphertext, 'base64');
  rawCipherBytes[rawCipherBytes.length - 1] ^= 0x01; // flip 1 bit in authentication tag area
  const tamperedCiphertext = rawCipherBytes.toString('base64');

  const tamperResult = await decryptMessage(tamperedCiphertext, pristineEnc.iv, keyParticipantB);
  assert(
    tamperResult === '[Encrypted message — Decryption key mismatch]',
    'Tampered ciphertext strictly rejected by AES-GCM authentication tag verification'
  );

  // 2. Bit-flip in IV base64
  const rawIvBytes = Buffer.from(pristineEnc.iv, 'base64');
  rawIvBytes[0] ^= 0x01;
  const tamperedIv = rawIvBytes.toString('base64');

  const tamperedIvResult = await decryptMessage(pristineEnc.ciphertext, tamperedIv, keyParticipantB);
  assert(
    tamperedIvResult === '[Encrypted message — Decryption key mismatch]',
    'Tampered IV strictly rejected by AES-GCM authentication tag verification'
  );

  // 3. Null / Malformed inputs handled safely without throwing uncaught errors
  const nullResult = await decryptMessage(null, null, keyParticipantB);
  assert(nullResult === '[Encrypted message — Decryption key mismatch]', 'Null inputs return safe fallback notice');

  // -------------------------------------------------------------
  // [SECTION 5] Live Server Transport, Opacity & Storage Audit
  // -------------------------------------------------------------
  console.log('\n[SECTION 5] Server-Side Transport Privacy, Database & Socket Opacity');

  await connectDatabase();

  const server = http.createServer(app);
  initSocketServer(server);

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const serverUrl = `http://127.0.0.1:${port}`;
  console.log(`[Server] Test server listening on ${serverUrl}\n`);

  // Provision User A, User B, Intruder C
  const [userA, userB, userC] = await Promise.all([
    User.findOneAndUpdate(
      { email: 'crypto_user_a@looply.test' },
      {
        fullName: 'Crypto User A',
        email: 'crypto_user_a@looply.test',
        passwordHash: 'dummy_hash',
        accountStatus: 'active',
        isEmailVerified: true,
        tokenVersion: 0
      },
      { upsert: true, returnDocument: 'after' }
    ),
    User.findOneAndUpdate(
      { email: 'crypto_user_b@looply.test' },
      {
        fullName: 'Crypto User B',
        email: 'crypto_user_b@looply.test',
        passwordHash: 'dummy_hash',
        accountStatus: 'active',
        isEmailVerified: true,
        tokenVersion: 0
      },
      { upsert: true, returnDocument: 'after' }
    ),
    User.findOneAndUpdate(
      { email: 'crypto_user_c_intruder@looply.test' },
      {
        fullName: 'Crypto Intruder C',
        email: 'crypto_user_c_intruder@looply.test',
        passwordHash: 'dummy_hash',
        accountStatus: 'active',
        isEmailVerified: true,
        tokenVersion: 0
      },
      { upsert: true, returnDocument: 'after' }
    )
  ]);

  const tokenA = generateToken({ userId: userA._id.toString(), role: 'user', tokenVersion: 0 });
  const tokenB = generateToken({ userId: userB._id.toString(), role: 'user', tokenVersion: 0 });
  const tokenC = generateToken({ userId: userC._id.toString(), role: 'user', tokenVersion: 0 });

  // Provision Conversation between User A and User B
  let conversation = await Conversation.findOne({
    participants: { $all: [userA._id, userB._id] }
  });
  if (!conversation) {
    conversation = await Conversation.create({
      participants: [userA._id, userB._id],
      status: 'active',
      initiatedBy: userA._id
    });
  }

  const convId = conversation._id.toString();

  // Socket.IO connections
  const socketB = Client(serverUrl, { auth: { token: tokenB }, transports: ['websocket'] });
  const socketC = Client(serverUrl, { auth: { token: tokenC }, transports: ['websocket'] });

  await Promise.all([
    new Promise((resolve) => socketB.on('connect', resolve)),
    new Promise((resolve) => socketC.on('connect', resolve))
  ]);

  socketB.emit('join_conversation', convId);
  socketC.emit('join_conversation', convId); // Unauthorized join attempt
  await new Promise((r) => setTimeout(r, 200));

  // Client A encrypts secret message before dispatching to server
  const livePlaintext = 'Top secret proprietary algorithm data: 42-XYZ';
  const keyA = await deriveConversationKey(convId);
  const encryptedPayload = await encryptMessage(livePlaintext, keyA);

  assert(encryptedPayload.ciphertext !== livePlaintext, 'Payload encrypted: ciphertext is not plaintext');
  assert(typeof encryptedPayload.iv === 'string', 'Payload includes base64 IV');

  let socketReceivedPayload = null;
  let intruderReceivedPayload = null;

  socketB.on('new_message', (data) => {
    socketReceivedPayload = data;
  });

  socketC.on('new_message', (data) => {
    intruderReceivedPayload = data;
  });

  // User A dispatches encrypted message via HTTP REST API
  const sendRes = await fetch(`${serverUrl}/api/messages/conversations/${convId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`
    },
    body: JSON.stringify({
      content: encryptedPayload.ciphertext,
      isEncrypted: true,
      iv: encryptedPayload.iv
    })
  });

  const sendJson = await sendRes.json();
  assert(sendRes.status === 201, 'POST /api/messages/:id/messages returned HTTP 201 Created');
  assert(sendJson.message.isEncrypted === true, 'Server responded with isEncrypted: true');
  assert(sendJson.message.content === encryptedPayload.ciphertext, 'Server stores and responds with ciphertext');
  assert(!JSON.stringify(sendJson).includes(livePlaintext), 'Server HTTP response contains ZERO occurrences of plaintext');

  // Wait for real-time delivery
  await new Promise((r) => setTimeout(r, 500));

  // 1. Check Socket.IO privacy
  assert(socketReceivedPayload !== null, 'Participant B received new_message via Socket.IO');
  assert(
    socketReceivedPayload.message.content === encryptedPayload.ciphertext,
    'Socket.IO transmitted ciphertext only'
  );
  assert(
    !JSON.stringify(socketReceivedPayload).includes(livePlaintext),
    'Socket.IO broadcast contains ZERO occurrences of plaintext'
  );
  assert(intruderReceivedPayload === null, 'Intruder C received ZERO messages from unauthorized conversation');

  // 2. Client B decrypts received message
  const keyB = await deriveConversationKey(convId);
  const decryptedByB = await decryptMessage(
    socketReceivedPayload.message.content,
    socketReceivedPayload.message.iv,
    keyB
  );
  assert(decryptedByB === livePlaintext, 'Participant B decrypted live Socket.IO message to original plaintext');

  // 3. Inspect raw MongoDB document persistence
  const persistedMsg = await Message.findById(sendJson.message._id).lean();
  assert(persistedMsg.isEncrypted === true, 'Database record has isEncrypted: true');
  assert(persistedMsg.content === encryptedPayload.ciphertext, 'Database record content is base64 ciphertext');
  assert(persistedMsg.iv === encryptedPayload.iv, 'Database record stores initialization vector');
  assert(
    !JSON.stringify(persistedMsg).includes(livePlaintext),
    'Direct database inspection confirms ZERO plaintext stored in MongoDB'
  );

  // 4. Test non-participant REST API lockout
  const intruderFetchRes = await fetch(`${serverUrl}/api/messages/conversations/${convId}/messages`, {
    headers: { Authorization: `Bearer ${tokenC}` }
  });
  assert(
    intruderFetchRes.status === 403,
    'Intruder C HTTP GET /api/messages/:id strictly rejected with HTTP 403 Forbidden'
  );

  // -------------------------------------------------------------
  // Teardown
  // -------------------------------------------------------------
  socketB.disconnect();
  socketC.disconnect();
  await new Promise((resolve) => server.close(resolve));
  closeSocketServer();
  await disconnectDatabase();

  console.log('\n================================================================');
  console.log(`CRYPTOGRAPHIC AUDIT SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runCryptographicAudit().catch((err) => {
  console.error('[Audit Fatal Error]', err);
  process.exit(1);
});
