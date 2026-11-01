import mongoose from 'mongoose';
import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

const uri = 'mongodb+srv://ravikishan76768_db_user:1akCgBZbypjb56bN@cluster0.vtydaeh.mongodb.net/looply?retryWrites=true&w=majority';

async function run() {
  await mongoose.connect(uri);
  const res = await mongoose.connection.collection('users').updateMany(
    { email: { $in: ['user@gmail.com', 'randomsuser@gmail.com', 'randomuser@gmail.com'] } },
    { $set: { isEmailVerified: true } }
  );
  console.log('Successfully verified users count:', res.modifiedCount);
  await mongoose.disconnect();
}

run().catch(console.error);

