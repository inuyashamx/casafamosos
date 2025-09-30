'use client';

import { useState, useEffect } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export default function PushNotificationToggle() {
  const {
    isEnabled,
    isLoading,
    permission,
    enablePushNotifications,
    disablePushNotifications,
    updatePreferences,
  } = usePushNotifications();

  const [preferences, setPreferences] = useState({
    likes: true,
    comments: true,
  });

  const [showPreferences, setShowPreferences] = useState(false);

  // Cargar preferencias actuales
  useEffect(() => {
    if (isEnabled) {
      fetch('/api/push/preferences')
        .then((res) => res.json())
        .then((data) => {
          if (data.settings?.preferences) {
            setPreferences(data.settings.preferences);
          }
        })
        .catch(console.error);
    }
  }, [isEnabled]);

  const handleToggle = async () => {
    if (isEnabled) {
      await disablePushNotifications();
    } else {
      const success = await enablePushNotifications();
      if (success) {
        setShowPreferences(true);
      }
    }
  };

  const handlePreferenceChange = async (key: 'likes' | 'comments', value: boolean) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    await updatePreferences({ [key]: value });
  };

  // Si el navegador no soporta notificaciones
  if (typeof window !== 'undefined' && !('Notification' in window)) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Notificaciones Push
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Recibe notificaciones en tiempo real
          </p>
        </div>

        <button
          onClick={handleToggle}
          disabled={isLoading || permission === 'denied'}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
            isEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {permission === 'denied' && (
        <div className="text-sm text-red-600 dark:text-red-400">
          Has bloqueado las notificaciones. Por favor, habilítalas en la configuración de tu navegador.
        </div>
      )}

      {isEnabled && (
        <div className="space-y-3 border-t pt-4 dark:border-gray-700">
          <button
            onClick={() => setShowPreferences(!showPreferences)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {showPreferences ? 'Ocultar preferencias' : 'Configurar preferencias'}
          </button>

          {showPreferences && (
            <div className="space-y-3 pl-2">
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Likes y reacciones
                </span>
                <input
                  type="checkbox"
                  checked={preferences.likes}
                  onChange={(e) => handlePreferenceChange('likes', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Comentarios
                </span>
                <input
                  type="checkbox"
                  checked={preferences.comments}
                  onChange={(e) => handlePreferenceChange('comments', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </label>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Máximo 5 notificaciones por día, una cada 30 minutos
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}