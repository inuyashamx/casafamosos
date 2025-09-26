import { useState, useEffect } from 'react';
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

export function useNotifications() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUnreadCount = async () => {
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
  };

  const fetchRecentNotifications = async () => {
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
  };

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
  }, [session]);

  // Polling para actualizar el contador cada 3 minutos
  useEffect(() => {
    if (!session?.user) return;

    const interval = setInterval(fetchUnreadCount, 180000); // 3 minutos
    return () => clearInterval(interval);
  }, [session]);

  return {
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
}