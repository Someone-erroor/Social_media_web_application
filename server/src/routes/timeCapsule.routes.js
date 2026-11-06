import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  createCapsule,
  listCapsules,
  getCapsule,
  deleteCapsule
} from '../controllers/timeCapsule.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', listCapsules);
router.post('/', createCapsule);
router.get('/:capsuleId', getCapsule);
router.delete('/:capsuleId', deleteCapsule);

export default router;

