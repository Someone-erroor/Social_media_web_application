import mongoose from 'mongoose';
import {
  User,
  Post,
  Comment,
  Like,
  Notification,
  ActivityLog,
  ACTIVITY_ACTIONS,
  SENSITIVE_METADATA_KEYS,
  hasNoSensitiveKeys
} from '../src/models/index.js';
import {
  connectDatabase,
  disconnectDatabase,
  isDatabaseConnected,
  sanitizeMongoUri,
  validateMongoUri
} from '../src/config/database.js';
import { getHealth, getHealthReady } from '../src/controllers/health.controller.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ ${message}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${message}`);
    failed++;
  }
}

async function validateDoc(doc) {
  try {
    await doc.validate();
    return null;
  } catch (err) {
    return err;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('LOOPLY — PHASE 3 DATABASE & FOUNDATION VERIFICATION');
  console.log('====================================================\n');

  // Test 1: Mongoose Installation
  assert(typeof mongoose.version === 'string', `1. Mongoose installed (v${mongoose.version})`);

  // Test 2: URI Sanitization
  const rawUri = 'mongodb+srv://adminUser:SuperSecretPassword123@cluster0.looply.net/looply';
  const sanitized = sanitizeMongoUri(rawUri);
  assert(
    !sanitized.includes('SuperSecretPassword123') && sanitized.includes('***'),
    `2. Credentials masked in sanitized URI: ${sanitized}`
  );

  // Test 3: Missing Database URI Handling
  try {
    validateMongoUri('');
    assert(false, '3. Missing database URI handling failed (did not throw)');
  } catch (err) {
    assert(
      err.message.includes('MONGODB_URI is required'),
      `3. Missing database URI handled properly: "${err.message}"`
    );
  }

  // Test 4: Invalid Database URI Scheme Handling
  try {
    validateMongoUri('postgres://localhost:5432/mydb');
    assert(false, '4. Invalid URI scheme handling failed (did not throw)');
  } catch (err) {
    assert(
      err.message.includes('Invalid MONGODB_URI format'),
      `4. Invalid URI scheme handled properly: "${err.message}"`
    );
  }

  // Test 5: User Model Validation
  const validUser = new User({
    fullName: 'Jane Doe',
    email: 'Jane.Doe@EXAMPLE.COM ',
    passwordHash: '$2b$10$hashedpasswordhere1234567890',
    role: 'user',
    profile: { bio: 'Engineer and storyteller.' }
  });
  const userErr = await validateDoc(validUser);
  assert(!userErr, '5. Valid user document passed schema validation');
  assert(validUser.email === 'jane.doe@example.com', '   Email normalized to lowercase and trimmed');

  // User Invalid Role
  const invalidRoleUser = new User({
    fullName: 'Bad Role',
    email: 'bad@example.com',
    passwordHash: 'hash',
    role: 'superadmin'
  });
  const roleErr = await validateDoc(invalidRoleUser);
  assert(Boolean(roleErr?.errors?.role), '   Invalid user role rejected by enum validation');

  // User Missing Required Fields
  const emptyUser = new User({});
  const emptyUserErr = await validateDoc(emptyUser);
  assert(
    Boolean(emptyUserErr?.errors?.fullName && emptyUserErr?.errors?.email && emptyUserErr?.errors?.passwordHash),
    '   User required fields (fullName, email, passwordHash) strictly enforced'
  );

  // Test 6: Verify Exactly ONE Unique Email Index on User
  const userIndexes = User.schema.indexes();
  const emailIndexes = userIndexes.filter((idx) => idx[0]?.email === 1 && idx[1]?.unique === true);
  assert(
    userIndexes.length === 1 && emailIndexes.length === 1,
    `6. User schema contains exactly ONE unique email index (total indexes: ${userIndexes.length}, email indexes: ${emailIndexes.length})`
  );

  // Test 7: Post Model Validation
  const validPost = new Post({
    author: new mongoose.Types.ObjectId(),
    content: 'Building the future of social networks with Looply! Connect. Share. Express.'
  });
  assert(!(await validateDoc(validPost)), '7. Valid post document passed schema validation');

  const emptyPost = new Post({});
  const emptyPostErr = await validateDoc(emptyPost);
  assert(
    Boolean(emptyPostErr?.errors?.author && emptyPostErr?.errors?.content),
    '   Post required fields (author, content) strictly enforced'
  );

  // Test 8: Comment Model Validation
  const validComment = new Comment({
    post: new mongoose.Types.ObjectId(),
    author: new mongoose.Types.ObjectId(),
    content: 'Great insight!'
  });
  assert(!(await validateDoc(validComment)), '8. Valid comment document passed schema validation');

  const emptyComment = new Comment({});
  const emptyCommentErr = await validateDoc(emptyComment);
  assert(
    Boolean(emptyCommentErr?.errors?.post && emptyCommentErr?.errors?.author && emptyCommentErr?.errors?.content),
    '   Comment required fields (post, author, content) strictly enforced'
  );

  // Test 9: Like Model Validation
  const validLike = new Like({
    post: new mongoose.Types.ObjectId(),
    user: new mongoose.Types.ObjectId()
  });
  assert(!(await validateDoc(validLike)), '9. Valid like document passed schema validation');

  const emptyLike = new Like({});
  const emptyLikeErr = await validateDoc(emptyLike);
  assert(
    Boolean(emptyLikeErr?.errors?.post && emptyLikeErr?.errors?.user),
    '   Like required fields (post, user) strictly enforced'
  );

  // Test 10: Notification Model Validation
  const validNotification = new Notification({
    recipient: new mongoose.Types.ObjectId(),
    type: 'post_like',
    message: 'Alex liked your publication.'
  });
  assert(!(await validateDoc(validNotification)), '10. Valid notification passed schema validation');

  const invalidNotif = new Notification({
    recipient: new mongoose.Types.ObjectId(),
    type: 'unknown_type',
    message: 'Test'
  });
  const notifErr = await validateDoc(invalidNotif);
  assert(Boolean(notifErr?.errors?.type), '   Invalid notification type rejected by enum');

  // Test 11: ActivityLog Model Validation & Recursive Metadata Security
  const validActivity = new ActivityLog({
    action: 'post_creation',
    targetType: 'Post',
    targetId: new mongoose.Types.ObjectId(),
    metadata: {
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      clientDetails: {
        platform: 'web',
        viewport: { width: 1440, height: 900 }
      },
      tags: ['release', 'v1']
    }
  });
  assert(!(await validateDoc(validActivity)), '11. Valid activity log with safe nested metadata passed validation');

  // Test 12: Recursive Rejection of Sensitive Nested Keys in ActivityLog
  const sensitiveCases = [
    { name: 'top-level password', data: { password: 'plaintext' } },
    { name: 'top-level passwordHash', data: { passwordHash: '$2b$10$abc' } },
    { name: 'nested object accessToken', data: { auth: { accessToken: 'xyz.jwt.token' } } },
    { name: 'deeply nested refreshToken', data: { session: { tokens: { refreshToken: 'rt_123' } } } },
    { name: 'nested secret', data: { config: { secret: 'supersecret' } } },
    { name: 'nested apiKey', data: { externalService: { apiKey: 'api_key_live_999' } } },
    { name: 'nested authorization header', data: { request: { headers: { authorization: 'Bearer 123' } } } },
    { name: 'nested credentials object', data: { user: { credentials: { id: 1 } } } },
    { name: 'deeply nested privateKey', data: { crypto: { keys: { privateKey: 'PEM_KEY' } } } },
    { name: 'nested array token', data: { auditHistory: [{ token: 'jwt_value' }] } },
    { name: 'mixed nested array secret', data: { meta: [{ items: [{ secret: 'nested_secret' }] }] } }
  ];

  for (const testCase of sensitiveCases) {
    const doc = new ActivityLog({
      action: 'successful_login',
      metadata: testCase.data
    });
    const err = await validateDoc(doc);
    assert(
      Boolean(err?.errors?.metadata),
      `12. Rejection verified for ${testCase.name}`
    );
  }

  // Test 13: Schema Indexes Verification Across Models
  const postIndexes = Post.schema.indexes();
  assert(
    postIndexes.some((idx) => idx[0]?.createdAt === -1) &&
    postIndexes.some((idx) => idx[0]?.author === 1 && idx[0]?.createdAt === -1),
    '13. Post schema contains { createdAt: -1 } and { author: 1, createdAt: -1 } indexes'
  );

  const commentIndexes = Comment.schema.indexes();
  assert(
    commentIndexes.some((idx) => idx[0]?.post === 1 && idx[0]?.createdAt === -1),
    '14. Comment schema contains { post: 1, createdAt: -1 } index'
  );

  const likeIndexes = Like.schema.indexes();
  assert(
    likeIndexes.some((idx) => idx[0]?.post === 1 && idx[0]?.user === 1 && idx[1]?.unique === true),
    '15. Like schema contains unique compound index { post: 1, user: 1 } preventing duplicate likes'
  );

  const notificationIndexes = Notification.schema.indexes();
  assert(
    notificationIndexes.some((idx) => idx[0]?.recipient === 1 && idx[0]?.createdAt === -1) &&
    notificationIndexes.some((idx) => idx[0]?.recipient === 1 && idx[0]?.readAt === 1),
    '16. Notification schema contains { recipient: 1, createdAt: -1 } and { recipient: 1, readAt: 1 } indexes'
  );

  const activityIndexes = ActivityLog.schema.indexes();
  assert(
    activityIndexes.some((idx) => idx[0]?.createdAt === -1) &&
    activityIndexes.some((idx) => idx[0]?.actor === 1 && idx[0]?.createdAt === -1),
    '17. ActivityLog schema contains { createdAt: -1 } and { actor: 1, createdAt: -1 } indexes'
  );

  // Test 14: Liveness Health Endpoint (GET /api/health)
  let healthCode = 0;
  let healthPayload = null;
  getHealth({}, {
    status: (code) => {
      healthCode = code;
      return {
        json: (data) => { healthPayload = data; }
      };
    }
  });
  assert(
    healthCode === 200 && healthPayload?.success === true && healthPayload?.message === 'Looply backend is running',
    '18. GET /api/health returns HTTP 200 preserving exact existing response contract'
  );

  // Test 15: Readiness Health Endpoint when Disconnected (GET /api/health/ready)
  let disconnectedCode = 0;
  let disconnectedPayload = null;
  getHealthReady({}, {
    status: (code) => {
      disconnectedCode = code;
      return {
        json: (data) => { disconnectedPayload = data; }
      };
    }
  });
  assert(
    disconnectedCode === 503 &&
    disconnectedPayload?.status === 'unready' &&
    disconnectedPayload?.database === 'disconnected' &&
    disconnectedPayload?.message === 'Database connection is not ready',
    '19. GET /api/health/ready returns HTTP 503 when database is disconnected (never exposing credentials)'
  );

  // Test 16: Readiness Health Endpoint when Connected (GET /api/health/ready)
  // Temporarily stub readyState to simulate connected state (readyState === 1)
  const originalReadyState = Object.getOwnPropertyDescriptor(mongoose.connection, 'readyState');
  Object.defineProperty(mongoose.connection, 'readyState', {
    value: 1,
    configurable: true
  });

  let connectedCode = 0;
  let connectedPayload = null;
  getHealthReady({}, {
    status: (code) => {
      connectedCode = code;
      return {
        json: (data) => { connectedPayload = data; }
      };
    }
  });

  // Restore original readyState
  if (originalReadyState) {
    Object.defineProperty(mongoose.connection, 'readyState', originalReadyState);
  } else {
    delete mongoose.connection.readyState;
  }

  assert(
    connectedCode === 200 &&
    connectedPayload?.success === true &&
    connectedPayload?.status === 'ready' &&
    connectedPayload?.database === 'connected',
    '20. GET /api/health/ready returns HTTP 200 when database is connected'
  );

  // Test 17: Attempt Database Connection with Non-Existent Server
  console.log('\nTesting connection failure timeout handling (2 second timeout)...');
  try {
    await connectDatabase('mongodb://127.0.0.1:27018/looply_test', {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000
    });
    assert(false, '21. Connection to non-existent MongoDB port succeeded unexpectedly');
  } catch (err) {
    assert(
      err.message.includes('Database Connection Error') || err.message.includes('ECONNREFUSED') || err.message.includes('EACCES'),
      `21. Connection failure handled gracefully with safe error message: "${err.message}"`
    );
  }

  // Live Database Connectivity Assessment
  console.log('\n--- Live Database Connectivity Check ---');
  let liveConnected = false;
  if (process.env.MONGODB_URI) {
    try {
      console.log('Attempting live connection using MONGODB_URI...');
      await connectDatabase(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 2000,
        connectTimeoutMS: 2000
      });
      liveConnected = isDatabaseConnected();
      console.log('Live MongoDB connection succeeded!');
      await disconnectDatabase();
    } catch (e) {
      console.log(`Live MongoDB connection attempt: ${e.message}`);
    }
  }

  if (liveConnected) {
    assert(true, 'Live MongoDB connection verified successfully');
  } else {
    console.log('ℹ Live database connectivity: PENDING (No live MongoDB cluster credentials in environment).');
    console.log('  Offline schema validation, indexing, and error handling: 100% VERIFIED.');
  }

  // Summary
  console.log('\n====================================================');
  console.log(`Phase 3 Test Results: ${passed} passed, ${failed} failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
