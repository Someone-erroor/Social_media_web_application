import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';

async function check() {
  console.log('Attempting connection to DB...');
  await mongoose.connect(env.MONGODB_URI);
  console.log('Connected to DB:', mongoose.connection.name);
  const users = await mongoose.connection.collection('users').find({}).toArray();
  console.log('USERS FOUND:', users.length);
  for (const u of users) {
    console.log(JSON.stringify({ id: u._id, email: u.email, fullName: u.fullName, role: u.role, isEmailVerified: u.isEmailVerified, accountStatus: u.accountStatus }));
  }
  await mongoose.disconnect();
}
check().catch(console.error);
