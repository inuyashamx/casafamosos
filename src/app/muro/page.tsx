"use client";
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Feed from '@/components/Feed';
import Image from 'next/image';
import TeamBadge from '@/components/TeamBadge';

export default function MuroPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Verificar si es admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!session) return;
      
      try {
        const response = await fetch('/api/admin?action=checkAdmin');
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.isAdmin || false);
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
      }
    };

    checkAdminStatus();
  }, [session]);

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

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-6">🏠</div>
          <h1 className="text-3xl font-bold text-foreground mb-4">Muro Casa Famosos</h1>
          <p className="text-muted-foreground mb-6">
            Únete a la conversación, comparte fotos, videos y mantente al día con todo lo que pasa en Casa Famosos.
          </p>
          
          <button
            onClick={() => signIn('google')}
            className="w-full bg-white text-gray-800 py-3 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center space-x-3 mb-4"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="font-medium">Iniciar sesión con Google</span>
          </button>

          <button
            onClick={() => router.push('/')}
            className="text-primary hover:text-primary/80 transition-colors text-sm"
          >
            ← Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-primary/20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Image
            src="/logo.png"
            alt="Casa Famosos"
            width={32}
            height={32}
            className="w-8 h-8 rounded-lg flex-shrink-0"
          />
          
          {/* Navigation Icons */}
          <div className="flex items-center space-x-6 flex-1 justify-center">
              <button
                onClick={() => router.push('/')}
                className="text-white hover:text-primary transition-colors p-2"
                title="Inicio"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
              </button>
              <button
                onClick={() => router.push('/vote')}
                className="text-white hover:text-primary transition-colors p-2"
                title="Votar"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7.5v-2H14v2zm2-4H7.5v-2H16v2zm0-4H7.5V7H16v2z"/>
                </svg>
              </button>
              <span className="text-primary p-2" title="Muro">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
              </span>
              <button
                onClick={() => router.push('/ranking')}
                className="text-white hover:text-primary transition-colors p-2"
                title="Ranking"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 14H5v5h2v-5zm3-7H8v12h2V7zm3 3h-2v9h2v-9zm3-6h-2v15h2V4z"/>
                </svg>
              </button>
              <button
                onClick={() => router.push('/global')}
                className="text-white hover:text-primary transition-colors p-2"
                title="Global"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
              </button>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-primary/30 transition-colors overflow-hidden"
              >
                {session.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || 'Usuario'}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <span className={`text-primary text-sm font-bold ${session.user?.image ? 'hidden' : ''}`}>
                  {session.user?.name?.[0] || 'U'}
                </span>
              </button>

              {showUserMenu && (
                <>
                  {/* Overlay para cerrar el menú */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  />

                  {/* Menú desplegable */}
                  <div className="absolute right-0 mt-2 w-48 bg-card border border-border/40 rounded-lg shadow-lg z-20">
                    <div className="p-3 border-b border-border/20">
                      <p className="text-sm font-medium text-foreground truncate flex items-center gap-1">
                        {session.user?.name} <TeamBadge team={(session.user as any)?.team} />
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {session.user?.email}
                      </p>
                    </div>

                    <div className="py-2">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          router.push('/');
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted/30 transition-colors flex items-center space-x-2"
                      >
                        <span>🏠</span>
                        <span>Inicio</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          router.push('/perfil');
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted/30 transition-colors flex items-center space-x-2"
                      >
                        <span>👤</span>
                        <span>Perfil</span>
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            router.push('/admin');
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted/30 transition-colors flex items-center space-x-2"
                        >
                          <span>👑</span>
                          <span>Panel Admin</span>
                        </button>
                      )}

                      <div className="border-t border-border/20 mt-2 pt-2">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            signOut({ callbackUrl: '/' });
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-destructive/10 transition-colors flex items-center space-x-2"
                        >
                          <span>🚪</span>
                          <span>Cerrar Sesión</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Feed />
      </div>
    </main>
  );
}