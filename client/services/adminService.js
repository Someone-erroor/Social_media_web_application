import { apiClient } from './api';

export const adminService = {
  // Phase 11
  async getDashboardStats() {
    return apiClient('/admin/dashboard/stats', {
      method: 'GET'
    });
  },

  async getDashboardActivity(limit = 20) {
    return apiClient(`/admin/dashboard/activity?limit=${limit}`, {
      method: 'GET'
    });
  },

  // Phase 12: User Management
  async getUsers({ page = 1, limit = 10, search = '', accountStatus = '', role = '' } = {}) {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('limit', limit);
    if (search) params.set('search', search);
    if (accountStatus) params.set('accountStatus', accountStatus);
    if (role) params.set('role', role);

    return apiClient(`/admin/users?${params.toString()}`, {
      method: 'GET'
    });
  },

  async getUserById(userId) {
    return apiClient(`/admin/users/${userId}`, {
      method: 'GET'
    });
  },

  async updateUserStatus(userId, accountStatus) {
    return apiClient(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ accountStatus })
    });
  },

  // Phase 12: Post Management
  async getPosts({ page = 1, limit = 10, search = '' } = {}) {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('limit', limit);
    if (search) params.set('search', search);

    return apiClient(`/admin/posts?${params.toString()}`, {
      method: 'GET'
    });
  },

  async deletePost(postId) {
    return apiClient(`/admin/posts/${postId}`, {
      method: 'DELETE'
    });
  },

  // Phase 12: Comment Management
  async getComments({ page = 1, limit = 10, search = '' } = {}) {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('limit', limit);
    if (search) params.set('search', search);

    return apiClient(`/admin/comments?${params.toString()}`, {
      method: 'GET'
    });
  },

  async deleteComment(commentId) {
    return apiClient(`/admin/comments/${commentId}`, {
      method: 'DELETE'
    });
  }
};

export default adminService;

