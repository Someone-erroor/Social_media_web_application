import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

import mongoose from 'mongoose';
import dotenv from 'dotenv';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: './.env' });
dotenv.config({ path: './server/.env' });

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

