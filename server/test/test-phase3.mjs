import mongoose from 'mongoose';
import {
  User,
  Post,
  Comment,
  Like,
  Notification,
  ActivityLog,
  ACTIVITY_ACTIONS
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

  // Test 4: Invalid Database URI Handling
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

  // Test 6: Post Model Validation
  const validPost = new Post({
    author: new mongoose.Types.ObjectId(),
    content: 'Building the future of social networks with Looply! Connect. Share. Express.'
  });
  assert(!(await validateDoc(validPost)), '6. Valid post document passed schema validation');

  const emptyPost = new Post({});
  const emptyPostErr = await validateDoc(emptyPost);
  assert(
    Boolean(emptyPostErr?.errors?.author && emptyPostErr?.errors?.content),
    '   Post required fields (author, content) strictly enforced'
  );

  // Test 7: Comment Model Validation
  const validComment = new Comment({
    post: new mongoose.Types.ObjectId(),
    author: new mongoose.Types.ObjectId(),
    content: 'Great insight!'
  });
  assert(!(await validateDoc(validComment)), '7. Valid comment document passed schema validation');

  const emptyComment = new Comment({});
  const emptyCommentErr = await validateDoc(emptyComment);
  assert(
    Boolean(emptyCommentErr?.errors?.post && emptyCommentErr?.errors?.author && emptyCommentErr?.errors?.content),
    '   Comment required fields (post, author, content) strictly enforced'
  );

  // Test 8: Like Model Validation
  const validLike = new Like({
    post: new mongoose.Types.ObjectId(),
    user: new mongoose.Types.ObjectId()
  });
  assert(!(await validateDoc(validLike)), '8. Valid like document passed schema validation');

  const emptyLike = new Like({});
  const emptyLikeErr = await validateDoc(emptyLike);
  assert(
    Boolean(emptyLikeErr?.errors?.post && emptyLikeErr?.errors?.user),
    '   Like required fields (post, user) strictly enforced'
  );

  // Test 9: Notification Model Validation
  const validNotification = new Notification({
    recipient: new mongoose.Types.ObjectId(),
    type: 'post_like',
    message: 'Alex liked your publication.'
  });
  assert(!(await validateDoc(validNotification)), '9. Valid notification passed schema validation');

  const invalidNotif = new Notification({
    recipient: new mongoose.Types.ObjectId(),
    type: 'unknown_type',
    message: 'Test'
  });
  const notifErr = await validateDoc(invalidNotif);
  assert(Boolean(notifErr?.errors?.type), '   Invalid notification type rejected by enum');

  // Test 10: ActivityLog Model Validation
  const validActivity = new ActivityLog({
    action: 'post_creation',
    targetType: 'Post',
    targetId: new mongoose.Types.ObjectId(),
    metadata: { ip: '127.0.0.1' }
  });
  assert(!(await validateDoc(validActivity)), '10. Valid activity log passed schema validation');

  // Sensitive metadata rejection
  const sensitiveActivity = new ActivityLog({
    action: 'successful_login',
    metadata: { password: 'PlainTextPassword123' }
  });
  const sensitiveErr = await validateDoc(sensitiveActivity);
  assert(
    Boolean(sensitiveErr?.errors?.metadata),
    '   Sensitive credentials (password) rejected from ActivityLog metadata'
  );

  // Test 11: Schema Indexes Verification
  const userIndexes = User.schema.indexes();
  assert(
    userIndexes.some((idx) => idx[0]?.email === 1 && idx[1]?.unique === true),
    '11. User schema contains unique email index'
  );

  const postIndexes = Post.schema.indexes();
  assert(
    postIndexes.some((idx) => idx[0]?.createdAt === -1) &&
    postIndexes.some((idx) => idx[0]?.author === 1 && idx[0]?.createdAt === -1),
    '12. Post schema contains { createdAt: -1 } and { author: 1, createdAt: -1 } indexes'
  );

  const commentIndexes = Comment.schema.indexes();
  assert(
    commentIndexes.some((idx) => idx[0]?.post === 1 && idx[0]?.createdAt === -1),
    '13. Comment schema contains { post: 1, createdAt: -1 } index'
  );

  const likeIndexes = Like.schema.indexes();
  assert(
    likeIndexes.some((idx) => idx[0]?.post === 1 && idx[0]?.user === 1 && idx[1]?.unique === true),
    '14. Like schema contains unique compound index { post: 1, user: 1 } preventing duplicate likes'
  );

  const notificationIndexes = Notification.schema.indexes();
  assert(
    notificationIndexes.some((idx) => idx[0]?.recipient === 1 && idx[0]?.createdAt === -1) &&
    notificationIndexes.some((idx) => idx[0]?.recipient === 1 && idx[0]?.readAt === 1),
    '15. Notification schema contains { recipient: 1, createdAt: -1 } and { recipient: 1, readAt: 1 } indexes'
  );

  const activityIndexes = ActivityLog.schema.indexes();
  assert(
    activityIndexes.some((idx) => idx[0]?.createdAt === -1) &&
    activityIndexes.some((idx) => idx[0]?.actor === 1 && idx[0]?.createdAt === -1),
    '16. ActivityLog schema contains { createdAt: -1 } and { actor: 1, createdAt: -1 } indexes'
  );

  // Test 12: Health Endpoints Contract
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
    '17. GET /api/health returned HTTP 200 preserving exact existing response contract'
  );

  let readyCode = 0;
  let readyPayload = null;
  getHealthReady({}, {
    status: (code) => {
      readyCode = code;
      return {
        json: (data) => { readyPayload = data; }
      };
    }
  });
  assert(
    readyCode === 503 && readyPayload?.status === 'unready' && readyPayload?.database === 'disconnected',
    '18. GET /api/health/ready returned HTTP 503 when database is disconnected (never exposing credentials)'
  );

  // Test 13: Attempt Database Connection with Non-Existent Server
  console.log('\nTesting connection failure timeout handling (2 second timeout)...');
  try {
    await connectDatabase('mongodb://127.0.0.1:27018/looply_test', {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000
    });
    assert(false, '19. Connection to non-existent MongoDB port succeeded unexpectedly');
  } catch (err) {
    assert(
      err.message.includes('Database Connection Error') || err.message.includes('ECONNREFUSED'),
      `19. Connection failure handled gracefully with safe error message: "${err.message}"`
    );
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
