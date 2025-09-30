import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inicializar Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Función para obtener el token FCM
export async function getFCMToken(): Promise<string | null> {
  try {
    // Verificar si el navegador soporta notificaciones
    const messagingSupported = await isSupported();
    if (!messagingSupported) {
      console.log('Firebase Messaging is not supported in this browser');
      return null;
    }

    // Verificar permisos
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return null;
      }

      const messaging = getMessaging(app);

      // Registrar service worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

        // Esperar a que el service worker esté activo
        await navigator.serviceWorker.ready;

        // Si está instalando, esperar a que se active
        if (registration.installing) {
          await new Promise<void>((resolve) => {
            registration.installing!.addEventListener('statechange', function() {
              if (this.state === 'activated') {
                resolve();
              }
            });
          });
        }

        // Obtener token
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (token) {
          return token;
        } else {
          return null;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

// Función para escuchar mensajes en primer plano
export function onMessageListener() {
  return new Promise((resolve) => {
    isSupported().then((supported) => {
      if (supported) {
        const messaging = getMessaging(app);
        onMessage(messaging, (payload) => {
          console.log('Message received in foreground:', payload);
          resolve(payload);
        });
      }
    });
  });
}

export { app };