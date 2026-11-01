import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import http from 'http';
import mongoose from 'mongoose';
import { getTestMongoUri } from './test-helpers.mjs';
import { connectDatabase } from '../src/config/database.js';
import app from '../src/app.js';

const testUri = getTestMongoUri();
await connectDatabase(testUri);
console.log('Test script PID:', process.pid);
console.log('Mongoose connection name before listen:', mongoose.connection.name);

const server = http.createServer(app);
await new Promise((resolve) => server.listen(5000, '0.0.0.0', resolve));

const res = await fetch('http://localhost:5000/api/who-am-i');
console.log('HTTP fetch response:', res.status, await res.json());

await new Promise((resolve) => server.close(resolve));
await mongoose.disconnect();
process.exit(0);
