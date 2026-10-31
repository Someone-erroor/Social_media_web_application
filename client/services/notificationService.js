import { apiClient } from './api';

export const notificationService = {
  /**
   * Retrieves paginated notifications for current user.
   *
   * @param {{ page?: number, limit?: number }} [params]
   * @returns {Promise<{ success: boolean, notifications: object[], unreadCount: number, pagination: object }>}
   */
  async getNotifications({ page = 1, limit = 20 } = {}) {
    return apiClient(`/notifications?page=${page}&limit=${limit}`, {
      method: 'GET'
    });
  },

  /**
   * Retrieves unread notification count.
   *
   * @returns {Promise<{ success: boolean, unreadCount: number }>}
   */
  async getUnreadCount() {
    return apiClient('/notifications/unread-count', {
      method: 'GET'
    });
  },

  /**
   * Marks a specific notification as read.
   *
   * @param {string} notificationId
   * @returns {Promise<{ success: boolean, message: string, notification: object }>}
   */
  async markAsRead(notificationId) {
    return apiClient(`/notifications/${notificationId}/read`, {
      method: 'PATCH'
    });
  },

  /**
   * Marks all user notifications as read.
   *
   * @returns {Promise<{ success: boolean, message: string, modifiedCount: number }>}
   */
  async markAllAsRead() {
    return apiClient('/notifications/read-all', {
      method: 'PATCH'
    });
  }
};

export default notificationService;

