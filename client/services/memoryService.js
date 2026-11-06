import { apiClient } from './api';

export const memoryService = {
  async getMemories(userId) {
    return apiClient(`/memories/${userId}`, {
      method: 'GET'
    });
  }
};

export default memoryService;

