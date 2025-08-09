"use client";
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import TeamBadge from '@/components/TeamBadge';

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

interface UserVotes {
  [candidateId: string]: number;
}

export default function VotePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [votingData, setVotingData] = useState<VotingData | null>(null);
  const [userPoints, setUserPoints] = useState(0);
  const [userVotes, setUserVotes] = useState<UserVotes>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Verificar autenticación
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/');
      return;
    }
  }, [session, status, router]);

  // Cargar datos de votación
  useEffect(() => {
    const fetchVotingData = async () => {
      try {
        const response = await fetch('/api/public/vote');
        if (response.ok) {
          const data = await response.json();
          setVotingData(data);
          
          // Inicializar votos del usuario en 0
          const initialVotes: UserVotes = {};
          data.nominees.forEach((nominee: Nominee) => {
            initialVotes[nominee.id] = 0;
          });
          setUserVotes(initialVotes);
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

    fetchVotingData();
    fetchUserPoints();
  }, [session]);

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

  // Calcular puntos usados
  const usedPoints = Object.values(userVotes).reduce((sum, points) => sum + points, 0);
  const remainingPoints = userPoints - usedPoints;

  // Función para actualizar votos
  const updateVote = (candidateId: string, points: number) => {
    const newPoints = Math.max(0, points);
    const currentUsed = usedPoints - userVotes[candidateId];
    const newUsed = currentUsed + newPoints;
    
    if (newUsed <= userPoints) {
      setUserVotes(prev => ({
        ...prev,
        [candidateId]: newPoints
      }));
    }
  };

  // Función para agregar puntos rápidamente
  const addQuickPoints = (candidateId: string, points: number) => {
    const currentPoints = userVotes[candidateId] || 0;
    const newPoints = currentPoints + points;
    updateVote(candidateId, newPoints);
  };



  // Función para enviar votos
  const submitVotes = async () => {
    if (usedPoints === 0) {
      setError('Debes asignar al menos un punto para poder votar');
      return;
    }

    if (usedPoints > userPoints) {
      setError('No tienes suficientes puntos disponibles');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const votes = Object.entries(userVotes)
        .filter(([_candidateId, points]) => points > 0)
        .map(([candidateId, points]) => ({
          candidateId,
          points
        }));

      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'submitVotes',
          weekId: votingData?.week?.id,
          votes
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al enviar votos');
      }

      // Redirigir a la página principal con mensaje de éxito
      router.push('/?message=voted');
    } catch (err: any) {
      setError(err.message);
      console.error('Error submitting votes:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
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
    return null; // Será redirigido
  }

  if (error && !votingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Error al cargar datos</h3>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  if (!votingData?.week?.isActive) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📅</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No hay votación activa</h3>
          <p className="text-muted-foreground">No hay ninguna semana de votación activa en este momento.</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-primary/20">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Image
              src="/logo.png"
              alt="Casa Famosos"
              width={32}
              height={32}
              className="w-8 h-8 rounded-lg"
            />
            <button
              onClick={() => router.push('/')}
              className="text-lg font-bold text-foreground hover:text-primary transition-colors"
            >
              Inicio
            </button>
            <button
              onClick={() => router.push('/vote')}
              className="text-lg font-bold text-primary"
            >
              Votar
            </button>
            <button
              onClick={() => router.push('/muro')}
              className="text-lg font-bold text-foreground hover:text-primary transition-colors"
            >
              Muro
            </button>
          </div>

          {/* User Menu */}
          {session && (
            <div className="flex items-center space-x-3">
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-primary/30 transition-colors overflow-hidden"
                >
                  {session.user?.image ? (
                    <img 
                      src={session.user.image} 
                      alt={session.user.name || 'Usuario'}
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
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            window.location.href = '/perfil';
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
                              window.location.href = '/admin';
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
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Error Display */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
            <div className="flex items-center space-x-2">
              <span className="text-destructive">⚠️</span>
              <span className="text-destructive font-medium">{error}</span>
              <button 
                onClick={() => setError(null)}
                className="ml-auto text-destructive hover:text-destructive/80"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Available Points */}
        <div className="bg-card rounded-xl p-4 border border-border/20">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-1">{remainingPoints}</div>
            <div className="text-sm text-muted-foreground">puntos disponibles</div>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">Distribuye tus puntos</h2>
          <p className="text-muted-foreground text-sm">
            Asigna tus {userPoints} puntos entre los candidatos nominados
          </p>
        </div>

        {/* Candidates */}
        <div className="space-y-4">
          {votingData?.nominees.map((nominee) => (
            <div key={nominee.id} className="bg-card rounded-xl p-4 border border-border/20">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center overflow-hidden">
                  {nominee.photo ? (
                    <Image
                      src={nominee.photo}
                      alt={nominee.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-muted-foreground text-lg">👤</span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{nominee.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {nominee.votes.toLocaleString()} votos actuales
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-primary">
                    {userVotes[nominee.id] || 0} pts
                  </div>
                </div>
              </div>

              {/* Vote Controls */}
              <div className="flex items-center justify-center space-x-2 mb-3">
                <button
                  onClick={() => updateVote(nominee.id, (userVotes[nominee.id] || 0) - 1)}
                  disabled={!userVotes[nominee.id] || userVotes[nominee.id] === 0}
                  className="w-10 h-10 bg-muted text-muted-foreground rounded-lg flex items-center justify-center hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  -
                </button>
                <div className="w-16 h-10 bg-input border border-border rounded-lg flex items-center justify-center">
                  <span className="font-medium text-foreground">
                    {userVotes[nominee.id] || 0}
                  </span>
                </div>
                <button
                  onClick={() => updateVote(nominee.id, (userVotes[nominee.id] || 0) + 1)}
                  disabled={remainingPoints <= 0}
                  className="w-10 h-10 bg-primary text-primary-foreground rounded-lg flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +
                </button>
                <button
                  onClick={() => updateVote(nominee.id, 0)}
                  disabled={!userVotes[nominee.id] || userVotes[nominee.id] === 0}
                  className="w-10 h-10 bg-red-500 text-white rounded-lg flex items-center justify-center hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Resetear puntos"
                >
                  ↺
                </button>
              </div>

              {/* Quick Add Buttons */}
              <div className="flex justify-center space-x-2">
                <button
                  onClick={() => addQuickPoints(nominee.id, 5)}
                  disabled={remainingPoints < 5}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +5
                </button>
                <button
                  onClick={() => addQuickPoints(nominee.id, 10)}
                  disabled={remainingPoints < 10}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +10
                </button>
                <button
                  onClick={() => addQuickPoints(nominee.id, 20)}
                  disabled={remainingPoints < 20}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +20
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border/40 p-4 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="text-sm">
            <span className="text-muted-foreground">Puntos disponibles:</span>
            <span className="font-bold text-primary ml-1">{remainingPoints}</span>
          </div>
          <button
            onClick={submitVotes}
            disabled={submitting || usedPoints === 0}
            className="bg-primary text-primary-foreground py-3 px-6 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Enviando...' : `Votar (${usedPoints} pts)`}
          </button>
        </div>
      </div>
    </main>
  );
} 