import { apiClient } from './api';

/**
 * Profile service handling user profile retrieval, updates, public member profiles,
 * and follow / unfollow social relationships.
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
  },

  /**
   * Follows a target user.
   *
   * @param {string} userId - Target user ID
   * @returns {Promise<{ success: boolean, isFollowing: boolean, followersCount: number, followingCount: number, message: string }>}
   */
  async followUser(userId) {
    return apiClient(`/profiles/${userId}/follow`, {
      method: 'POST'
    });
  },

  /**
   * Unfollows a target user.
   *
   * @param {string} userId - Target user ID
   * @returns {Promise<{ success: boolean, isFollowing: boolean, followersCount: number, followingCount: number, message: string }>}
   */
  async unfollowUser(userId) {
    return apiClient(`/profiles/${userId}/unfollow`, {
      method: 'POST'
    });
  },

  /**
   * Retrieves followers list for a user.
   *
   * @param {string} userId - Target user ID
   * @returns {Promise<{ success: boolean, count: number, followers: Array<object> }>}
   */
  async getFollowers(userId) {
    return apiClient(`/profiles/${userId}/followers`, {
      method: 'GET'
    });
  },

  /**
   * Retrieves following list for a user.
   *
   * @param {string} userId - Target user ID
   * @returns {Promise<{ success: boolean, count: number, following: Array<object> }>}
   */
  async getFollowing(userId) {
    return apiClient(`/profiles/${userId}/following`, {
      method: 'GET'
    });
  },

  /**
   * Retrieves follow status between viewer and target user.
   *
   * @param {string} userId - Target user ID
   * @returns {Promise<{ success: boolean, isFollowing: boolean, isOwnProfile: boolean, canFollow: boolean, followersCount: number, followingCount: number }>}
   */
  async getFollowStatus(userId) {
    return apiClient(`/profiles/${userId}/follow-status`, {
      method: 'GET'
    });
  }
};

export default profileService;
