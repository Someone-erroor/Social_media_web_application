import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import puppeteer from 'puppeteer-core';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { connectDatabase, disconnectDatabase, isDatabaseConnected } from '../src/config/database.js';
import { AUTH_COOKIE_NAME } from '../src/config/jwt.js';
import { User, ActivityLog } from '../src/models/index.js';
import app from '../src/app.js';
import { validateTestDatabaseSafety, getTestMongoUri, findChromeExecutable } from './test-helpers.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

/**
 * Polls a URL until it returns a successful HTTP response or times out.
 */
async function waitForServer(url, timeoutMs = 30000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status < 500) {
        return true;
      }
    } catch {
      // Server not yet listening
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Timeout waiting for server at ${url} after ${timeoutMs}ms`);
}

async function runE2EBrowserTests() {
  console.log('====================================================');
  console.log('LOOPLY — PHASE 4 END-TO-END BROWSER AUTHENTICATION');
  console.log('====================================================\n');

  // 1. Establish database connection to dedicated looply_test database
  const testUri = getTestMongoUri();
  validateTestDatabaseSafety(testUri);
  await connectDatabase(testUri);
  const activeDb = mongoose.connection.name || mongoose.connection.db?.databaseName;
  assert(
    isDatabaseConnected() && activeDb === 'looply_test',
    `1. Connected to dedicated test database: "${activeDb}"`
  );

  // Pre-test assertion: Verify database name before creating any records
  if (activeDb !== 'looply_test') {
    throw new Error(
      `CRITICAL SAFETY CHECK: Expected database "looply_test", but active database is "${activeDb}". Halting E2E execution.`
    );
  }
  assert(true, 'Verified mongoose.connection.name === "looply_test" before browser test actions');

  // 2. Start Express API Server on port 5000
  console.log('\n--- Starting Express API Server on port 5000 ---');
  let expressServer;
  try {
    expressServer = app.listen(5000);
    await new Promise((resolve, reject) => {
      expressServer.on('listening', resolve);
      expressServer.on('error', reject);
    });
  } catch (err) {
    if (err.code === 'EADDRINUSE') {
      console.log('Port 5000 already in use, testing connectivity...');
    } else {
      throw err;
    }
  }
  await waitForServer('http://127.0.0.1:5000/api/health', 10000);
  assert(true, '2. Express backend listening and healthy on port 5000');

  // 3. Start Next.js frontend server on port 3000
  console.log('\n--- Starting Next.js Production Frontend on port 3000 ---');
  const clientDir = path.resolve(__dirname, '../../client');
  let nextProcess;
  try {
    const isPort3000Alive = await fetch('http://127.0.0.1:3000')
      .then(() => true)
      .catch(() => false);

    if (!isPort3000Alive) {
      nextProcess = spawn(
        process.platform === 'win32' ? 'npx.cmd' : 'npx',
        ['next', 'start', '-p', '3000'],
        {
          cwd: clientDir,
          stdio: 'pipe',
          shell: true
        }
      );

      nextProcess.stderr.on('data', (d) => {
        const text = d.toString();
        if (text.includes('Error')) console.error(`[Next.js Error] ${text}`);
      });
    }
  } catch (e) {
    console.warn('Next.js process spawn notice:', e.message);
  }

  await waitForServer('http://127.0.0.1:3000', 30000);
  assert(true, '3. Next.js frontend listening and responsive on port 3000');

  // 4. Launch Headless Chrome via puppeteer-core using portable executable finder
  console.log('\n--- Launching Portable Headless Chrome Browser ---');
  const chromePath = findChromeExecutable();
  console.log(`Discovered portable Chrome binary: ${chromePath}`);

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1280,800'
    ]
  });
  assert(Boolean(browser), '4. Portable Headless Chrome browser launched successfully');

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const testTimestamp = Date.now();
  const testUserEmail = `browser_e2e_${testTimestamp}@example.com`;
  const testUserPassword = 'BrowserSecurePassword123!';
  const testUserFullName = 'Browser E2E User';
  let createdUserId = null;

  try {
    // 5. Navigate to Register Page in Browser
    console.log('\n--- Step 1: User Registration via Real Browser UI ---');
    await page.goto('http://localhost:3000/register', { waitUntil: 'networkidle2' });
    const pageTitle = await page.title();
    assert(pageTitle.includes('Looply'), `5. Loaded registration page (title: "${pageTitle}")`);

    // Verify form elements exist
    await page.waitForSelector('#register-name');
    await page.waitForSelector('#register-email');
    await page.waitForSelector('#register-password');
    await page.waitForSelector('#register-confirm-password');
    await page.waitForSelector('#terms');

    // Fill registration form
    await page.type('#register-name', testUserFullName);
    await page.type('#register-email', testUserEmail);
    await page.type('#register-password', testUserPassword);
    await page.type('#register-confirm-password', testUserPassword);
    await page.click('#terms');

    // Submit registration form
    console.log('Submitting registration form...');
    await page.click('button[type="submit"]');

    // Wait for redirect to login page
    await page.waitForFunction(() => window.location.pathname === '/login', { timeout: 15000 });
    assert(true, '6. Browser automatically navigated to /login after successful registration');

    // 6. Confirm user is created in MongoDB test database
    console.log('\n--- Step 2: Database Verification for Created User ---');
    const createdUser = await User.findOne({ email: testUserEmail }).select('+passwordHash');
    assert(Boolean(createdUser), '7. User document verified in dedicated "looply_test" MongoDB database');
    if (createdUser) {
      createdUserId = createdUser._id;
      assert(createdUser.fullName === testUserFullName, `8. Stored full name matches: "${createdUser.fullName}"`);
      assert(createdUser.role === 'user', `9. Authoritative database role is strictly "user" (role escalation blocked)`);
      assert(createdUser.isEmailVerified === false, '10. Initial email verification status is false');

      // 7. Confirm password is encrypted with bcrypt
      assert(
        Boolean(createdUser.passwordHash && createdUser.passwordHash.startsWith('$2')),
        '11. Password stored as high-entropy bcrypt hash ($2a$/$2b$), never plaintext'
      );
      const isPasswordValid = await bcrypt.compare(testUserPassword, createdUser.passwordHash);
      assert(isPasswordValid, '12. Stored bcrypt hash successfully verifies against original plaintext password');
    }

    // 8. Role Escalation Prevention Verification via direct API injection
    console.log('\n--- Step 3: Direct API Role Escalation Prevention Check ---');
    const escalationRes = await page.evaluate(async (email) => {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fullName: 'Hacker Browser',
          email: `hacker_${Date.now()}@example.com`,
          password: 'Password123!',
          confirmPassword: 'Password123!',
          role: 'admin'
        })
      });
      return res.json();
    });
    assert(
      escalationRes?.success === true && escalationRes?.user?.role === 'user',
      '13. Registration strictly enforces role="user" even when role="admin" is injected in payload'
    );
    if (escalationRes?.user?._id) {
      await User.findByIdAndDelete(escalationRes.user._id);
    }

    // 9. Login through the Browser
    console.log('\n--- Step 4: Login Authentication via Real Browser UI ---');
    await page.waitForSelector('#login-email', { timeout: 10000 });
    await page.waitForSelector('#login-password', { timeout: 10000 });

    await page.type('#login-email', testUserEmail);
    await page.type('#login-password', testUserPassword);

    console.log('Submitting login form in browser...');
    await page.click('button[type="submit"]');

    // Wait for redirect to /feed
    await page.waitForFunction(() => window.location.pathname === '/feed', { timeout: 15000 });
    assert(true, '14. Browser redirected to /feed after successful login');

    // 10. Confirm HTTP-only cookie is issued in browser
    console.log('\n--- Step 5: Cookie Inspection in Browser Client ---');
    // Inspect cookies via CDP Network domain to capture all attributes
    const client = await page.createCDPSession();
    const { cookies } = await client.send('Network.getAllCookies');
    const authCookie = cookies.find((c) => c.name === AUTH_COOKIE_NAME);

    assert(Boolean(authCookie), `15. "${AUTH_COOKIE_NAME}" authentication cookie exists in browser cookie jar`);
    assert(authCookie?.httpOnly === true, '16. Cookie has HttpOnly flag set (inaccessible to malicious scripts)');
    assert(authCookie?.path === '/', '17. Cookie has Path=/ set');

    // 11. Confirm UI displays authenticated user
    await page.waitForSelector('aside[aria-label="User Sidebar"]', { timeout: 10000 });
    const pageText = await page.evaluate(() => document.body.innerText);
    assert(
      pageText.includes('Browser E2E User'),
      '18. UI reflects active authenticated session (displays user full name in UserSidebar)'
    );

    // 12. Refresh the browser and confirm session restoration
    console.log('\n--- Step 6: Session Restoration upon Page Refresh ---');
    await page.reload({ waitUntil: 'networkidle2' });
    const currentPath = await page.evaluate(() => window.location.pathname);
    assert(currentPath === '/feed', '19. Path remains /feed after full browser reload');

    // Wait for client-side AuthProvider useEffect(getMe) to complete and render user name
    await page.waitForFunction(
      (name) => document.body.innerText.includes(name),
      { timeout: 10000 },
      testUserFullName
    );
    const refreshedText = await page.evaluate(() => document.body.innerText);
    assert(
      refreshedText.includes(testUserFullName),
      '20. Session restored automatically from HTTP-only cookie via GET /api/auth/me'
    );

    // 13. Verify API calls use credentials: 'include'
    console.log('\n--- Step 7: Verify Client API credentials: include ---');
    const meResult = await page.evaluate(async () => {
      // apiClient in window context
      const res = await fetch('http://localhost:5000/api/auth/me', {
        credentials: 'include'
      });
      return { status: res.status, data: await res.json() };
    });
    assert(
      meResult.status === 200 && meResult.data?.success === true && meResult.data?.user?.email === testUserEmail,
      '21. Authenticated session verified with credentials: "include" fetch call'
    );

    // 14. Logout through the Browser
    console.log('\n--- Step 8: User Logout via Real Browser UI ---');
    const logoutBtn = await page.waitForSelector('button[aria-label="Sign Out"]', { timeout: 10000 });
    assert(Boolean(logoutBtn), '22. "Sign Out" button found in UserSidebar');

    await logoutBtn.click();
    await page.waitForFunction(() => window.location.pathname === '/login', { timeout: 15000 });
    assert(true, '23. Browser navigated to /login after clicking Sign Out');

    // 15. Confirm Cookie Removal
    console.log('\n--- Step 9: Verify Cookie Cleared after Logout ---');
    const { cookies: postLogoutCookies } = await client.send('Network.getAllCookies');
    const postLogoutAuthCookie = postLogoutCookies.find(
      (c) => c.name === AUTH_COOKIE_NAME && c.expires > Date.now() / 1000
    );
    assert(
      !postLogoutAuthCookie,
      '24. Authentication cookie is cleared / expired from browser cookie jar upon logout'
    );

  } finally {
    // Clean up created user from MongoDB test database
    console.log('\n--- Cleaning up Test Artifacts from Dedicated Test Database ---');
    const finalDb = mongoose.connection.name || mongoose.connection.db?.databaseName;
    assert(
      finalDb === 'looply_test',
      'Verified mongoose.connection.name === "looply_test" before deleting any E2E test records'
    );

    if (finalDb !== 'looply_test') {
      console.error(`SAFETY ABORT: Current database is "${finalDb}". Cleanup prevented.`);
    } else if (createdUserId) {
      await User.findByIdAndDelete(createdUserId);
      await ActivityLog.deleteMany({ actor: createdUserId });
      console.log(`Cleaned up test user ${createdUserId} from "${finalDb}".`);
    }

    // Clean up browser and servers
    await browser.close();
    if (expressServer) {
      await new Promise((r) => expressServer.close(r));
    }
    if (nextProcess) {
      nextProcess.kill('SIGINT');
    }
    await disconnectDatabase();
  }

  console.log('\n====================================================');
  console.log(`E2E Browser Test Results: ${passed} passed, ${failed} failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runE2EBrowserTests().catch((err) => {
  console.error('[Fatal Error in E2E Browser Tests]', err);
  process.exit(1);
});
