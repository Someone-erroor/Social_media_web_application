import { apiClient } from './api';

export const eventService = {
  async getActiveEvents() {
    return apiClient('/events', {
      method: 'GET'
    });
  },

  async getEvent(eventId) {
    return apiClient(`/events/${eventId}`, {
      method: 'GET'
    });
  },

  async submitAnswer(eventId, answerData) {
    const rawAnswer = typeof answerData === 'object' && answerData !== null ? answerData.answer : answerData;
    return apiClient(`/events/${eventId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answer: rawAnswer })
    });
  },

  async listEvents() {
    return this.getActiveEvents();
  },

  async getLeaderboard(eventId) {
    const res = await this.getEvent(eventId);
    return { success: true, leaderboard: res?.leaderboard || [] };
  },

  async adminCreateEvent(data) {
    return apiClient('/events/admin/create', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

export default eventService;

