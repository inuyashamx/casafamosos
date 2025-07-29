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
      if (token && session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).isAdmin = token.isAdmin as boolean;
      }
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