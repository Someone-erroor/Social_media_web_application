import { Router } from 'express';
import { getHealth, getHealthReady } from '../controllers/health.controller.js';

const router = Router();

// GET /api/health - Process liveness probe
router.get('/', getHealth);

// GET /api/health/ready - Database readiness probe
router.get('/ready', getHealthReady);

export default router;
