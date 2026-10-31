import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, execSync } from 'child_process';
import net from 'net';
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
 * Checks if a specific network port on localhost is available.
 * Resolves true if available, false if already bound/occupied.
 *
 * @param {number} port
 * @returns {Promise<boolean>}
 */
function checkPortAvailable(port) {
  return new Promise((resolve) => {
    const tester = net.createServer();
    tester.once('error', () => {
      resolve(false);
    });
    tester.once('listening', () => {
      tester.close(() => resolve(true));
    });
    // Listen without host so Node tests across all interfaces (IPv4 and IPv6 dual-stack)
    tester.listen(port);
  });
}

/**
 * Verifies that the compiled Next.js build output in .next inlined the expected API URL.
 * Scans generated chunk files to ensure the test backend URL is present.
 *
 * @param {string} clientDir
 * @param {string} expectedApiUrl
 * @returns {boolean}
 */
function verifyFrontendBuildApiUrl(clientDir, expectedApiUrl) {
  const dotNextDir = path.join(clientDir, '.next');
  if (!fs.existsSync(dotNextDir)) {
    return false;
  }

  function searchDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (searchDirectory(fullPath)) return true;
      } else if (entry.isFile() && fullPath.endsWith('.js')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.includes(expectedApiUrl)) {
            return true;
          }
        } catch {
          // ignore unreadable files
        }
      }
    }
    return false;
  }

  return searchDirectory(dotNextDir);
}

/**
 * Reliably terminates a spawned child process and all its child/descendant processes
 * across Windows, macOS, and Linux without killing any unrelated external processes.
 *
 * @param {import('child_process').ChildProcess} childProc - Target child process to terminate
 */
function terminateProcessTree(childProc) {
  if (!childProc || !childProc.pid) return;

  const pid = childProc.pid;

  if (process.platform === 'win32') {
    // Windows: taskkill /pid <PID> /T /F targets only this process and its child tree
    try {
      execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
    } catch {
      // Process or process tree may have already exited
    }
  } else {
    // Unix (macOS & Linux): terminate the child process and its descendants
    try {
      // 1. Terminate descendant processes by parent PID
      try {
        const descendantPids = execSync(`pgrep -P ${pid}`, { stdio: ['ignore', 'pipe', 'ignore'] })
          .toString()
          .trim()
          .split(/\s+/)
          .filter(Boolean);

        for (const childPid of descendantPids) {
          try {
            process.kill(Number(childPid), 'SIGKILL');
          } catch {}
        }
      } catch {
        // No descendants or pgrep exited with non-zero
      }

      // 2. Terminate the process group if spawned detached
      try {
        process.kill(-pid, 'SIGKILL');
      } catch {
        // Not a process group leader or already exited
      }

      // 3. Terminate the target process itself
      try {
        childProc.kill('SIGKILL');
      } catch {}
      try {
        process.kill(pid, 'SIGKILL');
      } catch {}
    } catch {
      // Process already terminated
    }
  }
}

