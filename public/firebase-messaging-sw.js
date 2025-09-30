// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Configuración de Firebase
firebase.initializeApp({
  apiKey: "AIzaSyBfETIH7grDjuz_hGBA1vEcgSxXHgB3va4",
  authDomain: "lacasavota-7d8b0.firebaseapp.com",
  projectId: "lacasavota-7d8b0",
  storageBucket: "lacasavota-7d8b0.firebasestorage.app",
  messagingSenderId: "449034480035",
  appId: "1:449034480035:web:f1242b6563ebbb5739d216"
});

const messaging = firebase.messaging();

// Manejar notificaciones en segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification.title || 'Casa de los Famosos';
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: payload.data?.notificationId || 'default',
    data: {
      url: payload.fcmOptions?.link || '/',
      ...payload.data
    },
    requireInteraction: false,
  };

  if (payload.notification.image) {
    notificationOptions.image = payload.notification.image;
  }

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Manejar clics en las notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Si ya hay una ventana abierta, enfocarlua
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              url: urlToOpen
            });
            return;
          }
        }
        // Si no hay ventana abierta, abrir una nueva
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});