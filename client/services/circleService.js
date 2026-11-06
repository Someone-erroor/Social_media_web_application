import { apiClient } from './api';

export const circleService = {
  async listCircles(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiClient(`/circles?${query}`, {
      method: 'GET'
    });
  },

  async getCircleBySlug(slug) {
    return apiClient(`/circles/${slug}`, {
      method: 'GET'
    });
  },

  async createCircle(data) {
    return apiClient('/circles', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async joinCircle(circleId) {
    return apiClient(`/circles/${circleId}/join`, {
      method: 'POST'
    });
  },

  async leaveCircle(circleId) {
    return apiClient(`/circles/${circleId}/leave`, {
      method: 'POST'
    });
  },

  async getCirclePosts(circleId, page = 1, limit = 20) {
    return apiClient(`/circles/${circleId}/posts?page=${page}&limit=${limit}`, {
      method: 'GET'
    });
  },

  async createCirclePost(circleId, content) {
    return apiClient(`/circles/${circleId}/posts`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  }
};

export default circleService;

