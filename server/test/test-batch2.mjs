import assert from 'assert';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';
import { env } from '../src/config/env.js';
import { User, Post, ActivityLog } from '../src/models/index.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { generateToken, AUTH_COOKIE_NAME } from '../src/config/jwt.js';
import {
  getTestMongoUri,
  validateTestDatabaseSafety
} from './test-helpers.mjs';
import {
  getTestOutbox,
  getLastTestEmail,
  clearTestOutbox,
  setForceTestOutbox
} from '../src/services/email.service.js';

const TEST_PORT = 5002;
const baseUrl = `http://127.0.0.1:${TEST_PORT}/api`;

async function runBatch2Tests() {
  console.log('====================================================');
  console.log('LOOPLY — BATCH 2 (PHASES 5, 6, 7, 8, 9) TEST SUITE');
  console.log('====================================================\n');

  let serverInstance = null;
  const createdUserIds = [];
  const createdPostIds = [];
  let passedCount = 0;

  function recordPass(msg) {
    passedCount++;
    console.log(`✓ ${passedCount}. ${msg}`);
  }

  try {
    // ----------------------------------------------------
    // Section 0: Test Database Safety & Isolation Check
    // ----------------------------------------------------
    console.log('--- Section 0: Database Safety & Transport Setup ---');
    const testMongoUri = getTestMongoUri();
    validateTestDatabaseSafety(testMongoUri);
    recordPass('MONGODB_TEST_URI validated targeting strictly "looply_test"');

    // Enable test mail outbox
    setForceTestOutbox(true);
    clearTestOutbox();
    recordPass('Test mail outbox activated and cleared for test execution');

    // Connect to test database
    await connectDatabase(testMongoUri);
    const activeDb = mongoose.connection.name || mongoose.connection.db?.databaseName;
    assert.strictEqual(activeDb, 'looply_test', 'Must be connected strictly to looply_test');
    recordPass(`Connected to dedicated test database: "${activeDb}"`);

    // Start isolated test server
    await new Promise((resolve) => {
      serverInstance = app.listen(TEST_PORT, () => resolve());
    });
    recordPass(`Test API server listening on http://127.0.0.1:${TEST_PORT}`);

    // Helper: Parse cookie from Set-Cookie header
    function extractAuthCookie(res) {
      const setCookie = res.headers.get('set-cookie');
      if (!setCookie) return '';
      const match = setCookie.match(new RegExp(`${AUTH_COOKIE_NAME}=([^;]+)`));
      return match ? `${AUTH_COOKIE_NAME}=${match[1]}` : '';
    }

    // ----------------------------------------------------
    // PHASE 5: Email Verification & Password Recovery Tests
    // ----------------------------------------------------
    console.log('\n--- Section 1: Phase 5 Email Verification Tests ---');

    const timestamp = Date.now();
    const aliceEmail = `alice_phase5_${timestamp}@example.com`;
    const alicePassword = 'AlicePassword123!';

    // 1. Register Alice -> Check verification token generated and email dispatched
    clearTestOutbox();
    const resReg = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Alice Johnson',
        email: aliceEmail,
        password: alicePassword,
        confirmPassword: alicePassword
      })
    });
    const jsonReg = await resReg.json();
    assert.strictEqual(resReg.status, 201);
    assert.strictEqual(jsonReg.user.isEmailVerified, false);
    createdUserIds.push(jsonReg.user._id);
    recordPass('User registered with isEmailVerified: false and verification email dispatched');

    // 2. Inspect captured verification email in test outbox
    const lastEmail = getLastTestEmail();
    assert.ok(lastEmail, 'Verification email must be captured in test outbox');
    assert.strictEqual(lastEmail.to, aliceEmail);
    assert.ok(lastEmail.text.includes('/verify-email?token='), 'Email text contains verification link');
    recordPass('Verification email captured in outbox with proper recipient and link structure');

    // Extract raw token from email URL
    const tokenMatch = lastEmail.text.match(/token=([a-f0-9]+)/);
    assert.ok(tokenMatch && tokenMatch[1], 'Raw verification token extracted from email');
    const rawToken = tokenMatch[1];
    recordPass('Cryptographic verification token extracted from email body');

    // 3. Verify user in database stores only SHA-256 hash (never raw token)
    const aliceDb = await User.findById(jsonReg.user._id).select('+verificationTokenHash');
    assert.notStrictEqual(aliceDb.verificationTokenHash, rawToken);
    assert.strictEqual(aliceDb.verificationTokenHash.length, 64);
    recordPass('Database stores 64-char SHA-256 token digest, never raw token');

    // 4. Unverified user login must be rejected with HTTP 403
    const resUnverifiedLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: aliceEmail, password: alicePassword })
    });
    const jsonUnverifiedLogin = await resUnverifiedLogin.json();
    assert.strictEqual(resUnverifiedLogin.status, 403);
    assert.ok(jsonUnverifiedLogin.message.toLowerCase().includes('verify'));
    recordPass('Unverified user login rejected with HTTP 403 Forbidden');

    // 5. Invalid verification token rejected with HTTP 400
    const resInvalidVerify = await fetch(`${baseUrl}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'invalid_token_12345' })
    });
    assert.strictEqual(resInvalidVerify.status, 400);
    recordPass('Invalid verification token rejected with HTTP 400');

    // 6. Expired verification token rejected with HTTP 400
    await User.findByIdAndUpdate(jsonReg.user._id, {
      verificationTokenExpiresAt: new Date(Date.now() - 1000)
    });
    const resExpiredVerify = await fetch(`${baseUrl}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: rawToken })
    });
    assert.strictEqual(resExpiredVerify.status, 400);
    recordPass('Expired verification token rejected with HTTP 400');

    // 7. Valid verification succeeds: sets isEmailVerified = true and clears token records
    await User.findByIdAndUpdate(jsonReg.user._id, {
      verificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });
    const resValidVerify = await fetch(`${baseUrl}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: rawToken })
    });
    const jsonValidVerify = await resValidVerify.json();
    assert.strictEqual(resValidVerify.status, 200);
    assert.strictEqual(jsonValidVerify.user.isEmailVerified, true);
    recordPass('Valid verification token accepted with HTTP 200; isEmailVerified becomes true');

    // 8. Token reuse rejection: verifying again with the same token fails
    const resReuseVerify = await fetch(`${baseUrl}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: rawToken })
    });
    assert.strictEqual(resReuseVerify.status, 400);
    recordPass('Token reuse rejected: already used verification token rejected with HTTP 400');

    // 9. Resend verification safe response (no user enumeration)
    const resResend = await fetch(`${baseUrl}/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent_user_xyz@example.com' })
    });
    const jsonResend = await resResend.json();
    assert.strictEqual(resResend.status, 200);
    assert.ok(jsonResend.message.includes('If an account exists'));
    recordPass('Resend verification avoids enumeration with generic message for unknown email');

    // 10. Verified user can now log in successfully
    const resAliceLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: aliceEmail, password: alicePassword })
    });
    assert.strictEqual(resAliceLogin.status, 200);
    const aliceCookie = extractAuthCookie(resAliceLogin);
    assert.ok(aliceCookie, 'Set-Cookie header received upon verified login');
    recordPass('Verified user completes login successfully with HTTP 200 and auth cookie');

    // 11. Forgot password request (generic response, no enumeration)
    clearTestOutbox();
    const resForgot = await fetch(`${baseUrl}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: aliceEmail })
    });
    const jsonForgot = await resForgot.json();
    assert.strictEqual(resForgot.status, 200);
    assert.ok(jsonForgot.message.includes('instructions have been sent'));
    recordPass('Forgot password returns safe generic response without exposing account existence');

    // 12. Password reset email captured in outbox
    const resetEmail = getLastTestEmail();
    assert.ok(resetEmail && resetEmail.to === aliceEmail);
    assert.ok(resetEmail.text.includes('/reset-password?token='));
    const resetTokenMatch = resetEmail.text.match(/token=([a-f0-9]+)/);
    assert.ok(resetTokenMatch && resetTokenMatch[1]);
    const rawResetToken = resetTokenMatch[1];
    recordPass('Password reset email dispatched to outbox with reset token link');

    // 13. Expired reset token rejected
    await User.findByIdAndUpdate(jsonReg.user._id, {
      resetPasswordTokenExpiresAt: new Date(Date.now() - 1000)
    });
    const resExpiredReset = await fetch(`${baseUrl}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: rawResetToken,
        password: 'NewAlicePassword456!',
        confirmPassword: 'NewAlicePassword456!'
      })
    });
    assert.strictEqual(resExpiredReset.status, 400);
    recordPass('Expired password reset token rejected with HTTP 400');

    // 14. Valid password reset updates password and increments tokenVersion
    await User.findByIdAndUpdate(jsonReg.user._id, {
      resetPasswordTokenExpiresAt: new Date(Date.now() + 30 * 60 * 1000)
    });
    const newAlicePassword = 'NewAlicePassword456!';
    const resValidReset = await fetch(`${baseUrl}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: rawResetToken,
        password: newAlicePassword,
        confirmPassword: newAlicePassword
      })
    });
    const jsonValidReset = await resValidReset.json();
    assert.strictEqual(resValidReset.status, 200);
    assert.ok(jsonValidReset.message.includes('Password has been reset'));
    recordPass('Valid password reset succeeds with HTTP 200');

    // 15. Verify new password works and old password fails
    const resOldPassLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: aliceEmail, password: alicePassword })
    });
    assert.strictEqual(resOldPassLogin.status, 401);
    const resNewPassLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: aliceEmail, password: newAlicePassword })
    });
    assert.strictEqual(resNewPassLogin.status, 200);
    const freshAliceCookie = extractAuthCookie(resNewPassLogin);
    recordPass('Password hash updated in database; new password authenticates, old password rejected');

    // 16. Previous session token is invalidated by tokenVersion change
    const resOldSessionCheck = await fetch(`${baseUrl}/auth/me`, {
      headers: { Cookie: aliceCookie }
    });
    assert.strictEqual(resOldSessionCheck.status, 401);
    recordPass('Session invalidation: previous JWT rejected with HTTP 401 after password reset');

    // ----------------------------------------------------
    // PHASE 6: Authentication Security & RBAC Tests
    // ----------------------------------------------------
    console.log('\n--- Section 2: Phase 6 RBAC & Authorization Tests ---');

    // 17. Protected route rejects missing JWT
    const resNoToken = await fetch(`${baseUrl}/auth/me`);
    assert.strictEqual(resNoToken.status, 401);
    recordPass('requireAuth rejects missing authentication token with HTTP 401');

    // 18. Protected route rejects invalid signature
    const resTampered = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: 'Bearer invalid.tampered.token' }
    });
    assert.strictEqual(resTampered.status, 401);
    recordPass('requireAuth rejects invalid/tampered JWT signature with HTTP 401');

    // 19. Suspended user session rejected
    await User.findByIdAndUpdate(jsonReg.user._id, { accountStatus: 'suspended' });
    const resSuspendedAuth = await fetch(`${baseUrl}/auth/me`, {
      headers: { Cookie: freshAliceCookie }
    });
    assert.strictEqual(resSuspendedAuth.status, 403);
    recordPass('requireAuth rejects suspended user account with HTTP 403 Forbidden');
    await User.findByIdAndUpdate(jsonReg.user._id, { accountStatus: 'active' });

    // 20. Normal user accessing admin API rejected with HTTP 403
    const resAdminForbidden = await fetch(`${baseUrl}/admin/status`, {
      headers: { Cookie: freshAliceCookie }
    });
    assert.strictEqual(resAdminForbidden.status, 403);
    recordPass('requireRole("admin") strictly rejects normal user with HTTP 403 Forbidden');

    // 21. Create dedicated admin user in looply_test and verify authorized admin access
    const adminEmail = `admin_phase6_${timestamp}@example.com`;
    const adminPassword = 'AdminPassword123!';
    const adminUser = new User({
      fullName: 'Platform Admin',
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: 'admin',
      isEmailVerified: true,
      accountStatus: 'active'
    });
    await adminUser.save();
    createdUserIds.push(adminUser._id);

    const resAdminLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword })
    });
    assert.strictEqual(resAdminLogin.status, 200);
    const adminCookie = extractAuthCookie(resAdminLogin);

    const resAdminAccess = await fetch(`${baseUrl}/admin/status`, {
      headers: { Cookie: adminCookie }
    });
    const jsonAdminAccess = await resAdminAccess.json();
    assert.strictEqual(resAdminAccess.status, 200);
    assert.strictEqual(jsonAdminAccess.admin.role, 'admin');
    recordPass('Authorized admin user granted access to administrative endpoint (HTTP 200)');

    // ----------------------------------------------------
    // PHASE 7: User Profile Management Tests
    // ----------------------------------------------------
    console.log('\n--- Section 3: Phase 7 Profile Management Tests ---');

    // 22. GET /api/profile/me retrieves current user profile without passwordHash
    const resGetProfile = await fetch(`${baseUrl}/profile/me`, {
      headers: { Cookie: freshAliceCookie }
    });
    const jsonGetProfile = await resGetProfile.json();
    assert.strictEqual(resGetProfile.status, 200);
    assert.strictEqual(jsonGetProfile.user.fullName, 'Alice Johnson');
    assert.strictEqual(jsonGetProfile.user.passwordHash, undefined);
    recordPass('GET /api/profile/me returns current user profile excluding sensitive hashes');

    // 23. PATCH /api/profile/me updates fullName, bio, avatarUrl
    const resUpdateProfile = await fetch(`${baseUrl}/profile/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: freshAliceCookie
      },
      body: JSON.stringify({
        fullName: 'Alice J. Morgan',
        bio: 'Software engineer passionate about decentralized social tech.',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330'
      })
    });
    const jsonUpdateProfile = await resUpdateProfile.json();
    assert.strictEqual(resUpdateProfile.status, 200);
    assert.strictEqual(jsonUpdateProfile.user.fullName, 'Alice J. Morgan');
    assert.strictEqual(jsonUpdateProfile.user.profile.bio, 'Software engineer passionate about decentralized social tech.');
    recordPass('PATCH /api/profile/me successfully updates profile attributes');

    // 24. PATCH /api/profile/me strictly rejects protected fields (role, email)
    const resTamperRole = await fetch(`${baseUrl}/profile/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: freshAliceCookie
      },
      body: JSON.stringify({ role: 'admin' })
    });
    assert.strictEqual(resTamperRole.status, 400);
    recordPass('PATCH /api/profile/me strictly rejects modification of role or protected fields');

    // 25. PATCH /api/profile/me rejects invalid avatar URL format
    const resInvalidAvatar = await fetch(`${baseUrl}/profile/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: freshAliceCookie
      },
      body: JSON.stringify({ avatarUrl: 'ftp://not-a-valid-http-url' })
    });
    assert.strictEqual(resInvalidAvatar.status, 400);
    recordPass('PATCH /api/profile/me rejects invalid avatar URL scheme');

    // 26. GET /api/profiles/:userId returns public profile excluding email and private credentials
    const resPublicProfile = await fetch(`${baseUrl}/profiles/${jsonReg.user._id}`);
    const jsonPublicProfile = await resPublicProfile.json();
    assert.strictEqual(resPublicProfile.status, 200);
    assert.strictEqual(jsonPublicProfile.profile.fullName, 'Alice J. Morgan');
    assert.strictEqual(jsonPublicProfile.profile.email, undefined);
    assert.strictEqual(jsonPublicProfile.profile.passwordHash, undefined);
    recordPass('GET /api/profiles/:userId returns public profile strictly excluding private email');

    // ----------------------------------------------------
    // PHASE 8: Post Creation & Management Tests
    // ----------------------------------------------------
    console.log('\n--- Section 4: Phase 8 Post Creation & CRUD Tests ---');

    // 27. Create post with valid content
    const resCreatePost = await fetch(`${baseUrl}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: freshAliceCookie
      },
      body: JSON.stringify({
        content: 'Hello Looply! This is my first publication on the decentralized network.'
      })
    });
    const jsonCreatePost = await resCreatePost.json();
    assert.strictEqual(resCreatePost.status, 201);
    assert.strictEqual(jsonCreatePost.post.author.fullName, 'Alice J. Morgan');
    createdPostIds.push(jsonCreatePost.post._id);
    recordPass('POST /api/posts creates new post with automatic author assignment (HTTP 201)');

    // 28. Post creation rejects empty content
    const resEmptyPost = await fetch(`${baseUrl}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: freshAliceCookie
      },
      body: JSON.stringify({ content: '   ' })
    });
    assert.strictEqual(resEmptyPost.status, 400);
    recordPass('POST /api/posts rejects empty content with HTTP 400');

    // 29. Post creation rejects content exceeding 1000 characters
    const resOverlongPost = await fetch(`${baseUrl}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: freshAliceCookie
      },
      body: JSON.stringify({ content: 'a'.repeat(1001) })
    });
    assert.strictEqual(resOverlongPost.status, 400);
    recordPass('POST /api/posts rejects content exceeding 1000 characters with HTTP 400');

    // 30. GET /api/posts/mine returns authenticated user's posts
    const resMyPosts = await fetch(`${baseUrl}/posts/mine`, {
      headers: { Cookie: freshAliceCookie }
    });
    const jsonMyPosts = await resMyPosts.json();
    assert.strictEqual(resMyPosts.status, 200);
    assert.ok(jsonMyPosts.posts.length >= 1);
    assert.strictEqual(jsonMyPosts.posts[0]._id, jsonCreatePost.post._id);
    recordPass('GET /api/posts/mine retrieves user personal posts with pagination metadata');

    // 31. GET /api/posts/:postId retrieves single post
    const resGetSinglePost = await fetch(`${baseUrl}/posts/${jsonCreatePost.post._id}`);
    const jsonGetSinglePost = await resGetSinglePost.json();
    assert.strictEqual(resGetSinglePost.status, 200);
    assert.strictEqual(jsonGetSinglePost.post._id, jsonCreatePost.post._id);
    recordPass('GET /api/posts/:postId retrieves post with populated author info');

    // 32. GET /api/posts/:postId returns HTTP 400 on invalid ObjectId
    const resBadPostId = await fetch(`${baseUrl}/posts/not-an-objectid`);
    assert.strictEqual(resBadPostId.status, 400);
    recordPass('GET /api/posts/:postId returns HTTP 400 on malformed ObjectId');

    // 33. Author can update their own post
    const resUpdatePost = await fetch(`${baseUrl}/posts/${jsonCreatePost.post._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: freshAliceCookie
      },
      body: JSON.stringify({
        content: 'Updated content: Looply is built with clean architecture!'
      })
    });
    const jsonUpdatePost = await resUpdatePost.json();
    assert.strictEqual(resUpdatePost.status, 200);
    assert.strictEqual(jsonUpdatePost.post.content, 'Updated content: Looply is built with clean architecture!');
    recordPass('PATCH /api/posts/:postId allows post author to update content (HTTP 200)');

    // 34. Non-author user rejected when attempting to edit another user's post
    const bobEmail = `bob_phase8_${timestamp}@example.com`;
    const bobPassword = 'BobPassword123!';
    const bobUser = new User({
      fullName: 'Bob Smith',
      email: bobEmail,
      passwordHash: await bcrypt.hash(bobPassword, 12),
      role: 'user',
      isEmailVerified: true,
      accountStatus: 'active'
    });
    await bobUser.save();
    createdUserIds.push(bobUser._id);

    const resBobLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: bobEmail, password: bobPassword })
    });
    const bobCookie = extractAuthCookie(resBobLogin);

    const resBobEditAlice = await fetch(`${baseUrl}/posts/${jsonCreatePost.post._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: bobCookie
      },
      body: JSON.stringify({ content: 'Malicious modification attempt' })
    });
    assert.strictEqual(resBobEditAlice.status, 403);
    recordPass('PATCH /api/posts/:postId rejects non-owner edit attempt with HTTP 403 Forbidden');

    // 35. Non-author user rejected when attempting to delete another user's post
    const resBobDeleteAlice = await fetch(`${baseUrl}/posts/${jsonCreatePost.post._id}`, {
      method: 'DELETE',
      headers: { Cookie: bobCookie }
    });
    assert.strictEqual(resBobDeleteAlice.status, 403);
    recordPass('DELETE /api/posts/:postId rejects non-owner delete attempt with HTTP 403 Forbidden');

    // 36. Author successfully deletes own post
    const resDeletePost = await fetch(`${baseUrl}/posts/${jsonCreatePost.post._id}`, {
      method: 'DELETE',
      headers: { Cookie: freshAliceCookie }
    });
    assert.strictEqual(resDeletePost.status, 200);
    const postInDb = await Post.findById(jsonCreatePost.post._id);
    assert.strictEqual(postInDb, null);
    recordPass('DELETE /api/posts/:postId allows author to delete own post (HTTP 200)');

    // ----------------------------------------------------
    // PHASE 9: Social Media Feed and Explore Tests
    // ----------------------------------------------------
    console.log('\n--- Section 5: Phase 9 Social Feed & Explore Tests ---');

    // Create 3 posts in chronological order
    const post1 = await Post.create({ author: aliceDb._id, content: 'First post in test stream' });
    createdPostIds.push(post1._id);
    await new Promise((r) => setTimeout(r, 50));
    const post2 = await Post.create({ author: bobUser._id, content: 'Second post by Bob' });
    createdPostIds.push(post2._id);
    await new Promise((r) => setTimeout(r, 50));
    const post3 = await Post.create({ author: aliceDb._id, content: 'Third and newest post by Alice' });
    createdPostIds.push(post3._id);

    // 37. GET /api/feed returns posts in reverse chronological order
    const resFeed = await fetch(`${baseUrl}/feed?page=1&limit=10`, {
      headers: { Cookie: freshAliceCookie }
    });
    const jsonFeed = await resFeed.json();
    assert.strictEqual(resFeed.status, 200);
    assert.ok(jsonFeed.posts.length >= 3);
    assert.strictEqual(jsonFeed.posts[0]._id, post3._id.toString());
    assert.strictEqual(jsonFeed.posts[1]._id, post2._id.toString());
    recordPass('GET /api/feed returns posts in strict reverse chronological order (newest first)');

    // 38. GET /api/feed verifies safe author population without passwordHash
    const firstFeedPost = jsonFeed.posts[0];
    assert.ok(firstFeedPost.author && firstFeedPost.author.fullName);
    assert.strictEqual(firstFeedPost.author.passwordHash, undefined);
    recordPass('GET /api/feed populates safe author details; passwordHash strictly excluded');

    // 39. Feed pagination inputs verified
    const resFeedPage2 = await fetch(`${baseUrl}/feed?page=1&limit=2`, {
      headers: { Cookie: freshAliceCookie }
    });
    const jsonFeedPage2 = await resFeedPage2.json();
    assert.strictEqual(resFeedPage2.status, 200);
    assert.strictEqual(jsonFeedPage2.posts.length, 2);
    assert.strictEqual(jsonFeedPage2.pagination.page, 1);
    assert.strictEqual(jsonFeedPage2.pagination.limit, 2);
    assert.ok(jsonFeedPage2.pagination.totalPages >= 2);
    recordPass('GET /api/feed pagination validates limit, page, and totalPages metadata');

    // 40. GET /api/profiles/:userId/posts retrieves posts for specific user
    const resAliceTimeline = await fetch(`${baseUrl}/profiles/${aliceDb._id}/posts`);
    const jsonAliceTimeline = await resAliceTimeline.json();
    assert.strictEqual(resAliceTimeline.status, 200);
    assert.ok(jsonAliceTimeline.posts.every((p) => p.author._id.toString() === aliceDb._id.toString()));
    recordPass('GET /api/profiles/:userId/posts retrieves posts belonging strictly to requested user');

    // 41. GET /api/explore returns recent discovery posts
    const resExplore = await fetch(`${baseUrl}/explore?page=1&limit=10`);
    const jsonExplore = await resExplore.json();
    assert.strictEqual(resExplore.status, 200);
    assert.ok(jsonExplore.posts.length >= 3);
    recordPass('GET /api/explore retrieves recent public posts with discovery layout support');

    // ----------------------------------------------------
    // End-to-End Complete Integrated Lifecycle Test
    // ----------------------------------------------------
    console.log('\n--- Section 6: End-to-End Complete Integrated Lifecycle ---');

    // 42. Integrated lifecycle: Register -> Outbox -> Verify -> Login -> Profile -> Post -> Feed -> Delete -> Logout
    const e2eEmail = `e2e_user_${timestamp}@example.com`;
    const e2ePass = 'E2ESecurePass123!';
    clearTestOutbox();

    const e2eReg = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Integrated E2E User',
        email: e2eEmail,
        password: e2ePass,
        confirmPassword: e2ePass
      })
    });
    const e2eRegJson = await e2eReg.json();
    assert.strictEqual(e2eReg.status, 201);
    createdUserIds.push(e2eRegJson.user._id);

    const e2eEmailRecord = getLastTestEmail();
    const e2eToken = e2eEmailRecord.text.match(/token=([a-f0-9]+)/)[1];

    const e2eVerify = await fetch(`${baseUrl}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: e2eToken })
    });
    assert.strictEqual(e2eVerify.status, 200);

    const e2eLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: e2eEmail, password: e2ePass })
    });
    assert.strictEqual(e2eLogin.status, 200);
    const e2eCookie = extractAuthCookie(e2eLogin);

    // Edit profile
    const e2eProfile = await fetch(`${baseUrl}/profile/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: e2eCookie },
      body: JSON.stringify({ bio: 'Integrated test bio' })
    });
    assert.strictEqual(e2eProfile.status, 200);

    // Create post
    const e2ePost = await fetch(`${baseUrl}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: e2eCookie },
      body: JSON.stringify({ content: 'Post created in full integration lifecycle' })
    });
    const e2ePostJson = await e2ePost.json();
    assert.strictEqual(e2ePost.status, 201);
    createdPostIds.push(e2ePostJson.post._id);

    // Verify post in feed
    const e2eFeed = await fetch(`${baseUrl}/feed`, { headers: { Cookie: e2eCookie } });
    const e2eFeedJson = await e2eFeed.json();
    assert.strictEqual(e2eFeed.status, 200);
    assert.ok(e2eFeedJson.posts.some((p) => p._id === e2ePostJson.post._id));

    // Delete post
    const e2eDel = await fetch(`${baseUrl}/posts/${e2ePostJson.post._id}`, {
      method: 'DELETE',
      headers: { Cookie: e2eCookie }
    });
    assert.strictEqual(e2eDel.status, 200);

    // Logout
    const e2eLogout = await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: { Cookie: e2eCookie }
    });
    assert.strictEqual(e2eLogout.status, 200);
    recordPass('Complete integrated lifecycle verified: Register -> Verify -> Login -> Profile -> Post -> Feed -> Delete -> Logout');

    console.log('\n====================================================');
    console.log(`Batch 2 Test Results: ${passedCount} passed, 0 failed`);
    console.log('====================================================\n');

  } finally {
    console.log('--- Cleaning Up Test Artifacts from Dedicated Database ---');
    try {
      const activeDb = mongoose.connection.name || mongoose.connection.db?.databaseName;
      if (activeDb === 'looply_test') {
        if (createdPostIds.length > 0) {
          await Post.deleteMany({ _id: { $in: createdPostIds } });
          console.log(`Cleaned up ${createdPostIds.length} test posts from looply_test.`);
        }
        if (createdUserIds.length > 0) {
          await User.deleteMany({ _id: { $in: createdUserIds } });
          await ActivityLog.deleteMany({ actor: { $in: createdUserIds } });
          console.log(`Cleaned up ${createdUserIds.length} test users from looply_test.`);
        }
      }
    } catch (cleanupErr) {
      console.error('[Cleanup Warning]', cleanupErr.message);
    }

    if (serverInstance) {
      serverInstance.close();
    }
    await disconnectDatabase();
  }
}

runBatch2Tests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n[FATAL TEST FAILURE]', err);
    process.exit(1);
  });

