import { apiClient } from './api';

export const safetyService = {
  async getBlockedUsers() {
    return apiClient('/safety/blocks', {
      method: 'GET'
    });
  },

  async blockUser(userId) {
    return apiClient(`/safety/blocks/${userId}`, {
      method: 'POST'
    });
  },

  async unblockUser(userId) {
    return apiClient(`/safety/blocks/${userId}`, {
      method: 'DELETE'
    });
  },

  async reportItem({ reportedTarget, targetType, category, explanation }) {
    return apiClient('/safety/reports', {
      method: 'POST',
      body: JSON.stringify({ reportedTarget, targetType, category, explanation })
    });
  },

  async reportContent({ targetType, targetId, reportedTarget, category, reason, explanation }) {
    const finalTarget = reportedTarget || targetId;
    const finalExplanation = explanation !== undefined ? explanation : reason;
    return this.reportItem({
      reportedTarget: finalTarget,
      targetType,
      category,
      explanation: finalExplanation
    });
  },

  async submitAppeal({ actionType, reason }) {
    return apiClient('/safety/appeals', {
      method: 'POST',
      body: JSON.stringify({ actionType, reason })
    });
  }
};

export default safetyService;

