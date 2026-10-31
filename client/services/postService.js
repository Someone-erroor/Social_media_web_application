import { apiClient } from './api';

/**
 * Post and Feed service handling creation, retrieval, updates, deletions, and feed discovery.
 */
export const postService = {
  /**
   * Publishes a new post.
   *
   * @param {{ content: string }} data
   * @returns {Promise<{ success: boolean, message: string, post: object }>}
   */
  async createPost(data) {
    return apiClient('/posts', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  /**
   * Retrieves a single post by ID.
   *
   * @param {string} postId
   * @returns {Promise<{ success: boolean, post: object }>}
   */
  async getPostById(postId) {
    return apiClient(`/posts/${postId}`, {
      method: 'GET'
    });
  },

  /**
   * Retrieves posts authored by the authenticated user.
   *
   * @param {{ page?: number, limit?: number }} [params]
   * @returns {Promise<{ success: boolean, posts: object[], pagination: object }>}
   */
  async getMyPosts({ page = 1, limit = 10 } = {}) {
    return apiClient(`/posts/mine?page=${page}&limit=${limit}`, {
      method: 'GET'
    });
  },

  /**
   * Retrieves posts authored by a specific user.
   *
   * @param {string} userId
   * @param {{ page?: number, limit?: number }} [params]
   * @returns {Promise<{ success: boolean, posts: object[], pagination: object }>}
   */
  async getUserPosts(userId, { page = 1, limit = 10 } = {}) {
    return apiClient(`/profiles/${userId}/posts?page=${page}&limit=${limit}`, {
      method: 'GET'
    });
  },

  /**
   * Updates an existing post. Only the author may update their post.
   *
   * @param {string} postId
   * @param {{ content: string }} data
   * @returns {Promise<{ success: boolean, message: string, post: object }>}
   */
  async updatePost(postId, data) {
    return apiClient(`/posts/${postId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  /**
   * Deletes a post. Only the author may delete their post.
   *
   * @param {string} postId
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async deletePost(postId) {
    return apiClient(`/posts/${postId}`, {
      method: 'DELETE'
    });
  },

  /**
   * Retrieves the global social media feed.
   *
   * @param {{ page?: number, limit?: number }} [params]
   * @returns {Promise<{ success: boolean, posts: object[], pagination: object }>}
   */
  async getFeed({ page = 1, limit = 10 } = {}) {
    return apiClient(`/feed?page=${page}&limit=${limit}`, {
      method: 'GET'
    });
  },

  /**
   * Retrieves explore/discovery posts.
   *
   * @param {{ page?: number, limit?: number }} [params]
   * @returns {Promise<{ success: boolean, posts: object[], pagination: object }>}
   */
  async getExplore({ page = 1, limit = 10 } = {}) {
    return apiClient(`/feed/explore?page=${page}&limit=${limit}`, {
      method: 'GET'
    });
  }
};

export default postService;

