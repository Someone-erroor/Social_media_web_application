import { Router } from 'express';
import healthRoutes from './health.routes.js';

const router = Router();

// Mount health routes at /health (accessible via /api/health)
router.use('/health', healthRoutes);

export default router;
