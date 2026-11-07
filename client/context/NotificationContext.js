'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { notificationService } from '@/services/notificationService';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socketInstance, setSocketInstance] = useState(null);
  const socketRef = useRef(null);

  // Keep ref synchronized with notifications state outside render
  const notificationsRef = useRef(notifications);
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  // Fetch initial or refreshed notifications from database
  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const res = await notificationService.getNotifications({ page: 1, limit: 20 });
      setNotifications(res.notifications || []);
      if (typeof res?.unreadCount === 'number') {
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch notifications.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Connect to Socket.IO when authenticated; disconnect on logout
  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      Promise.resolve().then(() => {
        setIsConnected(false);
        setNotifications([]);
        setUnreadCount(0);
        setError(null);
      });
      return;
    }

    let ignore = false;

    // Fetch initial notifications with loading and error state
    Promise.resolve()
      .then(() => {
        if (ignore) return;
        setLoading(true);
        setError(null);
        return notificationService.getNotifications({ page: 1, limit: 20 });
      })
      .then((res) => {
        if (!ignore && res) {
          setNotifications(res.notifications || []);
          if (typeof res.unreadCount === 'number') {
            setUnreadCount(res.unreadCount);
          }
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || 'Failed to load notifications.');
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    // If an existing socket is already connected, don't create duplicate
    if (socketRef.current?.connected) {
      return;
    }

    // Determine backend base URL (strip /api if present in NEXT_PUBLIC_API_URL)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const socketUrl = apiUrl.replace(/\/api\/?$/, '');

    let authToken = null;
    if (typeof window !== 'undefined') {
      try { authToken = localStorage.getItem('looply_token'); } catch {}
    }

    const socket = io(socketUrl, {
      withCredentials: true,
      auth: authToken ? { token: authToken } : undefined,
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500
    });

    socketRef.current = socket;
    setSocketInstance(socket);

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', () => {
      setIsConnected(false);
    });

    // Re-fetch persisted notifications upon successful reconnection
    socket.on('reconnect', () => {
      setIsConnected(true);
      notificationService
        .getNotifications({ page: 1, limit: 20 })
        .then((res) => {
          if (!ignore && res) {
            setNotifications(res.notifications || []);
            if (typeof res.unreadCount === 'number') {
              setUnreadCount(res.unreadCount);
            }
          }
        })
        .catch((err) => {
          if (!ignore) {
            setError(err.message || 'Failed to sync notifications on reconnect.');
          }
        });
    });

    // Handle real-time incoming notification with duplicate prevention
    // Avoids calling setUnreadCount inside the setNotifications state updater
    const handleIncomingNotification = (item) => {
      if (!item || !item._id) return;

      // Prevent duplicate insertion if already present in state
      if (notificationsRef.current.some((n) => n._id === item._id)) {
        return;
      }

      setNotifications((prev) => {
        if (prev.some((n) => n._id === item._id)) {
          return prev;
        }
        return [item, ...prev];
      });

      // Increment unreadCount strictly outside the setNotifications updater
      setUnreadCount((c) => c + 1);
    };

    socket.on('notification', handleIncomingNotification);
    socket.on('admin_login_alert', handleIncomingNotification);

    return () => {
      ignore = true;
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('reconnect');
      socket.off('notification', handleIncomingNotification);
      socket.off('admin_login_alert', handleIncomingNotification);
      socket.disconnect();
      socketRef.current = null;
      setSocketInstance(null);
      setIsConnected(false);
    };
  }, [isAuthenticated, user]);

  /**
   * Idempotent markAsRead handler:
   * - Only decrements unreadCount if notification was previously unread
   * - Returns early if notification is already read (no duplicate state updates)
   * - Avoids calling setUnreadCount inside the setNotifications state updater
   */
  const markAsRead = async (notificationId) => {
    if (!notificationId) return;

    // Check existing notification state to ensure idempotency
    const existing = notificationsRef.current.find((n) => n._id === notificationId);
    if (existing && existing.readAt) {
      return; // Already marked as read; idempotent no-op
    }

    const wasUnread = existing ? !existing.readAt : true;

    try {
      await notificationService.markAsRead(notificationId);

      // Prevent duplicate state updates by returning same prev reference if already read
      setNotifications((prev) => {
        const item = prev.find((n) => n._id === notificationId);
        if (!item || item.readAt) {
          return prev;
        }
        return prev.map((n) =>
          n._id === notificationId ? { ...n, readAt: new Date().toISOString() } : n
        );
      });

      // Only decrement unreadCount when previously unread, strictly outside the updater
      if (wasUnread) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  /**
   * Idempotent markAllAsRead handler:
   * - No-op if already all read
   * - Updates unreadCount strictly outside setNotifications updater
   */
  const markAllAsRead = async () => {
    const hasUnread = notificationsRef.current.some((n) => !n.readAt);
    if (!hasUnread && unreadCount === 0) {
      return; // Already all read; idempotent no-op
    }

    try {
      await notificationService.markAllAsRead();

      setNotifications((prev) => {
        if (!prev.some((n) => !n.readAt)) {
          return prev;
        }
        return prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() }));
      });

      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        isConnected,
        socket: socketInstance || socketRef.current,
        markAsRead,
        markAllAsRead,
        refreshNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider.');
  }
  return context;
}
