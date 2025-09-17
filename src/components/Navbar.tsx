"use client";
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut, signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import TeamBadge from '@/components/TeamBadge';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
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

  // Función para determinar si un botón está activo
  const isActive = (path: string) => {
    return pathname === path;
  };

  // Estilo base para botones
  const getButtonStyle = (path: string) => {
    return isActive(path)
      ? "text-primary transition-colors p-2" // Azul cuando está activo
      : "text-white hover:text-primary transition-colors p-2"; // Blanco normal, azul al hover
  };

  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-primary/20">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Navigation Icons - Ahora 5 iconos incluyendo Anotador */}
        <div className="flex items-center space-x-4 sm:space-x-6 flex-1 justify-center">
          <button
            onClick={() => router.push('/')}
            className={getButtonStyle('/')}
            title="Inicio"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </button>

          <button
            onClick={() => router.push('/muro')}
            className={getButtonStyle('/muro')}
            title="Muro"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </button>

          <button
            onClick={() => router.push('/global')}
            className={getButtonStyle('/global')}
            title="Global"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
          </button>

          <button
            onClick={() => router.push('/anotador')}
            className={getButtonStyle('/anotador')}
            title="Anotador"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 2c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2H6zm0 2h12v16H6V4z"/>
              <path d="M8 6h8v2H8V6zm0 3h8v2H8V9zm0 3h8v2H8v-2zm0 3h5v2H8v-2z"/>
              <circle cx="16" cy="16" r="1"/>
              <circle cx="16" cy="18" r="1"/>
            </svg>
          </button>

          <button
            onClick={() => router.push('/ranking')}
            className={getButtonStyle('/ranking')}
            title="Ranking"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 14H5v5h2v-5zm3-7H8v12h2V7zm3 3h-2v9h2v-9zm3-6h-2v15h2V4z"/>
            </svg>
          </button>
        </div>

        {/* User Menu or Login Button */}
        {session ? (
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
                      // Si la imagen falla, mostrar la inicial
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

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          router.push('/vote');
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted/30 transition-colors flex items-center space-x-2"
                      >
                        <span>📊</span>
                        <span>Votar</span>
                      </button>

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
        ) : (
          <button
            onClick={() => signIn('google')}
            className="text-sm text-primary font-medium bg-primary/10 px-3 py-1 rounded-full hover:bg-primary/20 transition-colors"
          >
            Iniciar Sesión
          </button>
        )}
      </div>
    </header>
  );
}