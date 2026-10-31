import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';

const router = Router();

// Mount health routes at /health (accessible via /api/health)
router.use('/health', healthRoutes);

// Mount authentication routes at /auth (accessible via /api/auth)
router.use('/auth', authRoutes);

export default router;
