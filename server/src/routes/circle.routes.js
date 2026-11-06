import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  createCircle,
  listCircles,
  getCircle,
  joinCircle,
  leaveCircle,
  getCirclePosts,
  createCirclePost
} from '../controllers/circle.controller.js';

const router = Router();

// Public discovery
router.get('/', listCircles);
router.get('/:slug', getCircle);

// Authenticated actions
router.use(authenticate);

router.post('/', createCircle);
router.post('/:circleId/join', joinCircle);
router.post('/:circleId/leave', leaveCircle);
router.get('/:circleId/posts', getCirclePosts);
router.post('/:circleId/posts', createCirclePost);

export default router;

