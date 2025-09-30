# Configuración de Firebase para Push Notifications

## 1. Crear proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita Firebase Cloud Messaging (FCM)

## 2. Obtener credenciales

### Para el Frontend (Variables públicas):

1. Ve a Project Settings → General
2. En "Your apps", selecciona la app web o crea una nueva
3. Copia las credenciales de configuración

### Para el Backend (Service Account):

1. Ve a Project Settings → Service Accounts
2. Haz clic en "Generate new private key"
3. Descarga el archivo JSON

### Generar VAPID Key:

1. Ve a Project Settings → Cloud Messaging
2. En "Web Push certificates", genera un nuevo par de claves
3. Copia la clave pública (VAPID Key)

## 3. Configurar variables de entorno

Agrega estas variables a tu archivo `.env.local`:

```env
# Firebase Frontend (públicas)
NEXT_PUBLIC_FIREBASE_API_KEY=tu-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=tu-app-id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=tu-vapid-key-publica

# Firebase Backend (privadas) - Del archivo JSON de Service Account
FIREBASE_PROJECT_ID=tu-proyecto-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-proyecto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\ntu-private-key-aqui\n-----END PRIVATE KEY-----\n"
```

## 4. Actualizar Service Worker

Edita el archivo `public/firebase-messaging-sw.js` y reemplaza los valores de configuración con tus credenciales:

```javascript
firebase.initializeApp({
  apiKey: "tu-api-key",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "tu-sender-id",
  appId: "tu-app-id"
});
```

## 5. Agregar componente a la UI

Para permitir que los usuarios activen las notificaciones, agrega el componente en cualquier página:

```tsx
import PushNotificationToggle from '@/components/notifications/PushNotificationToggle';

// En tu componente:
<PushNotificationToggle />
```

## 6. Testing

1. Reinicia el servidor de desarrollo
2. Abre la aplicación en tu navegador
3. Activa las notificaciones desde el toggle
4. Permite los permisos cuando el navegador lo solicite
5. Prueba creando una notificación (like, comentario, etc.)

## Límites de Push Notifications

El sistema tiene límites configurados en `UserPushSettings.ts`:

- **Máximo diario**: 5 notificaciones por usuario
- **Intervalo mínimo**: 30 minutos entre notificaciones
- **Horas silenciosas**: 22:00 - 8:00 (no se envían notificaciones)

## Preferencias del Usuario

Los usuarios pueden configurar:
- Activar/desactivar notificaciones push
- Recibir notificaciones de likes y reacciones
- Recibir notificaciones de comentarios

## Troubleshooting

### Error: "Notification permission denied"
- El usuario bloqueó las notificaciones en el navegador
- Solicitar al usuario que las habilite manualmente en la configuración del navegador

### Error: "Service Worker registration failed"
- Verificar que el archivo `firebase-messaging-sw.js` esté en `/public`
- Verificar que las credenciales de Firebase estén correctas

### Error: "Invalid FCM token"
- El token expiró o es inválido
- El sistema automáticamente lo deshabilitará y solicitará uno nuevo

## Notas de Seguridad

- Las credenciales privadas (FIREBASE_PRIVATE_KEY) NUNCA deben exponerse en el cliente
- Las variables NEXT_PUBLIC_ son públicas y seguras de exponer
- Mantén el archivo de Service Account JSON seguro y nunca lo subas a Git