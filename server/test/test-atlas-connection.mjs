import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { connectDatabase, disconnectDatabase, isDatabaseConnected, sanitizeMongoUri } from '../src/config/database.js';
import { User, Post, Comment, Like, Notification, ActivityLog } from '../src/models/index.js';
import app from '../src/app.js';

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

async function testAtlas() {
  console.log('====================================================');
  console.log('LOOPLY — MONGODB ATLAS LIVE CONNECTION VERIFICATION');
  console.log('====================================================\n');

  // Task 2: Verify MONGODB_URI is correctly loaded
  assert(Boolean(env.MONGODB_URI), '1. MONGODB_URI is successfully loaded from server/.env');
  const sanitized = sanitizeMongoUri(env.MONGODB_URI);
  const passwordMatch = env.MONGODB_URI.match(/\/\/.*?:(.*?)@/);
  const detectedPassword = passwordMatch ? passwordMatch[1] : null;
  assert(
    detectedPassword ? !sanitized.includes(detectedPassword) && sanitized.includes('***') : sanitized.includes('***'),
    `2. Credentials securely masked in sanitized URI: ${sanitized}`
  );
  assert(
    sanitized.includes('cluster0.vtydaeh.mongodb.net') && sanitized.includes('ravikishan76768_db_user'),
    '3. Hostname and username match requested MongoDB Atlas configuration'
  );

  // Task 3 & 4: Connect using existing Mongoose configuration & verify actual connection
  console.log('\n--- Connecting to MongoDB Atlas ---');
  let startTime = Date.now();
  try {
    await connectDatabase();
    const connectDuration = Date.now() - startTime;
    assert(isDatabaseConnected(), `4. Successfully connected to MongoDB Atlas in ${connectDuration}ms`);
  } catch (err) {
    assert(false, `4. Connection to MongoDB Atlas failed: ${err.message}`);
    console.error('\nStopping verification due to connection failure.');
    process.exit(1);
  }

  // Task 5: Execute MongoDB ping command
  console.log('\n--- Executing MongoDB Ping Command ---');
  try {
    const pingResult = await mongoose.connection.db.admin().ping();
    assert(
      pingResult && pingResult.ok === 1,
      `5. MongoDB admin ping command executed successfully (result: ${JSON.stringify(pingResult)})`
    );
  } catch (err) {
    assert(false, `5. MongoDB admin ping failed: ${err.message}`);
  }

  // Verify connected database name
  const currentDbName = mongoose.connection.name;
  assert(
    currentDbName === 'looply',
    `6. Connected to intended database: "${currentDbName}"`
  );

  // Task 9: Verify all six Mongoose models
  console.log('\n--- Verifying All Six Mongoose Models ---');
  const models = [
    { name: 'User', model: User },
    { name: 'Post', model: Post },
    { name: 'Comment', model: Comment },
    { name: 'Like', model: Like },
    { name: 'Notification', model: Notification },
    { name: 'ActivityLog', model: ActivityLog }
  ];

  for (const { name, model } of models) {
    assert(
      Boolean(model && model.schema),
      `7. Mongoose model "${name}" is properly compiled and registered`
    );
  }

  // Task 10: Verify database indexes
  console.log('\n--- Verifying Database Indexes across Schemas ---');
  const userIndexes = User.schema.indexes();
  const emailIndexes = userIndexes.filter((idx) => idx[0]?.email === 1 && idx[1]?.unique === true);
  assert(
    emailIndexes.length === 1 && userIndexes.length === 1,
    '8. User model has exactly ONE unique index on email'
  );

  const postIndexes = Post.schema.indexes();
  const hasFeedIndex = postIndexes.some((idx) => idx[0]?.createdAt === -1);
  const hasAuthorTimelineIndex = postIndexes.some((idx) => idx[0]?.author === 1 && idx[0]?.createdAt === -1);
  assert(
    hasFeedIndex && hasAuthorTimelineIndex,
    '9. Post model has { createdAt: -1 } and { author: 1, createdAt: -1 } indexes'
  );

  const commentIndexes = Comment.schema.indexes();
  const hasCommentPostIndex = commentIndexes.some((idx) => idx[0]?.post === 1 && idx[0]?.createdAt === -1);
  assert(
    hasCommentPostIndex,
    '10. Comment model has { post: 1, createdAt: -1 } index'
  );

  const likeIndexes = Like.schema.indexes();
  const hasLikeCompoundUnique = likeIndexes.some((idx) => idx[0]?.post === 1 && idx[0]?.user === 1 && idx[1]?.unique === true);
  assert(
    hasLikeCompoundUnique,
    '11. Like model has unique compound index on { post: 1, user: 1 }'
  );

  const notificationIndexes = Notification.schema.indexes();
  const hasNotifRecipientIndex = notificationIndexes.some((idx) => idx[0]?.recipient === 1 && idx[0]?.createdAt === -1);
  const hasNotifUnreadIndex = notificationIndexes.some((idx) => idx[0]?.recipient === 1 && idx[0]?.readAt === 1);
  assert(
    hasNotifRecipientIndex && hasNotifUnreadIndex,
    '12. Notification model has { recipient: 1, createdAt: -1 } and { recipient: 1, readAt: 1 } indexes'
  );

  const activityIndexes = ActivityLog.schema.indexes();
  const hasActivityCreatedIndex = activityIndexes.some((idx) => idx[0]?.createdAt === -1);
  const hasActivityActorIndex = activityIndexes.some((idx) => idx[0]?.actor === 1 && idx[0]?.createdAt === -1);
  assert(
    hasActivityCreatedIndex && hasActivityActorIndex,
    '13. ActivityLog model has { createdAt: -1 } and { actor: 1, createdAt: -1 } indexes'
  );

  // Sync / create indexes in Atlas without dropping existing collections
  try {
    await Promise.all([
      User.createIndexes(),
      Post.createIndexes(),
      Comment.createIndexes(),
      Like.createIndexes(),
      Notification.createIndexes(),
      ActivityLog.createIndexes()
    ]);
    assert(true, '14. Mongoose schema indexes successfully synchronized in MongoDB Atlas');
  } catch (idxErr) {
    assert(false, `14. Index synchronization in MongoDB Atlas encountered an error: ${idxErr.message}`);
  }

  // Task 6, 7 & 8: Verify HTTP Health & Readiness Endpoints
  console.log('\n--- Testing Health & Readiness Probes (HTTP) ---');
  const server = app.listen(0);
  const serverPort = server.address().port;

  try {
    // Test 7: GET /api/health
    const healthRes = await fetch(`http://127.0.0.1:${serverPort}/api/health`);
    const healthJson = await healthRes.json();
    assert(
      healthRes.status === 200 && healthJson.success === true && healthJson.message === 'Looply backend is running',
      `15. GET /api/health returned HTTP 200 with expected response contract: ${JSON.stringify(healthJson)}`
    );

    // Test 8: GET /api/health/ready (connected)
    const readyRes = await fetch(`http://127.0.0.1:${serverPort}/api/health/ready`);
    const readyJson = await readyRes.json();
    assert(
      readyRes.status === 200 && readyJson.success === true && readyJson.status === 'ready' && readyJson.database === 'connected',
      `16. GET /api/health/ready returned HTTP 200 when Atlas is connected: ${JSON.stringify(readyJson)}`
    );
  } finally {
    server.close();
  }

  // Task 12: Preserve graceful shutdown functionality
  console.log('\n--- Testing Graceful Disconnection ---');
  await disconnectDatabase();
  assert(
    !isDatabaseConnected(),
    '17. Graceful disconnect successfully closed MongoDB Atlas connection'
  );

  // Test GET /api/health/ready when disconnected
  const disconnectedServer = app.listen(0);
  const disconnectedPort = disconnectedServer.address().port;
  try {
    const unreadyRes = await fetch(`http://127.0.0.1:${disconnectedPort}/api/health/ready`);
    const unreadyJson = await unreadyRes.json();
    assert(
      unreadyRes.status === 503 && unreadyJson.success === false && unreadyJson.status === 'unready' && unreadyJson.database === 'disconnected',
      `18. GET /api/health/ready returned HTTP 503 when disconnected: ${JSON.stringify(unreadyJson)}`
    );
  } finally {
    disconnectedServer.close();
  }

  console.log('\n====================================================');
  console.log(`Live Atlas Verification Results: ${passed} passed, ${failed} failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

testAtlas().catch((err) => {
  console.error('[Fatal Error]', err);
  process.exit(1);
});
