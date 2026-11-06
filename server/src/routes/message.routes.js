import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  getOrCreateConversation,
  listConversations,
  getMessages,
  sendMessage,
  markRead,
  respondRequest
} from '../controllers/message.controller.js';

const router = Router();

router.use(authenticate);

router.get('/conversations', listConversations);
router.post('/conversations/:targetUserId', getOrCreateConversation);
router.get('/conversations/:conversationId/messages', getMessages);
router.post('/conversations/:conversationId/messages', sendMessage);
router.patch('/conversations/:conversationId/read', markRead);
router.patch('/conversations/:conversationId/request', respondRequest);

export default router;

