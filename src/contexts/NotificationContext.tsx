"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

export interface Notification {
  _id: string;
  userId: string;
  fromUserId: {
    _id: string;
    name: string;
    image?: string;
  };
  type: 'POST_LIKE' | 'COMMENT' | 'COMMENT_LIKE';
  postId: string;
  commentId?: string;
  message: string;
  read: boolean;
  createdAt: string;
  navigationLink: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  refetch: () => Promise<void>;
  refetchUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!session?.user) return;

    try {
      const response = await fetch('/api/notifications/unread-count');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [session?.user]);

  const fetchRecentNotifications = useCallback(async () => {
    if (!session?.user) return;

    try {
      setLoading(true);
      const response = await fetch('/api/notifications/recent?limit=5');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      } else {
        setError('Error al cargar notificaciones');
      }
    } catch (error) {
      setError('Error de conexión');
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notification =>
            notification._id === notificationId
              ? { ...notification, read: true }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notification => ({ ...notification, read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  // Actualizar datos cuando cambia la sesión
  useEffect(() => {
    if (session?.user) {
      fetchUnreadCount();
      fetchRecentNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [session, fetchUnreadCount, fetchRecentNotifications]);

  // Polling inteligente basado en actividad del usuario
  useEffect(() => {
    if (!session?.user) return;

    let interval: NodeJS.Timeout;

    const startPolling = () => {
      // Intervalo basado en visibilidad: 5min activo, 15min inactivo
      const pollingInterval = document.visibilityState === 'visible' ? 300000 : 900000;

      clearInterval(interval);
      interval = setInterval(fetchUnreadCount, pollingInterval);
    };

    // Iniciar polling
    startPolling();

    // Ajustar polling cuando cambia la visibilidad
    const handleVisibilityChange = () => {
      startPolling();

      // Si vuelve a estar visible, hacer fetch inmediato
      if (document.visibilityState === 'visible') {
        fetchUnreadCount();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session, fetchUnreadCount]);

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    refetch: fetchRecentNotifications,
    refetchUnreadCount: fetchUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}