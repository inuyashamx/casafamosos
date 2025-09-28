"use client";
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Feed from '@/components/Feed';
import Navbar from '@/components/Navbar';

export default function MuroPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }


  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Banner Palabras al Corazón */}
        <div className="mb-6 bg-gradient-to-r from-pink-500/20 via-red-500/20 to-rose-500/20 rounded-xl border border-pink-200/30 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">💌</span>
                <h3 className="text-lg sm:text-xl font-bold text-foreground">
                  Palabras al Corazón
                </h3>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground mb-3">
                Expresa tu apoyo y cariño a tu habitante favorito. Escribe desde el corazón y deja que tus palabras lleguen a quien más admiras.
              </p>
              <button
                onClick={() => router.push('/palabras-corazon')}
                className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-lg text-sm sm:text-base font-medium hover:from-pink-600 hover:to-rose-600 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                ❤️ Escribir Dedicatoria
              </button>
            </div>
            <div className="hidden sm:block text-4xl ml-4">
              ❤️
            </div>
          </div>
        </div>

        <Feed />
      </div>
    </main>
  );
}