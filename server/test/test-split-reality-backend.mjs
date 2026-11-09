import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { User, Post, Comment, Like } from '../src/models/index.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { env } from '../src/config/env.js';
import {
  validateCreatePostInput,
  validateUpdatePostInput
} from '../src/validators/post.validator.js';
import {
  detectImageFormat,
  validateExternalUrl,
  processAndStoreMedia,
  deleteMediaFile,
  cleanupMediaFiles,
  UPLOADS_DIR
} from '../src/services/media.service.js';
import {
  createPost,
  getPostById,
  getMyPosts,
  getUserPosts,
  getFeed,
  updatePost,
  deletePost
} from '../src/services/post.service.js';
import { getAdminPosts, adminDeletePost } from '../src/services/admin.service.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ ${message}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${message}`);
    failed++;
  }
}

// 1x1 Transparent PNG binary data URI
const SAMPLE_PNG_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

// Minimal 1x1 JPEG binary data URI
const SAMPLE_JPEG_BASE64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

async function runTests() {
  console.log('================================================================');
  console.log('LOOPLY — LEVEL 1 BACKEND & SPLIT-REALITY POSTS VERIFICATION');
  console.log('================================================================\n');

  // ----------------------------------------------------------------
  // SECTION A: SCHEMA AND MODEL VALIDATION
  // ----------------------------------------------------------------
  console.log('[SECTION A] Post Model & Schema Integrity');

  const testAuthorId = new mongoose.Types.ObjectId();

  // Test 1: Normal Post Model Validation
  const validNormalPost = new Post({
    author: testAuthorId,
    content: 'A thoughtful reflection on engineering and design.'
  });
  let normErr = null;
  try {
    await validNormalPost.validate();
  } catch (err) {
    normErr = err;
  }
  assert(!normErr, '1. Valid normal post passes Mongoose schema validation');
  assert(validNormalPost.postType === 'normal', '   Default postType is "normal"');
  assert(validNormalPost.primaryMedia === null, '   Default primaryMedia is null');
  assert(validNormalPost.realityMedia === null, '   Default realityMedia is null');

  // Test 2: Normal Post missing content rejected
  const emptyNormalPost = new Post({
    author: testAuthorId,
    postType: 'normal',
    content: ''
  });
  let emptyErr = null;
  try {
    await emptyNormalPost.validate();
  } catch (err) {
    emptyErr = err;
  }
  assert(Boolean(emptyErr?.errors?.content), '2. Normal post with empty content rejected by pre-validate hook');

  // Test 3: Split-Reality Post Valid Schema Validation
  const validSplitPost = new Post({
    author: testAuthorId,
    postType: 'splitReality',
    primaryMedia: 'https://images.unsplash.com/photo-final.jpg',
    realityMedia: 'https://images.unsplash.com/photo-reality.jpg',
    content: 'From napkin sketch to final release!'
  });
  let splitErr = null;
  try {
    await validSplitPost.validate();
  } catch (err) {
    splitErr = err;
  }
  assert(!splitErr, '3. Valid Split-Reality post passes Mongoose schema validation');
  assert(validSplitPost.postType === 'splitReality', '   postType set to "splitReality"');

  // Test 4: Split-Reality Post missing primaryMedia rejected
  const missingPrimaryPost = new Post({
    author: testAuthorId,
    postType: 'splitReality',
    realityMedia: 'https://images.unsplash.com/photo-reality.jpg'
  });
  let misPrimaryErr = null;
  try {
    await missingPrimaryPost.validate();
  } catch (err) {
    misPrimaryErr = err;
  }
  assert(Boolean(misPrimaryErr?.errors?.primaryMedia), '4. Split-Reality post missing primaryMedia strictly rejected');

  // Test 5: Split-Reality Post missing realityMedia rejected
  const missingRealityPost = new Post({
    author: testAuthorId,
    postType: 'splitReality',
    primaryMedia: 'https://images.unsplash.com/photo-final.jpg'
  });
  let misRealityErr = null;
  try {
    await missingRealityPost.validate();
  } catch (err) {
    misRealityErr = err;
  }
  assert(Boolean(misRealityErr?.errors?.realityMedia), '5. Split-Reality post missing realityMedia strictly rejected');

  // Test 6: Verify Post Indexes
  const postIndexes = Post.schema.indexes();
  assert(postIndexes.length >= 2, `6. Post schema indexes configured (total: ${postIndexes.length})`);

  // ----------------------------------------------------------------
  // SECTION B: MEDIA SERVICE, VALIDATION & SSRF SECURITY
  // ----------------------------------------------------------------
  console.log('\n[SECTION B] Media Service, Magic Bytes & SSRF Defense');

  // Test 7: Magic byte detection
  const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
  const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
  const fakeHeader = Buffer.from('NOT_AN_IMAGE_FILE_BUFFER');
  assert(detectImageFormat(pngHeader) === 'png', '7. PNG magic bytes accurately identified (89 50 4E 47)');
  assert(detectImageFormat(jpegHeader) === 'jpg', '   JPEG magic bytes accurately identified (FF D8 FF)');
  assert(detectImageFormat(fakeHeader) === null, '   Non-image buffer strictly rejected');

  // Test 8: SSRF Prevention
  assert(!validateExternalUrl('http://localhost:8080/secret').isValid, '8. SSRF: http://localhost strictly blocked');
  assert(!validateExternalUrl('http://127.0.0.1/admin').isValid, '   SSRF: 127.0.0.1 loopback strictly blocked');
  assert(!validateExternalUrl('http://10.0.0.1/api').isValid, '   SSRF: Private 10.0.0.0/8 strictly blocked');
  assert(!validateExternalUrl('http://192.168.1.1').isValid, '   SSRF: Private 192.168.0.0/16 strictly blocked');
  assert(!validateExternalUrl('http://169.254.169.254/latest/meta-data/').isValid, '   SSRF: Cloud metadata IP strictly blocked');
  assert(!validateExternalUrl('ftp://example.com/photo.jpg').isValid, '   SSRF: Non-HTTP/HTTPS protocol (ftp:) strictly blocked');
  assert(validateExternalUrl('https://images.unsplash.com/photo-12345.jpg').isValid, '   Public HTTPS image URL permitted');

  // Test 9: Base64 image decoding, magic byte inspection and local disk storage
  const storedMedia = await processAndStoreMedia(SAMPLE_PNG_BASE64);
  assert(storedMedia.isLocal === true && storedMedia.mediaUrl.startsWith('/uploads/posts/'), `9. Base64 PNG decoded, verified, and saved to disk (${storedMedia.mediaUrl})`);
  assert(fs.existsSync(storedMedia.filePath), '   Local file physically verified on disk');

  // Test 10: Safe deletion with path traversal prevention
  const deleted = await deleteMediaFile(storedMedia.mediaUrl);
  assert(deleted === true, '10. Local media file cleanly deleted');
  assert(!fs.existsSync(storedMedia.filePath), '    File verified removed from disk');
  const traversalAttempt = await deleteMediaFile('/uploads/posts/../../package.json');
  assert(!traversalAttempt, '    Directory traversal attempt strictly blocked');

  // ----------------------------------------------------------------
  // SECTION C: CONTROLLER INPUT VALIDATORS
  // ----------------------------------------------------------------
  console.log('\n[SECTION C] Input Validation Layer');

  // Test 11: validateCreatePostInput normal post
  const valNorm = validateCreatePostInput({ content: 'Authentic creator update' });
  assert(valNorm.isValid && valNorm.sanitized.postType === 'normal', '11. validateCreatePostInput handles normal post');

  // Test 12: validateCreatePostInput splitReality valid
  const valSplit = validateCreatePostInput({
    postType: 'splitReality',
    primaryMedia: 'https://images.unsplash.com/final.jpg',
    realityMedia: 'https://images.unsplash.com/reality.jpg',
    content: 'Behind the curtain!'
  });
  assert(valSplit.isValid && valSplit.sanitized.postType === 'splitReality', '12. validateCreatePostInput handles splitReality post');

  // Test 13: validateCreatePostInput splitReality missing media rejected
  const valSplitBad = validateCreatePostInput({
    postType: 'splitReality',
    primaryMedia: 'https://images.unsplash.com/final.jpg'
  });
  assert(!valSplitBad.isValid, '13. validateCreatePostInput rejects splitReality missing realityMedia');

  // Test 14: validateUpdatePostInput content
  const valUpd = validateUpdatePostInput({ content: 'Updated caption' });
  assert(valUpd.isValid && valUpd.sanitized.content === 'Updated caption', '14. validateUpdatePostInput validates caption');

  // ----------------------------------------------------------------
  // SECTION D: DATABASE INTEGRATION AND END-TO-END FLOW
  // ----------------------------------------------------------------
  console.log('\n[SECTION D] Database Integration, Retrieval & Cascades');

  const uri = env.MONGODB_TEST_URI || env.MONGODB_URI;
  await connectDatabase(uri);
  assert(mongoose.connection.readyState === 1, '15. Connected to test MongoDB database');

  // Create isolated test users
  const timestamp = Date.now();
  const creatorUser = new User({
    fullName: `Creator User ${timestamp}`,
    email: `creator_${timestamp}@example.com`,
    passwordHash: '$2b$10$hashedtestpassword1234567890',
    isEmailVerified: true,
    role: 'user',
    profile: { avatarUrl: 'https://example.com/avatar.jpg' }
  });
  await creatorUser.save();

  const otherUser = new User({
    fullName: `Other User ${timestamp}`,
    email: `other_${timestamp}@example.com`,
    passwordHash: '$2b$10$hashedtestpassword1234567890',
    isEmailVerified: true,
    role: 'user'
  });
  await otherUser.save();

  const adminUser = new User({
    fullName: `Admin User ${timestamp}`,
    email: `admin_${timestamp}@example.com`,
    passwordHash: '$2b$10$hashedtestpassword1234567890',
    isEmailVerified: true,
    role: 'admin'
  });
  await adminUser.save();

  assert(Boolean(creatorUser._id && otherUser._id && adminUser._id), '16. Isolated test users provisioned');

  let normalPostId = null;
  let splitPostId = null;

  // Test 17: Create Normal Post through Service
  const createdNormal = await createPost({
    authorId: creatorUser._id,
    content: 'Normal social publication on Looply.'
  });
  normalPostId = createdNormal._id;
  assert(createdNormal.postType === 'normal', '17. createPost persists normal post');
  assert(createdNormal.primaryMedia === null, '    Normal post primaryMedia is null');
  assert(createdNormal.realityMedia === null, '    Normal post realityMedia is null');

  // Test 18: Create Split-Reality Post through Service with Base64 Media
  const createdSplit = await createPost({
    authorId: creatorUser._id,
    postType: 'splitReality',
    primaryMedia: SAMPLE_PNG_BASE64,
    realityMedia: SAMPLE_JPEG_BASE64,
    content: 'Dual-perspective engineering milestone!'
  });
  splitPostId = createdSplit._id;
  assert(createdSplit.postType === 'splitReality', '18. createPost persists Split-Reality post');
  assert(createdSplit.primaryMedia.startsWith('/uploads/posts/'), `    primaryMedia saved to local storage: ${createdSplit.primaryMedia}`);
  assert(createdSplit.realityMedia.startsWith('/uploads/posts/'), `    realityMedia saved to local storage: ${createdSplit.realityMedia}`);

  // Test 19: Retrieve Post by ID
  const retrievedPost = await getPostById(splitPostId, creatorUser._id);
  assert(retrievedPost.postType === 'splitReality', '19. getPostById preserves postType');
  assert(Boolean(retrievedPost.primaryMedia && retrievedPost.realityMedia), '    getPostById returns both media references');

  // Test 20: Feed Aggregation Retrieval
  const feedResult = await getFeed({ userId: creatorUser._id, mode: 'latest', page: 1, limit: 10 });
  const feedSplit = feedResult.posts.find((p) => p._id.toString() === splitPostId.toString());
  const feedNorm = feedResult.posts.find((p) => p._id.toString() === normalPostId.toString());
  assert(Boolean(feedSplit), '20. Split-Reality post included in getFeed aggregation');
  assert(feedSplit.postType === 'splitReality', '    Split-Reality postType projected correctly');
  assert(Boolean(feedSplit.primaryMedia && feedSplit.realityMedia), '    Both media references projected in feed');
  assert(Boolean(feedNorm && feedNorm.postType === 'normal'), '    Normal post projected correctly alongside Split-Reality');

  // Test 21: Feed Modes Verification
  const exploreResult = await getFeed({ userId: creatorUser._id, mode: 'explore', page: 1, limit: 10 });
  assert(exploreResult.mode === 'explore', '21. getFeed supports explore mode');

  // Test 22: User Profile Posts Retrieval
  const userPostsResult = await getUserPosts({ userId: creatorUser._id, viewerId: otherUser._id, page: 1, limit: 10 });
  const userSplit = userPostsResult.posts.find((p) => p._id.toString() === splitPostId.toString());
  assert(Boolean(userSplit), '22. getUserPosts returns creator Split-Reality post');
  assert(Boolean(userSplit.primaryMedia && userSplit.realityMedia), '    getUserPosts returns both media references');

  // Test 23: Current User Posts Retrieval (getMyPosts)
  const myPostsResult = await getMyPosts({ authorId: creatorUser._id, page: 1, limit: 10, skip: 0 });
  const mySplit = myPostsResult.posts.find((p) => p._id.toString() === splitPostId.toString());
  assert(Boolean(mySplit), '23. getMyPosts returns authenticated creator Split-Reality post');

  // Test 24: Admin Post Listing (getAdminPosts)
  const adminPostsResult = await getAdminPosts({ page: 1, limit: 10 });
  const adminSplit = adminPostsResult.posts.find((p) => p._id.toString() === splitPostId.toString());
  assert(Boolean(adminSplit), '24. getAdminPosts surfaces Split-Reality post for moderation');

  // Test 25: Post Editing Authorization
  const updated = await updatePost({ postId: splitPostId, authorId: creatorUser._id, content: 'Updated caption!' });
  assert(updated.content === 'Updated caption!', '25. Creator successfully updates own post caption');
  try {
    await updatePost({ postId: splitPostId, authorId: otherUser._id, content: 'Unauthorized edit' });
    assert(false, '26. Non-author edit did not fail');
  } catch (err) {
    assert(err.status === 403, '26. Non-author edit strictly rejected with HTTP 403');
  }

  // Test 27: Post Deletion Authorization & Local Media Cleanup
  try {
    await deletePost({ postId: splitPostId, authorId: otherUser._id });
    assert(false, '27. Non-author deletion did not fail');
  } catch (err) {
    assert(err.status === 403, '27. Non-author deletion strictly rejected with HTTP 403');
  }

  const primaryLocalFile = path.join(UPLOADS_DIR, path.basename(createdSplit.primaryMedia));
  const realityLocalFile = path.join(UPLOADS_DIR, path.basename(createdSplit.realityMedia));
  assert(fs.existsSync(primaryLocalFile) && fs.existsSync(realityLocalFile), '28. Local media files verified before deletion');

  const deleteSuccess = await deletePost({ postId: splitPostId, authorId: creatorUser._id });
  assert(deleteSuccess === true, '29. Author successfully deleted Split-Reality post');

  // Wait a moment for non-blocking cleanup
  await new Promise((res) => setTimeout(res, 500));
  assert(!fs.existsSync(primaryLocalFile), '    Primary media file cleanly unlinked from disk');
  assert(!fs.existsSync(realityLocalFile), '    Reality media file cleanly unlinked from disk');

  // Clean up remaining test data
  await Promise.all([
    Post.deleteMany({ author: { $in: [creatorUser._id, otherUser._id, adminUser._id] } }),
    User.deleteMany({ _id: { $in: [creatorUser._id, otherUser._id, adminUser._id] } })
  ]);

  await disconnectDatabase();
  assert(mongoose.connection.readyState === 0, '30. Test database cleanly disconnected');

  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

