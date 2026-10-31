import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { handleGeneratePost, handleImprovePost } from '../controllers/ai.controller.js';

const router = Router();

// Enforce authentication for all AI features
router.use(requireAuth);

router.post('/posts/generate', handleGeneratePost);
router.post('/posts/improve', handleImprovePost);

export default router;

