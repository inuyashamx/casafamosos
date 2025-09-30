import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { getFCMToken, onMessageListener } from '@/lib/firebase';

export function usePushNotifications() {
  const { data: session } = useSession();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Verificar el estado actual de los permisos
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Cargar configuración del usuario
  useEffect(() => {
    if (session?.user && (session.user as any).id) {
      loadUserSettings();
    }
  }, [session]);

  // Escuchar mensajes en primer plano
  useEffect(() => {
    if (isEnabled) {
      onMessageListener()
        .then((payload: any) => {
          console.log('Received foreground message:', payload);

          // Mostrar notificación en primer plano
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(payload.notification.title, {
              body: payload.notification.body,
              icon: payload.notification.icon || '/icon-192x192.png',
              data: payload.data,
            });
          }
        })
        .catch((err) => console.error('Failed to receive foreground message:', err));
    }
  }, [isEnabled]);

  const loadUserSettings = async () => {
    try {
      const response = await fetch('/api/push/preferences');
      if (response.ok) {
        const { settings } = await response.json();
        if (settings) {
          setIsEnabled(settings.isEnabled && !!settings.fcmToken);
        }
      }
    } catch (error) {
      console.error('Error loading push settings:', error);
    }
  };

  const enablePushNotifications = useCallback(async () => {
    if (!session?.user) {
      console.error('User not authenticated');
      return false;
    }

    setIsLoading(true);

    try {
      // Obtener token FCM
      const token = await getFCMToken();

      if (!token) {
        console.error('Failed to get FCM token');
        setIsLoading(false);
        return false;
      }

      // Guardar token en el servidor
      const response = await fetch('/api/push/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new Error('Failed to save FCM token');
      }

      setIsEnabled(true);
      setPermission('granted');
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error enabling push notifications:', error);
      setIsLoading(false);
      return false;
    }
  }, [session]);

  const disablePushNotifications = useCallback(async () => {
    if (!session?.user) {
      return false;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/push/token', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to disable push notifications');
      }

      setIsEnabled(false);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error disabling push notifications:', error);
      setIsLoading(false);
      return false;
    }
  }, [session]);

  const updatePreferences = useCallback(async (preferences: { likes?: boolean; comments?: boolean }) => {
    if (!session?.user) {
      return false;
    }

    try {
      const response = await fetch('/api/push/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }

      return true;
    } catch (error) {
      console.error('Error updating preferences:', error);
      return false;
    }
  }, [session]);

  return {
    isEnabled,
    isLoading,
    permission,
    enablePushNotifications,
    disablePushNotifications,
    updatePreferences,
  };
}