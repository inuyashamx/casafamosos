"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Notification, useNotifications } from '@/contexts/NotificationContext';
import Navbar from '@/components/Navbar';
import PushNotificationToggle from '@/components/notifications/PushNotificationToggle';

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const {
    clearAllNotifications: hookClearAll,
    markAllAsRead: hookMarkAllAsRead,
    refetch,
    refetchUnreadCount
  } = useNotifications();
  const [pageNotifications, setPageNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (session?.user) {
      fetchNotifications(1);
    }
  }, [session, status, filter]);

  const fetchNotifications = async (pageNum: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/notifications?page=${pageNum}&limit=20`);
      if (response.ok) {
        const data = await response.json();

        let filteredNotifications = data.notifications;
        if (filter === 'unread') {
          filteredNotifications = data.notifications.filter((n: Notification) => !n.read);
        }

        if (pageNum === 1) {
          setPageNotifications(filteredNotifications);
        } else {
          setPageNotifications(prev => [...prev, ...filteredNotifications]);
        }

        setHasMore(data.pagination.page < data.pagination.pages);
        setPage(pageNum);
      }
    } catch (error) {
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
        setPageNotifications(prev =>
          prev.map(notification =>
            notification._id === notificationId
              ? { ...notification, read: true }
              : notification
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Llamar al hook para sincronizar el estado del dropdown
      await hookMarkAllAsRead();

      // Forzar actualización del hook
      await refetch();
      await refetchUnreadCount();

      // Actualizar el estado local de la página
      setPageNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const clearAllNotifications = async () => {
    if (confirm('¿Estás seguro de que quieres eliminar todas las notificaciones?')) {
      try {
        // Llamar al hook para sincronizar el estado del dropdown
        await hookClearAll();

        // Forzar actualización del hook
        await refetch();
        await refetchUnreadCount();

        // Actualizar el estado local de la página
        setPageNotifications([]);
      } catch (error) {
        console.error('Error clearing notifications:', error);
      }
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification._id);
    }

    // Navegar a la página individual del post
    const url = `/post/${notification.postId}${notification.commentId ? `#comment-${notification.commentId}` : ''}`;
    router.push(url);
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `hace ${diffInMinutes} minuto${diffInMinutes !== 1 ? 's' : ''}`;
    if (diffInHours < 24) return `hace ${diffInHours} hora${diffInHours !== 1 ? 's' : ''}`;
    if (diffInDays < 30) return `hace ${diffInDays} día${diffInDays !== 1 ? 's' : ''}`;

    return date.toLocaleDateString('es-ES');
  };

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="bg-card rounded-lg shadow border border-border">
          <div className="p-4 sm:p-6 border-b border-border">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <h1 className="text-2xl font-bold text-foreground">Notificaciones</h1>

              <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as 'all' | 'unread')}
                  className="border border-border rounded-md px-3 py-1 text-sm bg-input text-foreground"
                >
                  <option value="all">Todas</option>
                  <option value="unread">Sin leer</option>
                </select>

                <div className="flex space-x-2 sm:space-x-4">
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
                  >
                    Marcar leídas
                  </button>

                  <button
                    onClick={clearAllNotifications}
                    className="text-sm text-destructive hover:text-destructive/80 transition-colors whitespace-nowrap"
                  >
                    Limpiar todas
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Push Notification Settings */}
          <div className="p-4 sm:p-6 border-b border-border">
            <PushNotificationToggle />
          </div>

          <div className="divide-y divide-border">
            {loading && pageNotifications.length === 0 ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Cargando notificaciones...</p>
              </div>
            ) : pageNotifications.length === 0 ? (
              <div className="p-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-5-5V9.09c0-2.97-2.16-5.43-5-5.91V2a1 1 0 00-2 0v1.18C5.16 3.66 3 6.12 3 9.09V12l-5 5h5a3 3 0 006 0z"
                  />
                </svg>
                <p className="mt-4 text-lg text-muted-foreground">No tienes notificaciones</p>
                <p className="text-muted-foreground/70">Las notificaciones aparecerán aquí cuando otros usuarios interactúen con tus posts.</p>
              </div>
            ) : (
              <>
                {pageNotifications.map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 sm:p-6 hover:bg-muted/50 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-primary/10' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      {notification.fromUserId.image ? (
                        <img
                          src={notification.fromUserId.image}
                          alt={notification.fromUserId.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                          <span className="text-lg font-medium text-muted-foreground">
                            {notification.fromUserId.name[0].toUpperCase()}
                          </span>
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="text-foreground leading-relaxed">
                          {notification.message}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>

                      {!notification.read && (
                        <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                ))}

                {hasMore && (
                  <div className="p-6 text-center">
                    <button
                      onClick={() => fetchNotifications(page + 1)}
                      disabled={loading}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                      {loading ? 'Cargando...' : 'Cargar más'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}