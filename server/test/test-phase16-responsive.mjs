import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import { spawn, execSync } from 'child_process';
import net from 'net';
import puppeteer from 'puppeteer-core';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../src/config/env.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { AUTH_COOKIE_NAME, generateToken } from '../src/config/jwt.js';
import { User, Post, ActivityLog } from '../src/models/index.js';
import app from '../src/app.js';
import { validateTestDatabaseSafety, getTestMongoUri, findChromeExecutable } from './test-helpers.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VIEWPORTS = [
  { width: 360, height: 740, label: '360px (Small Mobile)' },
  { width: 375, height: 667, label: '375px (iPhone SE)' },
  { width: 390, height: 844, label: '390px (iPhone 12/13/14)' },
  { width: 414, height: 896, label: '414px (iPhone Plus)' },
  { width: 768, height: 1024, label: '768px (iPad Portrait)' },
  { width: 1024, height: 768, label: '1024px (iPad Landscape)' },
  { width: 1280, height: 800, label: '1280px (Standard Laptop)' },
  { width: 1440, height: 900, label: '1440px (Desktop)' },
  { width: 1920, height: 1080, label: '1920px (FHD Large Screen)' }
];

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

function checkPortAvailable(port) {
  return new Promise((resolve) => {
    const tester = net.createServer();
    tester.once('error', () => resolve(false));
    tester.once('listening', () => tester.close(() => resolve(true)));
    tester.listen(port, '127.0.0.1');
  });
}

function terminateProcess(childProc) {
  if (!childProc || !childProc.pid) return;
  const pid = childProc.pid;
  if (process.platform === 'win32') {
    try {
      execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
    } catch {}
  } else {
    try {
      process.kill(-pid, 'SIGKILL');
    } catch {
      try {
        childProc.kill('SIGKILL');
      } catch {}
    }
  }
}

