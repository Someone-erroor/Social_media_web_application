/**
 * Centralized Route Configuration for Looply
 * Connect. Share. Express.
 *
 * All application routes must be referenced through this configuration
 * to avoid inconsistent hardcoded paths across components.
 */

export const ROUTES = {
  // Public & Authentication Routes
  PUBLIC: {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    VERIFY_EMAIL: '/verify-email',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    PRIVACY: '/privacy',
    TERMS: '/terms'
  },

  // User Experience Routes
  USER: {
    FEED: '/feed',
    EXPLORE: '/explore',
    PROFILE: '/profile',
    PROFILE_EDIT: '/profile/edit',
    USER_PROFILE: (userId) => `/profile/${userId}`,
    NOTIFICATIONS: '/notifications',
    ASSISTANT: '/assistant',
    SETTINGS: '/settings'
  },

  // Administrator Experience Routes
  ADMIN: {
    DASHBOARD: '/admin',
    USERS: '/admin/users',
    POSTS: '/admin/posts',
    COMMENTS: '/admin/comments',
    ACTIVITY: '/admin/activity',
    NOTIFICATIONS: '/admin/notifications'
  }
};

/**
 * Route metadata catalogue for documentation and navigation breadcrumbs
 */
export const ROUTE_METADATA = {
  [ROUTES.PUBLIC.HOME]: { title: 'Home', scope: 'public', description: 'Landing page' },
  [ROUTES.PUBLIC.LOGIN]: { title: 'Login', scope: 'auth', description: 'User login' },
  [ROUTES.PUBLIC.REGISTER]: { title: 'Register', scope: 'auth', description: 'User registration' },
  [ROUTES.PUBLIC.VERIFY_EMAIL]: { title: 'Verify Email', scope: 'auth', description: 'Email address verification' },
  [ROUTES.PUBLIC.FORGOT_PASSWORD]: { title: 'Forgot Password', scope: 'auth', description: 'Password reset request' },
  [ROUTES.PUBLIC.RESET_PASSWORD]: { title: 'Reset Password', scope: 'auth', description: 'Password reset execution' },
  [ROUTES.PUBLIC.PRIVACY]: { title: 'Privacy Policy', scope: 'public', description: 'Platform privacy policy and data governance' },
  [ROUTES.PUBLIC.TERMS]: { title: 'Terms of Service', scope: 'public', description: 'Platform terms of service and acceptable use' },

  [ROUTES.USER.FEED]: { title: 'Feed', scope: 'user', description: 'Social media home feed' },
  [ROUTES.USER.EXPLORE]: { title: 'Explore', scope: 'user', description: 'Discover trending posts and creators' },
  [ROUTES.USER.PROFILE]: { title: 'Profile', scope: 'user', description: 'Personal user profile' },
  [ROUTES.USER.PROFILE_EDIT]: { title: 'Edit Profile', scope: 'user', description: 'Edit profile information' },
  [ROUTES.USER.NOTIFICATIONS]: { title: 'Notifications', scope: 'user', description: 'Activity notifications' },
  [ROUTES.USER.ASSISTANT]: { title: 'AI Assistant', scope: 'user', description: 'AI assistant chat interface' },
  [ROUTES.USER.SETTINGS]: { title: 'Settings', scope: 'user', description: 'Account settings and preferences' },

  [ROUTES.ADMIN.DASHBOARD]: { title: 'Admin Overview', scope: 'admin', description: 'Administrative dashboard' },
  [ROUTES.ADMIN.USERS]: { title: 'User Management', scope: 'admin', description: 'User account administration' },
  [ROUTES.ADMIN.POSTS]: { title: 'Post Moderation', scope: 'admin', description: 'Content moderation' },
  [ROUTES.ADMIN.COMMENTS]: { title: 'Comment Moderation', scope: 'admin', description: 'Comment oversight' },
  [ROUTES.ADMIN.ACTIVITY]: { title: 'System Activity', scope: 'admin', description: 'Platform audit and activity logs' },
  [ROUTES.ADMIN.NOTIFICATIONS]: { title: 'Admin Alerts', scope: 'admin', description: 'Administrative security alerts' }
};

export default ROUTES;
