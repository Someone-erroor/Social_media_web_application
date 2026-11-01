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
  const login = async ({ email, password, isAdminMode = false }) => {
    const data = await authService.login({ email, password });
    if (data?.success && data?.user) {
      if (isAdminMode && data.user.role !== 'admin') {
        // Standard user attempted to log in through admin portal:
        // Clear cookie session so they aren't trapped as standard user
        await authService.logout().catch(() => {});
        setUser(null);
        const adminError = new Error('This account is a standard member account. Please sign in with an Administrator account or use the "Create Admin Account" option.');
        adminError.status = 403;
        throw adminError;
      }

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
   * Registers or provisions an administrator account directly.
   */
  const registerAdmin = async ({ fullName, email, password, confirmPassword }) => {
    const data = await authService.registerAdmin({
      fullName,
      email,
      password,
      confirmPassword
    });
    if (data?.success && data?.user) {
      setUser(data.user);
      router.push(ROUTES.ADMIN.DASHBOARD);
    }
    return data;
  };

  const updateUser = useCallback((updatedUser) => {
    setUser((prev) => (prev ? { ...prev, ...updatedUser } : updatedUser));
  }, []);

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
        registerAdmin,
        logout,
        refreshUser,
        updateUser
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
