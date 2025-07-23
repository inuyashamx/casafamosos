import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { signOut } from "next-auth/react";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }
  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="bg-card p-8 rounded-lg shadow-md border border-border text-center">
        <h1 className="text-2xl font-bold mb-4 text-foreground">
          Logueado con {session.user.name || session.user.email}
        </h1>
        <form action="/api/auth/signout" method="post">
          <button
            type="submit"
            className="bg-destructive text-destructive-foreground px-4 py-2 rounded hover:bg-destructive/80 transition-colors"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </main>
  );
} 