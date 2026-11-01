import assert from 'assert';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';
import { User } from '../src/models/index.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { getTestMongoUri, validateTestDatabaseSafety } from './test-helpers.mjs';

async function runLoginLifecycleTests() {
  console.log('====================================================');
  console.log('LOOPLY — 10-STEP AUTHENTICATION LIFECYCLE TEST');
  console.log('====================================================\n');

  const testMongoUri = getTestMongoUri();
  validateTestDatabaseSafety(testMongoUri);
  await connectDatabase(testMongoUri);

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api/auth`;
  const createdUserIds = [];

  let passed = 0;
  function pass(msg) {
    passed++;
    console.log(`✓ ${passed}. ${msg}`);
  }

  try {
    const timestamp = Date.now();
    const testEmail = `logintest_${timestamp}@example.com`;
    const testPassword = 'SecurePassword123!';
    const passwordHash = await bcrypt.hash(testPassword, 12);

    // Setup active verified user
    const user = new User({
      fullName: 'Lifecycle Test User',
      email: testEmail,
      passwordHash,
      role: 'user',
      isEmailVerified: true,
      accountStatus: 'active',
      tokenVersion: 0
    });
    await user.save();
    createdUserIds.push(user._id);

    // Setup suspended user
    const suspendedEmail = `suspended_${timestamp}@example.com`;
    const suspendedUser = new User({
      fullName: 'Suspended User',
      email: suspendedEmail,
      passwordHash,
      role: 'user',
      isEmailVerified: true,
      accountStatus: 'suspended',
      tokenVersion: 0
    });
    await suspendedUser.save();
    createdUserIds.push(suspendedUser._id);

    // Step 1: Wrong password -> 401
    const resBadPass = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'WrongPassword!' })
    });
    const jsonBadPass = await resBadPass.json();
    assert.strictEqual(resBadPass.status, 401);
    assert.strictEqual(jsonBadPass.message, 'Invalid email or password.');
    pass('Wrong password correctly returns HTTP 401 with generic error message');

    // Step 2: Non-existent email -> 401
    const resNonExistent = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nobody_here@example.com', password: testPassword })
    });
    assert.strictEqual(resNonExistent.status, 401);
    pass('Unknown user email correctly returns HTTP 401');

    // Step 3: Suspended user -> 403
    const resSuspended = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: suspendedEmail, password: testPassword })
    });
    const jsonSuspended = await resSuspended.json();
    assert.strictEqual(resSuspended.status, 403);
    assert.ok(jsonSuspended.message.includes('suspended'));
    pass('Suspended account correctly returns HTTP 403 Forbidden with suspension notice');

    // Step 4: Successful login -> 200 with HttpOnly cookie
    const resLogin = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword })
    });
    const jsonLogin = await resLogin.json();
    assert.strictEqual(resLogin.status, 200);
    assert.strictEqual(jsonLogin.success, true);
    assert.strictEqual(jsonLogin.user.email, testEmail);
    assert.strictEqual(jsonLogin.user.passwordHash, undefined, 'passwordHash must never be exposed');

    const setCookieHeader = resLogin.headers.get('set-cookie');
    assert.ok(setCookieHeader, 'Set-Cookie header must be present');
    assert.ok(setCookieHeader.includes('looply_token='), 'Cookie name must be looply_token');
    assert.ok(setCookieHeader.toLowerCase().includes('httponly'), 'Cookie must have HttpOnly attribute');
    pass('Valid login succeeds (HTTP 200) and sets looply_token HttpOnly cookie');

    // Extract cookie for subsequent calls
    const cookieValue = setCookieHeader.split(';')[0];

    // Step 5: Session verification (GET /api/auth/me) with cookie
    const resMe = await fetch(`${baseUrl}/me`, {
      method: 'GET',
      headers: { Cookie: cookieValue }
    });
    const jsonMe = await resMe.json();
    assert.strictEqual(resMe.status, 200);
    assert.strictEqual(jsonMe.success, true);
    assert.strictEqual(jsonMe.user.email, testEmail);
    pass('GET /api/auth/me returns authenticated user from active cookie session');

    // Step 6: Logout -> 200 and clears cookie
    const resLogout = await fetch(`${baseUrl}/logout`, {
      method: 'POST',
      headers: { Cookie: cookieValue }
    });
    assert.strictEqual(resLogout.status, 200);
    const logoutCookie = resLogout.headers.get('set-cookie');
    assert.ok(logoutCookie, 'Logout must send cookie clear header');
    assert.ok(logoutCookie.includes('looply_token=;') || logoutCookie.includes('Max-Age=0') || logoutCookie.includes('Expires=Thu, 01 Jan 1970'), 'Cookie must be expired');
    pass('POST /api/auth/logout invalidates session and clears cookie');

    // Step 7: Subsequent GET /api/auth/me with old cookie is rejected (tokenVersion invalidated)
    const resMeAfter = await fetch(`${baseUrl}/me`, {
      method: 'GET',
      headers: { Cookie: cookieValue }
    });
    assert.strictEqual(resMeAfter.status, 401, 'Old cookie must be rejected after logout');
    pass('Subsequent GET /api/auth/me with revoked token returns HTTP 401');

    console.log(`\n====================================================`);
    console.log(`Login Lifecycle Tests: ${passed} passed, 0 failed`);
    console.log(`====================================================\n`);
  } finally {
    if (createdUserIds.length > 0) {
      await User.deleteMany({ _id: { $in: createdUserIds } });
    }
    await new Promise((r) => server.close(r));
    await disconnectDatabase();
  }
}

runLoginLifecycleTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});

