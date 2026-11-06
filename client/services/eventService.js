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

  async submitAnswer(eventId, answer) {
    return apiClient(`/events/${eventId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answer })
    });
  },

  async adminCreateEvent(data) {
    return apiClient('/events/admin/create', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

export default eventService;

