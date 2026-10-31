'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';
import { ROUTES } from '@/lib/routes';

// Default context value is strictly null so that any component consuming useAuth
// outside AuthProvider immediately throws an error instead of silently failing.
const AuthContext = createContext(null);

/**
 * Global authentication state provider for Looply.
 * Handles automatic session restoration via HTTP-only cookie,
 * loading states, login, registration, and logout workflows.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Restore authenticated session from backend on initial mount
  useEffect(() => {
    let isMounted = true;

    authService
      .getMe()
      .then((data) => {
        if (isMounted) {
          if (data?.success && data?.user) {
            setUser(data.user);
          } else {
            setUser(null);
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setUser(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await authService.getMe();
      if (data?.success && data?.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  /**
   * Performs user login, sets user state, and navigates based on authoritative role.
   */
  const login = async ({ email, password }) => {
    const data = await authService.login({ email, password });
    if (data?.success && data?.user) {
      setUser(data.user);
      // Route based on authoritative backend role
      if (data.user.role === 'admin') {
        router.push(ROUTES.ADMIN.DASHBOARD);
      } else {
        router.push(ROUTES.USER.FEED);
      }
    }
    return data;
  };

  /**
   * Registers a new user. Does not auto-elevate role.
   */
  const register = async ({ fullName, email, password, confirmPassword }) => {
    const data = await authService.register({
      fullName,
      email,
      password,
      confirmPassword
    });
    return data;
  };

  /**
   * Logs out user, invalidates session cookie, and navigates to login.
   */
  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Logout notice:', err.message);
    } finally {
      setUser(null);
      router.push(ROUTES.PUBLIC.LOGIN);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to consume the authentication context.
 * Throws an explicit error if accessed outside an AuthProvider.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
};

export default AuthContext;
