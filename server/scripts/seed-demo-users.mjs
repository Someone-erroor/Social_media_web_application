import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../src/config/env.js';

async function seedDemoUsers() {
  console.log('[1/4] Connecting to MongoDB Atlas...');
  await mongoose.connect(env.MONGODB_URI);
  console.log('[2/4] Connected to database:', mongoose.connection.name);

  const sharedPassword = 'Password@123';
  const hashedPassword = await bcrypt.hash(sharedPassword, 12);
  const usersCollection = mongoose.connection.collection('users');

  const accounts = [
    {
      email: 'admin@looply.com',
      password: 'Password@123',
      fullName: 'Looply Administrator',
      role: 'admin',
      bio: 'Platform Lead Administrator with full platform controls.'
    },
    {
      email: 'admin@looply.social',
      password: 'Admin@1234',
      fullName: 'Looply Administrator',
      role: 'admin',
      bio: 'Platform Lead Administrator with full platform controls.'
    },
    {
      email: 'demo@looply.com',
      password: 'Password@123',
      fullName: 'Demo Explorer',
      role: 'user',
      bio: 'Demo community creator exploring Looply features.'
    },
    {
      email: 'user@looply.com',
      password: 'Password@123',
      fullName: 'Looply Demo User',
      role: 'user',
      bio: 'Standard demo user for social posting and interactions.'
    }
  ];

  console.log('[3/4] Provisioning demo accounts...');

  for (const acc of accounts) {
    const hashedPassword = await bcrypt.hash(acc.password, 12);
    const result = await usersCollection.updateOne(
      { email: acc.email },
      {
        $set: {
          email: acc.email,
          fullName: acc.fullName,
          passwordHash: hashedPassword,
          role: acc.role,
          isEmailVerified: true,
          accountStatus: 'active',
          tokenVersion: 0,
          isPrivate: false,
          followers: [],
          following: [],
          followersCount: 0,
          followingCount: 0,
          blockedUsers: [],
          followRequests: [],
          sentFollowRequests: [],
          profile: {
            bio: acc.bio,
            avatarUrl: ''
          },
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    console.log(
      `✓ [${acc.role.toUpperCase()}] ${acc.email} -> password: "${acc.password}" (${result.upsertedCount ? 'Created' : 'Updated'})`
    );
  }

  console.log('[4/4] Demo users successfully provisioned in database!');
  await mongoose.disconnect();
  console.log('Done.');
}

seedDemoUsers().catch((err) => {
  console.error('Failed to seed demo users:', err);
  process.exit(1);
});

