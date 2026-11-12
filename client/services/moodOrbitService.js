import { apiClient } from './api';

export const moodOrbitService = {
  /**
   * Retrieves active Mood-Orbit rooms with optional mood filtering.
   */
  async getRooms({ mood = '', status = 'active', page = 1, limit = 12 } = {}) {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('limit', limit);
    if (mood) params.set('mood', mood);
    if (status) params.set('status', status);

    return apiClient(`/mood-orbit?${params.toString()}`, {
      method: 'GET'
    });
  },

  /**
   * Retrieves specific Mood-Orbit room details, participants, and conversation stream.
   */
  async getRoom(roomId) {
    return apiClient(`/mood-orbit/${roomId}`, {
      method: 'GET'
    });
  },

  /**
   * Creates a new Mood-Orbit space.
   */
  async createRoom(roomData) {
    return apiClient('/mood-orbit', {
      method: 'POST',
      body: JSON.stringify(roomData)
    });
  },

  /**
   * Joins an active Mood-Orbit room.
   */
  async joinRoom(roomId) {
    return apiClient(`/mood-orbit/${roomId}/join`, {
      method: 'POST'
    });
  },

  /**
   * Leaves a Mood-Orbit room.
   */
  async leaveRoom(roomId) {
    return apiClient(`/mood-orbit/${roomId}/leave`, {
      method: 'POST'
    });
  },

  /**
   * Posts an atmospheric message to the room's live stream.
   */
  async postMessage(roomId, { content }) {
    return apiClient(`/mood-orbit/${roomId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  }
};

export default moodOrbitService;

