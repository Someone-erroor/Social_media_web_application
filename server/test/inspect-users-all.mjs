import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const uri = process.env.MONGODB_URI;

async function check() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const users = await db.collection('users').find({}, { projection: { email: 1, role: 1, fullName: 1, isEmailVerified: 1 } }).toArray();
  console.log('Total users:', users.length);
  console.log(users.map(u => `${u.role}: ${u.email} (${u.fullName})`));
  await mongoose.disconnect();
}

check().catch(console.error);

