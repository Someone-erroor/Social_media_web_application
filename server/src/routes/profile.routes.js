import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  getMyProfile,
  updateMyProfile,
  getPublicProfile
} from '../controllers/profile.controller.js';
import { getUserPosts } from '../controllers/post.controller.js';

const router = Router();

// Private profile management for authenticated user
router.get('/me', requireAuth, getMyProfile);
router.patch('/me', requireAuth, updateMyProfile);

// Public profile retrieval
router.get('/:userId', getPublicProfile);

// Public profile user posts retrieval
router.get('/:userId/posts', getUserPosts);

export default router;

