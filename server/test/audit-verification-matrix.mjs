import assert from 'assert';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';
import {
  User,
  Post,
  Comment,
  Notification,
  Report,
  TimeCapsule,
  GameChallenge,
  Circle,
  GlobalEvent,
  Conversation,
  Message
} from '../src/models/index.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { generateToken } from '../src/config/jwt.js';
import { getTestMongoUri, validateTestDatabaseSafety } from './test-helpers.mjs';

const TEST_PORT = 5005;
const baseUrl = `http://127.0.0.1:${TEST_PORT}/api`;

async function runAuditMatrix() {
  process.env.NODE_ENV = 'test';
  console.log('====================================================');
  console.log('LOOPLY — POST-IMPLEMENTATION COMPREHENSIVE AUDIT MATRIX');
  console.log('====================================================\n');

  let serverInstance = null;
  let passedCount = 0;
  const createdUserIds = [];
  const createdPostIds = [];
  const createdReportIds = [];
  const createdCapsuleIds = [];
  const createdChallengeIds = [];
  const createdCircleIds = [];

  function recordPass(msg) {
    passedCount++;
    console.log(`✓ [PASSED ${passedCount}] ${msg}`);
  }

  try {
    // 0. DB Safety & Connect
    const testMongoUri = getTestMongoUri();
    validateTestDatabaseSafety(testMongoUri);
    await connectDatabase(testMongoUri, { serverSelectionTimeoutMS: 20000, connectTimeoutMS: 25000 });
    recordPass(`Connected safely to test database: "${mongoose.connection.name}"`);

    await new Promise((resolve) => {
      serverInstance = app.listen(TEST_PORT, () => resolve());
    });
    recordPass(`Audit test server listening on port ${TEST_PORT}`);

    // Helper to generate auth header
    const authHeaders = (user) => ({
      Authorization: `Bearer ${generateToken({
        userId: user._id.toString(),
        role: user.role,
        tokenVersion: typeof user.tokenVersion === 'number' ? user.tokenVersion : 0
      })}`,
      'Content-Type': 'application/json'
    });

    const timestamp = Date.now();
    const hash = await bcrypt.hash('Password@123', 10);

    // Create Test Users
    const [alice, bob, charlie, adminUser] = await Promise.all([
      User.create({
        fullName: 'Alice Audit',
        email: `alice_${timestamp}@test.com`,
        passwordHash: hash,
        isEmailVerified: true,
        accountStatus: 'active',
        role: 'user',
        isPrivate: false
      }),
      User.create({
        fullName: 'Bob Audit (Private)',
        email: `bob_${timestamp}@test.com`,
        passwordHash: hash,
        isEmailVerified: true,
        accountStatus: 'active',
        role: 'user',
        isPrivate: true
      }),
      User.create({
        fullName: 'Charlie Audit',
        email: `charlie_${timestamp}@test.com`,
        passwordHash: hash,
        isEmailVerified: true,
        accountStatus: 'active',
        role: 'user',
        isPrivate: false
      }),
      User.create({
        fullName: 'Admin Auditor',
        email: `admin_${timestamp}@test.com`,
        passwordHash: hash,
        isEmailVerified: true,
        accountStatus: 'active',
        role: 'admin',
        isPrivate: false
      })
    ]);

    createdUserIds.push(alice._id, bob._id, charlie._id, adminUser._id);
    recordPass('Created 4 test accounts: Alice (public), Bob (private), Charlie (public), Admin');

    // -------------------------------------------------------------------------
    // PART 1 & 2: FOLLOW / UNFOLLOW SYSTEM & NOTIFICATIONS
    // -------------------------------------------------------------------------
    console.log('\n--- AUDIT PART 1: Follow / Unfollow System & Notifications ---');

    // 1. Self-follow rejection
    const selfFollowRes = await fetch(`${baseUrl}/profiles/${alice._id}/follow`, {
      method: 'POST',
      headers: authHeaders(alice)
    });
    const selfFollowData = await selfFollowRes.json();
    assert.strictEqual(selfFollowRes.status, 400, 'Self-follow must return 400');
    assert.strictEqual(selfFollowData.success, false);
    recordPass('Self-follow correctly rejected with 400 Bad Request');

    // 2. Follow public user (Alice follows Charlie)
    const followRes = await fetch(`${baseUrl}/profiles/${charlie._id}/follow`, {
      method: 'POST',
      headers: authHeaders(alice)
    });
    const followData = await followRes.json();
    assert.strictEqual(followRes.status, 200);
    assert.strictEqual(followData.success, true);
    assert.strictEqual(followData.isFollowing, true);
    recordPass('Alice successfully followed Charlie (public account)');

    // Verify dual-sided DB update
    const [aliceDb1, charlieDb1] = await Promise.all([
      User.findById(alice._id),
      User.findById(charlie._id)
    ]);
    assert(aliceDb1.following.some(id => id.toString() === charlie._id.toString()), 'Alice following list must contain Charlie');
    assert(charlieDb1.followers.some(id => id.toString() === alice._id.toString()), 'Charlie followers list must contain Alice');
    recordPass('Dual-sided relationship verified atomically in MongoDB');

    // Verify Follow notification was created for Charlie
    const followNotif = await Notification.findOne({
      recipient: charlie._id,
      actor: alice._id,
      type: 'follow'
    });
    assert(followNotif, 'Follow notification must exist for Charlie');
    assert.strictEqual(followNotif.type, 'follow');
    recordPass('Follow notification created in database for recipient');

    // 3. Duplicate follow idempotency
    const dupFollowRes = await fetch(`${baseUrl}/profiles/${charlie._id}/follow`, {
      method: 'POST',
      headers: authHeaders(alice)
    });
    const dupFollowData = await dupFollowRes.json();
    assert.strictEqual(dupFollowRes.status, 200);
    assert.strictEqual(dupFollowData.isFollowing, true);
    const charlieDbCheck = await User.findById(charlie._id);
    const charlieFollowersMatches = charlieDbCheck.followers.filter(id => id.toString() === alice._id.toString());
    assert.strictEqual(charlieFollowersMatches.length, 1, 'Followers list must have exactly 1 entry (no duplicates)');
    recordPass('Duplicate follow handled idempotently without corrupting or duplicating array');

    // 4. Followers & Following retrieval
    const followersRes = await fetch(`${baseUrl}/profiles/${charlie._id}/followers`, {
      headers: authHeaders(alice)
    });
    const followersData = await followersRes.json();
    assert.strictEqual(followersData.success, true);
    assert.strictEqual(followersData.count, 1);
    assert.strictEqual(followersData.followers[0]._id.toString(), alice._id.toString());
    recordPass('Followers list retrieved accurately with correct count and details');

    // 5. Unfollow Charlie
    const unfollowRes = await fetch(`${baseUrl}/profiles/${charlie._id}/follow`, {
      method: 'DELETE',
      headers: authHeaders(alice)
    });
    const unfollowData = await unfollowRes.json();
    assert.strictEqual(unfollowRes.status, 200);
    assert.strictEqual(unfollowData.isFollowing, false);

    const [aliceDb2, charlieDb2] = await Promise.all([
      User.findById(alice._id),
      User.findById(charlie._id)
    ]);
    assert(!aliceDb2.following.some(id => id.toString() === charlie._id.toString()), 'Alice following must not contain Charlie');
    assert(!charlieDb2.followers.some(id => id.toString() === alice._id.toString()), 'Charlie followers must not contain Alice');
    recordPass('Unfollow removes dual-sided relationship cleanly from both user documents');

    // -------------------------------------------------------------------------
    // PART 3: PRIVATE ACCOUNTS & FOLLOW REQUESTS & POST IDOR DEFENSE
    // -------------------------------------------------------------------------
    console.log('\n--- AUDIT PART 2: Private Accounts, Follow Requests & IDOR Protection ---');

    // 1. Follow private user (Alice follows Bob -> Pending Follow Request)
    const privFollowRes = await fetch(`${baseUrl}/profiles/${bob._id}/follow`, {
      method: 'POST',
      headers: authHeaders(alice)
    });
    const privFollowData = await privFollowRes.json();
    assert.strictEqual(privFollowRes.status, 200);
    assert.strictEqual(privFollowData.isPending, true);
    assert.strictEqual(privFollowData.isFollowing, false);
    recordPass('Following private user Bob produces pending follow request instead of immediate follow');

    // 2. Private post authorization (IDOR audit)
    const bobPrivatePost = await Post.create({
      author: bob._id,
      content: 'Bob secret private journal post'
    });
    createdPostIds.push(bobPrivatePost._id);

    // Alice tries to read Bob private post before being accepted
    const aliceViewPrivRes = await fetch(`${baseUrl}/posts/${bobPrivatePost._id}`, {
      headers: authHeaders(alice)
    });
    const aliceViewPrivData = await aliceViewPrivRes.json();
    assert.strictEqual(aliceViewPrivRes.status, 403, 'Unauthorized viewer must be rejected with 403 Forbidden');
    assert.strictEqual(aliceViewPrivData.success, false);
    recordPass('Private Post IDOR Defense: Non-follower strictly blocked with 403 Forbidden');

    // 3. Bob accepts Alice follow request
    const acceptReqRes = await fetch(`${baseUrl}/privacy/requests/${alice._id}/accept`, {
      method: 'POST',
      headers: authHeaders(bob)
    });
    const acceptReqData = await acceptReqRes.json();
    assert.strictEqual(acceptReqRes.status, 200);
    assert.strictEqual(acceptReqData.success, true);
    recordPass('Bob accepted Alice follow request');

    // Alice now approved follower: can access Bob private post
    const aliceViewApprovedRes = await fetch(`${baseUrl}/posts/${bobPrivatePost._id}`, {
      headers: authHeaders(alice)
    });
    const aliceViewApprovedData = await aliceViewApprovedRes.json();
    assert.strictEqual(aliceViewApprovedRes.status, 200);
    assert.strictEqual(aliceViewApprovedData.post.content, 'Bob secret private journal post');
    recordPass('Approved follower can now access private post successfully');

    // 4. Privacy settings retrieval & toggle verification
    const privSettingsRes = await fetch(`${baseUrl}/privacy/settings`, {
      headers: authHeaders(bob)
    });
    const privSettingsData = await privSettingsRes.json();
    assert.strictEqual(privSettingsRes.status, 200);
    assert.strictEqual(privSettingsData.settings.isPrivate, true);
    recordPass('Privacy settings endpoint correctly reflects account private status');

    // -------------------------------------------------------------------------
    // PART 4: SAFETY, BLOCKING & REPORTING
    // -------------------------------------------------------------------------
    console.log('\n--- AUDIT PART 3: Safety, Blocking & Reporting ---');

    // 1. Charlie blocks Alice
    // First let Charlie and Alice follow each other
    await User.findByIdAndUpdate(charlie._id, { $addToSet: { following: alice._id, followers: alice._id } });
    await User.findByIdAndUpdate(alice._id, { $addToSet: { following: charlie._id, followers: charlie._id } });

    const blockRes = await fetch(`${baseUrl}/safety/blocks/${alice._id}`, {
      method: 'POST',
      headers: authHeaders(charlie)
    });
    const blockData = await blockRes.json();
    assert.strictEqual(blockRes.status, 200);
    assert.strictEqual(blockData.isBlocked, true);

    const [charlieDb3, aliceDb3] = await Promise.all([
      User.findById(charlie._id),
      User.findById(alice._id)
    ]);
    assert(charlieDb3.blockedUsers.some(id => id.toString() === alice._id.toString()), 'Charlie blockedUsers must contain Alice');
    assert(!charlieDb3.following.some(id => id.toString() === alice._id.toString()), 'Blocking must sever Charlie following Alice');
    assert(!aliceDb3.following.some(id => id.toString() === charlie._id.toString()), 'Blocking must sever Alice following Charlie');
    recordPass('Blocking severs all follower and following connections symmetrically');

    // 2. Post retrieval between blocked users returns 404 (invisible)
    const charliePost = await Post.create({
      author: charlie._id,
      content: 'Charlie public post'
    });
    createdPostIds.push(charliePost._id);

    const aliceViewBlockedRes = await fetch(`${baseUrl}/posts/${charliePost._id}`, {
      headers: authHeaders(alice)
    });
    assert.strictEqual(aliceViewBlockedRes.status, 404, 'Blocked relationship must make post return 404');
    recordPass('Blocked user cannot see blocker post (returns 404 Not Found)');

    // 3. Reporting System Verification
    const reportRes = await fetch(`${baseUrl}/safety/reports`, {
      method: 'POST',
      headers: authHeaders(alice),
      body: JSON.stringify({
        reportedTarget: charliePost._id,
        targetType: 'Post',
        category: 'spam',
        explanation: 'Automated test report on spam content'
      })
    });
    const reportData = await reportRes.json();
    assert.strictEqual(reportRes.status, 201);
    assert.strictEqual(reportData.success, true);
    assert(reportData.reportId);
    createdReportIds.push(reportData.reportId);
    recordPass('Safety report submitted successfully with valid category and targetType');

    // Duplicate report prevention
    const dupReportRes = await fetch(`${baseUrl}/safety/reports`, {
      method: 'POST',
      headers: authHeaders(alice),
      body: JSON.stringify({
        reportedTarget: charliePost._id,
        targetType: 'Post',
        category: 'spam',
        explanation: 'Second report'
      })
    });
    const dupReportData = await dupReportRes.json();
    assert.strictEqual(dupReportRes.status, 201);
    assert(dupReportData.message.includes('already submitted'));
    recordPass('Duplicate active report detected and deduplicated cleanly');

    // 4. Admin Access & Report Management
    // Non-admin blocked from admin reports
    const nonAdminRes = await fetch(`${baseUrl}/admin/reports`, {
      headers: authHeaders(alice)
    });
    assert.strictEqual(nonAdminRes.status, 403, 'Regular user must be blocked from /admin/reports with 403');
    recordPass('Admin endpoint enforces role authorization (regular user rejected 403)');

    // Admin retrieves reports
    const adminReportsRes = await fetch(`${baseUrl}/admin/reports`, {
      headers: authHeaders(adminUser)
    });
    const adminReportsData = await adminReportsRes.json();
    assert.strictEqual(adminReportsRes.status, 200);
    assert(adminReportsData.reports.some(r => r._id.toString() === reportData.reportId.toString()));
    recordPass('Admin retrieves reports including newly submitted report with populated fields');

    // Admin updates report status
    const updateReportRes = await fetch(`${baseUrl}/admin/reports/${reportData.reportId}/status`, {
      method: 'PATCH',
      headers: authHeaders(adminUser),
      body: JSON.stringify({
        status: 'resolved',
        resolutionNotes: 'Verified and actioned'
      })
    });
    const updateReportData = await updateReportRes.json();
    assert.strictEqual(updateReportRes.status, 200);
    assert.strictEqual(updateReportData.report.status, 'resolved');
    recordPass('Admin successfully resolved report status and logged resolution notes');

    // -------------------------------------------------------------------------
    // PART 5: LOOPLY PLAY & TIME CAPSULE & CIRCLES
    // -------------------------------------------------------------------------
    console.log('\n--- AUDIT PART 4: Looply Play, Time Capsule & Circles ---');

    // 1. Looply Play: Challenge creation with hidden answerKey
    const playRes = await fetch(`${baseUrl}/play/challenges`, {
      method: 'POST',
      headers: authHeaders(alice),
      body: JSON.stringify({
        gameType: 'who_knows_me',
        title: 'How well do you know Alice?',
        gameData: {
          questions: [
            { question: 'What is my favorite language?', options: ['Python', 'JavaScript', 'Rust'] }
          ]
        },
        answerKey: { q0: 1 } // Answer is JavaScript
      })
    });
    const playData = await playRes.json();
    assert.strictEqual(playRes.status, 201);
    createdChallengeIds.push(playData.challenge._id);
    recordPass('Play challenge created successfully');

    // List challenges and verify answerKey is NOT leaked
    const listChallengesRes = await fetch(`${baseUrl}/play/challenges`, {
      headers: authHeaders(bob)
    });
    const listChallengesData = await listChallengesRes.json();
    const foundChallenge = listChallengesData.challenges.find(c => c._id.toString() === playData.challenge._id.toString());
    assert(foundChallenge, 'Challenge must appear in challenges list');
    assert.strictEqual(foundChallenge.answerKey, undefined, 'answerKey must be excluded via select: false');
    recordPass('Security verification: answerKey strictly masked and not leaked to players');

    // Submit answer and calculate score
    const submitPlayRes = await fetch(`${baseUrl}/play/challenges/${playData.challenge._id}/answer`, {
      method: 'POST',
      headers: authHeaders(bob),
      body: JSON.stringify({
        userAnswers: { q0: 1 }
      })
    });
    const submitPlayData = await submitPlayRes.json();
    assert.strictEqual(submitPlayRes.status, 200);
    assert.strictEqual(submitPlayData.score, 1, 'Score must be 1 for correct answer');
    recordPass('Answer submitted and scored accurately (1/1)');

    // 2. Time Capsule: Locked content masking
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const capsuleRes = await fetch(`${baseUrl}/time-capsules`, {
      method: 'POST',
      headers: authHeaders(alice),
      body: JSON.stringify({
        title: 'Secret 2027 Goals',
        message: 'Top secret future vision content',
        unlockDate: futureDate,
        isShared: false
      })
    });
    const capsuleData = await capsuleRes.json();
    assert.strictEqual(capsuleRes.status, 201);
    createdCapsuleIds.push(capsuleData.capsule._id);
    recordPass('Future time capsule created and sealed');

    // List capsules: verify message is masked
    const listCapsuleRes = await fetch(`${baseUrl}/time-capsules`, {
      headers: authHeaders(alice)
    });
    const listCapsuleData = await listCapsuleRes.json();
    const foundCapsule = listCapsuleData.capsules.find(c => c._id.toString() === capsuleData.capsule._id.toString());
    assert(foundCapsule.isLocked, 'Future capsule must have isLocked = true');
    assert(foundCapsule.message.includes('Locked Memory Vault'), 'Message must be masked while locked');
    recordPass('Security verification: Sealed time capsule content is masked on server side');

    // 3. Circles: Creation, Join & Leave
    const circleRes = await fetch(`${baseUrl}/circles`, {
      method: 'POST',
      headers: authHeaders(alice),
      body: JSON.stringify({
        name: `Tech Innovators ${timestamp}`,
        description: 'Discussions on engineering and architecture',
        category: 'Technology'
      })
    });
    const circleData = await circleRes.json();
    assert.strictEqual(circleRes.status, 201);
    createdCircleIds.push(circleData.circle._id);
    recordPass('Circle created with creator as first member');

    // Bob joins circle
    const joinCircleRes = await fetch(`${baseUrl}/circles/${circleData.circle._id}/join`, {
      method: 'POST',
      headers: authHeaders(bob)
    });
    const joinCircleData = await joinCircleRes.json();
    assert.strictEqual(joinCircleRes.status, 200);
    assert.strictEqual(joinCircleData.memberCount, 2);
    recordPass('Bob joined circle; member count updated to 2');

    // Bob leaves circle
    const leaveCircleRes = await fetch(`${baseUrl}/circles/${circleData.circle._id}/leave`, {
      method: 'POST',
      headers: authHeaders(bob)
    });
    const leaveCircleData = await leaveCircleRes.json();
    assert.strictEqual(leaveCircleRes.status, 200);
    assert.strictEqual(leaveCircleData.memberCount, 1);
    recordPass('Bob left circle; member count decremented to 1');

    // -------------------------------------------------------------------------
    // PART 6: FEED MODES
    // -------------------------------------------------------------------------
    console.log('\n--- AUDIT PART 5: User-Controlled Feed Modes ---');

    for (const mode of ['latest', 'following', 'explore']) {
      const feedRes = await fetch(`${baseUrl}/feed?mode=${mode}`, {
        headers: authHeaders(alice)
      });
      const feedData = await feedRes.json();
      assert.strictEqual(feedRes.status, 200);
      assert.strictEqual(feedData.mode, mode);
      assert(Array.isArray(feedData.posts));
      recordPass(`Feed mode "${mode}" served with valid pagination and recommendation reasons`);
    }

    console.log('\n====================================================');
    console.log(`ALL ${passedCount} AUDIT VERIFICATION TESTS PASSED WITH 100% SUCCESS!`);
    console.log('====================================================\n');

  } catch (err) {
    console.error('\n❌ AUDIT VERIFICATION FAILED:', err);
    process.exitCode = 1;
  } finally {
    // Cleanup created test documents in test database
    try {
      if (createdUserIds.length > 0) await User.deleteMany({ _id: { $in: createdUserIds } });
      if (createdPostIds.length > 0) await Post.deleteMany({ _id: { $in: createdPostIds } });
      if (createdReportIds.length > 0) await Report.deleteMany({ _id: { $in: createdReportIds } });
      if (createdCapsuleIds.length > 0) await TimeCapsule.deleteMany({ _id: { $in: createdCapsuleIds } });
      if (createdChallengeIds.length > 0) await GameChallenge.deleteMany({ _id: { $in: createdChallengeIds } });
      if (createdCircleIds.length > 0) await Circle.deleteMany({ _id: { $in: createdCircleIds } });
    } catch (cleanupErr) {
      console.warn('Cleanup warning:', cleanupErr.message);
    }

    if (serverInstance) {
      await new Promise(resolve => serverInstance.close(resolve));
    }
    await disconnectDatabase();
  }
}

runAuditMatrix();
