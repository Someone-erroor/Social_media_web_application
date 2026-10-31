import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { getFeed, getExplore } from '../controllers/post.controller.js';

const router = Router();

// Chronological social media feed
router.get('/', requireAuth, getFeed);

// Explore / public discovery posts
router.get('/explore', getExplore);

export default router;

