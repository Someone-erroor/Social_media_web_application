import { apiClient } from './api';

export const heistService = {
  /**
   * Retrieves paginated list of community Feed Heists.
   */
  async getHeists({ page = 1, limit = 10, status = '', category = '', heistType = '', difficulty = '', search = '' } = {}) {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('limit', limit);
    if (status) params.set('status', status);
    if (category) params.set('category', category);
    if (heistType) params.set('heistType', heistType);
    if (difficulty) params.set('difficulty', difficulty);
    if (search) params.set('search', search);

    return apiClient(`/heists?${params.toString()}`, {
      method: 'GET'
    });
  },

  /**
   * Retrieves a single Feed Heist mission details.
   */
  async getHeist(heistId) {
    return apiClient(`/heists/${heistId}`, {
      method: 'GET'
    });
  },

  /**
   * Creates a new collaborative Feed Heist.
   */
  async createHeist(heistData) {
    return apiClient('/heists', {
      method: 'POST',
      body: JSON.stringify(heistData)
    });
  },

  /**
   * Enrolls as an active operative in a Feed Heist.
   */
  async joinHeist(heistId) {
    return apiClient(`/heists/${heistId}/join`, {
      method: 'POST'
    });
  },

  /**
   * Withdraws from a Feed Heist.
   */
  async leaveHeist(heistId) {
    return apiClient(`/heists/${heistId}/leave`, {
      method: 'POST'
    });
  },

  /**
   * Submits a cipher answer attempt.
   */
  async submitAnswer(heistId, { answer, note = '' }) {
    return apiClient(`/heists/${heistId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answer, note })
    });
  }
};

export default heistService;
