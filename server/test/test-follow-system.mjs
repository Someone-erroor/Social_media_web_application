import assert from 'assert';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';
import { User, ActivityLog } from '../src/models/index.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { generateToken } from '../src/config/jwt.js';
import { getTestMongoUri, validateTestDatabaseSafety } from './test-helpers.mjs';

async function runFollowSystemTests() {
  console.log('====================================================');
  console.log('LOOPLY — FOLLOW / UNFOLLOW SYSTEM VERIFICATION SUITE');
  console.log('====================================================\n');

  const testMongoUri = getTestMongoUri();
  validateTestDatabaseSafety(testMongoUri);
  await connectDatabase(testMongoUri);

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api/profiles`;
  const createdUserIds = [];

  let passed = 0;
  function pass(msg) {
    passed++;
    console.log(`✓ ${passed}. ${msg}`);
  }

  try {
    const timestamp = Date.now();
    const passwordHash = await bcrypt.hash('TestPassword123!', 12);

    // Create User A
    const userA = new User({
      fullName: 'User A Explorer',
      email: `usera_${timestamp}@example.com`,
      passwordHash,
      role: 'user',
      isEmailVerified: true,
      accountStatus: 'active',
      tokenVersion: 0,
      followers: [],
      following: []
    });
    await userA.save();
    createdUserIds.push(userA._id);

    // Create User B
    const userB = new User({
      fullName: 'User B Creator',
      email: `userb_${timestamp}@example.com`,
      passwordHash,
      role: 'user',
      isEmailVerified: true,
      accountStatus: 'active',
      tokenVersion: 0,
      followers: [],
      following: []
    });
    await userB.save();
    createdUserIds.push(userB._id);

    // Create User C
    const userC = new User({
      fullName: 'User C Observer',
      email: `userc_${timestamp}@example.com`,
      passwordHash,
      role: 'user',
      isEmailVerified: true,
      accountStatus: 'active',
      tokenVersion: 0,
      followers: [],
      following: []
    });
    await userC.save();
    createdUserIds.push(userC._id);

    const tokenA = generateToken({ userId: userA._id.toString(), role: userA.role, tokenVersion: userA.tokenVersion });
    const tokenB = generateToken({ userId: userB._id.toString(), role: userB.role, tokenVersion: userB.tokenVersion });
    const tokenC = generateToken({ userId: userC._id.toString(), role: userC.role, tokenVersion: userC.tokenVersion });

    // Test 1: Unauthenticated follow attempt -> 401
    const resNoAuth = await fetch(`${baseUrl}/${userB._id}/follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    assert.strictEqual(resNoAuth.status, 401);
    pass('Unauthenticated follow request is rejected with HTTP 401');

    // Test 2: Self-follow attempt -> 400
    const resSelfFollow = await fetch(`${baseUrl}/${userA._id}/follow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      }
    });
    const jsonSelfFollow = await resSelfFollow.json();
    assert.strictEqual(resSelfFollow.status, 400);
    assert.strictEqual(jsonSelfFollow.message, 'You cannot follow yourself.');
    pass('Self-follow attempt is rejected with HTTP 400 and clear error message');

    // Test 3: Follow invalid ObjectId -> 400
    const resInvalidId = await fetch(`${baseUrl}/invalid-user-id-format/follow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      }
    });
    const jsonInvalidId = await resInvalidId.json();
    assert.strictEqual(resInvalidId.status, 400);
    assert.strictEqual(jsonInvalidId.message, 'Invalid user ID format.');
    pass('Invalid user ID format returns HTTP 400');

    // Test 4: Follow non-existent user -> 404
    const nonExistentId = new mongoose.Types.ObjectId();
    const resNotFound = await fetch(`${baseUrl}/${nonExistentId}/follow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      }
    });
    const jsonNotFound = await resNotFound.json();
    assert.strictEqual(resNotFound.status, 404);
    assert.strictEqual(jsonNotFound.message, 'User not found.');
    pass('Following a non-existent user returns HTTP 404');

    // Test 5: Scenario 1 - User A follows User B -> 200
    const resFollow = await fetch(`${baseUrl}/${userB._id}/follow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      }
    });
    const jsonFollow = await resFollow.json();
    assert.strictEqual(resFollow.status, 200);
    assert.strictEqual(jsonFollow.success, true);
    assert.strictEqual(jsonFollow.isFollowing, true);
    assert.strictEqual(jsonFollow.followersCount, 1);
    assert.strictEqual(jsonFollow.followingCount, 1);

    // Verify database state directly
    const dbUserBAfterFollow = await User.findById(userB._id);
    const dbUserAAfterFollow = await User.findById(userA._id);
    assert.ok(dbUserBAfterFollow.followers.some((id) => id.toString() === userA._id.toString()));
    assert.ok(dbUserAAfterFollow.following.some((id) => id.toString() === userB._id.toString()));
    pass('User A follows User B: Both followers and following updated correctly in database');

    // Test 6: Scenario 4 - User A follows User B again (duplicate prevention) -> idempotent 200
    const resFollowDup = await fetch(`${baseUrl}/${userB._id}/follow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      }
    });
    const jsonFollowDup = await resFollowDup.json();
    assert.strictEqual(resFollowDup.status, 200);
    assert.strictEqual(jsonFollowDup.isFollowing, true);

    const dbUserBAfterDup = await User.findById(userB._id);
    assert.strictEqual(dbUserBAfterDup.followers.length, 1);
    pass('Duplicate follow attempt prevented: no redundant entries in database');

    // Test 7: Get follow status for User A viewing User B
    const resStatus = await fetch(`${baseUrl}/${userB._id}/follow-status`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const jsonStatus = await resStatus.json();
    assert.strictEqual(resStatus.status, 200);
    assert.strictEqual(jsonStatus.isFollowing, true);
    assert.strictEqual(jsonStatus.isOwnProfile, false);
    assert.strictEqual(jsonStatus.canFollow, true);
    assert.strictEqual(jsonStatus.followersCount, 1);
    pass('GET follow-status accurately returns isFollowing=true, isOwnProfile=false, canFollow=true');

    // Test 8: Get follow status for User B viewing own profile
    const resStatusSelf = await fetch(`${baseUrl}/${userB._id}/follow-status`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const jsonStatusSelf = await resStatusSelf.json();
    assert.strictEqual(resStatusSelf.status, 200);
    assert.strictEqual(jsonStatusSelf.isFollowing, false);
    assert.strictEqual(jsonStatusSelf.isOwnProfile, true);
    assert.strictEqual(jsonStatusSelf.canFollow, false);
    pass('GET follow-status on own profile accurately returns isOwnProfile=true, canFollow=false');

    // Test 9: Public profile endpoint extended with follow status and counts
    const resPublicProfile = await fetch(`${baseUrl}/${userB._id}`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const jsonPublicProfile = await resPublicProfile.json();
    assert.strictEqual(resPublicProfile.status, 200);
    assert.strictEqual(jsonPublicProfile.profile.isFollowing, true);
    assert.strictEqual(jsonPublicProfile.profile.isOwnProfile, false);
    assert.strictEqual(jsonPublicProfile.profile.followersCount, 1);
    assert.strictEqual(jsonPublicProfile.profile.followingCount, 0);
    pass('GET public profile endpoint correctly includes follow status and follower counts');

    // Test 10: User C also follows User B
    const resFollowC = await fetch(`${baseUrl}/${userB._id}/follow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenC}`
      }
    });
    assert.strictEqual(resFollowC.status, 200);
    pass('User C successfully follows User B');

    // Test 11: Get followers of User B -> should return User A and User C
    const resFollowers = await fetch(`${baseUrl}/${userB._id}/followers`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const jsonFollowers = await resFollowers.json();
    assert.strictEqual(resFollowers.status, 200);
    assert.strictEqual(jsonFollowers.count, 2);
    assert.strictEqual(jsonFollowers.followers.length, 2);

    const followerIds = jsonFollowers.followers.map((f) => f._id.toString());
    assert.ok(followerIds.includes(userA._id.toString()));
    assert.ok(followerIds.includes(userC._id.toString()));

    // Verify sensitive fields are strictly excluded
    for (const f of jsonFollowers.followers) {
      assert.strictEqual(f.passwordHash, undefined);
      assert.strictEqual(f.verificationTokenHash, undefined);
      assert.strictEqual(f.resetPasswordTokenHash, undefined);
      assert.strictEqual(f.tokenVersion, undefined);
    }
    pass('GET followers returns complete list with sensitive credentials strictly excluded');

    // Test 12: Get following of User A -> should return User B
    const resFollowing = await fetch(`${baseUrl}/${userA._id}/following`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const jsonFollowing = await resFollowing.json();
    assert.strictEqual(resFollowing.status, 200);
    assert.strictEqual(jsonFollowing.count, 1);
    assert.strictEqual(jsonFollowing.following[0]._id.toString(), userB._id.toString());
    assert.strictEqual(jsonFollowing.following[0].passwordHash, undefined);
    pass('GET following returns list of followed users with safe public attributes');

    // Test 13: Scenario 2 - User A unfollows User B -> 200
    const resUnfollow = await fetch(`${baseUrl}/${userB._id}/unfollow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      }
    });
    const jsonUnfollow = await resUnfollow.json();
    assert.strictEqual(resUnfollow.status, 200);
    assert.strictEqual(jsonUnfollow.isFollowing, false);
    assert.strictEqual(jsonUnfollow.followersCount, 1); // User C still follows User B
    assert.strictEqual(jsonUnfollow.followingCount, 0); // User A now follows 0 users

    const dbUserBAfterUnfollow = await User.findById(userB._id);
    const dbUserAAfterUnfollow = await User.findById(userA._id);
    assert.ok(!dbUserBAfterUnfollow.followers.some((id) => id.toString() === userA._id.toString()));
    assert.ok(!dbUserAAfterUnfollow.following.some((id) => id.toString() === userB._id.toString()));
    pass('User A unfollows User B: Relationship cleanly removed from both users in database');

    // Test 14: Scenario 7 - Idempotent unfollow when not following -> 200 without corruption
    const resUnfollowAgain = await fetch(`${baseUrl}/${userB._id}/unfollow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      }
    });
    const jsonUnfollowAgain = await resUnfollowAgain.json();
    assert.strictEqual(resUnfollowAgain.status, 200);
    assert.strictEqual(jsonUnfollowAgain.isFollowing, false);
    assert.strictEqual(jsonUnfollowAgain.message, 'You are not following this user.');
    pass('Unfollowing when not following returns success without corrupting data');

    // Test 15: DELETE HTTP method alias for unfollow
    // User C unfollows User B via DELETE /api/profiles/:userId/follow
    const resDeleteUnfollow = await fetch(`${baseUrl}/${userB._id}/follow`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenC}`
      }
    });
    const jsonDeleteUnfollow = await resDeleteUnfollow.json();
    assert.strictEqual(resDeleteUnfollow.status, 200);
    assert.strictEqual(jsonDeleteUnfollow.isFollowing, false);
    assert.strictEqual(jsonDeleteUnfollow.followersCount, 0);
    pass('DELETE /api/profiles/:userId/follow correctly aliases unfollow operation');

    // Test 16: ActivityLog records follow and unfollow events
    const followAuditLogs = await ActivityLog.find({
      actor: { $in: [userA._id, userC._id] },
      action: { $in: ['follow_user', 'unfollow_user'] }
    });
    assert.ok(followAuditLogs.length >= 2);
    pass('Audit logs accurately record follow and unfollow activities');

    console.log('\n====================================================');
    console.log(`ALL ${passed} FOLLOW / UNFOLLOW INTEGRATION TESTS PASSED!`);
    console.log('====================================================\n');
  } finally {
    // Cleanup created test records
    if (createdUserIds.length > 0) {
      await User.deleteMany({ _id: { $in: createdUserIds } });
      await ActivityLog.deleteMany({ actor: { $in: createdUserIds } });
    }
    server.close();
    await disconnectDatabase();
  }
}

runFollowSystemTests().catch((err) => {
  console.error('\n❌ Follow System Test Failed:', err);
  process.exit(1);
});

