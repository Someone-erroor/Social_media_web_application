import http from 'http';
import { spawn } from 'child_process';
import path from 'path';

const PORT = 3012;
const routes = [
  '/',
  '/login',
  '/register',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
  '/feed',
  '/explore',
  '/profile',
  '/profile/edit',
  '/profile/alexmorgan',
  '/notifications',
  '/assistant',
  '/settings',
  '/admin',
  '/admin/users',
  '/admin/posts',
  '/admin/comments',
  '/admin/activity',
  '/admin/notifications'
];

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchRoute(route, host = '127.0.0.1') {
  return new Promise((resolve, reject) => {
    const req = http.get({
      host,
      port: PORT,
      path: route,
      timeout: 3000
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, data });
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(new Error('Request timeout'));
    });
  });
}

async function run() {
  console.log(`Starting Next.js server on port ${PORT}...`);
  const server = spawn('node', ['node_modules/next/dist/bin/next', 'start', '-p', String(PORT), '-H', '127.0.0.1'], {
    cwd: path.resolve('./client'),
    stdio: 'inherit'
  });

  let ready = false;
  let activeHost = '127.0.0.1';

  for (let i = 0; i < 30; i++) {
    await sleep(500);
    try {
      const res = await fetchRoute('/', '127.0.0.1');
      if (res.statusCode === 200) {
        ready = true;
        activeHost = '127.0.0.1';
        break;
      }
    } catch (e) {
      // try localhost
      try {
        const res2 = await fetchRoute('/', 'localhost');
        if (res2.statusCode === 200) {
          ready = true;
          activeHost = 'localhost';
          break;
        }
      } catch (e2) {
        if (i % 5 === 0) console.log(`Attempt ${i}: 127.0.0.1 error: ${e.message}, localhost error: ${e2.message}`);
      }
    }
  }

  if (!ready) {
    console.error('Server failed to start in time.');
    spawn('taskkill', ['/pid', String(server.pid), '/f', '/t']);
    process.exit(1);
  }

  console.log(`Server is ready on ${activeHost}. Testing all 20 routes...\n`);

  let passed = 0;
  let failed = 0;

  for (const r of routes) {
    try {
      const res = await fetchRoute(r, activeHost);
      if (res.statusCode === 200) {
        console.log(`✓ [200 OK] ${r}`);
        passed++;

        if (r === '/admin') {
          if (res.data.includes('Backend Ready') || res.data.includes('HTTP 200')) {
            console.error('  FAIL: /admin contains fabricated live backend claims!');
            failed++;
          } else {
            console.log('  ✓ /admin contains no fabricated live backend claims');
          }
          if (res.data.includes('Awaiting Telemetry Sync')) {
            console.log('  ✓ /admin contains neutral status placeholder (Awaiting Telemetry Sync)');
          }
        }

        if (r === '/assistant') {
          if (res.data.includes('AI Preview')) {
            console.error('  FAIL: /assistant contains "AI Preview"');
            failed++;
          } else {
            console.log('  ✓ /assistant contains no internal preview labels');
          }
        }
      } else {
        console.error(`✗ [${res.statusCode}] ${r}`);
        failed++;
      }
    } catch (err) {
      console.error(`✗ [ERROR] ${r}:`, err.message);
      failed++;
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed out of ${routes.length} routes.`);

  spawn('taskkill', ['/pid', String(server.pid), '/f', '/t']);

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('All 20 required application routes verified successfully!');
    process.exit(0);
  }
}

run();
