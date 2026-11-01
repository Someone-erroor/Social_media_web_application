import { spawn, execSync } from 'child_process';
import path from 'path';
import net from 'net';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const serverDir = path.join(rootDir, 'server');
const clientDir = path.join(rootDir, 'client');

let backendProcess = null;
let frontendProcess = null;
let isShuttingDown = false;

/**
 * Checks if a TCP port on localhost is available.
 *
 * @param {number} port
 * @returns {Promise<boolean>}
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const tester = net.createServer();
    tester.once('error', () => resolve(false));
    tester.once('listening', () => {
      tester.close(() => resolve(true));
    });
    tester.listen(port, '127.0.0.1');
  });
}

/**
 * Probes the backend readiness endpoint (GET /api/health/ready).
 *
 * @param {string} url
 * @returns {Promise<{ ok: boolean, status: number, data?: any }>}
 */
function probeHealthReady(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(body);
        } catch {
          // non-JSON
        }
        resolve({ ok: res.statusCode === 200, status: res.statusCode, data: parsed });
      });
    });
    req.on('error', () => {
      resolve({ ok: false, status: 0 });
    });
    req.setTimeout(2000, () => {
      req.destroy();
      resolve({ ok: false, status: 0 });
    });
  });
}

/**
 * Gracefully terminates a child process and its subtree across platforms.
 *
 * @param {import('child_process').ChildProcess} proc
 */
function terminateProcess(proc) {
  if (!proc || !proc.pid) return;
  const pid = proc.pid;

  if (process.platform === 'win32') {
    try {
      execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
    } catch {
      // Process already terminated
    }
  } else {
    try {
      process.kill(-pid, 'SIGTERM');
    } catch {
      try {
        proc.kill('SIGTERM');
      } catch {
        // Process already terminated
      }
    }
  }
}

/**
 * Shutdown handler triggered on SIGINT (Ctrl+C), SIGTERM, or process exit.
 */
function handleShutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log('\n[Looply Launcher] Shutting down development processes...');

  if (frontendProcess) {
    terminateProcess(frontendProcess);
    frontendProcess = null;
  }

  if (backendProcess) {
    terminateProcess(backendProcess);
    backendProcess = null;
  }

  console.log('[Looply Launcher] All processes stopped. Goodbye!\n');
  process.exit(0);
}

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

