import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../src/config/env.js';

async function provision() {
  console.log('[1/3] Connecting to MongoDB Atlas...');
  await mongoose.connect(env.MONGODB_URI);
  console.log('[2/3] Connected to database:', mongoose.connection.name);

  const hashedPassword = await bcrypt.hash('Admin@1234', 12);

  const usersCollection = mongoose.connection.collection('users');

  // 1. Demo Admin Account: admin@looply.social
  await usersCollection.updateOne(
    { email: 'admin@looply.social' },
    {
      $set: {
        email: 'admin@looply.social',
        fullName: 'Looply Administrator',
        passwordHash: hashedPassword,
        role: 'admin',
        isEmailVerified: true,
        accountStatus: 'active',
        tokenVersion: 0,
        profile: { bio: 'Platform Lead Administrator', avatarUrl: '' },
        updatedAt: new Date()
      },
      $setOnInsert: {
        createdAt: new Date()
      }
    },
    { upsert: true }
  );
  console.log('✓ Provisioned admin@looply.social (password: Admin@1234)');

  // 2. Demo Admin Account: admin@smartbookstore.com
  await usersCollection.updateOne(
    { email: 'admin@smartbookstore.com' },
    {
      $set: {
        email: 'admin@smartbookstore.com',
        fullName: 'Platform Admin',
        passwordHash: hashedPassword,
        role: 'admin',
        isEmailVerified: true,
        accountStatus: 'active',
        tokenVersion: 0,
        profile: { bio: 'System Administrator', avatarUrl: '' },
        updatedAt: new Date()
      },
      $setOnInsert: {
        createdAt: new Date()
      }
    },
    { upsert: true }
  );
  console.log('✓ Provisioned admin@smartbookstore.com (password: Admin@1234)');

  // 3. User account av@gmail.com -> promote to admin & set password to Admin@1234
  await usersCollection.updateOne(
    { email: 'av@gmail.com' },
    {
      $set: {
        role: 'admin',
        isEmailVerified: true,
        accountStatus: 'active',
        passwordHash: hashedPassword,
        updatedAt: new Date()
      }
    }
  );
  console.log('✓ Promoted av@gmail.com to role: admin (password: Admin@1234)');

  // 4. User account ravikishan76768@gmail.com -> promote to admin
  await usersCollection.updateOne(
    { email: 'ravikishan76768@gmail.com' },
    {
      $set: {
        role: 'admin',
        isEmailVerified: true,
        accountStatus: 'active',
        updatedAt: new Date()
      }
    }
  );
  console.log('✓ Promoted ravikishan76768@gmail.com to role: admin');

  console.log('[3/3] Admin accounts successfully provisioned and verified!');
  await mongoose.disconnect();
}

provision().catch((err) => {
  console.error('Provisioning failed:', err);
  process.exit(1);
});

