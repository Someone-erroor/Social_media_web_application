import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import {
  getActiveEvents,
  getEvent,
  submitAnswer,
  adminCreate
} from '../controllers/event.controller.js';

const router = Router();

// Publicly viewable active events
router.get('/', getActiveEvents);
router.get('/:eventId', getEvent);

// Authenticated participation
router.use(authenticate);
router.post('/:eventId/submit', submitAnswer);

// Admin creation
router.post('/admin/create', requireRole('admin'), adminCreate);

export default router;

