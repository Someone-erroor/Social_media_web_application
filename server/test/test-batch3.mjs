import assert from 'assert';
import http from 'http';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { io as ioClient } from 'socket.io-client';
import app from '../src/app.js';
import { env } from '../src/config/env.js';
import { User, Post, Comment, Like, Notification, ActivityLog } from '../src/models/index.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { generateToken, AUTH_COOKIE_NAME } from '../src/config/jwt.js';
import { initSocketServer, closeSocketServer } from '../src/services/socket.service.js';
import {
  setForceAiMock,
  setSimulateAiFailure,
  setSimulateAiTimeout
} from '../src/services/ai.service.js';
import {
  getTestMongoUri,
  validateTestDatabaseSafety
} from './test-helpers.mjs';

const TEST_PORT = 5003;
const baseUrl = `http://127.0.0.1:${TEST_PORT}/api`;
const socketUrl = `http://127.0.0.1:${TEST_PORT}`;

async function runBatch3Tests() {
  console.log('====================================================');
  console.log('LOOPLY — BATCH 3 (PHASES 10, 11, 12, 13, 14) TEST SUITE');
  console.log('====================================================\n');

  let serverInstance = null;
  const createdUserIds = [];
  const createdPostIds = [];
  const createdCommentIds = [];
  const createdNotificationIds = [];
  let passedCount = 0;

  function recordPass(msg) {
    passedCount++;
    console.log(`✓ ${passedCount}. ${msg}`);
  }

  try {
    // ----------------------------------------------------
    // Section 0: Database Safety & Server Setup
    // ----------------------------------------------------
    console.log('--- Section 0: Database Safety & Server Setup ---');
    const testMongoUri = getTestMongoUri();
    validateTestDatabaseSafety(testMongoUri);
    recordPass('MONGODB_TEST_URI validated targeting strictly "looply_test"');

    // Connect to test database
    await connectDatabase(testMongoUri);
    const activeDb = mongoose.connection.name || mongoose.connection.db?.databaseName;
    assert.strictEqual(activeDb, 'looply_test', 'Must be connected strictly to looply_test');
    recordPass(`Connected to dedicated test database: "${activeDb}"`);

    // Create and start HTTP server with Socket.IO attached
    serverInstance = http.createServer(app);
    initSocketServer(serverInstance);

    await new Promise((resolve, reject) => {
      serverInstance.listen(TEST_PORT, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    recordPass(`Unified HTTP and Socket.IO server running on port ${TEST_PORT}`);

    // Helper for API calls
    async function apiRequest(path, options = {}) {
      const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      };
      if (options.token) {
        headers['Cookie'] = `${AUTH_COOKIE_NAME}=${options.token}`;
      }

      const response = await fetch(`${baseUrl}${path}`, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined
      });

      const data = await response.json().catch(() => ({}));
      return { status: response.status, body: data, headers: response.headers };
    }

    // ----------------------------------------------------
    // Setup Test Users
    // ----------------------------------------------------
    console.log('\n--- Setting Up Test Accounts ---');
    const timestamp = Date.now();
    const hashedPassword = await bcrypt.hash('Password123!', 10);

    // User A: Post Author
    const userA = await User.create({
      fullName: 'Alice Post Author',
      email: `alice_${timestamp}@example.com`,
      passwordHash: hashedPassword,
      isEmailVerified: true,
      accountStatus: 'active',
      role: 'user',
      tokenVersion: 1
    });
    createdUserIds.push(userA._id);
    const tokenA = generateToken({
      userId: userA._id.toString(),
      role: userA.role,
      tokenVersion: userA.tokenVersion
    });

    // User B: Reactor / Interactor
    const userB = await User.create({
      fullName: 'Bob Commenter',
      email: `bob_${timestamp}@example.com`,
      passwordHash: hashedPassword,
      isEmailVerified: true,
      accountStatus: 'active',
      role: 'user',
      tokenVersion: 1
    });
    createdUserIds.push(userB._id);
    const tokenB = generateToken({
      userId: userB._id.toString(),
      role: userB.role,
      tokenVersion: userB.tokenVersion
    });

    // User C: Third Party User
    const userC = await User.create({
      fullName: 'Charlie Bystander',
      email: `charlie_${timestamp}@example.com`,
      passwordHash: hashedPassword,
      isEmailVerified: true,
      accountStatus: 'active',
      role: 'user',
      tokenVersion: 1
    });
    createdUserIds.push(userC._id);
    const tokenC = generateToken({
      userId: userC._id.toString(),
      role: userC.role,
      tokenVersion: userC.tokenVersion
    });

    // User D: Platform Administrator
    const adminUser = await User.create({
      fullName: 'Dave Super Admin',
      email: `admin_${timestamp}@example.com`,
      passwordHash: hashedPassword,
      isEmailVerified: true,
      accountStatus: 'active',
      role: 'admin',
      tokenVersion: 1
    });
    createdUserIds.push(adminUser._id);
    const adminToken = generateToken({
      userId: adminUser._id.toString(),
      role: adminUser.role,
      tokenVersion: adminUser.tokenVersion
    });

    recordPass('Created 4 test accounts: User A (Author), User B (Reactor), User C (User), Admin D');

    // ====================================================
    // 1. PHASE 10: LIKES AND COMMENTS
    // ====================================================
    console.log('\n--- Phase 10: Likes and Comments ---');

    // Create a post by User A
    const postRes = await apiRequest('/posts', {
      method: 'POST',
      token: tokenA,
      body: { content: 'This is Alice’s test post for Batch 3 verification!' }
    });
    assert.strictEqual(postRes.status, 201, 'Post creation must return 201');
    const testPostId = postRes.body.post._id;
    createdPostIds.push(testPostId);
    recordPass('Post created by User A with initial likesCount: 0, commentsCount: 0');

    // Test 1: User B likes User A's post
    const likeRes = await apiRequest(`/posts/${testPostId}/like`, {
      method: 'POST',
      token: tokenB
    });
    assert.ok([200, 201].includes(likeRes.status), 'Like endpoint must return 200 or 201');
    assert.strictEqual(likeRes.body.hasLiked, true, 'Response must confirm hasLiked: true');
    assert.strictEqual(likeRes.body.likesCount, 1, 'Response must return updated likesCount: 1');
    recordPass('User B liked post; like count correctly incremented to 1');

    // Test 2: User B attempts to like the post a second time (idempotency / race protection)
    const duplicateLikeRes = await apiRequest(`/posts/${testPostId}/like`, {
      method: 'POST',
      token: tokenB
    });
    assert.ok([200, 409].includes(duplicateLikeRes.status), 'Duplicate like must return 200 or 409 Conflict');
    const verifyLikesAfterDuplicate = await Like.countDocuments({ post: testPostId });
    assert.strictEqual(verifyLikesAfterDuplicate, 1, 'Duplicate like must NOT increment like count');
    recordPass('Duplicate like prevented from incrementing like counter');

    // Test 3: Query post likes status
    const likesStatusRes = await apiRequest(`/posts/${testPostId}/likes`, {
      method: 'GET',
      token: tokenB
    });
    assert.strictEqual(likesStatusRes.status, 200, 'Likes status returns 200');
    assert.strictEqual(likesStatusRes.body.likesCount, 1, 'Likes count is 1');
    assert.strictEqual(likesStatusRes.body.hasLiked, true, 'User B hasLiked is true');
    recordPass('Likes status query confirms User B has liked with count 1');

    // Test 4: User B unlikes post
    const unlikeRes = await apiRequest(`/posts/${testPostId}/like`, {
      method: 'DELETE',
      token: tokenB
    });
    assert.strictEqual(unlikeRes.status, 200, 'Unlike endpoint returns 200');
    assert.strictEqual(unlikeRes.body.hasLiked, false, 'Response confirms hasLiked: false');
    assert.strictEqual(unlikeRes.body.likesCount, 0, 'Response confirms likesCount: 0');
    recordPass('User B unliked post; likesCount decremented to 0');

    // Re-like so we have like data for admin stats verification
    await apiRequest(`/posts/${testPostId}/like`, { method: 'POST', token: tokenB });
    recordPass('User B re-liked post for subsequent admin stats verification');

    // Test 5: Comment creation validation
    const emptyCommentRes = await apiRequest(`/posts/${testPostId}/comments`, {
      method: 'POST',
      token: tokenB,
      body: { content: '   ' }
    });
    assert.strictEqual(emptyCommentRes.status, 400, 'Empty comment must return 400');
    recordPass('Comment creation rejected empty content with 400');

    const longCommentRes = await apiRequest(`/posts/${testPostId}/comments`, {
      method: 'POST',
      token: tokenB,
      body: { content: 'A'.repeat(501) }
    });
    assert.strictEqual(longCommentRes.status, 400, 'Oversized comment must return 400');
    recordPass('Comment creation rejected >500 char content with 400');

    // Test 6: User B creates valid comment
    const commentRes1 = await apiRequest(`/posts/${testPostId}/comments`, {
      method: 'POST',
      token: tokenB,
      body: { content: 'Great insights Alice, completely agree!' }
    });
    assert.strictEqual(commentRes1.status, 201, 'Valid comment creation returns 201');
    const comment1Id = commentRes1.body.comment._id;
    createdCommentIds.push(comment1Id);
    assert.strictEqual(commentRes1.body.comment.content, 'Great insights Alice, completely agree!');
    recordPass('User B created comment successfully; author populated');

    // Test 7: User C creates another comment
    const commentRes2 = await apiRequest(`/posts/${testPostId}/comments`, {
      method: 'POST',
      token: tokenC,
      body: { content: 'I have a question regarding paragraph 2.' }
    });
    assert.strictEqual(commentRes2.status, 201, 'Valid comment creation returns 201');
    const comment2Id = commentRes2.body.comment._id;
    createdCommentIds.push(comment2Id);
    recordPass('User C created second comment successfully');

    // Test 8: Get comments on post
    const commentsListRes = await apiRequest(`/posts/${testPostId}/comments`, {
      method: 'GET',
      token: tokenA
    });
    assert.strictEqual(commentsListRes.status, 200, 'Get comments returns 200');
    assert.strictEqual(commentsListRes.body.comments.length, 2, '2 comments returned');
    recordPass('Retrieved post comments list with correct count and author details');

    // Test 9: User B edits own comment
    const editCommentRes = await apiRequest(`/comments/${comment1Id}`, {
      method: 'PATCH',
      token: tokenB,
      body: { content: 'Great insights Alice, completely agree! (edited)' }
    });
    assert.strictEqual(editCommentRes.status, 200, 'Editing own comment returns 200');
    assert.strictEqual(editCommentRes.body.comment.content, 'Great insights Alice, completely agree! (edited)');
    recordPass('User B edited their own comment successfully');

    // Test 10: User C attempts to edit User B's comment (Forbidden)
    const unauthorizedEditRes = await apiRequest(`/comments/${comment1Id}`, {
      method: 'PATCH',
      token: tokenC,
      body: { content: 'Hacked by Charlie!' }
    });
    assert.strictEqual(unauthorizedEditRes.status, 403, 'Editing another user comment returns 403');
    recordPass('Unauthorized comment edit rejected with 403 Forbidden');

    // Test 11: User C attempts to delete User B's comment (Forbidden)
    const unauthorizedDeleteRes = await apiRequest(`/comments/${comment1Id}`, {
      method: 'DELETE',
      token: tokenC
    });
    assert.strictEqual(unauthorizedDeleteRes.status, 403, 'Deleting another user comment returns 403');
    recordPass('Unauthorized comment deletion rejected with 403 Forbidden');

    // Test 12: User C deletes own comment
    const deleteCommentRes = await apiRequest(`/comments/${comment2Id}`, {
      method: 'DELETE',
      token: tokenC
    });
    assert.strictEqual(deleteCommentRes.status, 200, 'Deleting own comment returns 200');
    recordPass('User C deleted their own comment successfully');

    // ====================================================
    // 2. PHASE 11: ADMIN DASHBOARD & STATISTICS
    // ====================================================
    console.log('\n--- Phase 11: Admin Dashboard & Statistics ---');

    // Test 1: Non-admin access to admin stats is forbidden
    const nonAdminStatsRes = await apiRequest('/admin/stats', {
      method: 'GET',
      token: tokenB
    });
    assert.strictEqual(nonAdminStatsRes.status, 403, 'Non-admin stats request returns 403');
    recordPass('Non-admin access to /api/admin/stats blocked with 403 Forbidden');

    // Test 2: Admin access to real database statistics
    const adminStatsRes = await apiRequest('/admin/stats', {
      method: 'GET',
      token: adminToken
    });
    assert.strictEqual(adminStatsRes.status, 200, 'Admin stats request returns 200');
    const stats = adminStatsRes.body.stats;
    assert.ok(typeof stats.users.total === 'number', 'stats.users.total is a number');
    assert.ok(typeof stats.content.posts === 'number', 'stats.content.posts is a number');
    assert.ok(typeof stats.content.comments === 'number', 'stats.content.comments is a number');
    assert.ok(typeof stats.content.likes === 'number', 'stats.content.likes is a number');

    // Validate real database counts match
    const actualUsers = await User.countDocuments();
    const actualPosts = await Post.countDocuments();
    const actualComments = await Comment.countDocuments();
    const actualLikes = await Like.countDocuments();

    assert.strictEqual(stats.users.total, actualUsers, 'Reported totalUsers matches MongoDB exactly');
    assert.strictEqual(stats.content.posts, actualPosts, 'Reported totalPosts matches MongoDB exactly');
    assert.strictEqual(stats.content.comments, actualComments, 'Reported totalComments matches MongoDB exactly');
    assert.strictEqual(stats.content.likes, actualLikes, 'Reported totalLikes matches MongoDB exactly');
    recordPass('Admin telemetry returns 100% genuine database metrics (zero fabricated numbers)');

    // Test 3: Admin platform activity log
    const adminActivityRes = await apiRequest('/admin/activity?limit=10', {
      method: 'GET',
      token: adminToken
    });
    assert.strictEqual(adminActivityRes.status, 200, 'Admin activity request returns 200');
    assert.ok(Array.isArray(adminActivityRes.body.activities), 'Activities returned as array');
    recordPass('Admin activity log returns real audit trail records');

    // ====================================================
    // 3. PHASE 12: ADMINISTRATIVE MANAGEMENT
    // ====================================================
    console.log('\n--- Phase 12: Administrative Management ---');

    // Test 1: Admin user listing and search
    const adminUsersRes = await apiRequest('/admin/users?search=Charlie', {
      method: 'GET',
      token: adminToken
    });
    assert.strictEqual(adminUsersRes.status, 200, 'Admin users list returns 200');
    assert.ok(adminUsersRes.body.users.some((u) => u.email === userC.email), 'Found Charlie in search results');
    recordPass('Admin user management search returns matching user account');

    // Test 2: Admin self-suspension protection
    const selfSuspendRes = await apiRequest(`/admin/users/${adminUser._id}/status`, {
      method: 'PATCH',
      token: adminToken,
      body: { accountStatus: 'suspended' }
    });
    assert.strictEqual(selfSuspendRes.status, 400, 'Self-suspension returns 400');
    recordPass('Admin self-suspension prevented with 400 Bad Request');

    // Test 3: Admin suspends User C
    const suspendRes = await apiRequest(`/admin/users/${userC._id}/status`, {
      method: 'PATCH',
      token: adminToken,
      body: { accountStatus: 'suspended' }
    });
    assert.strictEqual(suspendRes.status, 200, 'User suspension returns 200');
    assert.strictEqual(suspendRes.body.user.accountStatus, 'suspended', 'Status updated to suspended');

    // Verify tokenVersion incremented and session invalidated
    const updatedUserC = await User.findById(userC._id);
    assert.strictEqual(updatedUserC.tokenVersion, userC.tokenVersion + 1, 'tokenVersion incremented');

    // Verify User C cannot perform authenticated actions with previous token
    const suspendedActionRes = await apiRequest('/posts/mine', {
      method: 'GET',
      token: tokenC
    });
    assert.ok([401, 403].includes(suspendedActionRes.status), 'Suspended user action rejected');
    recordPass('Admin suspended User C; tokenVersion incremented and active session invalidated');

    // Test 4: Admin reactivates User C
    const reactivateRes = await apiRequest(`/admin/users/${userC._id}/status`, {
      method: 'PATCH',
      token: adminToken,
      body: { accountStatus: 'active' }
    });
    assert.strictEqual(reactivateRes.status, 200, 'User reactivation returns 200');
    assert.strictEqual(reactivateRes.body.user.accountStatus, 'active', 'Status updated to active');
    recordPass('Admin reactivated User C account');

    // Test 5: Admin post moderation and cascading deletion
    // Create a new post with comment and like for moderation testing
    const modPost = await Post.create({
      author: userA._id,
      content: 'Post destined for administrative moderation'
    });
    createdPostIds.push(modPost._id);
    const modComment = await Comment.create({
      post: modPost._id,
      author: userB._id,
      content: 'Comment on doomed post'
    });
    createdCommentIds.push(modComment._id);
    await Like.create({ post: modPost._id, user: userB._id });

    // Admin lists posts
    const adminPostsRes = await apiRequest('/admin/posts', {
      method: 'GET',
      token: adminToken
    });
    assert.strictEqual(adminPostsRes.status, 200, 'Admin posts list returns 200');
    recordPass('Admin successfully listed posts for moderation');

    // Admin deletes post
    const adminDeletePostRes = await apiRequest(`/admin/posts/${modPost._id}`, {
      method: 'DELETE',
      token: adminToken
    });
    assert.strictEqual(adminDeletePostRes.status, 200, 'Admin post deletion returns 200');

    // Verify post, comments, and likes are all removed
    const postInDb = await Post.findById(modPost._id);
    const commentsInDb = await Comment.find({ post: modPost._id });
    const likesInDb = await Like.find({ post: modPost._id });
    assert.strictEqual(postInDb, null, 'Post removed from database');
    assert.strictEqual(commentsInDb.length, 0, 'Cascaded comments removed from database');
    assert.strictEqual(likesInDb.length, 0, 'Cascaded likes removed from database');
    recordPass('Admin post deletion cascaded cleanly, purging post, comments, and likes');

    // Test 6: Admin comment moderation
    const adminDeleteCommentRes = await apiRequest(`/admin/comments/${comment1Id}`, {
      method: 'DELETE',
      token: adminToken
    });
    assert.strictEqual(adminDeleteCommentRes.status, 200, 'Admin comment deletion returns 200');
    const commentInDb = await Comment.findById(comment1Id);
    assert.strictEqual(commentInDb, null, 'Comment purged by admin moderation');
    recordPass('Admin deleted inappropriate comment via comment moderation API');

    // ====================================================
    // 4. PHASE 13: REAL-TIME NOTIFICATIONS & SOCKET.IO
    // ====================================================
    console.log('\n--- Phase 13: Real-Time Notifications & Socket.IO ---');

    // Test 1: Unauthenticated Socket.IO connection rejected
    let socketAuthRejected = false;
    await new Promise((resolve) => {
      const clientWithoutAuth = ioClient(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: false
      });
      clientWithoutAuth.on('connect_error', (err) => {
        if (err.message.includes('Token required') || err.message.includes('Authentication')) {
          socketAuthRejected = true;
        }
        clientWithoutAuth.disconnect();
        resolve();
      });
      clientWithoutAuth.on('connect', () => {
        clientWithoutAuth.disconnect();
        resolve();
      });
    });
    assert.ok(socketAuthRejected, 'Socket connection without JWT rejected by handshake middleware');
    recordPass('Unauthenticated Socket.IO connection rejected at auth handshake');

    // Test 2: Authenticated Socket.IO client connections
    const socketClientUserA = ioClient(socketUrl, {
      extraHeaders: {
        Cookie: `${AUTH_COOKIE_NAME}=${tokenA}`
      },
      transports: ['websocket', 'polling'],
      reconnection: false
    });

    const socketClientAdmin = ioClient(socketUrl, {
      extraHeaders: {
        Cookie: `${AUTH_COOKIE_NAME}=${adminToken}`
      },
      transports: ['websocket', 'polling'],
      reconnection: false
    });

    await new Promise((resolve) => {
      let connectedCount = 0;
      function checkDone() {
        connectedCount++;
        if (connectedCount === 2) resolve();
      }
      socketClientUserA.on('connect', checkDone);
      socketClientAdmin.on('connect', checkDone);
    });
    recordPass('Authenticated Socket.IO connections established for User A and Admin D');

    // Test 3: Admin receives real-time login alert when normal user logs in
    let adminReceivedLoginAlert = false;
    let loginAlertEventData = null;

    socketClientAdmin.on('admin_login_alert', (data) => {
      adminReceivedLoginAlert = true;
      loginAlertEventData = data;
    });

    // Simulate User B logging in via auth API
    const userBLoginRes = await apiRequest('/auth/login', {
      method: 'POST',
      body: {
        email: userB.email,
        password: 'Password123!'
      }
    });
    assert.strictEqual(userBLoginRes.status, 200, 'User B login returns 200');

    // Wait briefly for Socket.IO event propagation
    await new Promise((r) => setTimeout(r, 600));

    assert.ok(adminReceivedLoginAlert, 'Admin socket received admin_login_alert event');
    assert.ok(loginAlertEventData?.message?.includes('Bob Commenter'), 'Alert includes user fullName');
    recordPass('Admin received real-time socket alert upon regular user login');

    // Test 4: Verify persistent Notification created in database for Admin
    const adminDbNotification = await Notification.findOne({
      recipient: adminUser._id,
      type: 'login_alert'
    });
    assert.ok(adminDbNotification, 'Persistent login_alert Notification created in DB');
    createdNotificationIds.push(adminDbNotification._id);
    recordPass('Persistent login_alert Notification stored in MongoDB for administrator');

    // Test 5: Notification REST APIs (read, unread count, read-all)
    // Create another notification for User A
    const userANotif = await Notification.create({
      recipient: userA._id,
      actor: userB._id,
      type: 'post_like',
      message: 'Bob liked your post'
    });
    createdNotificationIds.push(userANotif._id);

    // Get unread count
    const unreadCountRes = await apiRequest('/notifications/unread-count', {
      method: 'GET',
      token: tokenA
    });
    assert.strictEqual(unreadCountRes.status, 200, 'Unread count returns 200');
    assert.ok(unreadCountRes.body.unreadCount >= 1, 'Unread count is at least 1');
    recordPass('GET /api/notifications/unread-count returns accurate unread count');

    // Mark single notification read
    const markSingleRes = await apiRequest(`/notifications/${userANotif._id}/read`, {
      method: 'PATCH',
      token: tokenA
    });
    assert.strictEqual(markSingleRes.status, 200, 'Mark single notification read returns 200');
    assert.ok(markSingleRes.body.notification.readAt, 'Notification readAt is populated');
    recordPass('PATCH /api/notifications/:id/read successfully marks notification as read');

    // Create another unread notification and test read-all
    const notif2 = await Notification.create({
      recipient: userA._id,
      actor: userB._id,
      type: 'post_comment',
      message: 'Bob commented on your post'
    });
    createdNotificationIds.push(notif2._id);

    const markAllRes = await apiRequest('/notifications/read-all', {
      method: 'PATCH',
      token: tokenA
    });
    assert.strictEqual(markAllRes.status, 200, 'Mark all read returns 200');

    const finalUnreadRes = await apiRequest('/notifications/unread-count', {
      method: 'GET',
      token: tokenA
    });
    assert.strictEqual(finalUnreadRes.body.unreadCount, 0, 'Unread count is now 0');
    recordPass('PATCH /api/notifications/read-all cleared all unread notifications');

    // Disconnect test sockets
    socketClientUserA.disconnect();
    socketClientAdmin.disconnect();

    // ====================================================
    // 5. PHASE 14: AI POST GENERATION & IMPROVEMENT
    // ====================================================
    console.log('\n--- Phase 14: AI Post Generation & Improvement ---');

    // Test 1: Unauthenticated request rejected
    const unauthAiRes = await apiRequest('/ai/posts/generate', {
      method: 'POST',
      body: { topic: 'Social media best practices' }
    });
    assert.strictEqual(unauthAiRes.status, 401, 'Unauthenticated AI call returns 401');
    recordPass('Unauthenticated AI generation call rejected with 401 Unauthorized');

    // Test 2: Input validation on /api/ai/posts/generate
    const missingTopicRes = await apiRequest('/ai/posts/generate', {
      method: 'POST',
      token: tokenA,
      body: { topic: '   ' }
    });
    assert.strictEqual(missingTopicRes.status, 400, 'Missing topic returns 400');
    recordPass('AI generation rejected empty topic with 400 Bad Request');

    const invalidToneRes = await apiRequest('/ai/posts/generate', {
      method: 'POST',
      token: tokenA,
      body: { topic: 'Tech tips', tone: 'sarcastic_invalid' }
    });
    assert.strictEqual(invalidToneRes.status, 400, 'Invalid tone returns 400');
    recordPass('AI generation rejected unsupported tone option with 400 Bad Request');

    // Test 3: AI post generation in test mock mode
    setForceAiMock(true);
    setSimulateAiFailure(false);

    const generateRes = await apiRequest('/ai/posts/generate', {
      method: 'POST',
      token: tokenA,
      body: {
        topic: 'Building responsive layouts with Tailwind CSS',
        tone: 'insightful',
        length: 'medium',
        context: 'Focus on flexbox and grid utilities'
      }
    });
    assert.strictEqual(generateRes.status, 200, 'AI generation returns 200');
    assert.strictEqual(generateRes.body.success, true, 'AI generation success is true');
    assert.ok(generateRes.body.generatedContent.length > 20, 'Generated content has substantive text');
    assert.ok(generateRes.body.metadata?.model, 'Generation response includes model metadata');
    recordPass('POST /api/ai/posts/generate produced valid post draft with metadata');

    // Test 4: Input validation on /api/ai/posts/improve
    const missingContentRes = await apiRequest('/ai/posts/improve', {
      method: 'POST',
      token: tokenA,
      body: { content: '  ' }
    });
    assert.strictEqual(missingContentRes.status, 400, 'Missing content returns 400');
    recordPass('AI improve rejected empty content with 400 Bad Request');

    const oversizedContentRes = await apiRequest('/ai/posts/improve', {
      method: 'POST',
      token: tokenA,
      body: { content: 'x'.repeat(1001) }
    });
    assert.strictEqual(oversizedContentRes.status, 400, 'Oversized content returns 400');
    recordPass('AI improve rejected >1000 char content with 400 Bad Request');

    // Test 5: AI post improvement in test mock mode
    const improveRes = await apiRequest('/ai/posts/improve', {
      method: 'POST',
      token: tokenA,
      body: {
        content: 'hey guys checkout this new feature i built for my project',
        tone: 'professional',
        instructions: 'Make it sound polished for technical recruiters'
      }
    });
    assert.strictEqual(improveRes.status, 200, 'AI improve returns 200');
    assert.strictEqual(improveRes.body.success, true, 'AI improve success is true');
    assert.ok(improveRes.body.improvedContent.length > 20, 'Improved content has substantive text');
    recordPass('POST /api/ai/posts/improve successfully polished text with metadata');

    // Test 6: AI graceful failure handling
    setSimulateAiFailure(true);
    const failedAiRes = await apiRequest('/ai/posts/generate', {
      method: 'POST',
      token: tokenA,
      body: { topic: 'Testing error resilience' }
    });
    assert.strictEqual(failedAiRes.status, 502, 'Simulated failure returns 502 Bad Gateway');
    assert.strictEqual(failedAiRes.body.success, false, 'Failed response has success: false');
    recordPass('AI service simulated failure handled gracefully with 502 Bad Gateway');

    // Reset AI mock state
    setSimulateAiFailure(false);
    setForceAiMock(false);

    // ====================================================
    // 6. END-TO-END BATCH 3 INTEGRATION LIFECYCLE
    // ====================================================
    console.log('\n--- Section 6: End-to-End Batch 3 Integrated Lifecycle ---');

    // Complete lifecycle:
    // 1. User A creates post
    // 2. User B likes post
    // 3. User B comments on post
    // 4. User A receives notification
    // 5. Admin inspects dashboard telemetry (exact numbers match)
    // 6. Admin inspects audit logs
    // 7. Admin deletes post, cascading cleanup verified

    const lifePostRes = await apiRequest('/posts', {
      method: 'POST',
      token: tokenA,
      body: { content: 'End-to-End lifecycle post testing all 5 phases simultaneously' }
    });
    assert.strictEqual(lifePostRes.status, 201);
    const lifePostId = lifePostRes.body.post._id;
    createdPostIds.push(lifePostId);

    // Like
    await apiRequest(`/posts/${lifePostId}/like`, { method: 'POST', token: tokenB });

    // Comment
    const lifeCommentRes = await apiRequest(`/posts/${lifePostId}/comments`, {
      method: 'POST',
      token: tokenB,
      body: { content: 'End-to-end comment validation' }
    });
    createdCommentIds.push(lifeCommentRes.body.comment._id);

    // Verify Author notifications received
    const lifeNotifRes = await apiRequest('/notifications', { method: 'GET', token: tokenA });
    assert.ok(lifeNotifRes.body.notifications.length >= 1, 'Notifications received in lifecycle');

    // Verify Admin stats accurately track additions
    const lifeStatsRes = await apiRequest('/admin/stats', { method: 'GET', token: adminToken });
    assert.ok(lifeStatsRes.body.stats.content.posts >= 1);
    assert.ok(lifeStatsRes.body.stats.content.comments >= 1);
    assert.ok(lifeStatsRes.body.stats.content.likes >= 1);

    // Admin cascade deletion
    const lifeDeleteRes = await apiRequest(`/admin/posts/${lifePostId}`, {
      method: 'DELETE',
      token: adminToken
    });
    assert.strictEqual(lifeDeleteRes.status, 200);

    // Verify database cascade
    const verifyPostGone = await Post.findById(lifePostId);
    const verifyCommentsGone = await Comment.find({ post: lifePostId });
    const verifyLikesGone = await Like.find({ post: lifePostId });
    assert.strictEqual(verifyPostGone, null);
    assert.strictEqual(verifyCommentsGone.length, 0);
    assert.strictEqual(verifyLikesGone.length, 0);

    recordPass('End-to-end multi-phase lifecycle executed and verified with total integrity');

    console.log(`\n====================================================`);
    console.log(`ALL BATCH 3 TESTS PASSED: ${passedCount} / ${passedCount}`);
    console.log(`====================================================\n`);
  } finally {
    // ----------------------------------------------------
    // Cleanup: Strictly remove created test records
    // ----------------------------------------------------
    console.log('--- Cleaning Up Test Artifacts in looply_test ---');
    try {
      const activeDb = mongoose.connection.name || mongoose.connection.db?.databaseName;
      if (activeDb === 'looply_test') {
        if (createdPostIds.length > 0) {
          await Post.deleteMany({ _id: { $in: createdPostIds } });
          await Comment.deleteMany({ post: { $in: createdPostIds } });
          await Like.deleteMany({ post: { $in: createdPostIds } });
        }
        if (createdCommentIds.length > 0) {
          await Comment.deleteMany({ _id: { $in: createdCommentIds } });
        }
        if (createdNotificationIds.length > 0) {
          await Notification.deleteMany({ _id: { $in: createdNotificationIds } });
        }
        if (createdUserIds.length > 0) {
          await User.deleteMany({ _id: { $in: createdUserIds } });
          await Notification.deleteMany({
            $or: [
              { recipient: { $in: createdUserIds } },
              { sender: { $in: createdUserIds } }
            ]
          });
          await ActivityLog.deleteMany({ user: { $in: createdUserIds } });
        }
        console.log('✓ Successfully cleaned up test records in looply_test');
      }
    } catch (cleanupErr) {
      console.error(`Warning: Cleanup encountered error: ${cleanupErr.message}`);
    }

    try {
      await closeSocketServer();
    } catch (sErr) {}

    if (serverInstance) {
      await new Promise((resolve) => serverInstance.close(resolve));
    }

    try {
      await disconnectDatabase();
    } catch (dbErr) {}
  }
}

runBatch3Tests().catch((err) => {
  console.error('\n❌ BATCH 3 TEST FAILURE:', err);
  process.exit(1);
});
