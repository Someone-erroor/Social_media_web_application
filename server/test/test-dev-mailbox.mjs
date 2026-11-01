import assert from 'assert';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/index.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { getTestMongoUri, validateTestDatabaseSafety } from './test-helpers.mjs';
import { clearTestOutbox } from '../src/services/email.service.js';

async function runDevMailboxTests() {
  console.log('====================================================');
  console.log('LOOPLY — DEV MAILBOX & EMAIL PREVIEW TEST SUITE');
  console.log('====================================================\n');

  const testMongoUri = getTestMongoUri();
  validateTestDatabaseSafety(testMongoUri);
  await connectDatabase(testMongoUri);

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;
  const createdUserIds = [];

  let passed = 0;
  function pass(msg) {
    passed++;
    console.log(`✓ ${passed}. ${msg}`);
  }

  try {
    clearTestOutbox();

    // Test 1: Mailbox is empty initially
    const resEmpty = await fetch(`${baseUrl}/__dev/mailbox/latest`);
    const jsonEmpty = await resEmpty.json();
    assert.strictEqual(resEmpty.status, 200, 'Empty mailbox should return 200');
    assert.strictEqual(jsonEmpty.success, true);
    assert.strictEqual(jsonEmpty.data, null, 'Data should be null when no emails sent');
    pass('Empty mailbox returns data: null');

    // Test 2: Register a user in dev mode
    const timestamp = Date.now();
    const testEmail = `devtest_${timestamp}@example.com`;
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Dev Mailbox User',
        email: testEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!'
      })
    });
    const regJson = await regRes.json();
    assert.strictEqual(regRes.status, 201);
    assert.strictEqual(regJson.deliveryMode, 'preview', 'Delivery mode must be preview');
    const userId = regJson.user._id || regJson.user.id;
    createdUserIds.push(userId);
    pass('User registration reported deliveryMode: "preview"');

    // Test 3: Query latest mailbox entry
    const resLatest = await fetch(`${baseUrl}/__dev/mailbox/latest`);
    const jsonLatest = await resLatest.json();
    assert.strictEqual(resLatest.status, 200);
    assert.strictEqual(jsonLatest.success, true);
    assert.strictEqual(jsonLatest.data.recipient, testEmail);
    assert.ok(jsonLatest.data.actionUrl, 'Action URL must be present');
    assert.ok(jsonLatest.data.actionUrl.includes('/verify-email?token='), 'Action URL must target /verify-email');
    pass('GET /api/__dev/mailbox/latest returned recipient and actionUrl');

    // Test 4: Verify email using token from actionUrl
    const urlObj = new URL(jsonLatest.data.actionUrl, 'http://localhost:3000');
    const token = urlObj.searchParams.get('token');
    assert.ok(token, 'Token param must be non-empty');

    const verifyRes = await fetch(`${baseUrl}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    const verifyJson = await verifyRes.json();
    assert.strictEqual(verifyRes.status, 200, 'Verification must succeed with 200');
    assert.strictEqual(verifyJson.success, true);
    pass('Email verified successfully using token from dev mailbox');

    // Test 5: Verify user isEmailVerified is true in DB
    const dbUser = await User.findById(userId);
    assert.strictEqual(dbUser.isEmailVerified, true);
    pass('User isEmailVerified in database is now true');

    // Test 6: Forgot password generates dev email preview
    const forgotRes = await fetch(`${baseUrl}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });
    const forgotJson = await forgotRes.json();
    assert.strictEqual(forgotRes.status, 200);
    pass('Forgot password request succeeded');

    const resResetMail = await fetch(`${baseUrl}/__dev/mailbox/latest`);
    const jsonResetMail = await resResetMail.json();
    assert.strictEqual(jsonResetMail.data.recipient, testEmail);
    assert.ok(jsonResetMail.data.actionUrl.includes('/reset-password?token='), 'Reset password action URL matches');
    pass('Dev mailbox captured password reset email with reset actionUrl');

    console.log(`\n====================================================`);
    console.log(`Dev Mailbox Tests: ${passed} passed, 0 failed`);
    console.log(`====================================================\n`);
  } finally {
    if (createdUserIds.length > 0) {
      await User.deleteMany({ _id: { $in: createdUserIds } });
    }
    await new Promise((r) => server.close(r));
    await disconnectDatabase();
  }
}

runDevMailboxTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
