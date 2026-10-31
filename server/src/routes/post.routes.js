import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  createPost,
  getMyPosts,
  getPostById,
  updatePost,
  deletePost
} from '../controllers/post.controller.js';

const router = Router();

// Create new post
router.post('/', requireAuth, createPost);

// Retrieve posts authored by current user
router.get('/mine', requireAuth, getMyPosts);

// Single post retrieval
router.get('/:postId', getPostById);

// Post modification (author ownership enforced)
router.patch('/:postId', requireAuth, updatePost);

// Post deletion (author ownership enforced)
router.delete('/:postId', requireAuth, deletePost);

export default router;

