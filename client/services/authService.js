import { apiClient } from './api';

/**
 * Authentication service handling registration, login, session checks, and logout.
 */
export const authService = {
  /**
   * Registers a new account.
   *
   * @param {{ fullName: string, email: string, password: string, confirmPassword: string }} data
   * @returns {Promise<{ success: boolean, message: string, user: object }>}
   */
  async register(data) {
    return apiClient('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  /**
   * Authenticates user with credentials and establishes HTTP-only cookie session.
   *
   * @param {{ email: string, password: string }} credentials
   * @returns {Promise<{ success: boolean, message: string, user: object }>}
   */
  async login(credentials) {
    return apiClient('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },

  /**
   * Retrieves the currently authenticated user from the active session.
   *
   * @returns {Promise<{ success: boolean, user: object }>}
   */
  async getMe() {
    return apiClient('/auth/me', {
      method: 'GET'
    });
  },

  /**
   * Logs out user and clears the authentication session cookie.
   *
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async logout() {
    return apiClient('/auth/logout', {
      method: 'POST'
    });
  }
};

export default authService;

