import assert from 'assert';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';
import { env } from '../src/config/env.js';
import { User, Post, Comment, Like, ActivityLog } from '../src/models/index.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { generateToken, AUTH_COOKIE_NAME } from '../src/config/jwt.js';
import { deletePost as deletePostService } from '../src/services/post.service.js';
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
    assert.strictEqual(jsonReg.emailDispatched, true);
    createdUserIds.push(jsonReg.user._id);
    recordPass('User registered with isEmailVerified: false and verification email dispatched');

    // 2. Inspect captured verification email in test outbox
    const lastEmail = getLastTestEmail();
    assert.ok(lastEmail !== null, 'Email was delivered to test mail outbox');
    assert.strictEqual(lastEmail.to, aliceEmail.toLowerCase());
    assert.ok(lastEmail.text.includes('/verify-email?token='));
    recordPass('Verification email captured in outbox with proper recipient and link structure');

    // 3. Extract cryptographic verification token from email
    const matchToken = lastEmail.text.match(/token=([a-f0-9]+)/);
    assert.ok(matchToken && matchToken[1], 'Raw token exists in email link');
    const rawVerificationToken = matchToken[1];
    recordPass('Cryptographic verification token extracted from email body');

    // 4. Verify database stores SHA-256 hash digest, never raw token
    const userInDb = await User.findById(jsonReg.user._id).select('+verificationTokenHash');
    assert.notStrictEqual(userInDb.verificationTokenHash, rawVerificationToken);
    assert.strictEqual(userInDb.verificationTokenHash.length, 64); // SHA-256 hex string is 64 chars
    recordPass('Database stores 64-char SHA-256 token digest, never raw token');

    // 5. Unverified user login is rejected with HTTP 403 Forbidden
    const resUnverifiedLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: aliceEmail,
        password: alicePassword
      })
    });
    assert.strictEqual(resUnverifiedLogin.status, 403);
    const jsonUnverifiedLogin = await resUnverifiedLogin.json();
    assert.ok(jsonUnverifiedLogin.message.includes('verify your email'));
    recordPass('Unverified user login rejected with HTTP 403 Forbidden');

    // 6. Verify email with invalid token returns HTTP 400
    const resBadToken = await fetch(`${baseUrl}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'invalid_deadbeef_token_12345' })
    });
    assert.strictEqual(resBadToken.status, 400);
    recordPass('Invalid verification token rejected with HTTP 400');

    // 7. Expired verification token rejected
    await User.findByIdAndUpdate(jsonReg.user._id, {
      verificationTokenExpiresAt: new Date(Date.now() - 1000)
    });
    const resExpiredVerify = await fetch(`${baseUrl}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: rawVerificationToken })
    });
    assert.strictEqual(resExpiredVerify.status, 400);
    recordPass('Expired verification token rejected with HTTP 400');

    // Restore expiration for valid verification
    await User.findByIdAndUpdate(jsonReg.user._id, {
      verificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    // 8. Valid token accepted -> isEmailVerified becomes true
    const resValidVerify = await fetch(`${baseUrl}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: rawVerificationToken })
    });
    assert.strictEqual(resValidVerify.status, 200);
    const verifiedUser = await User.findById(jsonReg.user._id).select('+verificationTokenHash');
    assert.strictEqual(verifiedUser.isEmailVerified, true);
    assert.strictEqual(verifiedUser.verificationTokenHash, undefined);
    recordPass('Valid verification token accepted with HTTP 200; isEmailVerified becomes true');

    // 9. Replay attack: Used verification token cannot be reused
    const resReplayVerify = await fetch(`${baseUrl}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: rawVerificationToken })
    });
    assert.strictEqual(resReplayVerify.status, 400);
    recordPass('Token reuse rejected: already used verification token rejected with HTTP 400');

    // 10. Resend verification avoids enumeration with generic response
    clearTestOutbox();
    const resResend = await fetch(`${baseUrl}/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent_account_xyz@example.com' })
    });
    assert.strictEqual(resResend.status, 200);
    const jsonResend = await resResend.json();
    assert.ok(jsonResend.message.includes('If an account exists'));
    assert.strictEqual(getLastTestEmail(), null);
    recordPass('Resend verification avoids enumeration with generic message for unknown email');

    // 11. Now Alice can log in successfully
    const resAliceLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: aliceEmail,
        password: alicePassword
      })
    });
    assert.strictEqual(resAliceLogin.status, 200);
    const aliceCookie = extractAuthCookie(resAliceLogin);
    assert.ok(aliceCookie.length > 0);
    recordPass('Verified user completes login successfully with HTTP 200 and auth cookie');

    // 12. Forgot password request returns safe generic response without exposing user existence
    clearTestOutbox();
    const resForgotUnknown = await fetch(`${baseUrl}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'unknown_account_xyz@example.com' })
    });
    assert.strictEqual(resForgotUnknown.status, 200);
    const jsonForgotUnknown = await resForgotUnknown.json();
    assert.ok(jsonForgotUnknown.message.includes('If an account exists'));
    recordPass('Forgot password returns safe generic response without exposing account existence');

    // 13. Forgot password for Alice dispatches reset email to outbox
    const resForgotAlice = await fetch(`${baseUrl}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: aliceEmail })
    });
    assert.strictEqual(resForgotAlice.status, 200);
    const resetEmail = getLastTestEmail();
    assert.ok(resetEmail !== null);
    assert.ok(resetEmail.text.includes('/reset-password?token='));
    const matchResetToken = resetEmail.text.match(/token=([a-f0-9]+)/);
    const rawResetToken = matchResetToken[1];
    recordPass('Password reset email dispatched to outbox with reset token link');

    // 14. Expired password reset token rejected
    await User.findByIdAndUpdate(jsonReg.user._id, {
      resetPasswordTokenExpiresAt: new Date(Date.now() - 1000)
    });
    const resExpiredReset = await fetch(`${baseUrl}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: rawResetToken,
        password: 'NewAlicePassword123!',
        confirmPassword: 'NewAlicePassword123!'
      })
    });
    assert.strictEqual(resExpiredReset.status, 400);
    recordPass('Expired password reset token rejected with HTTP 400');

    // Restore reset token expiry for valid reset
    await User.findByIdAndUpdate(jsonReg.user._id, {
      resetPasswordTokenExpiresAt: new Date(Date.now() + 30 * 60 * 1000)
    });

    // 15. Valid password reset succeeds and updates password
    const newAlicePassword = 'NewAlicePassword123!';
    const resValidReset = await fetch(`${baseUrl}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: rawResetToken,
        password: newAlicePassword,
        confirmPassword: newAlicePassword
      })
    });
    assert.strictEqual(resValidReset.status, 200);
    recordPass('Valid password reset succeeds with HTTP 200');

    // 16. Verify new password authenticates and old password fails
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

    // 17. Previous session token is invalidated by tokenVersion change
    const resOldSessionCheck = await fetch(`${baseUrl}/auth/me`, {
      headers: { Cookie: aliceCookie }
    });
    assert.strictEqual(resOldSessionCheck.status, 401);
    recordPass('Session invalidation: previous JWT rejected with HTTP 401 after password reset');

    // ----------------------------------------------------
    // PHASE 6: Authentication Security, Strict TokenVersion & RBAC Tests
    // ----------------------------------------------------
    console.log('\n--- Section 2: Phase 6 Strict TokenVersion & Authorization Tests ---');

    // 18. Protected route rejects missing JWT
    const resNoToken = await fetch(`${baseUrl}/auth/me`);
    assert.strictEqual(resNoToken.status, 401);
    recordPass('requireAuth rejects missing authentication token with HTTP 401');

    // 19. Protected route rejects invalid signature
    const resTampered = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: 'Bearer invalid.tampered.token' }
    });
    assert.strictEqual(resTampered.status, 401);
    recordPass('requireAuth rejects invalid/tampered JWT signature with HTTP 401');

    // 20. Strict tokenVersion: JWT missing tokenVersion claim is strictly rejected with HTTP 401
    const aliceDb = await User.findById(jsonReg.user._id).select('+tokenVersion');
    const tokenWithoutVersion = generateToken({
      userId: aliceDb._id.toString(),
      role: 'user'
      // tokenVersion intentionally omitted
    });
    const resNoVersionClaim = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${tokenWithoutVersion}` }
    });
    assert.strictEqual(resNoVersionClaim.status, 401);
    const jsonNoVersionClaim = await resNoVersionClaim.json();
    assert.ok(jsonNoVersionClaim.message.includes('token version'));
    recordPass('Strict tokenVersion: JWT with missing tokenVersion claim rejected with HTTP 401');

    // 21. Strict tokenVersion: JWT with mismatched/incorrect tokenVersion is rejected with HTTP 401
    const tokenWithWrongVersion = generateToken({
      userId: aliceDb._id.toString(),
      role: 'user',
      tokenVersion: (aliceDb.tokenVersion || 0) + 999
    });
    const resWrongVersion = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${tokenWithWrongVersion}` }
    });
    assert.strictEqual(resWrongVersion.status, 401);
    recordPass('Strict tokenVersion: JWT with mismatched tokenVersion rejected with HTTP 401');

    // 22. Strict tokenVersion: JWT with matching integer tokenVersion is accepted with HTTP 200
    const tokenWithCorrectVersion = generateToken({
      userId: aliceDb._id.toString(),
      role: 'user',
      tokenVersion: aliceDb.tokenVersion
    });
    const resCorrectVersion = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${tokenWithCorrectVersion}` }
    });
    assert.strictEqual(resCorrectVersion.status, 200);
    recordPass('Strict tokenVersion: JWT with correct matching tokenVersion accepted with HTTP 200');

    // 23. Suspended user session rejected
    await User.findByIdAndUpdate(jsonReg.user._id, { accountStatus: 'suspended' });
    const resSuspendedAuth = await fetch(`${baseUrl}/auth/me`, {
      headers: { Cookie: freshAliceCookie }
    });
    assert.strictEqual(resSuspendedAuth.status, 403);
    recordPass('requireAuth rejects suspended user account with HTTP 403 Forbidden');
    await User.findByIdAndUpdate(jsonReg.user._id, { accountStatus: 'active' });

    // 24. Normal user accessing admin API rejected with HTTP 403
    const resAdminForbidden = await fetch(`${baseUrl}/admin/status`, {
      headers: { Cookie: freshAliceCookie }
    });
    assert.strictEqual(resAdminForbidden.status, 403);
    recordPass('requireRole("admin") strictly rejects normal user with HTTP 403 Forbidden');

    // 25. Create dedicated admin user in looply_test and verify authorized admin access
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

    // 26. GET /api/profile/me retrieves current user profile without passwordHash or tokenVersion
    const resGetProfile = await fetch(`${baseUrl}/profile/me`, {
      headers: { Cookie: freshAliceCookie }
    });
    const jsonGetProfile = await resGetProfile.json();
    assert.strictEqual(resGetProfile.status, 200);
    assert.strictEqual(jsonGetProfile.user.fullName, 'Alice Johnson');
    assert.strictEqual(jsonGetProfile.user.passwordHash, undefined);
    assert.strictEqual(jsonGetProfile.user.tokenVersion, undefined);
    recordPass('GET /api/profile/me returns current user profile excluding sensitive hashes and tokenVersion');

    // 27. PATCH /api/profile/me updates fullName, bio, avatarUrl
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

    // 28. PATCH /api/profile/me strictly rejects protected fields (role, email, tokenVersion)
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

    // 29. PATCH /api/profile/me rejects invalid avatar URL format
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

    // 30. GET /api/profiles/:userId returns public profile excluding email, credentials, and tokenVersion
    const resPublicProfile = await fetch(`${baseUrl}/profiles/${jsonReg.user._id}`);
    const jsonPublicProfile = await resPublicProfile.json();
    assert.strictEqual(resPublicProfile.status, 200);
    assert.strictEqual(jsonPublicProfile.profile.fullName, 'Alice J. Morgan');
    assert.strictEqual(jsonPublicProfile.profile.email, undefined);
    assert.strictEqual(jsonPublicProfile.profile.passwordHash, undefined);
    assert.strictEqual(jsonPublicProfile.profile.tokenVersion, undefined);
    recordPass('GET /api/profiles/:userId returns public profile strictly excluding private email & tokens');

    // ----------------------------------------------------
    // PHASE 8: Post Creation, Atomic Deletion & Management Tests
    // ----------------------------------------------------
    console.log('\n--- Section 4: Phase 8 Post Creation & Atomic CRUD Tests ---');

    // 31. Create post with valid content
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

    // 32. Post creation rejects empty content
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

    // 33. Post creation rejects content exceeding 1000 characters
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

    // 34. GET /api/posts/mine returns authenticated user's posts
    const resMyPosts = await fetch(`${baseUrl}/posts/mine`, {
      headers: { Cookie: freshAliceCookie }
    });
    const jsonMyPosts = await resMyPosts.json();
    assert.strictEqual(resMyPosts.status, 200);
    assert.ok(jsonMyPosts.posts.length >= 1);
    assert.strictEqual(jsonMyPosts.posts[0]._id, jsonCreatePost.post._id);
    recordPass('GET /api/posts/mine retrieves user personal posts with pagination metadata');

    // 35. GET /api/posts/:postId retrieves single post
    const resGetSinglePost = await fetch(`${baseUrl}/posts/${jsonCreatePost.post._id}`);
    const jsonGetSinglePost = await resGetSinglePost.json();
    assert.strictEqual(resGetSinglePost.status, 200);
    assert.strictEqual(jsonGetSinglePost.post._id, jsonCreatePost.post._id);
    recordPass('GET /api/posts/:postId retrieves post with populated author info');

    // 36. GET /api/posts/:postId returns HTTP 400 on invalid ObjectId
    const resBadPostId = await fetch(`${baseUrl}/posts/not-an-objectid`);
    assert.strictEqual(resBadPostId.status, 400);
    recordPass('GET /api/posts/:postId returns HTTP 400 on malformed ObjectId');

    // 37. Author can update their own post
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

    // 38. Non-author user rejected when attempting to edit another user's post
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

    // 39. Non-author user rejected when attempting to delete another user's post
    const resBobDeleteAlice = await fetch(`${baseUrl}/posts/${jsonCreatePost.post._id}`, {
      method: 'DELETE',
      headers: { Cookie: bobCookie }
    });
    assert.strictEqual(resBobDeleteAlice.status, 403);
    recordPass('DELETE /api/posts/:postId rejects non-owner delete attempt with HTTP 403 Forbidden');

    // 40. Atomic post deletion: rollback on simulated failure preserves post, comments and likes
    const atomicPost = await Post.create({ author: aliceDb._id, content: 'Atomic transaction test post' });
    createdPostIds.push(atomicPost._id);
    const comment1 = await Comment.create({ post: atomicPost._id, author: bobUser._id, content: 'Nice atomic post' });
    const like1 = await Like.create({ post: atomicPost._id, user: bobUser._id });

    let rollbackErrorCaught = false;
    try {
      await deletePostService({ postId: atomicPost._id, authorId: aliceDb._id, _forceFailForTest: true });
    } catch {
      rollbackErrorCaught = true;
    }
    assert.strictEqual(rollbackErrorCaught, true, 'Error should be thrown on simulated failure');
    const preservedPost = await Post.findById(atomicPost._id);
    const preservedComment = await Comment.findById(comment1._id);
    const preservedLike = await Like.findById(like1._id);
    assert.ok(preservedPost, 'Post must be preserved on transaction abort');
    assert.ok(preservedComment, 'Comment must be preserved on transaction abort');
    assert.ok(preservedLike, 'Like must be preserved on transaction abort');
    recordPass('Transaction rollback on simulated failure preserves post, comments and likes');

    // 41. Atomic post deletion: successful transaction deletes post and associated comments and likes
    const resDeletePost = await fetch(`${baseUrl}/posts/${atomicPost._id}`, {
      method: 'DELETE',
      headers: { Cookie: freshAliceCookie }
    });
    assert.strictEqual(resDeletePost.status, 200);
    const postInDb = await Post.findById(atomicPost._id);
    const commentInDb = await Comment.findById(comment1._id);
    const likeInDb = await Like.findById(like1._id);
    assert.strictEqual(postInDb, null, 'Post should be deleted');
    assert.strictEqual(commentInDb, null, 'Associated comments should be atomically deleted');
    assert.strictEqual(likeInDb, null, 'Associated likes should be atomically deleted');
    recordPass('DELETE /api/posts/:postId atomically removes post, associated comments and likes');

    // Clean up original post from Alice
    await fetch(`${baseUrl}/posts/${jsonCreatePost.post._id}`, {
      method: 'DELETE',
      headers: { Cookie: freshAliceCookie }
    });

    // ----------------------------------------------------
    // PHASE 9: Social Media Feed and Explore Tests
    // ----------------------------------------------------
    console.log('\n--- Section 5: Phase 9 Social Feed, Explore & Account Status Filtering Tests ---');

    // Create 3 active posts in chronological order
    const post1 = await Post.create({ author: aliceDb._id, content: 'First post in test stream' });
    createdPostIds.push(post1._id);
    await new Promise((r) => setTimeout(r, 50));
    const post2 = await Post.create({ author: bobUser._id, content: 'Second post by Bob' });
    createdPostIds.push(post2._id);
    await new Promise((r) => setTimeout(r, 50));
    const post3 = await Post.create({ author: aliceDb._id, content: 'Third and newest post by Alice' });
    createdPostIds.push(post3._id);

    // Create a suspended user and a post from them
    const suspendedUser = new User({
      fullName: 'Suspended Sam',
      email: `suspended_${timestamp}@example.com`,
      passwordHash: await bcrypt.hash('SuspendedPass123!', 12),
      role: 'user',
      isEmailVerified: true,
      accountStatus: 'suspended'
    });
    await suspendedUser.save();
    createdUserIds.push(suspendedUser._id);
    const suspendedPost = await Post.create({ author: suspendedUser._id, content: 'Spam from suspended user' });
    createdPostIds.push(suspendedPost._id);

    // Create an orphaned post (deleted author)
    const nonexistentAuthorId = new mongoose.Types.ObjectId();
    const orphanedPost = await Post.create({ author: nonexistentAuthorId, content: 'Post with deleted author' });
    createdPostIds.push(orphanedPost._id);

    // 42. GET /api/feed returns posts in reverse chronological order
    const resFeed = await fetch(`${baseUrl}/feed?page=1&limit=10`, {
      headers: { Cookie: freshAliceCookie }
    });
    const jsonFeed = await resFeed.json();
    assert.strictEqual(resFeed.status, 200);
    assert.ok(jsonFeed.posts.length >= 3);
    assert.strictEqual(jsonFeed.posts[0]._id, post3._id.toString());
    assert.strictEqual(jsonFeed.posts[1]._id, post2._id.toString());
    recordPass('GET /api/feed returns posts in strict reverse chronological order (newest first)');

    // 43. GET /api/feed verifies safe author population without passwordHash
    const firstFeedPost = jsonFeed.posts[0];
    assert.ok(firstFeedPost.author && firstFeedPost.author.fullName);
    assert.strictEqual(firstFeedPost.author.passwordHash, undefined);
    recordPass('GET /api/feed populates safe author details; passwordHash strictly excluded');

    // 44. Feed pagination inputs verified
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

    // 45. Feed excludes suspended user's post and deleted author's post
    const allFeedPostIds = jsonFeed.posts.map((p) => p._id.toString());
    assert.ok(!allFeedPostIds.includes(suspendedPost._id.toString()), 'Suspended user post must not appear in feed');
    assert.ok(!allFeedPostIds.includes(orphanedPost._id.toString()), 'Deleted author post must not appear in feed');
    recordPass('GET /api/feed strictly filters out posts from suspended accounts and deleted authors');

    // 46. GET /api/explore returns recent discovery posts and excludes suspended/deleted authors
    const resExplore = await fetch(`${baseUrl}/explore?page=1&limit=10`);
    const jsonExplore = await resExplore.json();
    assert.strictEqual(resExplore.status, 200);
    assert.ok(jsonExplore.posts.length >= 3);
    const explorePostIds = jsonExplore.posts.map((p) => p._id.toString());
    assert.ok(!explorePostIds.includes(suspendedPost._id.toString()), 'Suspended user post must not appear in explore');
    assert.ok(!explorePostIds.includes(orphanedPost._id.toString()), 'Deleted author post must not appear in explore');
    recordPass('GET /api/explore strictly excludes posts from suspended accounts and deleted authors');

    // 47. GET /api/profiles/:userId/posts for suspended user returns empty list and total 0
    const resSuspendedTimeline = await fetch(`${baseUrl}/profiles/${suspendedUser._id}/posts`);
    const jsonSuspendedTimeline = await resSuspendedTimeline.json();
    assert.strictEqual(resSuspendedTimeline.status, 200);
    assert.strictEqual(jsonSuspendedTimeline.posts.length, 0);
    assert.strictEqual(jsonSuspendedTimeline.pagination.total, 0);
    recordPass('Suspended user public profile posts are not publicly returned (empty timeline, total 0)');

    // 48. GET /api/profiles/:userId/posts retrieves posts for active user
    const resAliceTimeline = await fetch(`${baseUrl}/profiles/${aliceDb._id}/posts`);
    const jsonAliceTimeline = await resAliceTimeline.json();
    assert.strictEqual(resAliceTimeline.status, 200);
    assert.ok(jsonAliceTimeline.posts.every((p) => p.author._id.toString() === aliceDb._id.toString()));
    recordPass('GET /api/profiles/:userId/posts retrieves posts belonging strictly to requested active user');

    // 49. Pagination total counts strictly reflect only visible active posts
    assert.strictEqual(jsonFeed.pagination.total, jsonFeed.posts.length);
    recordPass('Feed pagination total count strictly reflects only visible active posts');

    // ----------------------------------------------------
    // End-to-End Complete Integrated Lifecycle Test
    // ----------------------------------------------------
    console.log('\n--- Section 6: End-to-End Complete Integrated Lifecycle ---');

    // 50. Integrated lifecycle: Register -> Outbox -> Verify -> Login -> Profile -> Post -> Feed -> Delete -> Logout
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

    // Delete post atomically
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
          await Comment.deleteMany({ post: { $in: createdPostIds } });
          await Like.deleteMany({ post: { $in: createdPostIds } });
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