async function main() {
  console.log('====================================================');
  console.log('LOOPLY — ONE-COMMAND DEVELOPMENT LAUNCHER');
  console.log('Tagline: Connect. Share. Express.');
  console.log('====================================================\n');

  // Step 1: Pre-flight port availability verification
  const port5000Available = await isPortAvailable(5000);
  if (!port5000Available) {
    console.error('✗ ERROR: Port 5000 is already in use by another process.');
    console.error('  Please stop any running backend or service on port 5000 before launching.\n');
    process.exit(1);
  }

  const port3000Available = await isPortAvailable(3000);
  if (!port3000Available) {
    console.error('✗ ERROR: Port 3000 is already in use by another process.');
    console.error('  Next.js requires port 3000 to match the configured CORS origins and authentication cookies.');
    console.error('  Looply will not silently start on port 3001. Please free port 3000 and try again.\n');
    process.exit(1);
  }

  // Step 2: Start Express Backend
  console.log('[1/4] Starting Looply Express backend on port 5000...');
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

  let backendExitedEarly = false;
  let backendExitCode = null;
  let backendOutput = '';

  backendProcess = spawn(npmCmd, ['run', 'start'], {
    cwd: serverDir,
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true,
    env: { ...process.env, NODE_ENV: 'development' }
  });

  backendProcess.stdout.on('data', (chunk) => {
    const text = chunk.toString();
    backendOutput += text;
    process.stdout.write(`[Backend] ${text}`);
  });

  backendProcess.stderr.on('data', (chunk) => {
    const text = chunk.toString();
    backendOutput += text;
    process.stderr.write(`[Backend Error] ${text}`);
  });

  backendProcess.on('exit', (code) => {
    backendExitedEarly = true;
    backendExitCode = code;
  });

  // Step 3: Wait for Backend Readiness (MongoDB Connection & /api/health/ready)
  console.log('[2/4] Waiting for backend and MongoDB readiness check...');
  const readyUrl = 'http://127.0.0.1:5000/api/health/ready';
  const maxAttempts = 30; // 30 attempts * 500ms = 15 seconds max wait
  let isReady = false;

  for (let i = 1; i <= maxAttempts; i++) {
    if (backendExitedEarly) {
      break;
    }

    const check = await probeHealthReady(readyUrl);
    if (check.ok) {
      isReady = true;
      break;
    }

    await new Promise((res) => setTimeout(res, 500));
  }

  if (!isReady) {
    console.error('\n====================================================');
    console.error('✗ BACKEND STARTUP FAILURE');
    console.error('====================================================');
    console.error('The backend server failed to become ready on http://localhost:5000.\n');

    // Classify known startup errors from captured output
    if (/Missing MongoDB URI/i.test(backendOutput)) {
      console.error('Diagnostic Category: Missing MongoDB URI');
      console.error('Explanation: MONGODB_URI is not set in server/.env.');
    } else if (/Invalid MongoDB URI/i.test(backendOutput)) {
      console.error('Diagnostic Category: Invalid MongoDB URI');
      console.error('Explanation: MONGODB_URI does not start with mongodb:// or mongodb+srv://.');
    } else if (/DNS resolution failure/i.test(backendOutput) || /ENOTFOUND|EAI_AGAIN/i.test(backendOutput)) {
      console.error('Diagnostic Category: DNS resolution failure');
      console.error('Explanation: Unable to resolve MongoDB Atlas cluster hostname. Check internet connectivity.');
    } else if (/Atlas network access denied/i.test(backendOutput) || /whitelist|network access/i.test(backendOutput)) {
      console.error('Diagnostic Category: Atlas network access denied');
      console.error('Explanation: MongoDB Atlas IP Access List blocked the connection. Add your IP in Atlas console.');
    } else if (/Authentication failure/i.test(backendOutput) || /bad auth/i.test(backendOutput)) {
      console.error('Diagnostic Category: Authentication failure');
      console.error('Explanation: Database username or password was rejected by MongoDB Atlas.');
    } else if (/Connection timeout/i.test(backendOutput) || /serverSelectionTimeoutMS/i.test(backendOutput)) {
      console.error('Diagnostic Category: Connection timeout');
      console.error('Explanation: Timed out waiting for connection to MongoDB Atlas.');
    } else {
      console.error('Diagnostic Category: Database or Server Error');
      console.error(`Exit Code: ${backendExitCode !== null ? backendExitCode : 'unknown'}`);
    }

    console.error('\nNext Steps:');
    console.error('  1. Review server/.env configuration.');
    console.error('  2. Verify your MongoDB Atlas connection and Network Access settings.');
    console.error('  3. Re-run: npm run dev\n');

    if (backendProcess) {
      terminateProcess(backendProcess);
    }
    process.exit(1);
  }

  console.log('[3/4] ✓ Backend and MongoDB readiness confirmed!');

  // Step 4: Verify port 3000 again right before launching Next.js
  const recheckPort3000 = await isPortAvailable(3000);
  if (!recheckPort3000) {
    console.error('✗ ERROR: Port 3000 was bound during backend startup.');
    console.error('  Next.js cannot start on port 3000. Terminating.\n');
    handleShutdown();
    process.exit(1);
  }

  // Step 5: Start Next.js Frontend
  console.log('[4/4] Starting Looply Next.js frontend on http://localhost:3000...\n');
  frontendProcess = spawn(npmCmd, ['run', 'dev'], {
    cwd: clientDir,
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true,
    env: { ...process.env }
  });

  frontendProcess.stdout.on('data', (chunk) => {
    process.stdout.write(`[Frontend] ${chunk.toString()}`);
  });

  frontendProcess.stderr.on('data', (chunk) => {
    process.stderr.write(`[Frontend Error] ${chunk.toString()}`);
  });

  frontendProcess.on('exit', (code) => {
    if (!isShuttingDown) {
      console.log(`\n[Frontend] Next.js process exited with code ${code}.`);
      handleShutdown();
    }
  });

  console.log('====================================================');
  console.log('✓ LOOPLY PLATFORM READY FOR DEVELOPMENT');
  console.log('====================================================');
  console.log('Frontend Application: http://localhost:3000');
  console.log('Backend REST API:     http://localhost:5000');
  console.log('API Health Check:     http://localhost:5000/api/health/ready');
  console.log('Dev Mailbox Preview:  http://localhost:5000/api/__dev/mailbox/latest');
  console.log('====================================================');
  console.log('Press Ctrl+C to stop both applications gracefully.\n');
}

main().catch((err) => {
  console.error('[Looply Launcher Fatal Error]:', err.message);
  handleShutdown();
});

