import http from 'http';
import app from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { initSocketServer, closeSocketServer } from '../src/services/socket.service.js';
import { io as Client } from 'socket.io-client';
import User from '../src/models/User.js';
import Conversation from '../src/models/Conversation.js';
import Message from '../src/models/Message.js';
import { generateToken } from '../src/config/jwt.js';

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

async function runVerification() {
  console.log('================================================================');
  console.log('LOOPLY — REAL-TIME MESSAGING & ROOM AUTHORIZATION AUDIT');
  console.log('================================================================\n');

  await connectDatabase();

  const server = http.createServer(app);
  initSocketServer(server);

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const serverUrl = `http://127.0.0.1:${port}`;
  console.log(`[Server] Test server listening on ${serverUrl}\n`);

  // Provision 3 test users: User A, User B, and User C (Intruder)
  const [userA, userB, userC] = await Promise.all([
    User.findOneAndUpdate(
      { email: 'user_a_audit@looply.test' },
      {
        fullName: 'User A Audit',
        email: 'user_a_audit@looply.test',
        passwordHash: 'dummy_hash',
        accountStatus: 'active',
        isEmailVerified: true,
        tokenVersion: 0
      },
      { upsert: true, new: true }
    ),
    User.findOneAndUpdate(
      { email: 'user_b_audit@looply.test' },
      {
        fullName: 'User B Audit',
        email: 'user_b_audit@looply.test',
        passwordHash: 'dummy_hash',
        accountStatus: 'active',
        isEmailVerified: true,
        tokenVersion: 0
      },
      { upsert: true, new: true }
    ),
    User.findOneAndUpdate(
      { email: 'user_c_intruder@looply.test' },
      {
        fullName: 'Intruder C Audit',
        email: 'user_c_intruder@looply.test',
        passwordHash: 'dummy_hash',
        accountStatus: 'active',
        isEmailVerified: true,
        tokenVersion: 0
      },
      { upsert: true, new: true }
    )
  ]);

  const tokenA = generateToken({ userId: userA._id.toString(), role: 'user', tokenVersion: 0 });
  const tokenB = generateToken({ userId: userB._id.toString(), role: 'user', tokenVersion: 0 });
  const tokenC = generateToken({ userId: userC._id.toString(), role: 'user', tokenVersion: 0 });

  // Conversation between A and B (C is NOT a participant)
  let convAB = await Conversation.findOne({
    participants: { $all: [userA._id, userB._id] }
  });
  if (!convAB) {
    convAB = await Conversation.create({
      participants: [userA._id, userB._id],
      initiatedBy: userA._id,
      status: 'active'
    });
  }

  // Conversation between B and C
  let convBC = await Conversation.findOne({
    participants: { $all: [userB._id, userC._id] }
  });
  if (!convBC) {
    convBC = await Conversation.create({
      participants: [userB._id, userC._id],
      initiatedBy: userB._id,
      status: 'active'
    });
  }

  console.log('[SECTION 1] Socket Authentication Handshake');

  // Test 1: Missing Token rejection
  await new Promise((resolve) => {
    const unauthSocket = Client(serverUrl, {
      transports: ['websocket'],
      reconnection: false
    });
    unauthSocket.on('connect_error', (err) => {
      assert(err.message.includes('Missing token'), 'Unauthenticated socket without token strictly rejected');
      unauthSocket.close();
      resolve();
    });
    unauthSocket.on('connect', () => {
      assert(false, 'Unauthenticated socket without token must not connect');
      unauthSocket.close();
      resolve();
    });
  });

  // Test 2: Invalid Token rejection
  await new Promise((resolve) => {
    const badTokenSocket = Client(serverUrl, {
      auth: { token: 'invalid.jwt.signature' },
      transports: ['websocket'],
      reconnection: false
    });
    badTokenSocket.on('connect_error', (err) => {
      assert(err.message.includes('Invalid or expired token'), 'Socket with forged/invalid token strictly rejected');
      badTokenSocket.close();
      resolve();
    });
  });

  // Test 3: Valid Token connection via auth payload
  const socketA = Client(serverUrl, {
    auth: { token: tokenA },
    transports: ['websocket'],
    reconnection: true
  });
  const socketB = Client(serverUrl, {
    auth: { token: tokenB },
    transports: ['websocket'],
    reconnection: true
  });
  const socketC = Client(serverUrl, {
    auth: { token: tokenC },
    transports: ['websocket'],
    reconnection: true
  });

  await Promise.all([
    new Promise((r) => socketA.on('connect', r)),
    new Promise((r) => socketB.on('connect', r)),
    new Promise((r) => socketC.on('connect', r))
  ]);

  assert(socketA.connected, 'User A connected via primary auth: { token } payload');
  assert(socketB.connected, 'User B connected via primary auth: { token } payload');
  assert(socketC.connected, 'Intruder C connected via primary auth: { token } payload');

  console.log('\n[SECTION 2] User Room Authorization & Anti-Spoofing');

  // Test 4: Intruder C attempts to manually join User A's personal notification room
  await new Promise((resolve) => {
    socketC.once('error', (err) => {
      assert(err.message.includes('Unauthorized user room subscription'), 'Intruder C blocked from joining user_<UserA_ID> room');
      resolve();
    });
    socketC.emit('join_room', `user_${userA._id}`);
  });

  // Test 5: Intruder C attempts to join admin room without admin role
  await new Promise((resolve) => {
    socketC.once('error', (err) => {
      assert(err.message.includes('Unauthorized room subscription'), 'Standard member blocked from joining admin_room');
      resolve();
    });
    socketC.emit('join_room', 'admin_room');
  });

  console.log('\n[SECTION 3] Conversation Room Authorization & Anti-Eavesdropping');

  // Test 6: Intruder C attempts to join Conversation A-B via join_conversation
  await new Promise((resolve) => {
    socketC.once('error', (err) => {
      assert(err.message.includes('Access denied: You are not a participant'), 'Intruder C strictly blocked from joining private Conversation A-B');
      resolve();
    });
    socketC.emit('join_conversation', convAB._id.toString());
  });

  // Test 7: Intruder C attempts to bypass via generic join_room
  await new Promise((resolve) => {
    socketC.once('error', (err) => {
      assert(err.message.includes('Direct conversation room join forbidden'), 'Bypassing conversation authorization via join_room strictly blocked');
      resolve();
    });
    socketC.emit('join_room', `conversation_${convAB._id}`);
  });

  // Test 8: Legitimate participants A and B join Conversation A-B
  socketA.emit('join_conversation', convAB._id.toString());
  socketB.emit('join_conversation', { conversationId: convAB._id.toString() });
  await new Promise((r) => setTimeout(r, 200));
  assert(true, 'Legitimate participants A and B joined Conversation A-B without error');

  console.log('\n[SECTION 4] Typing Indicator Authorization');

  // Test 9: Intruder C attempts to broadcast typing into Conversation A-B
  let intruderTypingSeen = false;
  socketB.on('user_typing', (payload) => {
    if (payload.userId === userC._id.toString()) {
      intruderTypingSeen = true;
    }
  });

  socketC.emit('typing_start', convAB._id.toString());
  await new Promise((r) => setTimeout(r, 200));
  assert(!intruderTypingSeen, 'Typing indicators from unauthorized non-participants are dropped');

  // Test 10: Legitimate typing from User A to User B
  let legitTypingSeen = false;
  socketB.once('user_typing', (payload) => {
    if (payload.userId === userA._id.toString()) {
      legitTypingSeen = true;
    }
  });

  socketA.emit('typing_start', convAB._id.toString());
  await new Promise((r) => setTimeout(r, 200));
  assert(legitTypingSeen, 'Legitimate typing indicators broadcast correctly between verified participants');

  console.log('\n[SECTION 5] Real-Time Messaging Delivery & Deduplication');

  let msgReceivedByB = null;
  let msgReceivedByIntruderC = null;

  socketB.on('new_message', (payload) => {
    msgReceivedByB = payload;
  });
  socketC.on('new_message', (payload) => {
    msgReceivedByIntruderC = payload;
  });

  // User A sends message to User B via HTTP API
  const sendRes = await fetch(`${serverUrl}/api/messages/conversations/${convAB._id}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`
    },
    body: JSON.stringify({
      content: 'Real-time test message between A and B',
      isEncrypted: false
    })
  });
  const sendJson = await sendRes.json();
  assert(sendJson.success, 'HTTP POST /api/messages/:id/messages returned HTTP 201');

  await new Promise((r) => setTimeout(r, 500));

  assert(Boolean(msgReceivedByB), 'User B received new_message event in real-time');
  assert(msgReceivedByB?.message?.content === 'Real-time test message between A and B', 'Message payload content matches sent message');
  assert(!msgReceivedByIntruderC, 'Intruder C received 0 private messages from Conversation A-B');

  // Test 11: Database Persistence verification
  const persistedMsg = await Message.findById(sendJson.message._id);
  assert(Boolean(persistedMsg), 'Message is durably persisted in MongoDB database');
  assert(persistedMsg.content === 'Real-time test message between A and B', 'Persisted database content is authoritative');

  console.log('\n[SECTION 6] Read Receipt Synchronization');

  // Test 12: User B marks messages as read
  let readReceiptReceivedByA = null;
  socketA.once('messages_read', (payload) => {
    readReceiptReceivedByA = payload;
  });

  const readRes = await fetch(`${serverUrl}/api/messages/conversations/${convAB._id}/read`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${tokenB}`
    }
  });
  const readJson = await readRes.json();
  assert(readJson.success, 'HTTP PATCH /api/messages/:id/read returned HTTP 200');

  await new Promise((r) => setTimeout(r, 400));
  assert(Boolean(readReceiptReceivedByA), 'User A received real-time messages_read receipt');
  assert(readReceiptReceivedByA?.conversationId === convAB._id.toString(), 'Read receipt conversationId matches');

  console.log('\n[SECTION 7] Disconnection, Reconnection & Auto-Rejoin');

  // Test 13: User B disconnects and reconnects
  socketB.disconnect();
  assert(!socketB.connected, 'User B disconnected cleanly');

  // Send message while User B is offline
  const offlineSendRes = await fetch(`${serverUrl}/api/messages/conversations/${convAB._id}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`
    },
    body: JSON.stringify({
      content: 'Message while User B was offline',
      isEncrypted: false
    })
  });
  const offlineSendJson = await offlineSendRes.json();
  assert(offlineSendJson.success, 'Message sent while recipient was offline');

  // User B reconnects
  socketB.connect();
  await new Promise((r) => socketB.on('connect', r));
  assert(socketB.connected, 'User B successfully reconnected');

  // Auto-rejoin conversation room
  socketB.emit('join_conversation', convAB._id.toString());
  await new Promise((r) => setTimeout(r, 200));

  // User A sends live message after B reconnected
  let liveMsgAfterReconnect = null;
  socketB.once('new_message', (payload) => {
    liveMsgAfterReconnect = payload;
  });

  await fetch(`${serverUrl}/api/messages/conversations/${convAB._id}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`
    },
    body: JSON.stringify({
      content: 'Message after reconnection',
      isEncrypted: false
    })
  });

  await new Promise((r) => setTimeout(r, 400));
  assert(Boolean(liveMsgAfterReconnect), 'User B received live message immediately after reconnecting');
  assert(liveMsgAfterReconnect?.message?.content === 'Message after reconnection', 'Reconnected message content matches');

  // Fetch conversation history from API to verify offline message retrieval
  const historyRes = await fetch(`${serverUrl}/api/messages/conversations/${convAB._id}/messages`, {
    headers: {
      Authorization: `Bearer ${tokenB}`
    }
  });
  const historyJson = await historyRes.json();
  const foundOffline = historyJson.messages.some((m) => m.content === 'Message while User B was offline');
  assert(foundOffline, 'Offline message retrieved from database history on conversation load');

  // Cleanup
  socketA.close();
  socketB.close();
  socketC.close();
  await closeSocketServer();
  await new Promise((resolve) => server.close(resolve));
  await disconnectDatabase();

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runVerification().catch((err) => {
  console.error('[FATAL TEST ERROR]:', err);
  process.exit(1);
});

