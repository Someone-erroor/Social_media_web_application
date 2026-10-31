import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware.js';
import {
  createPost,
  getMyPosts,
  getPostById,
  updatePost,
  deletePost
} from '../controllers/post.controller.js';
import {
  handleLikePost,
  handleUnlikePost,
  handleGetPostLikes
} from '../controllers/like.controller.js';
import {
  handleCreateComment,
  handleGetPostComments
} from '../controllers/comment.controller.js';

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

// Post Like interaction (Phase 10)
router.post('/:postId/like', requireAuth, handleLikePost);
router.delete('/:postId/like', requireAuth, handleUnlikePost);
router.get('/:postId/likes', optionalAuth, handleGetPostLikes);

// Post Comment interaction (Phase 10)
router.get('/:postId/comments', optionalAuth, handleGetPostComments);
router.post('/:postId/comments', requireAuth, handleCreateComment);

export default router;

