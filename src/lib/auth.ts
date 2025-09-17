import { NextAuthOptions } from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import GoogleProvider from "next-auth/providers/google";
import clientPromise from "./mongodb-adapter";



export const authOptions: NextAuthOptions = {
  adapter: {
    ...MongoDBAdapter(clientPromise),
    createUser: async (data: any) => {
      const client = await clientPromise;
      const db = client.db();
      const user = {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const result = await db.collection('users').insertOne(user);
      return { ...user, id: result.insertedId.toString() };
    }
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // Incluir información de admin en el token
        token.isAdmin = (user as any).isAdmin || false;
      }
      return token;
    },
    async session({ session, token }) {
      console.log('🔍 SESSION CALLBACK - Token:', { id: token.id, isAdmin: token.isAdmin });

      if (token && session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).isAdmin = token.isAdmin as boolean;

        console.log('🔍 SESSION CALLBACK - Before DB check, isAdmin from token:', token.isAdmin);

        // Verificar admin y otros datos desde la base de datos para asegurar que estén actualizados
        try {
          const User = (await import('@/lib/models/User')).default;
          const user = await User.findById(token.id);
          if (user) {
            console.log('🔍 SESSION CALLBACK - User found in DB:', {
              id: user._id,
              email: user.email,
              isAdmin: user.isAdmin
            });

            (session.user as any).isAdmin = user.isAdmin;
            token.isAdmin = user.isAdmin;

            // Actualizar la imagen del usuario desde la base de datos
            if (user.image) {
              session.user.image = user.image;
            }

            // Actualizar el nombre si ha cambiado
            if (user.name) {
              session.user.name = user.name;
            }

            // Incluir team del usuario
            (session.user as any).team = user.team || null;
          } else {
            console.log('❌ SESSION CALLBACK - User NOT found in DB for token.id:', token.id);
          }
        } catch (error) {
          console.error('❌ SESSION CALLBACK - Error verificando datos del usuario:', error);
        }
      }

      console.log('🔍 SESSION CALLBACK - Final session.user.isAdmin:', (session.user as any)?.isAdmin);
      return session;
    },
    async signIn({ user, account, profile }) {
      // Permitir solo autenticación con Google
      if (account?.provider === "google") {
        return true;
      }
      return false;
    },

    async redirect({ url, baseUrl }) {
      // Manejar redirecciones
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
}; 