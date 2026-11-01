import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { getTestMongoUri } from './test-helpers.mjs';

const id = '6ae718b1ee48d162ea5402c6';
console.log('Searching for ID:', id);

try {
  const testUri = getTestMongoUri();
  const connTest = await mongoose.createConnection(testUri).asPromise();
  const userTest = await connTest.collection('users').findOne({ _id: new mongoose.Types.ObjectId(id) });
  console.log('Found in looply_test?', Boolean(userTest), connTest.name);
  await connTest.close();
} catch (e) {
  console.log('Error test db:', e.message);
}

try {
  const connMain = await mongoose.createConnection(env.MONGODB_URI).asPromise();
  const userMain = await connMain.collection('users').findOne({ _id: new mongoose.Types.ObjectId(id) });
  console.log('Found in main db?', Boolean(userMain), connMain.name, JSON.stringify(userMain));
  await connMain.close();
} catch (e) {
  console.log('Error main db:', e.message);
}

process.exit(0);
