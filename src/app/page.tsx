"use client";
import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Image from 'next/image';
import Chat from '@/components/Chat';

interface Nominee {
  id: string;
  name: string;
  photo: string;
  votes: number;
  percentage: number;
}

interface WeekData {
  id: string;
  weekNumber: number;
  name: string;
  votingEndDate: string;
  isActive: boolean;
}

interface SeasonData {
  id: string;
  name: string;
  year: number;
}

interface VotingData {
  nominees: Nominee[];
  week: WeekData;
  season: SeasonData;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [votingData, setVotingData] = useState<VotingData | null>(null);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Contador regresivo
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Cargar datos de votación
  useEffect(() => {
    const fetchVotingData = async () => {
      try {
        const response = await fetch('/api/public/vote');
        if (response.ok) {
          const data = await response.json();
          setVotingData(data);
          
          // Calcular tiempo restante si hay votación activa
          if (data.week?.votingEndDate) {
            updateCountdown(data.week.votingEndDate);
          }
        } else {
          const errorData = await response.json();
          setError(errorData.message || 'Error al cargar datos');
        }
      } catch (err) {
        console.error('Error fetching voting data:', err);
        setError('Error de conexión');
      } finally {
        setLoading(false);
      }
    };

    fetchVotingData();
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchVotingData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Cargar puntos del usuario
  useEffect(() => {
    const fetchUserPoints = async () => {
      if (!session) return;
      
      try {
        const response = await fetch('/api/vote?action=points');
        if (response.ok) {
          const data = await response.json();
          setUserPoints(data.availablePoints);
        }
      } catch (err) {
        console.error('Error fetching user points:', err);
      }
    };

    fetchUserPoints();
  }, [session]);

  // Actualizar contador regresivo
  const updateCountdown = (endDate: string) => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const distance = end - now;

      if (distance > 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  };

  useEffect(() => {
    if (votingData?.week?.votingEndDate) {
      const cleanup = updateCountdown(votingData.week.votingEndDate);
      return cleanup;
    }
  }, [votingData?.week?.votingEndDate]);

  const handleVoteClick = () => {
    if (!session) {
      setShowLoginModal(true);
    } else {
      // Redirigir a página de votación
      window.location.href = '/vote';
    }
  };

  const handleChatClick = () => {
    if (!session) {
      setShowLoginModal(true);
    } else {
      setShowChat(true);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/public/vote');
      if (response.ok) {
        const data = await response.json();
        setVotingData(data);
        if (data.week?.votingEndDate) {
          updateCountdown(data.week.votingEndDate);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al cargar datos');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background pb-20">
      {/* Header Mobile */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-primary/20">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-lg glow"></div>
            <span className="text-lg font-bold text-foreground">
              {votingData?.season?.name || 'Casa Famosos 2025'}
            </span>
          </div>

          {/* User Menu or Login Button */}
          {session ? (
            <div className="flex items-center space-x-3">
              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center hover:bg-primary/30 transition-colors"
                >
                  <span className="text-primary text-sm font-bold">
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
                        <p className="text-sm font-medium text-foreground truncate">
                          {session.user?.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {session.user?.email}
                        </p>
                      </div>

                      <div className="py-2">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            window.location.href = '/dashboard';
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted/30 transition-colors flex items-center space-x-2"
                        >
                          <span>👤</span>
                          <span>Mi Perfil</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            // Aquí iría la lógica para ver historial de votos
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted/30 transition-colors flex items-center space-x-2"
                        >
                          <span>📊</span>
                          <span>Mis Votos</span>
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
              onClick={() => setShowLoginModal(true)}
              className="text-sm text-primary font-medium bg-primary/10 px-3 py-1 rounded-full hover:bg-primary/20 transition-colors"
            >
              Iniciar Sesión
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Status Banner */}
        {loading ? (
          <div className="bg-card/50 rounded-xl p-4 border border-border/20 text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-1/2 mx-auto mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/3 mx-auto"></div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-destructive font-medium">Error al cargar datos</h3>
                <p className="text-destructive/80 text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={handleRefresh}
                className="bg-destructive text-destructive-foreground px-3 py-1 rounded-lg text-sm hover:bg-destructive/90 transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : !votingData?.season ? (
          <div className="bg-muted/30 border border-border/40 rounded-xl p-8 text-center">
            <div className="text-4xl mb-4">🏠</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No hay temporada activa</h3>
            <p className="text-muted-foreground">Actualmente no hay ninguna temporada en curso. Vuelve más tarde.</p>
          </div>
        ) : !votingData?.week ? (
          <div className="bg-muted/30 border border-border/40 rounded-xl p-8 text-center">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No hay votación activa</h3>
            <p className="text-muted-foreground">
              Temporada: {votingData.season.name} ({votingData.season.year})
            </p>
            <p className="text-muted-foreground mt-2">No hay ninguna semana de votación activa en este momento.</p>
          </div>
        ) : votingData?.week?.isActive ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <h3 className="text-green-500 font-bold">Votación Activa</h3>
                <p className="text-green-500/80 text-sm">
                  {votingData.week.name} - {votingData.nominees.length} nominados
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-muted/20 border border-border/20 rounded-xl p-4 text-center">
            <h3 className="text-muted-foreground font-medium">No hay votación activa</h3>
            <p className="text-muted-foreground/80 text-sm mt-1">
              Espera a que se publiquen los próximos nominados
            </p>
          </div>
        )}

        {/* Countdown Timer */}
        {votingData?.week?.isActive && (
          <div className="bg-card rounded-xl p-4 border border-border/20">
            <h3 className="text-center text-muted-foreground text-sm font-medium mb-3">
              Votación cierra en:
            </h3>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-primary/10 rounded-lg p-2">
                <div className="text-lg font-bold text-primary">{timeLeft.days}</div>
                <div className="text-xs text-muted-foreground">Días</div>
              </div>
              <div className="bg-primary/10 rounded-lg p-2">
                <div className="text-lg font-bold text-primary">{timeLeft.hours}</div>
                <div className="text-xs text-muted-foreground">Horas</div>
              </div>
              <div className="bg-primary/10 rounded-lg p-2">
                <div className="text-lg font-bold text-primary">{timeLeft.minutes}</div>
                <div className="text-xs text-muted-foreground">Min</div>
              </div>
              <div className="bg-primary/10 rounded-lg p-2">
                <div className="text-lg font-bold text-primary">{timeLeft.seconds}</div>
                <div className="text-xs text-muted-foreground">Seg</div>
              </div>
            </div>
          </div>
        )}

        {/* Vote Button */}
        {votingData?.week?.isActive && (
          <button
            onClick={handleVoteClick}
            className="w-full bg-gradient-to-r from-primary to-accent text-white py-4 rounded-xl font-bold text-lg glow hover:scale-105 transition-all duration-200 shadow-lg"
          >
            🗳️ VOTAR AHORA
          </button>
        )}

        {/* Nominees List */}
        {votingData?.nominees && votingData.nominees.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Nominados Actuales</h2>
              <button
                onClick={handleRefresh}
                className="text-primary hover:text-primary/80 transition-colors"
              >
                🔄
              </button>
            </div>
            
            {votingData.nominees.map((nominee, index) => (
              <div key={nominee.id} className="bg-card rounded-xl p-4 border border-border/20 vote-card">
                <div className="flex items-center space-x-4">
                  {/* Position Badge */}
                  <div className={`position-badge ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-muted'}`}>
                    #{index + 1}
                  </div>
                  
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center avatar-glow">
                    {nominee.photo ? (
                      <Image 
                        src={nominee.photo} 
                        alt={nominee.name}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <span className="text-xl">👤</span>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{nominee.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex-1 bg-muted rounded-full h-2 progress-bar">
                        <div 
                          className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-500"
                          style={{ width: `${nominee.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-muted-foreground min-w-[3rem]">
                        {nominee.percentage}%
                      </span>
                    </div>
                  </div>
                  
                  {/* Votes */}
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">{nominee.votes.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">votos</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Stats */}
        {votingData?.nominees && (
          <div className="bg-card rounded-xl p-4 border border-border/20">
            <h3 className="font-semibold text-foreground mb-3">Estadísticas</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {votingData.nominees.reduce((sum, n) => sum + n.votes, 0).toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Total de votos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-accent">{votingData.nominees.length}</div>
                <div className="text-xs text-muted-foreground">Nominados</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Chat Button - Oculto por ahora */}
      {/* <button
        onClick={handleChatClick}
        className="floating-button fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-primary to-accent text-white rounded-full shadow-lg glow hover:scale-110 transition-all duration-200 flex items-center justify-center z-50"
      >
        💬
      </button> */}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-md border border-border/40">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Iniciar Sesión</h2>
              <p className="text-muted-foreground text-sm">
                Inicia sesión para votar por tus candidatos favoritos
              </p>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => signIn('google', { callbackUrl: '/' })}
                className="w-full bg-white text-gray-800 py-3 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center space-x-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="font-medium">Continuar con Google</span>
              </button>
              
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Al continuar, aceptas nuestros términos y condiciones
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowLoginModal(false)}
              className="w-full mt-6 text-muted-foreground text-sm hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl w-full max-w-md h-[600px] border border-border/40 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border/20">
              <h2 className="text-lg font-bold text-foreground">Chat en Vivo</h2>
              <button
                onClick={() => setShowChat(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>
                         <div className="flex-1">
               <Chat isOpen={true} onClose={() => setShowChat(false)} />
             </div>
          </div>
        </div>
      )}
    </main>
  );
}
