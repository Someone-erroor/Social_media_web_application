import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  handleGetNotifications,
  handleGetUnreadCount,
  handleMarkAsRead,
  handleMarkAllAsRead
} from '../controllers/notification.controller.js';

const router = Router();

// All notification operations require authentication
router.use(requireAuth);

router.get('/', handleGetNotifications);
router.get('/unread-count', handleGetUnreadCount);
router.patch('/read-all', handleMarkAllAsRead);
router.patch('/:notificationId/read', handleMarkAsRead);

export default router;

