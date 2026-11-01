import { apiClient } from './api';

/**
 * Authentication service handling registration, verification, login, password recovery, session checks, and logout.
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
   * Provisions or registers an administrator account directly.
   *
   * @param {{ fullName: string, email: string, password: string, confirmPassword?: string }} data
   * @returns {Promise<{ success: boolean, message: string, user: object }>}
   */
  async registerAdmin(data) {
    return apiClient('/auth/register-admin', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  /**
   * Instantly verifies an account for demo or evaluator testing.
   *
   * @param {{ email: string }} data
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async demoVerify(data) {
    return apiClient('/auth/demo-verify', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  /**
   * Confirms email address with verification token.
   *
   * @param {{ token: string }} data
   * @returns {Promise<{ success: boolean, message: string, user: object }>}
   */
  async verifyEmail(data) {
    return apiClient('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  /**
   * Requests a new email verification message.
   *
   * @param {{ email: string }} data
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async resendVerification(data) {
    return apiClient('/auth/resend-verification', {
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
   * Requests password reset instructions.
   *
   * @param {{ email: string }} data
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async forgotPassword(data) {
    return apiClient('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  /**
   * Resets password with valid reset token.
   *
   * @param {{ token: string, password: string, confirmPassword: string }} data
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async resetPassword(data) {
    return apiClient('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data)
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
  },

  /**
   * Retrieves the latest email from the local development mailbox (dev mode only).
   *
   * @returns {Promise<{ success: boolean, email: object|null }>}
   */
  async getDevMailboxLatest() {
    return apiClient('/__dev/mailbox/latest', {
      method: 'GET'
    });
  }
};

export default authService;
