import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  updatePrivacy,
  sendFollowRequest,
  cancelFollowRequest,
  acceptFollowRequest,
  rejectFollowRequest,
  getPendingRequests
} from '../controllers/privacy.controller.js';

const router = Router();

// All privacy routes require authentication
router.use(authenticate);

// Settings
router.patch('/settings', updatePrivacy);

// Pending follow requests for current user
router.get('/requests', getPendingRequests);

// Request to follow a private user
router.post('/requests/:userId', sendFollowRequest);
router.delete('/requests/:userId', cancelFollowRequest);

// Private account owner actions
router.post('/requests/:requesterId/accept', acceptFollowRequest);
router.post('/requests/:requesterId/reject', rejectFollowRequest);

export default router;