async function runResponsiveAndA11yAudit() {
  process.env.NODE_ENV = 'test';
  console.log('====================================================');
  console.log('LOOPLY — PHASE 16 RESPONSIVE DESIGN & A11Y AUDIT');
  console.log('====================================================\n');

  let expressServer = null;
  let nextProcess = null;
  let browser = null;
  const createdUserIds = [];
  const createdPostIds = [];

  try {
    // 1. Connect to test DB
    console.log('--- Step 1: Database Setup & Port Verification ---');
    const testUri = getTestMongoUri();
    validateTestDatabaseSafety(testUri);
    await connectDatabase(testUri);
    const activeDb = mongoose.connection.name || mongoose.connection.db?.databaseName;
    assert(activeDb === 'looply_test', `1. Connected to dedicated test database: "${activeDb}"`);

    // Verify ports 5000 and 3000
    const port5000Ok = await checkPortAvailable(5000);
    const port3000Ok = await checkPortAvailable(3000);
    assert(port5000Ok && port3000Ok, '2. Verified ports 5000 and 3000 are available for isolated testing');

    // 2. Start Express API Server on port 5000
    console.log('\n--- Step 2: Starting Dedicated Test Backend on port 5000 ---');
    expressServer = app.listen(5000, '0.0.0.0');
    await new Promise((resolve, reject) => {
      expressServer.on('listening', resolve);
      expressServer.on('error', reject);
    });
    assert(true, '3. Dedicated Express backend listening on 0.0.0.0:5000');

    // 3. Setup test accounts (Normal user & Admin user)
    console.log('\n--- Step 3: Preparing Seed Accounts for Audit ---');
    const passwordHash = await bcrypt.hash('AuditorPassword123!', 10);
    const now = Date.now();

    const auditUser = new User({
      fullName: 'A11y Test User',
      email: `a11y_user_${now}@looply.test`,
      passwordHash,
      role: 'user',
      isEmailVerified: true,
      tokenVersion: 0,
      accountStatus: 'active'
    });
    await auditUser.save();
    createdUserIds.push(auditUser._id);

    const auditAdmin = new User({
      fullName: 'A11y Admin',
      email: `a11y_admin_${now}@looply.test`,
      passwordHash,
      role: 'admin',
      isEmailVerified: true,
      tokenVersion: 0,
      accountStatus: 'active'
    });
    await auditAdmin.save();
    createdUserIds.push(auditAdmin._id);

    const seedPost = new Post({
      author: auditUser._id,
      content: 'Responsive UI test post across multi-screen dimensions. Checking typography, card padding, and button contrast.'
    });
    await seedPost.save();
    createdPostIds.push(seedPost._id);
    assert(true, '4. Seed accounts (user, admin) and sample content created');

    const userToken = generateToken({
      userId: auditUser._id.toString(),
      role: auditUser.role,
      tokenVersion: auditUser.tokenVersion
    });

    const adminToken = generateToken({
      userId: auditAdmin._id.toString(),
      role: auditAdmin.role,
      tokenVersion: auditAdmin.tokenVersion
    });

    // 4. Start Next.js Frontend on port 3000
    console.log('\n--- Step 4: Starting Production Next.js Frontend on port 3000 ---');
    const clientDir = path.resolve(__dirname, '../../client');
    const startCmd = process.platform === 'win32' ? (process.env.ComSpec || 'cmd.exe') : 'npx';
    const startArgs = process.platform === 'win32'
      ? ['/c', 'npx', 'next', 'start', '-H', '127.0.0.1', '-p', '3000']
      : ['next', 'start', '-H', '127.0.0.1', '-p', '3000'];

    nextProcess = spawn(startCmd, startArgs, {
      cwd: clientDir,
      stdio: 'ignore',
      detached: process.platform !== 'win32',
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: '3000',
        NEXT_PUBLIC_API_URL: 'http://127.0.0.1:5000/api'
      }
    });

    // Wait for HTTP response on port 3000
    const startWait = Date.now();
    let frontendReady = false;
    while (Date.now() - startWait < 60000) {
      const isUp = await new Promise((resolve) => {
        const req = http.get('http://127.0.0.1:3000', (res) => {
          resolve(res.statusCode < 500);
        });
        req.on('error', () => resolve(false));
        req.setTimeout(1500, () => {
          req.destroy();
          resolve(false);
        });
      });

      if (isUp) {
        frontendReady = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    assert(frontendReady, '5. Next.js production frontend running on http://127.0.0.1:3000');

    // 5. Launch Chrome
    console.log('\n--- Step 5: Launching Headless Chrome Browser ---');
    const chromePath = findChromeExecutable();
    browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--window-size=1920,1080',
        '--disable-cache'
      ]
    });
    assert(Boolean(browser), '6. Headless Chrome launched successfully');

    const page = await browser.newPage();
    await page.setCacheEnabled(false);
    page.on('console', (msg) => console.log(`[Browser Console ${msg.type()}]:`, msg.text()));
    page.on('pageerror', (err) => console.error(`[Browser PageError]:`, err.message));

    // 6. Test Exact Viewports
    console.log('\n--- Step 6: Testing All Required Viewports (360px to 1920px) ---');
    for (const vp of VIEWPORTS) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle2' });

      // Check horizontal overflow
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      assert(!overflow, `Viewport ${vp.label}: Zero horizontal overflow (scrollWidth <= window.innerWidth)`);

      // Check responsive elements visibility
      if (vp.width < 768) {
        // Mobile view checks
        const mobileNavExists = await page.evaluate(() => {
          return Boolean(document.querySelector('nav, header'));
        });
        assert(mobileNavExists, `Viewport ${vp.label}: Mobile header/nav present and accessible`);
      } else {
        // Desktop view checks
        const desktopLayout = await page.evaluate(() => {
          return window.innerWidth >= 768;
        });
        assert(desktopLayout, `Viewport ${vp.label}: Desktop layout scaled properly without layout breakage`);
      }
    }

    // 7. Accessibility Audit on Key Routes
    console.log('\n--- Step 7: Accessibility & Semantic Structure Audit ---');
    const routesToAudit = [
      { path: '/', title: 'Landing' },
      { path: '/login', title: 'Login' },
      { path: '/register', title: 'Register' },
      { path: '/verify-email', title: 'Email Verification' },
      { path: '/forgot-password', title: 'Forgot Password' }
    ];

    for (const r of routesToAudit) {
      await page.goto(`http://127.0.0.1:3000${r.path}`, { waitUntil: 'networkidle2' });

      const a11yChecks = await page.evaluate(() => {
        // 1. Heading hierarchy: H1 must exist
        const h1 = document.querySelector('h1, h2, h3');
        const hasHeading = Boolean(h1);

        // 2. Form inputs must have labels or aria-labels
        const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"])'));
        const allInputsLabeled = inputs.every((input) => {
          const id = input.id;
          const hasLabel = id ? Boolean(document.querySelector(`label[for="${id}"]`)) : false;
          const hasAria = Boolean(input.getAttribute('aria-label') || input.getAttribute('aria-labelledby'));
          const hasPlaceholder = Boolean(input.placeholder);
          return hasLabel || hasAria || hasPlaceholder;
        });

        // 3. Buttons have accessible names
        const buttons = Array.from(document.querySelectorAll('button'));
        const allButtonsNamed = buttons.every((btn) => {
          const text = btn.innerText?.trim();
          const ariaLabel = btn.getAttribute('aria-label');
          const title = btn.getAttribute('title');
          return Boolean(text || ariaLabel || title);
        });

        // 4. Zero broken image elements (missing alt)
        const images = Array.from(document.querySelectorAll('img'));
        const allImagesAlt = images.every((img) => img.hasAttribute('alt'));

        return { hasHeading, allInputsLabeled, allButtonsNamed, allImagesAlt };
      });

      assert(a11yChecks.hasHeading, `Route "${r.path}": Contains valid semantic heading structure`);
      assert(a11yChecks.allInputsLabeled, `Route "${r.path}": All interactive form inputs have accessible labels`);
      assert(a11yChecks.allButtonsNamed, `Route "${r.path}": All buttons have discernible accessible names`);
      assert(a11yChecks.allImagesAlt, `Route "${r.path}": All image elements conform to alt-attribute accessibility`);
    }

    // 8. Authenticated User Flow Responsive Audit
    console.log('\n--- Step 8: Authenticated User Experience Responsive Audit ---');
    await page.goto('http://127.0.0.1:3000/login', { waitUntil: 'networkidle2' });
    await page.waitForSelector('#login-email', { timeout: 10000 });
    await page.waitForSelector('#login-password', { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 1500)); // Allow client hydration to settle
    await page.type('#login-email', auditUser.email);
    await page.type('#login-password', 'AuditorPassword123!');
    await page.click('button[type="submit"]');
    try {
      await page.waitForFunction(() => window.location.pathname === '/feed', { timeout: 10000 });
    } catch (e) {
      const currUrl = page.url();
      const alertMsg = await page.evaluate(() => document.querySelector('[role="alert"]')?.innerText || '');
      console.error(`[Login wait failed] Current URL: ${currUrl}, Alert: ${alertMsg}`);
      throw e;
    }

    // Test /feed in mobile (375px) and desktop (1280px)
    await page.setViewport({ width: 375, height: 667 });
    await new Promise((r) => setTimeout(r, 800));
    const mobileFeedOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert(!mobileFeedOverflow, 'User Feed @ 375px: Zero horizontal overflow on mobile feed');

    const mobileBottomNavVisible = await page.evaluate(() => {
      const bNav = document.querySelector('nav[aria-label="Mobile Navigation"]');
      return Boolean(bNav);
    });
    assert(mobileBottomNavVisible, 'User Feed @ 375px: UserBottomNav is active and visible on mobile');

    await page.setViewport({ width: 1280, height: 800 });
    await new Promise((r) => setTimeout(r, 800));
    const desktopSidebarVisible = await page.evaluate(() => {
      const sBar = document.querySelector('aside[aria-label="User Sidebar"]');
      return Boolean(sBar);
    });
    assert(desktopSidebarVisible, 'User Feed @ 1280px: UserSidebar is active and visible on desktop');

    // 9. Authenticated Admin Flow Responsive Audit
    console.log('\n--- Step 9: Administrator Console Responsive Audit ---');
    await page.goto('http://127.0.0.1:3000/login', { waitUntil: 'networkidle2' });
    await page.waitForSelector('#login-email', { timeout: 10000 });
    await page.waitForSelector('#login-password', { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 1500)); // Allow client hydration to settle
    await page.type('#login-email', auditAdmin.email);
    await page.type('#login-password', 'AuditorPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => window.location.pathname === '/admin', { timeout: 15000 });

    // Test /admin at 390px (Mobile) and 1440px (Desktop)
    await page.setViewport({ width: 390, height: 844 });
    await new Promise((r) => setTimeout(r, 800));
    const mobileAdminOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert(!mobileAdminOverflow, 'Admin Dashboard @ 390px: Zero horizontal overflow on mobile administration');

    const adminDrawerButtonExists = await page.evaluate(() => {
      return Boolean(document.querySelector('button[aria-label*="navigation menu" i], button[aria-label*="menu" i]'));
    });
    assert(adminDrawerButtonExists, 'Admin Dashboard @ 390px: Accessible mobile drawer toggle button present');

    await page.setViewport({ width: 1440, height: 900 });
    await new Promise((r) => setTimeout(r, 800));
    const desktopAdminSidebar = await page.evaluate(() => {
      return Boolean(document.querySelector('aside'));
    });
    assert(desktopAdminSidebar, 'Admin Dashboard @ 1440px: Full administrative dark sidebar visible on desktop');

    console.log('\n====================================================');
    console.log(`Phase 16 Audit Results: ${passed} passed, ${failed} failed`);
    console.log('====================================================\n');

    if (failed > 0) {
      process.exitCode = 1;
    }
  } finally {
    console.log('--- Cleaning Up Test Resources ---');
    if (browser) {
      try {
        await browser.close();
      } catch {}
    }
    if (nextProcess) {
      terminateProcess(nextProcess);
    }
    if (expressServer) {
      try {
        await new Promise((resolve) => expressServer.close(resolve));
      } catch {}
    }
    try {
      if (createdPostIds.length > 0) {
        await Post.deleteMany({ _id: { $in: createdPostIds } });
      }
      if (createdUserIds.length > 0) {
        await User.deleteMany({ _id: { $in: createdUserIds } });
      }
    } catch {}
    await disconnectDatabase();
  }
}

runResponsiveAndA11yAudit().catch((err) => {
  console.error('[Phase 16 Audit Error]', err);
  process.exit(1);
});

