import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  handleListRooms,
  handleGetRoomById,
  handleCreateRoom,
  handleJoinRoom,
  handleLeaveRoom,
  handlePostRoomMessage
} from '../controllers/moodOrbit.controller.js';

const router = Router();

// Mood-Orbit rooms require authenticated user sessions
router.use(requireAuth);

router.get('/', handleListRooms);
router.get('/:roomId', handleGetRoomById);
router.post('/', handleCreateRoom);
router.post('/:roomId/join', handleJoinRoom);
router.post('/:roomId/leave', handleLeaveRoom);
router.post('/:roomId/messages', handlePostRoomMessage);

export default router;

