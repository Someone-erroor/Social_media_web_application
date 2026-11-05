import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware.js';
import {
  getMyProfile,
  updateMyProfile,
  getPublicProfile
} from '../controllers/profile.controller.js';
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getFollowStatus
} from '../controllers/follow.controller.js';
import { getUserPosts } from '../controllers/post.controller.js';

const router = Router();

// Private profile management for authenticated user
router.get('/me', requireAuth, getMyProfile);
router.patch('/me', requireAuth, updateMyProfile);

// Follow / Unfollow social relationship endpoints
router.post('/:userId/follow', requireAuth, followUser);
router.post('/:userId/unfollow', requireAuth, unfollowUser);
router.delete('/:userId/follow', requireAuth, unfollowUser);
router.get('/:userId/followers', optionalAuth, getFollowers);
router.get('/:userId/following', optionalAuth, getFollowing);
router.get('/:userId/follow-status', optionalAuth, getFollowStatus);

// Public profile retrieval (with optionalAuth to detect isFollowing and isOwnProfile)
router.get('/:userId', optionalAuth, getPublicProfile);

// Public profile user posts retrieval
router.get('/:userId/posts', getUserPosts);

export default router;
