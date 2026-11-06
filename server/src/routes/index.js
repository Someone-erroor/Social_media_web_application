import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import adminRoutes from './admin.routes.js';
import profileRoutes from './profile.routes.js';
import postRoutes from './post.routes.js';
import commentRoutes from './comment.routes.js';
import notificationRoutes from './notification.routes.js';
import aiRoutes from './ai.routes.js';
import feedRoutes from './feed.routes.js';
import privacyRoutes from './privacy.routes.js';
import safetyRoutes from './safety.routes.js';
import messageRoutes from './message.routes.js';
import playRoutes from './play.routes.js';
import timeCapsuleRoutes from './timeCapsule.routes.js';
import circleRoutes from './circle.routes.js';
import eventRoutes from './event.routes.js';
import memoryRoutes from './memory.routes.js';
import devRoutes from './dev.routes.js';
import { getExplore } from '../controllers/post.controller.js';

const router = Router();

// Mount health routes at /health (accessible via /api/health)
router.use('/health', healthRoutes);

// Mount authentication routes at /auth (accessible via /api/auth)
router.use('/auth', authRoutes);

// Mount administrative routes at /admin (accessible via /api/admin)
router.use('/admin', adminRoutes);

// Mount user profile routes at /profile, /profiles, and /users (e.g. /api/profile/me, /api/profiles/:userId, /api/users/:userId/follow)
router.use('/profile', profileRoutes);
router.use('/profiles', profileRoutes);
router.use('/users', profileRoutes);

// Privacy & Follow Requests
router.use('/privacy', privacyRoutes);

// Safety & Blocking & Reports
router.use('/safety', safetyRoutes);

// Real-Time Direct Messaging
router.use('/messages', messageRoutes);

// Looply Play Games
router.use('/play', playRoutes);

// Time Capsule
router.use('/time-capsules', timeCapsuleRoutes);

// Circles
router.use('/circles', circleRoutes);

// Global Mystery Events
router.use('/events', eventRoutes);

// Friendship Memories
router.use('/memories', memoryRoutes);

// Mount post management routes at /posts (accessible via /api/posts)
router.use('/posts', postRoutes);

// Mount comment routes at /comments (accessible via /api/comments)
router.use('/comments', commentRoutes);

// Mount notification routes at /notifications (accessible via /api/notifications)
router.use('/notifications', notificationRoutes);

// Mount AI routes at /ai (accessible via /api/ai)
router.use('/ai', aiRoutes);

// Mount community feed routes at /feed (accessible via /api/feed)
router.use('/feed', feedRoutes);

// Direct discover/explore alias at /explore (accessible via /api/explore)
router.get('/explore', getExplore);

// Local development utilities (loopback only, never exposed in production)
router.use('/__dev', devRoutes);

export default router;
