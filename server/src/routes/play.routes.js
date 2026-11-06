import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  createChallenge,
  listChallenges,
  getChallenge,
  submitAnswer
} from '../controllers/play.controller.js';

const router = Router();

router.use(authenticate);

router.get('/challenges', listChallenges);
router.post('/challenges', createChallenge);
router.get('/challenges/:challengeId', getChallenge);
router.post('/challenges/:challengeId/answer', submitAnswer);

export default router;

