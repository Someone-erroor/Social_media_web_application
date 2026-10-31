import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  handleUpdateComment,
  handleDeleteComment
} from '../controllers/comment.controller.js';

const router = Router();

// Update own comment
router.patch('/:commentId', requireAuth, handleUpdateComment);

// Delete own comment (or admin moderation)
router.delete('/:commentId', requireAuth, handleDeleteComment);

export default router;

