import { apiClient } from './api';

/**
 * Profile service handling user profile retrieval, updates, and public member profiles.
 */
export const profileService = {
  /**
   * Retrieves the authenticated user's profile.
   *
   * @returns {Promise<{ success: boolean, user: object }>}
   */
  async getMyProfile() {
    return apiClient('/profile/me', {
      method: 'GET'
    });
  },

  /**
   * Updates the authenticated user's profile.
   *
   * @param {{ fullName?: string, bio?: string, avatarUrl?: string }} data
   * @returns {Promise<{ success: boolean, message: string, user: object }>}
   */
  async updateMyProfile(data) {
    return apiClient('/profile/me', {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  /**
   * Retrieves a public member profile by user ID.
   *
   * @param {string} userId - Target user ID
   * @returns {Promise<{ success: boolean, profile: object }>}
   */
  async getPublicProfile(userId) {
    return apiClient(`/profiles/${userId}`, {
      method: 'GET'
    });
  }
};

export default profileService;

