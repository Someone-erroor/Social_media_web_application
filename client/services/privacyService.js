import { apiClient } from './api';

export const privacyService = {
  async getPrivacySettings() {
    return apiClient('/privacy/settings', {
      method: 'GET'
    });
  },

  async updatePrivacySettings({ isPrivate }) {
    return apiClient('/privacy/settings', {
      method: 'PATCH',
      body: JSON.stringify({ isPrivate })
    });
  },

  async updatePrivacy(isPrivate) {
    return this.updatePrivacySettings({ isPrivate });
  },

  async getPendingFollowRequests() {
    return this.getPendingRequests();
  },

  async getPendingRequests() {
    return apiClient('/privacy/requests', {
      method: 'GET'
    });
  },

  async sendFollowRequest(userId) {
    return apiClient(`/privacy/requests/${userId}`, {
      method: 'POST'
    });
  },

  async cancelFollowRequest(userId) {
    return apiClient(`/privacy/requests/${userId}`, {
      method: 'DELETE'
    });
  },

  async acceptFollowRequest(requesterId) {
    return apiClient(`/privacy/requests/${requesterId}/accept`, {
      method: 'POST'
    });
  },

  async rejectFollowRequest(requesterId) {
    return apiClient(`/privacy/requests/${requesterId}/reject`, {
      method: 'POST'
    });
  }
};

export default privacyService;

