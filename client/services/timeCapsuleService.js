import { apiClient } from './api';

export const timeCapsuleService = {
  async listCapsules() {
    return apiClient('/time-capsules', {
      method: 'GET'
    });
  },

  async getCapsule(capsuleId) {
    return apiClient(`/time-capsules/${capsuleId}`, {
      method: 'GET'
    });
  },

  async createCapsule(data) {
    return apiClient('/time-capsules', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async deleteCapsule(capsuleId) {
    return apiClient(`/time-capsules/${capsuleId}`, {
      method: 'DELETE'
    });
  }
};

export default timeCapsuleService;