async function runE2EBrowserTests() {
  console.log('====================================================');
  console.log('LOOPLY — PHASE 4 END-TO-END BROWSER AUTHENTICATION');
  console.log('====================================================\n');

  // Owned resource handles tracked under a single reliable try/finally lifecycle
  let expressServer = null;
  let buildProcess = null;
  let nextProcess = null;
  let browser = null;
  let createdUserId = null;

  try {
    // 1. Establish database connection to dedicated looply_test database
    console.log('--- Step 1: Connecting to Dedicated Test Database ---');
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
    assert(true, '2. Verified mongoose.connection.name === "looply_test" before browser test actions');

    // 2. Port Isolation Check: Abort if required ports are already occupied
    console.log('\n--- Step 2: Verifying Port Availability & Strict Process Isolation ---');
    const isPort5000Available = await checkPortAvailable(5000);
    if (!isPort5000Available) {
      throw new Error(
        'ABORT: Port 5000 is occupied by an existing process. The E2E test suite must start and control its own test backend and will never reuse an existing backend on port 5000. Please terminate the process on port 5000 and re-run.'
      );
    }

    const isPort3000Available = await checkPortAvailable(3000);
    if (!isPort3000Available) {
      throw new Error(
        'ABORT: Port 3000 is occupied by an existing process. The E2E test suite must start and control its own test frontend and will never reuse an unrelated frontend on port 3000. Please terminate the process on port 3000 and re-run.'
      );
    }
    assert(true, '3. Verified ports 5000 and 3000 are unoccupied. Test will start and control isolated instances.');

    // 3. Start Dedicated Express API Server on port 5000
    console.log('\n--- Step 3: Starting Dedicated Express Test Backend on port 5000 ---');
    expressServer = app.listen(5000, '127.0.0.1');
    await new Promise((resolve, reject) => {
      expressServer.on('listening', resolve);
      expressServer.on('error', reject);
    });

    // Verify actual health endpoint response (never accept arbitrary 4xx responses as healthy)
    const healthUrl = 'http://127.0.0.1:5000/api/health';
    const healthStartTime = Date.now();
    let backendHealthy = false;
    while (Date.now() - healthStartTime < 10000) {
      try {
        const res = await fetch(healthUrl);
        if (res.status === 200) {
          const data = await res.json();
          if (data && data.success === true && data.message === 'Looply backend is running') {
            backendHealthy = true;
            break;
          }
        }
      } catch {
        // Retry until listening
      }
      await new Promise((r) => setTimeout(r, 300));
    }

    if (!backendHealthy) {
      throw new Error('ABORT: Test backend on port 5000 failed health contract verification.');
    }
    assert(true, '4. Dedicated Express test backend started on port 5000 and verified healthy ({ success: true, message: "Looply backend is running" })');

    // 4. Build Dedicated Next.js Frontend specifically for E2E testing
    console.log('\n--- Step 4: Building Frontend Specifically for E2E Testing ---');
    console.log('Setting NEXT_PUBLIC_API_URL=http://127.0.0.1:5000/api before executing next build...');
    const clientDir = path.resolve(__dirname, '../../client');
    const buildCmd = process.platform === 'win32' ? (process.env.ComSpec || 'cmd.exe') : 'npx';
    const buildArgs = process.platform === 'win32' ? ['/c', 'npx', 'next', 'build'] : ['next', 'build'];

    let buildExitCode = -1;
    let buildStdout = '';
    let buildStderr = '';
    const maxBuildAttempts = 3;

    for (let attempt = 1; attempt <= maxBuildAttempts; attempt++) {
      if (attempt > 1) {
        console.log(`Retrying Next.js build (attempt ${attempt}/${maxBuildAttempts}) after transient error...`);
        await new Promise((r) => setTimeout(r, 1000));
      }

      buildStdout = '';
      buildStderr = '';
      buildProcess = spawn(
        buildCmd,
        buildArgs,
        {
          cwd: clientDir,
          stdio: ['ignore', 'pipe', 'pipe'],
          env: {
            ...process.env,
            NODE_ENV: 'production',
            NEXT_PUBLIC_API_URL: 'http://127.0.0.1:5000/api'
          }
        }
      );

      buildProcess.stdout?.on('data', (d) => {
        buildStdout += d.toString();
      });
      buildProcess.stderr?.on('data', (d) => {
        buildStderr += d.toString();
      });

      buildExitCode = await new Promise((resolve, reject) => {
        buildProcess.on('error', reject);
        buildProcess.on('close', resolve);
      });
      buildProcess = null;

      if (buildExitCode === 0) {
        break;
      }
    }

    if (buildExitCode !== 0) {
      throw new Error(`CRITICAL: E2E Frontend build failed with exit code ${buildExitCode}.\nStdout: ${buildStdout}\nStderr: ${buildStderr}`);
    }
    assert(buildExitCode === 0, '5. Frontend built specifically for E2E testing with NEXT_PUBLIC_API_URL=http://127.0.0.1:5000/api');

    // Verify generated frontend build uses the test backend
    const isBuildVerified = verifyFrontendBuildApiUrl(clientDir, 'http://127.0.0.1:5000/api');
    assert(isBuildVerified, '6. Verified generated frontend build inlined test backend URL (http://127.0.0.1:5000/api)');

    // 5. Start Dedicated Next.js Production Frontend on port 3000
    console.log('\n--- Step 5: Starting Dedicated Next.js Production Frontend on port 3000 ---');
    const startCmd = process.platform === 'win32' ? (process.env.ComSpec || 'cmd.exe') : 'npx';
    const startArgs = process.platform === 'win32' ? ['/c', 'npx', 'next', 'start', '-p', '3000'] : ['next', 'start', '-p', '3000'];

    nextProcess = spawn(
      startCmd,
      startArgs,
      {
        cwd: clientDir,
        stdio: 'pipe',
        detached: process.platform !== 'win32', // Allows clean process group termination on Unix
        env: {
          ...process.env,
          NODE_ENV: 'production',
          PORT: '3000',
          NEXT_PUBLIC_API_URL: 'http://127.0.0.1:5000/api'
        }
      }
    );

    nextProcess.stderr?.on('data', (d) => {
      const text = d.toString();
      if (text.includes('Error')) console.error(`[Next.js Error] ${text}`);
    });

    // Wait for frontend to return strictly HTTP 200 (never accept 4xx as healthy)
    const frontendUrl = 'http://127.0.0.1:3000';
    const frontendStartTime = Date.now();
    let frontendHealthy = false;
    while (Date.now() - frontendStartTime < 35000) {
      try {
        const res = await fetch(frontendUrl);
        if (res.status === 200) {
          frontendHealthy = true;
          break;
        }
      } catch {
        // Retry
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    if (!frontendHealthy) {
      throw new Error('ABORT: Test frontend failed to start and return HTTP 200 on port 3000.');
    }
    assert(true, '7. Next.js test frontend started on port 3000 with NEXT_PUBLIC_API_URL pointing to test backend');

    // 6. Launch Headless Chrome via puppeteer-core using portable executable finder
    console.log('\n--- Step 6: Launching Portable Headless Chrome Browser ---');
    const chromePath = findChromeExecutable();
    console.log(`Discovered portable Chrome binary: ${chromePath}`);

    browser = await puppeteer.launch({
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
    assert(Boolean(browser), '8. Portable Headless Chrome browser launched successfully');

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Enable Puppeteer request interception to validate and restrict all browser requests
    await page.setRequestInterception(true);
    const interceptedApiRequests = [];
    const requestViolations = [];

    page.on('request', (interceptedReq) => {
      const url = interceptedReq.url();
      try {
        if (url.includes('/api/')) {
          interceptedApiRequests.push(url);
          const isAllowedTestBackend = url.startsWith('http://127.0.0.1:5000/api');
          if (!isAllowedTestBackend) {
            requestViolations.push(url);
            console.error(`[Security Interception] Aborting unexpected API request: ${url}`);
            interceptedReq.abort('blockedbyclient');
            return;
          }
        }
        interceptedReq.continue();
      } catch {
        // Prevent unhandled rejection if request was already resolved/aborted
      }
    });

    const testTimestamp = Date.now();
    const testUserEmail = `browser_e2e_${testTimestamp}@example.com`;
    const testUserPassword = 'BrowserSecurePassword123!';
    const testUserFullName = 'Browser E2E User';

    // 7. Navigate to Register Page in Browser
    console.log('\n--- Step 7: User Registration via Real Browser UI ---');
    await page.goto('http://127.0.0.1:3000/register', { waitUntil: 'networkidle2' });
    const pageTitle = await page.title();
    assert(pageTitle.includes('Looply'), `9. Loaded registration page (title: "${pageTitle}")`);

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
    assert(true, '10. Browser automatically navigated to /login after successful registration');

    // 8. Confirm user is created in MongoDB test database
    console.log('\n--- Step 8: Database Verification for Created User ---');
    const createdUser = await User.findOne({ email: testUserEmail }).select('+passwordHash');
    assert(Boolean(createdUser), '11. User document verified in dedicated "looply_test" MongoDB database');
    if (createdUser) {
      createdUserId = createdUser._id;
      assert(createdUser.fullName === testUserFullName, `12. Stored full name matches: "${createdUser.fullName}"`);
      assert(createdUser.role === 'user', `13. Authoritative database role is strictly "user" (role escalation blocked)`);
      assert(createdUser.isEmailVerified === false, '14. Initial email verification status is false');

      // Confirm password is encrypted with bcrypt
      assert(
        Boolean(createdUser.passwordHash && createdUser.passwordHash.startsWith('$2')),
        '15. Password stored as high-entropy bcrypt hash ($2a$/$2b$), never plaintext'
      );
      const isPasswordValid = await bcrypt.compare(testUserPassword, createdUser.passwordHash);
      assert(isPasswordValid, '16. Stored bcrypt hash successfully verifies against original plaintext password');
    }

    // 9. Role Escalation Prevention Verification via direct API injection
    console.log('\n--- Step 9: Direct API Role Escalation Prevention Check ---');
    const escalationRes = await page.evaluate(async () => {
      const res = await fetch('http://127.0.0.1:5000/api/auth/register', {
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
      '17. Registration strictly enforces role="user" even when role="admin" is injected in payload'
    );
    if (escalationRes?.user?._id) {
      await User.findByIdAndDelete(escalationRes.user._id);
    }

    // 10. Login through the Browser
    console.log('\n--- Step 10: Login Authentication via Real Browser UI ---');
    await page.waitForSelector('#login-email', { timeout: 10000 });
    await page.waitForSelector('#login-password', { timeout: 10000 });

    await page.type('#login-email', testUserEmail);
    await page.type('#login-password', testUserPassword);

    console.log('Submitting login form in browser...');
    await page.click('button[type="submit"]');

    // Wait for redirect to /feed
    await page.waitForFunction(() => window.location.pathname === '/feed', { timeout: 15000 });
    assert(true, '18. Browser redirected to /feed after successful login');

    // 11. Confirm HTTP-only cookie is issued in browser
    console.log('\n--- Step 11: Cookie Inspection in Browser Client ---');
    const client = await page.createCDPSession();
    const { cookies } = await client.send('Network.getAllCookies');
    const authCookie = cookies.find((c) => c.name === AUTH_COOKIE_NAME);

    assert(Boolean(authCookie), `19. "${AUTH_COOKIE_NAME}" authentication cookie exists in browser cookie jar`);
    assert(authCookie?.httpOnly === true, '20. Cookie has HttpOnly flag set (inaccessible to malicious scripts)');
    assert(authCookie?.path === '/', '21. Cookie has Path=/ set');

    // 12. Confirm UI displays authenticated user
    await page.waitForSelector('aside[aria-label="User Sidebar"]', { timeout: 10000 });
    const pageText = await page.evaluate(() => document.body.innerText);
    assert(
      pageText.includes('Browser E2E User'),
      '22. UI reflects active authenticated session (displays user full name in UserSidebar)'
    );

    // 13. Refresh the browser and confirm session restoration
    console.log('\n--- Step 12: Session Restoration upon Page Refresh ---');
    await page.reload({ waitUntil: 'networkidle2' });
    const currentPath = await page.evaluate(() => window.location.pathname);
    assert(currentPath === '/feed', '23. Path remains /feed after full browser reload');

    // Wait for client-side AuthProvider useEffect(getMe) to complete and render user name
    await page.waitForFunction(
      (name) => document.body.innerText.includes(name),
      { timeout: 10000 },
      testUserFullName
    );
    const refreshedText = await page.evaluate(() => document.body.innerText);
    assert(
      refreshedText.includes(testUserFullName),
      '24. Session restored automatically from HTTP-only cookie via GET /api/auth/me'
    );

    // 14. Verify API calls use credentials: 'include'
    console.log('\n--- Step 13: Verify Client API credentials: include ---');
    const meResult = await page.evaluate(async () => {
      const res = await fetch('http://127.0.0.1:5000/api/auth/me', {
        credentials: 'include'
      });
      return { status: res.status, data: await res.json() };
    });
    assert(
      meResult.status === 200 && meResult.data?.success === true && meResult.data?.user?.email === testUserEmail,
      '25. Authenticated session verified with credentials: "include" fetch call'
    );

    // 15. Logout through the Browser
    console.log('\n--- Step 14: User Logout via Real Browser UI ---');
    const logoutBtn = await page.waitForSelector('button[aria-label="Sign Out"]', { timeout: 10000 });
    assert(Boolean(logoutBtn), '26. "Sign Out" button found in UserSidebar');

    await logoutBtn.click();
    await page.waitForFunction(() => window.location.pathname === '/login', { timeout: 15000 });
    assert(true, '27. Browser navigated to /login after clicking Sign Out');

    // 16. Confirm Cookie Removal
    console.log('\n--- Step 15: Verify Cookie Cleared after Logout ---');
    const { cookies: postLogoutCookies } = await client.send('Network.getAllCookies');
    const postLogoutAuthCookie = postLogoutCookies.find(
      (c) => c.name === AUTH_COOKIE_NAME && c.expires > Date.now() / 1000
    );
    assert(
      !postLogoutAuthCookie,
      '28. Authentication cookie is cleared / expired from browser cookie jar upon logout'
    );

    // 17. Security Assertions: Validate request interception & isolation
    console.log('\n--- Step 16: Request Interception & API Security Assertions ---');
    assert(
      requestViolations.length === 0,
      `29. Verified zero unexpected API request violations occurred (violations: ${requestViolations.length})`
    );
    assert(
      interceptedApiRequests.length > 0 &&
      interceptedApiRequests.every((u) => u.startsWith('http://127.0.0.1:5000/api')),
      `30. Verified all intercepted browser API requests (${interceptedApiRequests.length}) targeted test backend exclusively (http://127.0.0.1:5000/api)`
    );

    // Fail the test after collecting violations if any occurred
    if (requestViolations.length > 0) {
      throw new Error(
        `E2E SECURITY FAILURE: Detected ${requestViolations.length} unauthorized API requests: ${requestViolations.join(', ')}`
      );
    }

  } finally {
    // Single reliable cleanup lifecycle: guaranteed to run on any error, exception, or success
    console.log('\n--- Guaranteed E2E Resource Cleanup Lifecycle ---');

    // 1. Clean up created test user from dedicated test database
    if (createdUserId) {
      try {
        const activeDb = mongoose.connection.name || mongoose.connection.db?.databaseName;
        if (activeDb === 'looply_test') {
          await User.findByIdAndDelete(createdUserId);
          await ActivityLog.deleteMany({ actor: createdUserId });
          console.log(`✓ Cleaned up test user ${createdUserId} from "${activeDb}".`);
        } else {
          console.error(`SAFETY ABORT: Current database is "${activeDb}". User record cleanup skipped.`);
        }
      } catch (cleanupErr) {
        console.error('[Cleanup Warning: User document deletion]', cleanupErr.message);
      }
    }

    // 2. Clean up Headless Chrome browser
    if (browser) {
      try {
        console.log('Closing Headless Chrome browser...');
        await browser.close();
        console.log('✓ Headless Chrome browser closed.');
      } catch (browserErr) {
        console.error('[Cleanup Warning: Browser close]', browserErr.message);
      }
    }

    // 3. Clean up Next.js frontend process tree (reliable on Windows, macOS, and Linux)
    if (nextProcess && nextProcess.pid) {
      try {
        console.log(`Terminating Next.js test process tree (PID ${nextProcess.pid})...`);
        terminateProcessTree(nextProcess);
        console.log('✓ Next.js test process tree terminated.');
      } catch (procErr) {
        console.error('[Cleanup Warning: Next.js process termination]', procErr.message);
      }
    }

    // Clean up build process if interrupted midway
    if (buildProcess && buildProcess.pid) {
      try {
        terminateProcessTree(buildProcess);
      } catch {
        // ignore
      }
    }

    // 4. Clean up Express API server
    if (expressServer) {
      try {
        console.log('Closing Express test backend server on port 5000...');
        await new Promise((resolve) => {
          expressServer.close(() => resolve());
        });
        console.log('✓ Express test backend server closed.');
      } catch (serverErr) {
        console.error('[Cleanup Warning: Express server close]', serverErr.message);
      }
    }

    // 5. Clean up Mongoose connection
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      try {
        console.log('Disconnecting Mongoose test database connection...');
        await disconnectDatabase();
        console.log('✓ Mongoose test database disconnected.');
      } catch (dbErr) {
        console.error('[Cleanup Warning: Mongoose disconnect]', dbErr.message);
      }
    }
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
