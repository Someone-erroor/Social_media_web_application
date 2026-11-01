import fs from 'fs';
import os from 'os';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import { spawn, execSync } from 'child_process';
import net from 'net';
import puppeteer from 'puppeteer-core';
import axeCore from 'axe-core';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../src/config/env.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { AUTH_COOKIE_NAME, generateToken } from '../src/config/jwt.js';
import { User, Post, Comment, Notification, ActivityLog } from '../src/models/index.js';
import app from '../src/app.js';
import { initSocketServer, closeSocketServer } from '../src/services/socket.service.js';
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
  console.log('LOOPLY — 20-ROUTE RESPONSIVE & AXE WCAG 2.2 AA AUDIT');
  console.log('====================================================\n');

  let expressServer = null;
  let nextProcess = null;
  let browser = null;
  let userDataDir = null;
  const createdUserIds = [];
  const createdPostIds = [];
  const createdCommentIds = [];

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

    // 2. Start Express API Server on port 5000 with unified Socket.IO
    console.log('\n--- Step 2: Starting Dedicated Test Backend on port 5000 ---');
    expressServer = http.createServer(app);
    initSocketServer(expressServer);
    await new Promise((resolve, reject) => {
      expressServer.listen(5000, '0.0.0.0', resolve);
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
      accountStatus: 'active',
      profile: {
        bio: 'Automated test profile bio for responsive verification.'
      }
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

    const seedComment = new Comment({
      post: seedPost._id,
      author: auditAdmin._id,
      content: 'Excellent layout fidelity and typography hierarchy.'
    });
    await seedComment.save();
    createdCommentIds.push(seedComment._id);

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
        NEXT_PUBLIC_API_URL: 'http://localhost:5000/api'
      }
    });

    // Wait for HTTP response on port 3000
    const startWait = Date.now();
    let frontendReady = false;
    while (Date.now() - startWait < 60000) {
      const isUp = await new Promise((resolve) => {
        const req = http.get('http://localhost:3000', (res) => {
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
    assert(frontendReady, '5. Next.js production frontend running on http://localhost:3000');

    // 5. Launch Chrome
    console.log('\n--- Step 5: Launching Headless Chrome Browser ---');
    const chromePath = findChromeExecutable();
    userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'puppeteer-looply-'));
    browser = await puppeteer.launch({
      executablePath: chromePath,
      userDataDir,
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
    page.on('requestfailed', (req) => console.log(`[Browser Request Failed]: ${req.url()} - ${req.failure()?.errorText}`));
    page.on('response', (res) => {
      if (res.url().includes('/api/') || res.url().includes('_next')) {
        console.log(`[Browser Response ${res.status()}]: ${res.url()}`);
      }
    });

    // Route Definitions: Exactly 20 routes (6 Public, 8 User, 6 Admin)
    const publicRoutes = [
      { path: '/', title: 'Landing' },
      { path: '/login', title: 'Login' },
      { path: '/register', title: 'Register' },
      { path: '/verify-email', title: 'Email Verification' },
      { path: '/forgot-password', title: 'Forgot Password' },
      { path: '/reset-password', title: 'Reset Password' }
    ];

    const userRoutes = [
      { path: '/feed', title: 'User Feed' },
      { path: '/explore', title: 'Explore' },
      { path: '/profile', title: 'User Profile' },
      { path: '/profile/edit', title: 'Edit Profile' },
      { path: `/profile/${auditUser._id}`, title: 'Member Profile' },
      { path: '/notifications', title: 'Notifications' },
      { path: '/assistant', title: 'AI Assistant' },
      { path: '/settings', title: 'Settings' }
    ];

    const adminRoutes = [
      { path: '/admin', title: 'Admin Overview' },
      { path: '/admin/users', title: 'Admin User Management' },
      { path: '/admin/posts', title: 'Admin Post Moderation' },
      { path: '/admin/comments', title: 'Admin Comment Moderation' },
      { path: '/admin/activity', title: 'Admin Activity & Audit' },
      { path: '/admin/notifications', title: 'Admin Broadcast Alerts' }
    ];

    assert(
      publicRoutes.length + userRoutes.length + adminRoutes.length === 20,
      `7. Configured all 20 distinct platform routes (6 Public, 8 User, 6 Admin)`
    );

    // Helper: Execute axe-core WCAG 2.2 AA audit
    async function runAxeAudit(routePath) {
      await page.evaluate(axeCore.source);
      const results = await page.evaluate(async () => {
        return await window.axe.run(document, {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
          }
        });
      });

      // Filter critical and serious violations
      const criticalOrSerious = (results.violations || []).filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      if (criticalOrSerious.length > 0) {
        console.error(`[A11y Violations on ${routePath}]:`, JSON.stringify(criticalOrSerious.map(v => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          nodes: v.nodes.map(n => n.target)
        })), null, 2));
      }

      return criticalOrSerious;
    }

    // Helper: Run 9-viewport responsive tests for a given route
    async function testRouteViewports(routePath, groupType) {
      let routeOverflowCount = 0;
      let routeBlankCount = 0;

      for (const vp of VIEWPORTS) {
        await page.setViewport({ width: vp.width, height: vp.height });
        await new Promise((r) => setTimeout(r, 60));

        const metrics = await page.evaluate((width, group) => {
          const docEl = document.documentElement;
          const body = document.body;
          const scrollWidth = docEl.scrollWidth;
          const innerWidth = window.innerWidth;
          const hasOverflow = scrollWidth > innerWidth + 1; // 1px threshold for subpixel rounding
          const text = (body.innerText || '').trim();
          const isBlank = text.length === 0;

          // Navigation element visibility checks
          let navOk = true;
          if (group === 'user') {
            const sidebar = document.querySelector('aside[aria-label="User Sidebar"]');
            const bottomNav = document.querySelector('nav[aria-label="Mobile Navigation"]');
            if (width >= 1024) {
              navOk = Boolean(sidebar);
            } else if (width < 768) {
              navOk = Boolean(bottomNav);
            }
          } else if (group === 'admin') {
            const aside = document.querySelector('aside');
            const mobileBtn = document.querySelector('button[aria-label="Toggle admin navigation menu"]');
            if (width >= 1024) {
              navOk = Boolean(aside);
            } else if (width < 768) {
              navOk = Boolean(mobileBtn);
            }
          }

          return { hasOverflow, isBlank, navOk, scrollWidth, innerWidth };
        }, vp.width, groupType);

        if (metrics.hasOverflow) {
          routeOverflowCount++;
          console.error(`Horizontal overflow on ${routePath} @ ${vp.label}: scrollWidth=${metrics.scrollWidth}, innerWidth=${metrics.innerWidth}`);
        }
        if (metrics.isBlank) {
          routeBlankCount++;
          console.error(`Blank content detected on ${routePath} @ ${vp.label}`);
        }
      }

      return { routeOverflowCount, routeBlankCount };
    }

    // -------------------------------------------------------------------------
    // GROUP A: 6 Public Routes (Unauthenticated)
    // -------------------------------------------------------------------------
    console.log('\n--- Step 6: Testing 6 Public Routes (axe WCAG 2.2 AA & 9 Viewports) ---');
    const clientSession = await page.target().createCDPSession();
    await clientSession.send('Network.clearBrowserCookies');

    for (const r of publicRoutes) {
      await page.setViewport({ width: 1280, height: 800 });
      await page.goto(`http://localhost:3000${r.path}`, { waitUntil: 'networkidle2' });
      await new Promise((res) => setTimeout(res, 300));

      // 1. axe WCAG 2.2 AA check
      const violations = await runAxeAudit(r.path);
      assert(
        violations.length === 0,
        `Public Route "${r.path}": 0 critical or serious WCAG 2.2 AA violations`
      );

      // 2. Viewport testing across all 9 screen widths
      const vpResults = await testRouteViewports(r.path, 'public');
      assert(
        vpResults.routeOverflowCount === 0 && vpResults.routeBlankCount === 0,
        `Public Route "${r.path}": Zero horizontal overflow & rendered content across all 9 viewports (360px - 1920px)`
      );
    }

    // -------------------------------------------------------------------------
    // GROUP B: 8 User Routes (Authenticated User)
    // -------------------------------------------------------------------------
    console.log('\n--- Step 7: Authenticating as Standard User & Testing 8 User Routes ---');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    await page.waitForSelector('#login-email', { timeout: 10000 });
    await page.waitForSelector('#login-password', { timeout: 10000 });

    await page.evaluate((email, pass) => {
      const emailInput = document.querySelector('#login-email');
      const passInput = document.querySelector('#login-password');
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(emailInput, email);
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      emailInput.dispatchEvent(new Event('change', { bubbles: true }));
      nativeSetter.call(passInput, pass);
      passInput.dispatchEvent(new Event('input', { bubbles: true }));
      passInput.dispatchEvent(new Event('change', { bubbles: true }));
    }, auditUser.email, 'AuditorPassword123!');

    await page.click('button[type="submit"]');
    await page.waitForFunction(() => window.location.pathname === '/feed', { timeout: 15000 });
    await page.waitForSelector('main', { timeout: 10000 });
    assert(true, '8. Authenticated successfully as standard user into /feed');

    for (const r of userRoutes) {
      await page.setViewport({ width: 1280, height: 800 });
      await page.goto(`http://localhost:3000${r.path}`, { waitUntil: 'networkidle2' });
      await new Promise((res) => setTimeout(res, 400));

      // 1. axe WCAG 2.2 AA check
      const violations = await runAxeAudit(r.path);
      assert(
        violations.length === 0,
        `User Route "${r.path}": 0 critical or serious WCAG 2.2 AA violations`
      );

      // 2. Viewport testing across all 9 screen widths
      const vpResults = await testRouteViewports(r.path, 'user');
      assert(
        vpResults.routeOverflowCount === 0 && vpResults.routeBlankCount === 0,
        `User Route "${r.path}": Zero horizontal overflow & rendered content across all 9 viewports (360px - 1920px)`
      );
    }

    // -------------------------------------------------------------------------
    // GROUP C: 6 Admin Routes (Authenticated Administrator)
    // -------------------------------------------------------------------------
    console.log('\n--- Step 8: Authenticating as Administrator & Testing 6 Admin Routes ---');
    await clientSession.send('Network.clearBrowserCookies');

    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    await page.waitForSelector('#login-email', { timeout: 10000 });
    await page.waitForSelector('#login-password', { timeout: 10000 });

    await page.evaluate((email, pass) => {
      const emailInput = document.querySelector('#login-email');
      const passInput = document.querySelector('#login-password');
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(emailInput, email);
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      emailInput.dispatchEvent(new Event('change', { bubbles: true }));
      nativeSetter.call(passInput, pass);
      passInput.dispatchEvent(new Event('input', { bubbles: true }));
      passInput.dispatchEvent(new Event('change', { bubbles: true }));
    }, auditAdmin.email, 'AuditorPassword123!');

    await page.click('button[type="submit"]');
    await page.waitForFunction(() => window.location.pathname === '/admin', { timeout: 15000 });
    await page.waitForSelector('main', { timeout: 10000 });
    assert(true, '9. Authenticated successfully as administrator into /admin');

    for (const r of adminRoutes) {
      await page.setViewport({ width: 1440, height: 900 });
      await page.goto(`http://localhost:3000${r.path}`, { waitUntil: 'networkidle2' });
      await new Promise((res) => setTimeout(res, 400));

      // 1. axe WCAG 2.2 AA check
      const violations = await runAxeAudit(r.path);
      assert(
        violations.length === 0,
        `Admin Route "${r.path}": 0 critical or serious WCAG 2.2 AA violations`
      );

      // 2. Viewport testing across all 9 screen widths
      const vpResults = await testRouteViewports(r.path, 'admin');
      assert(
        vpResults.routeOverflowCount === 0 && vpResults.routeBlankCount === 0,
        `Admin Route "${r.path}": Zero horizontal overflow & rendered content across all 9 viewports (360px - 1920px)`
      );
    }

    console.log('\n====================================================');
    console.log(`Phase 16 Responsive & A11y Audit: ${passed} passed, ${failed} failed`);
    console.log(`Total Routes Audited: ${publicRoutes.length + userRoutes.length + adminRoutes.length}`);
    console.log(`Total Viewport Checks: ${(publicRoutes.length + userRoutes.length + adminRoutes.length) * VIEWPORTS.length}`);
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
    if (userDataDir) {
      try {
        fs.rmSync(userDataDir, { recursive: true, force: true });
      } catch {}
    }
    if (nextProcess) {
      terminateProcess(nextProcess);
    }
    if (expressServer) {
      try {
        await closeSocketServer();
        await new Promise((resolve) => expressServer.close(resolve));
      } catch {}
    }
    try {
      if (createdCommentIds.length > 0) {
        await Comment.deleteMany({ _id: { $in: createdCommentIds } });
      }
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
