import { getFriendshipMemories as getFriendshipMemoriesService } from '../services/memory.service.js';

export const getFriendshipMemories = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const result = await getFriendshipMemoriesService(req.user._id, userId);
    return res.status(200).json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export default {
  getFriendshipMemories
};

