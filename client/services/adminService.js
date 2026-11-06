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

  async updateUserRole(userId, role) {
    return apiClient(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role })
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
  },

  // Phase 4: Trust & Safety
  async getReports({ page = 1, limit = 20, status = '', category = '', targetType = '' } = {}) {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('limit', limit);
    if (status) params.set('status', status);
    if (category) params.set('category', category);
    if (targetType) params.set('targetType', targetType);

    return apiClient(`/admin/reports?${params.toString()}`, {
      method: 'GET'
    });
  },

  async updateReportStatus(reportId, { status, resolutionNotes = '' }) {
    return apiClient(`/admin/reports/${reportId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, resolutionNotes })
    });
  },

  async applyModerationAction({ action, targetType, targetId, reason }) {
    return apiClient('/admin/moderation', {
      method: 'POST',
      body: JSON.stringify({ action, targetType, targetId, reason })
    });
  },

  async getAppeals({ page = 1, limit = 20, status = '' } = {}) {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('limit', limit);
    if (status) params.set('status', status);

    return apiClient(`/admin/appeals?${params.toString()}`, {
      method: 'GET'
    });
  },

  async reviewAppeal(appealId, { status, reviewNotes = '' }) {
    return apiClient(`/admin/appeals/${appealId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reviewNotes })
    });
  }
};

export default adminService;

