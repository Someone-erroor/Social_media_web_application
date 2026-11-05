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
  const collections = await db.listCollections().toArray();
  console.log('Collections in database:');
  for (const col of collections) {
    const count = await db.collection(col.name).countDocuments();
    console.log(`- ${col.name}: ${count} documents`);
  }
  await mongoose.disconnect();
}

check().catch(console.error);

