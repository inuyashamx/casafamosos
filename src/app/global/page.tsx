"use client";
import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import DraggableRanking from '@/components/DraggableRanking';
import TeamBadge from '@/components/TeamBadge';
import Navbar from '@/components/Navbar';

interface Candidate {
  _id: string;
  name: string;
  photo?: string;
  bio?: string;
  profession?: string;
  city?: string;
}

interface Season {
  id: string;
  name: string;
  year: number;
}

interface UserRanking {
  rankings: {
    candidateId: string;
    position: number;
  }[];
  updateCount: number;
  lastUpdated: string;
}

interface GlobalStat {
  candidate: Candidate;
  totalPoints: number;
  top5Count: number;
  averagePosition: number;
  top5Percentage: number;
}

interface GlobalRankingData {
  season: Season;
  candidates: Candidate[];
  userRanking: UserRanking | null;
  globalStats: {
    stats: GlobalStat[];
    totalParticipants: number;
  };
}

interface GlobalResults {
  globalStats: GlobalStat[];
  totalParticipants: number;
  recentActivity: {
    user: string;
    team?: string;
    lastUpdated: string;
    updateCount: number;
  }[];
}

// Helper function to abbreviate names for privacy
const abbreviateName = (fullName: string): string => {
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return parts[0];
  
  const firstName = parts[0];
  const lastNameInitial = parts[parts.length - 1][0];
  return `${firstName} ${lastNameInitial}.`;
};

// Helper function to format time elapsed
const formatTimeElapsed = (date: string): string => {
  const now = new Date();
  const updated = new Date(date);
  const diffMs = now.getTime() - updated.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 1) return 'hace menos de 1 minuto';
  if (diffMinutes < 60) return `hace ${diffMinutes} ${diffMinutes === 1 ? 'minuto' : 'minutos'}`;
  if (diffHours < 24) return `hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
  return `hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
};

export default function GlobalPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [data, setData] = useState<GlobalRankingData | null>(null);
  const [globalResults, setGlobalResults] = useState<GlobalResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'global'>('global');

  // Cargar datos iniciales
  useEffect(() => {
    fetchData();
    fetchGlobalResults();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/global-ranking');
      if (response.ok) {
        const data = await response.json();
        setData(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al cargar datos');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalResults = async () => {
    try {
      const response = await fetch('/api/global-ranking/results');
      if (response.ok) {
        const results = await response.json();
        setGlobalResults(results);
      }
    } catch (err) {
      console.error('Error fetching global results:', err);
    }
  };

  const handleSaveRanking = async (rankings: { candidateId: string }[]) => {
    if (!session) {
      setShowLoginModal(true);
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/global-ranking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rankings }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar ranking');
      }

      const result = await response.json();
      
      // Actualizar datos locales
      if (data) {
        setData({
          ...data,
          userRanking: {
            rankings: rankings.map((r, index) => ({
              candidateId: r.candidateId,
              position: index + 1,
            })),
            updateCount: result.updateCount,
            lastUpdated: result.lastUpdated,
          }
        });
      }

      // Refrescar resultados globales
      fetchGlobalResults();
    } catch (err: any) {
      console.error('Error saving ranking:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRankingChange = (rankings: { candidateId: string }[]) => {
    // Este callback se usa para actualizaciones en tiempo real si es necesario
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando ranking global...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
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

  if (!data?.season) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🏠</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No hay temporada activa</h3>
          <p className="text-muted-foreground">Actualmente no hay ninguna temporada en curso.</p>
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
    <main className="min-h-screen bg-background pb-20">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Hero Section */}
        <div className="text-center bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-6">
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            RANKING GLOBAL
          </h1>
          <p className="text-lg text-muted-foreground">
            ¿Cuál es tu TOP de habitantes? Ordénalos y comparte tu opinión
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-muted/20 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('global')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              activeTab === 'global' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            🌐 Ranking Global
          </button>
          <button
            onClick={() => setActiveTab('personal')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              activeTab === 'personal' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            🎯 Mi Ranking Personal
          </button>
        </div>

        {activeTab === 'personal' && (
          <div className="space-y-6">
            {/* Personal Ranking */}
            <div className="bg-card rounded-xl p-6 border border-border/20">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Tu Ranking Personal</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {session 
                      ? 'Arrastra para reordenar • Se guarda automáticamente'
                      : 'Inicia sesión para crear tu ranking personal'
                    }
                  </p>
                </div>
              </div>

              {session ? (
                <DraggableRanking
                  candidates={data.candidates}
                  initialRanking={data.userRanking?.rankings}
                  onRankingChange={handleRankingChange}
                  onSave={handleSaveRanking}
                  saving={saving}
                />
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🔒</div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Inicia sesión para crear tu ranking
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Ordena a todos los candidatos según tu preferencia
                  </p>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Iniciar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'global' && globalResults && (
          <div className="space-y-6">
            {/* Global Results */}
            <div className="bg-card rounded-xl p-6 border border-border/20">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Ranking Global de la Comunidad</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    El consenso de la comunidad
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {globalResults.globalStats.map((stat, index) => {
                  const position = index + 1;
                  return (
                    <div
                      key={stat.candidate._id}
                      className={`
                        rounded-xl p-4 border flex items-center space-x-4 ${
                          position === 1 
                            ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/50'
                            : position === 2 
                              ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/50' 
                              : position === 3 
                                ? 'bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-600/50'
                                : position <= 5 
                                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/40'
                                  : 'bg-card border-border/20'
                        }
                      `}
                    >
                      {/* Position */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                        <span className="text-lg font-bold text-primary">
                          {position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : position <= 5 ? '🏅' : `${position}°`}
                        </span>
                      </div>

                      {/* Photo */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-muted">
                        {stat.candidate.photo ? (
                          <Image
                            src={stat.candidate.photo}
                            alt={stat.candidate.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            👤
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">
                          {stat.candidate.name}
                        </h3>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Activity */}
            {globalResults.recentActivity.length > 0 && (
              <div className="bg-card rounded-xl p-6 border border-border/20">
                <h3 className="text-lg font-bold text-foreground mb-4">Actividad Reciente</h3>
                <div className="space-y-3">
                  {globalResults.recentActivity.slice(0, 30).map((activity, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="text-foreground font-medium">{abbreviateName(activity.user)}</span>
                        {activity.team && <TeamBadge team={activity.team as any} />}
                        <span className="text-muted-foreground">
                          actualizó su ranking {formatTimeElapsed(activity.lastUpdated)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-md border border-border/40">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Iniciar Sesión</h2>
              <p className="text-muted-foreground text-sm">
                Inicia sesión para crear tu ranking personal
              </p>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => signIn('google', { callbackUrl: '/global' })}
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
    </main>
  );
}