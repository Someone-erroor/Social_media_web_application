import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { aiRateLimiter } from '../middleware/rateLimit.middleware.js';
import {
  handleGeneratePost,
  handleImprovePost,
  handleSummarizeDiscussion
} from '../controllers/ai.controller.js';

const router = Router();

// Enforce authentication and rate limiting for all AI features
router.use(requireAuth);
router.use(aiRateLimiter);

router.post('/posts/generate', handleGeneratePost);
router.post('/posts/improve', handleImprovePost);
router.post('/posts/:postId/summarize', handleSummarizeDiscussion);

export default router;

