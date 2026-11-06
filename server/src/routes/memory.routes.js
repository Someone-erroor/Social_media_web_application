import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { getFriendshipMemories } from '../controllers/memory.controller.js';

const router = Router();

router.use(authenticate);

router.get('/:userId', getFriendshipMemories);

export default router;

