import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  blockUser,
  unblockUser,
  getBlockedUsers,
  createReport,
  submitAppeal
} from '../controllers/safety.controller.js';

const router = Router();

router.use(authenticate);

// Blocking
router.get('/blocks', getBlockedUsers);
router.post('/blocks/:userId', blockUser);
router.delete('/blocks/:userId', unblockUser);

// Reporting
router.post('/reports', createReport);

// Appeals
router.post('/appeals', submitAppeal);

export default router;

