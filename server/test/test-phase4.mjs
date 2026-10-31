import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.js';
import { connectDatabase, disconnectDatabase, isDatabaseConnected } from '../src/config/database.js';
import { AUTH_COOKIE_NAME } from '../src/config/jwt.js';
import { User, ActivityLog } from '../src/models/index.js';
import app from '../src/app.js';
import { validateTestDatabaseSafety, getTestMongoUri } from './test-helpers.mjs';

export { validateTestDatabaseSafety, getTestMongoUri };

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

async function runPhase4Tests() {
  console.log('====================================================');
  console.log('LOOPLY — PHASE 4 AUTHENTICATION & LOGIN TEST SUITE');
  console.log('====================================================\n');

  // ====================================================
  // 0. TEST DATABASE CONFIGURATION & SAFETY CHECKS
  // ====================================================
  console.log('--- Section 0: Test Database Safety & Isolation ---');

  // Verify safety check rejects primary application database
  let primaryDbRejected = false;
  try {
    validateTestDatabaseSafety('mongodb+srv://user:pass@cluster0.mongodb.net/looply?retryWrites=true');
  } catch (err) {
    if (err.message.includes('SAFETY CHECK REJECTED')) primaryDbRejected = true;
  }
  assert(primaryDbRejected, 'Safety check rejects primary application database URI (looply)');

  // Verify safety check rejects production database URI
  let prodDbRejected = false;
  try {
    validateTestDatabaseSafety('mongodb+srv://user:pass@cluster0.mongodb.net/looply_production');
  } catch (err) {
    if (err.message.includes('SAFETY CHECK REJECTED')) prodDbRejected = true;
  }
  assert(prodDbRejected, 'Safety check rejects production database URI (looply_production)');

  // Verify safety check accepts dedicated test database
  let testDbAccepted = false;
  try {
    const verifiedName = validateTestDatabaseSafety('mongodb://localhost:27017/looply_test');
    testDbAccepted = verifiedName === 'looply_test';
  } catch {
    testDbAccepted = false;
  }
  assert(testDbAccepted, 'Safety check accepts dedicated "looply_test" database URI');

  // Retrieve strictly required MONGODB_TEST_URI (never falls back to MONGODB_URI)
  const testUri = getTestMongoUri();
  assert(Boolean(testUri), 'MONGODB_TEST_URI successfully retrieved without fallback to MONGODB_URI');

  // Establish Database Connection to dedicated test database
  await connectDatabase(testUri);
  const activeDbName = mongoose.connection.name || mongoose.connection.db?.databaseName;
  assert(
    isDatabaseConnected() && activeDbName === 'looply_test',
    `1. Connected to dedicated test database: "${activeDbName}"`
  );

  // Pre-test assertion: Verify database name before creating any records
  if (activeDbName !== 'looply_test') {
    throw new Error(
      `CRITICAL SAFETY CHECK FAILED: Expected database "looply_test", but active database is "${activeDbName}". Halting test execution immediately.`
    );
  }
  assert(true, 'Verified mongoose.connection.name === "looply_test" before creating any test records');

  // Start temporary HTTP test server
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api/auth`;

  const testTimestamp = Date.now();
  const createdUserIds = [];

  try {
    // ====================================================
    // A. REGISTRATION TESTS (POST /api/auth/register)
    // ====================================================
    console.log('\n--- Section A: Registration Validation & Security ---');

    // Test 1: Missing full name
    const resNoName = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `valid_${testTimestamp}@example.com`,
        password: 'ValidPassword123!',
        confirmPassword: 'ValidPassword123!'
      })
    });
    const jsonNoName = await resNoName.json();
    assert(
      resNoName.status === 400 && jsonNoName.success === false,
      `2. Missing full name rejected with HTTP 400: "${jsonNoName.message}"`
    );

    // Test 2: Invalid email format
    const resBadEmail = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Test User',
        email: 'invalid-email-format',
        password: 'ValidPassword123!',
        confirmPassword: 'ValidPassword123!'
      })
    });
    const jsonBadEmail = await resBadEmail.json();
    assert(
      resBadEmail.status === 400 && jsonBadEmail.success === false,
      `3. Invalid email format rejected with HTTP 400: "${jsonBadEmail.message}"`
    );

    // Test 3: Short password (<8 characters)
    const resShortPass = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Test User',
        email: `valid_${testTimestamp}@example.com`,
        password: 'short',
        confirmPassword: 'short'
      })
    });
    const jsonShortPass = await resShortPass.json();
    assert(
      resShortPass.status === 400 && jsonShortPass.success === false,
      `4. Password <8 characters rejected with HTTP 400: "${jsonShortPass.message}"`
    );

    // Test 4: Password mismatch
    const resMismatch = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Test User',
        email: `valid_${testTimestamp}@example.com`,
        password: 'Password123!',
        confirmPassword: 'DifferentPassword456!'
      })
    });
    const jsonMismatch = await resMismatch.json();
    assert(
      resMismatch.status === 400 && jsonMismatch.success === false && jsonMismatch.message.includes('do not match'),
      `5. Password mismatch rejected with HTTP 400: "${jsonMismatch.message}"`
    );

    // Test 5: Role escalation attempt (submitting role: 'admin')
    const escalationEmail = `escalation_${testTimestamp}@example.com`;
    const resEscalation = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Hacker User',
        email: escalationEmail,
        password: 'SecurePassword123!',
        confirmPassword: 'SecurePassword123!',
        role: 'admin' // Attempted role escalation
      })
    });
    const jsonEscalation = await resEscalation.json();
    if (jsonEscalation?.user?._id) createdUserIds.push(jsonEscalation.user._id);
    assert(
      resEscalation.status === 201 && jsonEscalation.user.role === 'user',
      `6. Role escalation strictly prevented: requested "admin", assigned "${jsonEscalation?.user?.role}"`
    );

    // Test 6: Valid Registration
    const validEmail = `primary_user_${testTimestamp}@example.com`;
    const rawPassword = 'ValidPassword123!';
    const resValidReg = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: '  Alice Looply  ',
        email: `  ${validEmail.toUpperCase()}  `,
        password: rawPassword,
        confirmPassword: rawPassword
      })
    });
    const jsonValidReg = await resValidReg.json();
    if (jsonValidReg?.user?._id) createdUserIds.push(jsonValidReg.user._id);

    assert(
      resValidReg.status === 201 && jsonValidReg.success === true,
      `7. Valid registration succeeded with HTTP 201: "${jsonValidReg.message}"`
    );
    assert(
      jsonValidReg.user.fullName === 'Alice Looply',
      '8. Full name was trimmed of leading/trailing whitespace'
    );
    assert(
      jsonValidReg.user.email === validEmail.toLowerCase(),
      '9. Email was trimmed and converted to canonical lowercase'
    );
    assert(
      jsonValidReg.user.role === 'user' && jsonValidReg.user.isEmailVerified === false,
      '10. Default role: "user" and isEmailVerified: false assigned'
    );
    assert(
      jsonValidReg.user.passwordHash === undefined && jsonValidReg.user.password === undefined,
      '11. Password hash is strictly excluded from API registration response'
    );

    // Verify Password Hashing in MongoDB test database
    const dbUser = await User.findOne({ email: validEmail.toLowerCase() }).select('+passwordHash');
    assert(
      Boolean(dbUser && dbUser.passwordHash && dbUser.passwordHash.startsWith('$2')),
      '12. Password stored in MongoDB as bcrypt hash ($2a$ or $2b$), never plaintext'
    );
    const bcryptMatches = await bcrypt.compare(rawPassword, dbUser.passwordHash);
    assert(bcryptMatches, '13. Stored bcrypt hash correctly validates against raw password');

    // Test 7: Duplicate email rejection (HTTP 409)
    const resDup = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Duplicate Alice',
        email: validEmail,
        password: 'ValidPassword123!',
        confirmPassword: 'ValidPassword123!'
      })
    });
    const jsonDup = await resDup.json();
    assert(
      resDup.status === 409 && jsonDup.success === false,
      `14. Duplicate email rejected with HTTP 409 Conflict: "${jsonDup.message}"`
    );

    // ====================================================
    // B. LOGIN TESTS (POST /api/auth/login)
    // ====================================================
    console.log('\n--- Section B: Login Authentication & Cookies ---');

    // Test 8: Missing credentials
    const resNoCreds = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const jsonNoCreds = await resNoCreds.json();
    assert(
      resNoCreds.status === 400 && jsonNoCreds.success === false,
      `15. Empty login payload rejected with HTTP 400: "${jsonNoCreds.message}"`
    );

    // Test 9: Unknown email address
    const resUnknownUser = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `nonexistent_${testTimestamp}@example.com`,
        password: 'Password123!'
      })
    });
    const jsonUnknown = await resUnknownUser.json();
    assert(
      resUnknownUser.status === 401 && jsonUnknown.success === false && jsonUnknown.message.includes('Invalid email or password'),
      `16. Unknown email rejected with generic HTTP 401 error: "${jsonUnknown.message}"`
    );

    // Test 10: Incorrect password for valid user
    const resWrongPass = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: validEmail,
        password: 'WrongPassword999!'
      })
    });
    const jsonWrong = await resWrongPass.json();
    assert(
      resWrongPass.status === 401 && jsonWrong.success === false && jsonWrong.message.includes('Invalid email or password'),
      `17. Incorrect password rejected with generic HTTP 401 error: "${jsonWrong.message}"`
    );

    // Test 11: Suspended account rejection (HTTP 403)
    const suspendedEmail = `suspended_${testTimestamp}@example.com`;
    const suspendedHash = await bcrypt.hash('Suspended123!', 10);
    const suspendedUser = new User({
      fullName: 'Suspended User',
      email: suspendedEmail,
      passwordHash: suspendedHash,
      role: 'user',
      accountStatus: 'suspended'
    });
    await suspendedUser.save();
    createdUserIds.push(suspendedUser._id);

    const resSuspended = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: suspendedEmail,
        password: 'Suspended123!'
      })
    });
    const jsonSuspended = await resSuspended.json();
    assert(
      resSuspended.status === 403 && jsonSuspended.success === false && jsonSuspended.message.includes('suspended'),
      `18. Suspended user login rejected with HTTP 403 Forbidden: "${jsonSuspended.message}"`
    );

    // Test 12: Successful Login & HTTP-only Cookie
    // In Phase 5+, unverified users cannot login; verify email in test database for login verification
    await User.updateOne({ email: validEmail }, { isEmailVerified: true });

    const resLogin = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: validEmail,
        password: rawPassword
      })
    });
    const jsonLogin = await resLogin.json();
    const setCookieHeader = resLogin.headers.get('set-cookie');

    assert(
      resLogin.status === 200 && jsonLogin.success === true,
      `19. Valid login succeeded with HTTP 200: "${jsonLogin.message}"`
    );
    assert(
      jsonLogin.user.passwordHash === undefined && jsonLogin.token === undefined,
      '20. Neither passwordHash nor raw JWT is exposed in login response body'
    );
    assert(
      Boolean(setCookieHeader && setCookieHeader.includes(AUTH_COOKIE_NAME)),
      `21. Set-Cookie header contains "${AUTH_COOKIE_NAME}" token`
    );
    assert(
      Boolean(setCookieHeader && setCookieHeader.toLowerCase().includes('httponly')),
      '22. Authentication cookie has HttpOnly flag set'
    );
    assert(
      Boolean(setCookieHeader && setCookieHeader.toLowerCase().includes('path=/')),
      '23. Authentication cookie has Path=/ set'
    );

    // Extract cookie value for session verification
    const cookieValue = setCookieHeader.split(';')[0];
    const rawJwt = cookieValue.split('=')[1];

    // Verify token validity with jwt.verify
    const decodedToken = jwt.verify(rawJwt, env.JWT_SECRET);
    assert(
      decodedToken.userId === dbUser._id.toString() && decodedToken.role === 'user',
      `24. JWT payload contains valid userId (${decodedToken.userId}) and role (${decodedToken.role})`
    );

    // ====================================================
    // C. SESSION VERIFICATION (GET /api/auth/me)
    // ====================================================
    console.log('\n--- Section C: Session Verification (GET /api/auth/me) ---');

    // Test 13: Unauthenticated request (no cookie)
    const resNoCookie = await fetch(`${baseUrl}/me`);
    const jsonNoCookie = await resNoCookie.json();
    assert(
      resNoCookie.status === 401 && jsonNoCookie.success === false,
      `25. Unauthenticated GET /api/auth/me returns HTTP 401: "${jsonNoCookie.message}"`
    );

    // Test 14: Valid authenticated request with HTTP-only cookie
    const resMe = await fetch(`${baseUrl}/me`, {
      headers: { Cookie: cookieValue }
    });
    const jsonMe = await resMe.json();
    assert(
      resMe.status === 200 && jsonMe.success === true,
      `26. Authenticated GET /api/auth/me returns HTTP 200`
    );
    assert(
      jsonMe.user.email === validEmail.toLowerCase() && jsonMe.user.fullName === 'Alice Looply',
      '27. Authenticated user profile matches logged-in user data'
    );
    assert(
      jsonMe.user.passwordHash === undefined,
      '28. passwordHash strictly excluded from GET /api/auth/me response'
    );

    // Test 15: Invalid token signature
    const resInvalidJwt = await fetch(`${baseUrl}/me`, {
      headers: { Cookie: `${AUTH_COOKIE_NAME}=invalid.jwt.signature` }
    });
    const jsonInvalidJwt = await resInvalidJwt.json();
    assert(
      resInvalidJwt.status === 401 && jsonInvalidJwt.success === false,
      `29. Tampered JWT signature rejected with HTTP 401: "${jsonInvalidJwt.message}"`
    );

    // Test 16: Expired JWT token
    const expiredToken = jwt.sign(
      { userId: dbUser._id.toString(), role: 'user' },
      env.JWT_SECRET,
      { expiresIn: '-1s' }
    );
    const resExpired = await fetch(`${baseUrl}/me`, {
      headers: { Cookie: `${AUTH_COOKIE_NAME}=${expiredToken}` }
    });
    const jsonExpired = await resExpired.json();
    assert(
      resExpired.status === 401 && jsonExpired.success === false && jsonExpired.message.includes('expired'),
      `30. Expired JWT rejected with HTTP 401: "${jsonExpired.message}"`
    );

    // Test 17: Suspended user attempting session access
    const suspendedToken = jwt.sign(
      { userId: suspendedUser._id.toString(), role: 'user' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const resSuspendedMe = await fetch(`${baseUrl}/me`, {
      headers: { Cookie: `${AUTH_COOKIE_NAME}=${suspendedToken}` }
    });
    const jsonSuspendedMe = await resSuspendedMe.json();
    assert(
      resSuspendedMe.status === 403 && jsonSuspendedMe.success === false,
      `31. Suspended user session rejected with HTTP 403: "${jsonSuspendedMe.message}"`
    );

    // ====================================================
    // D. LOGOUT TESTS (POST /api/auth/logout)
    // ====================================================
    console.log('\n--- Section D: Logout & Cookie Clearing ---');

    const resLogout = await fetch(`${baseUrl}/logout`, {
      method: 'POST',
      headers: { Cookie: cookieValue }
    });
    const jsonLogout = await resLogout.json();
    const logoutCookieHeader = resLogout.headers.get('set-cookie');

    assert(
      resLogout.status === 200 && jsonLogout.success === true,
      `32. Logout returns HTTP 200: "${jsonLogout.message}"`
    );
    assert(
      Boolean(
        logoutCookieHeader &&
        logoutCookieHeader.includes(AUTH_COOKIE_NAME) &&
        (logoutCookieHeader.includes('Expires=Thu, 01 Jan 1970') || logoutCookieHeader.includes('Max-Age=0'))
      ),
      '33. Logout clears the HTTP-only cookie with matching expiration flags'
    );

  } finally {
    // Safety check before running cleanup: ensure we are strictly in looply_test
    console.log('\n--- Cleaning up Test Artifacts from Dedicated Test Database ---');
    const finalDbName = mongoose.connection.name || mongoose.connection.db?.databaseName;
    assert(
      finalDbName === 'looply_test',
      'Verified mongoose.connection.name === "looply_test" before deleting any test records'
    );

    if (finalDbName !== 'looply_test') {
      console.error(`CRITICAL SAFETY ABORT: Active database is "${finalDbName}". Cleanup cancelled to protect non-test data.`);
    } else if (createdUserIds.length > 0) {
      await User.deleteMany({ _id: { $in: createdUserIds } });
      await ActivityLog.deleteMany({ actor: { $in: createdUserIds } });
      console.log(`Cleaned up ${createdUserIds.length} test users from test database "${finalDbName}".`);
    }

    server.close();
    await disconnectDatabase();
  }

  console.log('\n====================================================');
  console.log(`Phase 4 Test Results: ${passed} passed, ${failed} failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

const isDirectEntrypoint =
  process.argv[1] &&
  (process.argv[1].endsWith('test-phase4.mjs') ||
    process.argv[1].endsWith('test-phase4') ||
    process.argv[1] === fileURLToPath(import.meta.url));

if (isDirectEntrypoint) {
  runPhase4Tests().catch((err) => {
    console.error('[Fatal Error in Phase 4 Tests]', err);
    process.exit(1);
  });
}

export { runPhase4Tests };
