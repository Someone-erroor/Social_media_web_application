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
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  // Fetch initial or refreshed notifications from database
  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await notificationService.getNotifications({ page: 1, limit: 20 });
      setNotifications(res.notifications || []);
      if (typeof res.unreadCount === 'number') {
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      // Fallback silently if offline or initial load
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
      setIsConnected(false);
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    let ignore = false;

    // Fetch initial notifications
    notificationService
      .getNotifications({ page: 1, limit: 20 })
      .then((res) => {
        if (!ignore) {
          setNotifications(res.notifications || []);
          if (typeof res?.unreadCount === 'number') {
            setUnreadCount(res.unreadCount);
          }
        }
      })
      .catch(() => { });

    // If an existing socket is already connected, don't create duplicate
    if (socketRef.current?.connected) {
      return;
    }

    // Determine backend base URL (strip /api if present in NEXT_PUBLIC_API_URL)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const socketUrl = apiUrl.replace(/\/api\/?$/, '');

    const socket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500
    });

    socketRef.current = socket;

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
          if (!ignore) {
            setNotifications(res.notifications || []);
            if (typeof res?.unreadCount === 'number') {
              setUnreadCount(res.unreadCount);
            }
          }
        })
        .catch(() => { });
    });

    // Handle real-time incoming notification (deduplicating by _id)
    const handleIncomingNotification = (item) => {
      if (!item) return;
      setNotifications((prev) => {
        if (item._id && prev.some((n) => n._id === item._id)) {
          return prev; // already present
        }
        return [item, ...prev];
      });
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
      setIsConnected(false);
    };
  }, [isAuthenticated, user]);

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() }))
      );
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
        isConnected,
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
    return {
      notifications: [],
      unreadCount: 0,
      loading: false,
      isConnected: false,
      markAsRead: async () => { },
      markAllAsRead: async () => { },
      refreshNotifications: async () => { }
    };
  }
  return context;
}
