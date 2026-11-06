import { apiClient } from './api';

export const messageService = {
  async getOrCreateConversation(targetUserId) {
    return apiClient(`/messages/conversations/${targetUserId}`, {
      method: 'POST'
    });
  },

  async listConversations() {
    return apiClient('/messages/conversations', {
      method: 'GET'
    });
  },

  async getMessages(conversationId, page = 1, limit = 50) {
    return apiClient(`/messages/conversations/${conversationId}/messages?page=${page}&limit=${limit}`, {
      method: 'GET'
    });
  },

  async sendMessage(conversationId, { content, isEncrypted = false, iv = null }) {
    return apiClient(`/messages/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, isEncrypted, iv })
    });
  },

  async markAsRead(conversationId) {
    return apiClient(`/messages/conversations/${conversationId}/read`, {
      method: 'PATCH'
    });
  },

  async respondToRequest(conversationId, action) {
    return apiClient(`/messages/conversations/${conversationId}/request`, {
      method: 'PATCH',
      body: JSON.stringify({ action })
    });
  }
};

export default messageService;

