import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  handleListHeists,
  handleGetHeistById,
  handleCreateHeist,
  handleJoinHeist,
  handleLeaveHeist,
  handleSubmitHeistAnswer
} from '../controllers/heist.controller.js';

const router = Router();

// Feed Heists require active authenticated user sessions
router.use(requireAuth);

router.get('/', handleListHeists);
router.get('/:heistId', handleGetHeistById);
router.post('/', handleCreateHeist);
router.post('/:heistId/join', handleJoinHeist);
router.post('/:heistId/leave', handleLeaveHeist);
router.post('/:heistId/submit', handleSubmitHeistAnswer);

export default router;

