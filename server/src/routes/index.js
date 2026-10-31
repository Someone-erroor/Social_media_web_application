import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import adminRoutes from './admin.routes.js';
import profileRoutes from './profile.routes.js';
import postRoutes from './post.routes.js';
import feedRoutes from './feed.routes.js';
import { getExplore } from '../controllers/post.controller.js';

const router = Router();

// Mount health routes at /health (accessible via /api/health)
router.use('/health', healthRoutes);

// Mount authentication routes at /auth (accessible via /api/auth)
router.use('/auth', authRoutes);

// Mount administrative routes at /admin (accessible via /api/admin)
router.use('/admin', adminRoutes);

// Mount user profile routes at /profile and /profiles (e.g. /api/profile/me, /api/profiles/:userId)
router.use('/profile', profileRoutes);
router.use('/profiles', profileRoutes);

// Mount post management routes at /posts (accessible via /api/posts)
router.use('/posts', postRoutes);

// Mount community feed routes at /feed (accessible via /api/feed)
router.use('/feed', feedRoutes);

// Direct discover/explore alias at /explore (accessible via /api/explore)
router.get('/explore', getExplore);

export default router;
