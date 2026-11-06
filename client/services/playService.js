import { apiClient } from './api';

export const playService = {
  async listChallenges(gameType = 'all', page = 1, limit = 20) {
    return apiClient(`/play/challenges?gameType=${gameType}&page=${page}&limit=${limit}`, {
      method: 'GET'
    });
  },

  async getChallenge(challengeId) {
    return apiClient(`/play/challenges/${challengeId}`, {
      method: 'GET'
    });
  },

  async createChallenge(data) {
    return apiClient('/play/challenges', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async submitAnswer(challengeId, userAnswers) {
    return apiClient(`/play/challenges/${challengeId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ userAnswers })
    });
  }
};

export default playService;

