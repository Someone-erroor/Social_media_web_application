import http from 'http';
import app from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { initSocketServer, closeSocketServer } from '../src/services/socket.service.js';
import { io as Client } from 'socket.io-client';
import User from '../src/models/User.js';
import FeedHeist from '../src/models/FeedHeist.js';
import MoodOrbitRoom from '../src/models/MoodOrbitRoom.js';
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

async function runTests() {
  console.log('================================================================');
  console.log('LOOPLY — FEED HEISTS & MOOD-ORBIT ROOMS SIGNATURE EXPERIENCES');
  console.log('================================================================\n');

  await connectDatabase();

  const server = http.createServer(app);
  initSocketServer(server);

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[Server] Test server listening on ${baseUrl}\n`);

  // 1. Provision Test Operatives
  const [agent1, agent2] = await Promise.all([
    User.findOneAndUpdate(
      { email: 'agent1@looply.test' },
      {
        fullName: 'Agent Alpha',
        email: 'agent1@looply.test',
        passwordHash: 'dummy_hash',
        accountStatus: 'active',
        isEmailVerified: true,
        tokenVersion: 0
      },
      { upsert: true, returnDocument: 'after' }
    ),
    User.findOneAndUpdate(
      { email: 'agent2@looply.test' },
      {
        fullName: 'Agent Beta',
        email: 'agent2@looply.test',
        passwordHash: 'dummy_hash',
        accountStatus: 'active',
        isEmailVerified: true,
        tokenVersion: 0
      },
      { upsert: true, returnDocument: 'after' }
    )
  ]);

  const token1 = generateToken({ userId: agent1._id.toString(), role: 'user', tokenVersion: 0 });
  const token2 = generateToken({ userId: agent2._id.toString(), role: 'user', tokenVersion: 0 });

  // ====================================================================
  // SUITE 1: FEED HEISTS
  // ====================================================================
  console.log('[SECTION 1] Feed Heists Authentication & Permissions');

  // 1.1 Unauthenticated requests are strictly rejected
  const unauthRes = await fetch(`${baseUrl}/api/heists`);
  assert(unauthRes.status === 401, 'Unauthenticated GET /api/heists returns HTTP 401 Unauthorized');

  // 1.2 Create Heist with missing solution rejected
  const invalidCreateRes = await fetch(`${baseUrl}/api/heists`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token1}`
    },
    body: JSON.stringify({
      title: 'Missing Cipher Heist'
    })
  });
  assert(invalidCreateRes.status === 400, 'Creation without required fields returns HTTP 400 Bad Request');

  // 1.3 Create Valid Feed Heist
  const futureEnd = new Date(Date.now() + 2 * 3600 * 1000); // 2 hours
  const createRes = await fetch(`${baseUrl}/api/heists`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token1}`
    },
    body: JSON.stringify({
      title: 'Operation Midnight Echo',
      shortDescription: 'Uncover the hidden signal frequencies across the Loop.',
      missionPrompt: 'A broadcast has been detected. Decrypt the 4-digit security code.',
      heistType: 'community_code',
      difficulty: 'hard',
      category: 'cipher',
      targetSolution: 'NEXUS-77',
      endAt: futureEnd.toISOString(),
      clues: [
        { order: 1, clueText: 'The prefix rhymes with solar plexus.', hint: 'Begins with N', unlockParticipantThreshold: 0 },
        { order: 2, clueText: 'The suffix is a double lucky seven.', hint: 'Two identical digits', unlockParticipantThreshold: 2 }
      ]
    })
  });
  const createData = await createRes.json();
  assert(createRes.status === 201 && createData.success, 'Valid heist creation returns HTTP 201 Created');
  const heistId = createData.heist?._id;

  // 1.4 Target solution must NOT be exposed in public API response
  assert(!createData.heist.targetSolution, 'Heist creation payload strictly omits targetSolution');

  const detailRes = await fetch(`${baseUrl}/api/heists/${heistId}`, {
    headers: { Authorization: `Bearer ${token1}` }
  });
  const detailData = await detailRes.json();
  assert(detailRes.status === 200 && !detailData.heist.targetSolution, 'GET /api/heists/:id strictly omits targetSolution');
  assert(detailData.heist.isParticipant === true, 'Creator is automatically registered as participant');

  // 1.5 Clue masking based on participant threshold
  // Clue 2 requires 2 participants. Currently only 1 participant (agent1).
  const clue2 = detailData.heist.clues.find((c) => c.order === 2);
  assert(clue2 && clue2.isUnlocked === false, 'Clue 2 is locked before participant threshold is met');
  assert(clue2.clueText.includes('[ENCRYPTED SIGNAL'), 'Locked clue text is securely masked');

  // 1.6 Agent 2 Joins the Heist
  console.log('\n[SECTION 2] Feed Heist Participation & Concurrency');
  const joinRes = await fetch(`${baseUrl}/api/heists/${heistId}/join`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token2}` }
  });
  const joinData = await joinRes.json();
  assert(joinRes.status === 200 && joinData.success, 'Agent 2 successfully joins Feed Heist');
  assert(joinData.participantsCount === 2, 'Participant count atomically incremented to 2');

  // 1.7 Duplicate join prevention
  const dupJoinRes = await fetch(`${baseUrl}/api/heists/${heistId}/join`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token2}` }
  });
  assert(dupJoinRes.status === 400, 'Duplicate join by Agent 2 strictly rejected with HTTP 400');

  // 1.8 Verify Clue 2 unlocks after participant threshold met
  const detailResAfterJoin = await fetch(`${baseUrl}/api/heists/${heistId}`, {
    headers: { Authorization: `Bearer ${token2}` }
  });
  const detailDataAfterJoin = await detailResAfterJoin.json();
  const clue2After = detailDataAfterJoin.heist.clues.find((c) => c.order === 2);
  assert(clue2After && clue2After.isUnlocked === true, 'Clue 2 automatically unlocks once participant threshold of 2 is reached');

  // 1.9 Incorrect answer submission
  console.log('\n[SECTION 3] Solution Verification & Expiration Logic');
  const incorrectSubRes = await fetch(`${baseUrl}/api/heists/${heistId}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token2}`
    },
    body: JSON.stringify({ answer: 'WRONG-ANSWER' })
  });
  const incorrectData = await incorrectSubRes.json();
  assert(incorrectSubRes.status === 200 && incorrectData.isCorrect === false, 'Incorrect answer rejected with isCorrect: false');

  // 1.10 Correct answer submission (case & punctuation tolerant)
  const correctSubRes = await fetch(`${baseUrl}/api/heists/${heistId}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token2}`
    },
    body: JSON.stringify({
      answer: 'nexus-77',
      note: 'Decrypted through frequency modulation.'
    })
  });
  const correctData = await correctSubRes.json();
  assert(correctSubRes.status === 200 && correctData.isCorrect === true, 'Correct answer marks heist completed with isCorrect: true');

  // 1.11 Verify heist state is now completed in database
  const finalDetailRes = await fetch(`${baseUrl}/api/heists/${heistId}`, {
    headers: { Authorization: `Bearer ${token1}` }
  });
  const finalDetailData = await finalDetailRes.json();
  assert(finalDetailData.heist.status === 'completed', 'Heist status is updated to "completed" in MongoDB');
  assert(finalDetailData.heist.solvedBy?._id === agent2._id.toString(), 'Solver ID correctly references Agent 2');

  // 1.12 Server-side Expiration Check
  const pastHeist = new FeedHeist({
    title: 'Expired Legacy Mission',
    shortDescription: 'Old mission.',
    missionPrompt: 'Prompt',
    targetSolution: 'SECRET',
    creator: agent1._id,
    status: 'active',
    endAt: new Date(Date.now() - 10000), // In the past
    participants: [{ user: agent1._id, joinedAt: new Date() }],
    participantsCount: 1
  });
  await pastHeist.save();

  const expiredJoinRes = await fetch(`${baseUrl}/api/heists/${pastHeist._id}/join`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token2}` }
  });
  assert(expiredJoinRes.status === 400, 'Joining past-due heist strictly rejected due to server-side expiration');

  const expiredSubRes = await fetch(`${baseUrl}/api/heists/${pastHeist._id}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token1}`
    },
    body: JSON.stringify({ answer: 'SECRET' })
  });
  assert(expiredSubRes.status === 400, 'Submitting to past-due heist strictly rejected due to server-side expiration');

  // ====================================================================
  // SUITE 2: MOOD-ORBIT ROOMS
  // ====================================================================
  console.log('\n[SECTION 4] Mood-Orbit Rooms API & Validation');

  // 2.1 Unauthenticated requests are rejected
  const unauthRoomRes = await fetch(`${baseUrl}/api/mood-orbit`);
  assert(unauthRoomRes.status === 401, 'Unauthenticated GET /api/mood-orbit returns HTTP 401 Unauthorized');

  // 2.2 Rejects invalid mood category
  const invalidMoodRes = await fetch(`${baseUrl}/api/mood-orbit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token1}`
    },
    body: JSON.stringify({
      name: 'Bad Mood Room',
      mood: 'medical_depression',
      intention: 'Invalid intention'
    })
  });
  assert(invalidMoodRes.status === 400, 'Invalid/unauthorized mood category strictly rejected with HTTP 400');

  // 2.3 Create Valid Mood-Orbit Room (Creative)
  const createRoomRes = await fetch(`${baseUrl}/api/mood-orbit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token1}`
    },
    body: JSON.stringify({
      name: 'Midnight Design Lab',
      mood: 'creative',
      intention: 'Sharing concept sketches and typography explorations.',
      maxParticipants: 2,
      durationHours: 2
    })
  });
  const createRoomData = await createRoomRes.json();
  assert(createRoomRes.status === 201 && createRoomData.success, 'Valid Mood-Orbit room creation returns HTTP 201 Created');
  const roomId = createRoomData.room?._id;

  // 2.4 List rooms with mood filter
  const listRoomsRes = await fetch(`${baseUrl}/api/mood-orbit?mood=creative`, {
    headers: { Authorization: `Bearer ${token1}` }
  });
  const listRoomsData = await listRoomsRes.json();
  assert(listRoomsRes.status === 200 && listRoomsData.rooms.length >= 1, 'Filter by mood=creative returns active room');

  // 2.5 Agent 2 Joins Room
  console.log('\n[SECTION 5] Mood-Orbit Capacity & Room Concurrency');
  const joinRoomRes = await fetch(`${baseUrl}/api/mood-orbit/${roomId}/join`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token2}` }
  });
  assert(joinRoomRes.status === 200, 'Agent 2 successfully joins Mood-Orbit room');

  // 2.6 Capacity Enforcement: maxParticipants is 2, now full
  const [agent3] = await Promise.all([
    User.findOneAndUpdate(
      { email: 'agent3@looply.test' },
      {
        fullName: 'Agent Gamma',
        email: 'agent3@looply.test',
        passwordHash: 'dummy_hash',
        accountStatus: 'active',
        isEmailVerified: true,
        tokenVersion: 0
      },
      { upsert: true, returnDocument: 'after' }
    )
  ]);
  const token3 = generateToken({ userId: agent3._id.toString(), role: 'user', tokenVersion: 0 });

  const fullJoinRes = await fetch(`${baseUrl}/api/mood-orbit/${roomId}/join`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token3}` }
  });
  assert(fullJoinRes.status === 400, 'Third agent rejected when room reaches max capacity (2 participants)');

  // 2.7 Message posting by participant
  console.log('\n[SECTION 6] Mood-Orbit Conversation & Real-Time Presence');
  const postMsgRes = await fetch(`${baseUrl}/api/mood-orbit/${roomId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token1}`
    },
    body: JSON.stringify({ content: 'Welcome to the creative orbit.' })
  });
  const postMsgData = await postMsgRes.json();
  assert(postMsgRes.status === 201 && postMsgData.message.content === 'Welcome to the creative orbit.', 'Room participant successfully posts message');

  // 2.8 Non-participant blocked from posting
  const nonPartMsgRes = await fetch(`${baseUrl}/api/mood-orbit/${roomId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token3}`
    },
    body: JSON.stringify({ content: 'Intruder message' })
  });
  assert(nonPartMsgRes.status === 403, 'Non-participant blocked from posting to room with HTTP 403 Forbidden');

  // ====================================================================
  // SUITE 3: SOCKET.IO MOOD-ORBIT AUTHORIZATION
  // ====================================================================
  console.log('\n[SECTION 7] Socket.IO Mood-Orbit Room Authorization & Anti-Spoofing');

  // Connect socket for Agent 1 and Agent 3
  const socket1 = Client(baseUrl, {
    auth: { token: token1 },
    transports: ['websocket']
  });

  const socket3 = Client(baseUrl, {
    auth: { token: token3 },
    transports: ['websocket']
  });

  await Promise.all([
    new Promise((resolve) => socket1.on('connect', resolve)),
    new Promise((resolve) => socket3.on('connect', resolve))
  ]);

  // 3.1 Direct join_room bypassing forbidden
  let directJoinError = false;
  socket1.on('error', (err) => {
    if (err.message?.includes('Direct mood orbit room join forbidden')) {
      directJoinError = true;
    }
  });
  socket1.emit('join_room', `mood_orbit_${roomId}`);
  await new Promise((r) => setTimeout(r, 200));
  assert(directJoinError, 'Direct bypass via join_room strictly blocked by Socket server');

  // 3.2 mood_orbit:join works for valid room
  let agent1JoinedNotice = false;
  socket3.on('mood_orbit:user_joined', (data) => {
    if (data.roomId === roomId.toString()) {
      agent1JoinedNotice = true;
    }
  });

  // Socket 3 joins room to listen
  socket3.emit('mood_orbit:join', { roomId: roomId.toString() });
  await new Promise((r) => setTimeout(r, 600));

  socket1.emit('mood_orbit:join', { roomId: roomId.toString() });
  await new Promise((r) => setTimeout(r, 600));
  assert(agent1JoinedNotice, 'Legitimate socket joins and broadcasts mood_orbit:user_joined to subscribers');

  // 3.3 Real-time message reception
  let receivedRealtimeMessage = false;
  socket3.on('mood_orbit:new_message', (payload) => {
    if (payload.message?.content === 'Live atmospheric pulse.') {
      receivedRealtimeMessage = true;
    }
  });

  socket1.emit('mood_orbit:message', {
    roomId: roomId.toString(),
    content: 'Live atmospheric pulse.'
  });

  await new Promise((r) => setTimeout(r, 800));
  assert(receivedRealtimeMessage, 'Real-time mood_orbit:new_message broadcast and received over socket');

  // Clean up sockets
  socket1.disconnect();
  socket3.disconnect();

  // Clean up server
  await closeSocketServer();
  await new Promise((r) => server.close(r));
  await disconnectDatabase();

  console.log('\n================================================================');
  console.log(`SIGNATURE EXPERIENCES SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed with error:', err);
  process.exit(1);
});
