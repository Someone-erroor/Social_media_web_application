/**
 * Looply - Local Admin Account Provisioning CLI
 *
 * Secure, local-only CLI utility to provision an administrator account.
 * Features:
 * - Interactive readline prompts (or optional CLI arguments)
 * - Strict refusal to run on test database (looply_test)
 * - Safe bcrypt password hashing (12 rounds)
 * - Zero plaintext password or secret logging
 */

import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { connectDatabase } from '../src/config/database.js';
import { User, ActivityLog } from '../src/models/index.js';

const BCRYPT_SALT_ROUNDS = 12;

function parseCliArgs() {
  const args = process.argv.slice(2);
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--name' && args[i + 1]) {
      options.fullName = args[++i];
    } else if (args[i] === '--email' && args[i + 1]) {
      options.email = args[++i];
    } else if (args[i] === '--password' && args[i + 1]) {
      options.password = args[++i];
    }
  }
  return options;
}

async function main() {
  console.log('\n========================================');
  console.log('   LOOPLY PLATFORM ADMIN PROVISIONING   ');
  console.log('========================================\n');

  // 1. Strict refusal to run against test database
  if (env.MONGODB_URI && env.MONGODB_URI.includes('looply_test')) {
    console.error('SAFETY ERROR: Refusing to provision administrator on looply_test.');
    console.error('Admin provisioning is prohibited on automated test databases.');
    process.exit(1);
  }

  // 2. Connect to database
  console.log('[1/4] Connecting to MongoDB...');
  await connectDatabase();

  if (mongoose.connection.name === 'looply_test') {
    console.error('SAFETY ERROR: Connected to looply_test database. Aborting.');
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`[2/4] Connected to database: ${mongoose.connection.name}`);

  const cliArgs = parseCliArgs();
  const rl = readline.createInterface({ input, output });

  try {
    // 3. Collect & validate credentials
    let fullName = cliArgs.fullName;
    while (!fullName || fullName.trim().length < 2) {
      fullName = await rl.question('Enter Admin Full Name: ');
      if (fullName.trim().length < 2) {
        console.log('Full name must be at least 2 characters long.');
      }
    }
    fullName = fullName.trim();

    let email = cliArgs.email;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    while (!email || !emailRegex.test(email.trim())) {
      email = await rl.question('Enter Admin Email Address: ');
      if (!emailRegex.test(email.trim())) {
        console.log('Please enter a valid email address.');
      }
    }
    email = email.trim().toLowerCase();

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`\nNote: An account with email "${email}" already exists (current role: ${existing.role}).`);
      const confirmPromote = await rl.question('Promote this existing user to Administrator? (y/N): ');
      if (confirmPromote.trim().toLowerCase() !== 'y') {
        console.log('Aborting admin creation without changes.');
        rl.close();
        await mongoose.disconnect();
        process.exit(0);
      }
    }

    let password = cliArgs.password;
    while (!password || password.length < 8) {
      password = await rl.question('Enter Secure Admin Password (min 8 characters): ');
      if (password.length < 8) {
        console.log('Password must be at least 8 characters long.');
        continue;
      }

      if (!cliArgs.password) {
        const confirm = await rl.question('Confirm Admin Password: ');
        if (password !== confirm) {
          console.log('Passwords do not match. Please try again.');
          password = '';
        }
      }
    }

    // 4. Hash password with bcrypt
    console.log('\n[3/4] Hashing password securely with bcrypt (12 rounds)...');
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // 5. Create or promote user
    console.log('[4/4] Provisioning administrator record in MongoDB...');
    let adminRecord;
    if (existing) {
      existing.fullName = fullName;
      existing.passwordHash = passwordHash;
      existing.role = 'admin';
      existing.isEmailVerified = true;
      existing.accountStatus = 'active';
      existing.tokenVersion = (existing.tokenVersion || 0) + 1;
      adminRecord = await existing.save();
    } else {
      adminRecord = await User.create({
        fullName,
        email,
        passwordHash,
        role: 'admin',
        isEmailVerified: true,
        accountStatus: 'active',
        profile: {
          bio: 'Looply Platform Administrator',
          avatarUrl: ''
        }
      });
    }

    // Record audit event
    await ActivityLog.create({
      action: 'admin_action',
      targetType: 'User',
      targetId: adminRecord._id,
      details: {
        event: 'admin_account_provisioned',
        email: adminRecord.email
      }
    }).catch(() => {});

    console.log('\n========================================');
    console.log('   ADMIN ACCOUNT PROVISIONED SUCCESSFULLY');
    console.log('========================================');
    console.log(`Full Name:      ${adminRecord.fullName}`);
    console.log(`Email:          ${adminRecord.email}`);
    console.log(`Role:           ${adminRecord.role}`);
    console.log(`Account Status: ${adminRecord.accountStatus}`);
    console.log(`Email Verified: ${adminRecord.isEmailVerified}`);
    console.log(`Database:       ${mongoose.connection.name}`);
    console.log('========================================\n');
  } finally {
    rl.close();
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error('\nFatal Error provisioning admin account:', err.message);
  process.exit(1);
});

