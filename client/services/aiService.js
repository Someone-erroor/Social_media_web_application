import { apiClient } from './api';

export const aiService = {
  /**
   * Generates a social media post draft using Gemini AI.
   *
   * @param {{ topic: string, context?: string, tone?: string, length?: string }} data
   * @returns {Promise<{ success: boolean, message: string, generatedContent: string, metadata: object }>}
   */
  async generatePost(data) {
    return apiClient('/ai/posts/generate', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  /**
   * Improves an existing post using Gemini AI.
   *
   * @param {{ content: string, tone?: string, instructions?: string }} data
   * @returns {Promise<{ success: boolean, message: string, improvedContent: string, metadata: object }>}
   */
  async improvePost(data) {
    return apiClient('/ai/posts/improve', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  /**
   * Summarizes an existing post and its discussion comments using Gemini AI.
   *
   * @param {string} postId
   * @returns {Promise<{ success: boolean, message: string, hasComments: boolean, summary: object, metadata: object }>}
   */
  async summarizeDiscussion(postId) {
    return apiClient(`/ai/posts/${postId}/summarize`, {
      method: 'POST'
    });
  }
};

export default aiService;

