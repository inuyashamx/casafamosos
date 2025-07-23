# Casa Famosos

Plataforma de entretenimiento y celebridades construida con Next.js, MongoDB y NextAuth.

## 🚀 Características

- **Next.js 14** con App Router
- **MongoDB** como base de datos
- **NextAuth.js** para autenticación
- **Tailwind CSS** con tema oscuro
- **TypeScript** para mejor desarrollo
- **Diseño responsive** y moderno

## 📋 Requisitos Previos

- Node.js 18+ 
- MongoDB (local o Atlas)
- Cuenta de Google Developer (para OAuth opcional)

## 🛠️ Instalación

1. **Clona el repositorio**
   ```bash
   git clone <tu-repositorio>
   cd casafamosos
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   ```

3. **Configura las variables de entorno**
   
   Crea un archivo `.env.local` en la raíz del proyecto con:
   ```env
   # MongoDB
   MONGODB_URI=mongodb://localhost:27017/casafamosos
   
   # NextAuth
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=tu-clave-secreta-aqui
   
   # Google OAuth (opcional)
   GOOGLE_CLIENT_ID=tu-google-client-id
   GOOGLE_CLIENT_SECRET=tu-google-client-secret
   ```

4. **Ejecuta el servidor de desarrollo**
   ```bash
   npm run dev
   ```

5. **Abre [http://localhost:3000](http://localhost:3000)** en tu navegador

## 🗄️ Configuración de MongoDB

### Opción 1: MongoDB Local
1. Instala MongoDB en tu sistema
2. Inicia el servicio de MongoDB
3. Usa la URI: `mongodb://localhost:27017/casafamosos`

### Opción 2: MongoDB Atlas
1. Crea una cuenta en [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Crea un cluster
3. Obtén la URI de conexión
4. Reemplaza `<password>` con tu contraseña

## 🔐 Configuración de NextAuth

### Google OAuth (Recomendado)
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto
3. Habilita la API de Google+ 
4. Crea credenciales OAuth 2.0
5. Agrega `http://localhost:3000/api/auth/callback/google` como URI de redirección

## 📁 Estructura del Proyecto

```
src/
├── app/                    # App Router de Next.js
│   ├── api/               # Rutas de API
│   │   └── auth/          # NextAuth endpoints
│   ├── globals.css        # Estilos globales
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página principal
├── components/            # Componentes reutilizables
├── lib/                   # Utilidades y configuraciones
│   ├── auth.ts           # Configuración de NextAuth
│   ├── mongodb.ts        # Conexión a MongoDB
│   └── mongodb-adapter.ts # Adaptador de MongoDB para NextAuth
```

## 🎨 Tema Oscuro

El proyecto viene configurado con un tema oscuro moderno por defecto. Las variables CSS están definidas en `globals.css` y se pueden personalizar fácilmente.

## 🚀 Despliegue

### Vercel (Recomendado)
1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en el dashboard
3. ¡Listo!

### Otros proveedores
El proyecto es compatible con cualquier proveedor que soporte Next.js.

## 📝 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Construir para producción
- `npm run start` - Servidor de producción
- `npm run lint` - Ejecutar ESLint

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Si tienes problemas o preguntas, abre un issue en el repositorio.
