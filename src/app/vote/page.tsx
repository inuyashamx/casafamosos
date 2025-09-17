"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
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
  savedCandidate?: {
    id: string;
    name: string;
    photo?: string;
    savedAt: string;
  };
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
  const [canReceiveShareBonus, setCanReceiveShareBonus] = useState(false);

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

          // Inicializar votos del usuario en 0 (excluyendo salvado por seguridad)
          const initialVotes: UserVotes = {};
          const savedId = data?.savedCandidate?.id;
          data.nominees
            .filter((n: Nominee) => !savedId || n.id !== savedId)
            .forEach((nominee: Nominee) => {
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

    const checkShareBonus = async () => {
      if (!session) return;

      try {
        const response = await fetch('/api/vote?action=check-share-bonus');
        if (response.ok) {
          const data = await response.json();
          setCanReceiveShareBonus(data.canReceiveBonus);
        }
      } catch (err) {
        console.error('Error checking share bonus:', err);
      }
    };

    fetchVotingData();
    fetchUserPoints();
    checkShareBonus();
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
        .filter(([candidateId]) => !votingData?.savedCandidate?.id || candidateId !== votingData.savedCandidate.id)
        .map(([candidateId, points]) => ({
          candidateId,
          points
        }));

      // Ya no enviamos fingerprint ni timeOnPage
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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

  const handleShareApp = async () => {
    try {
      const shareUrl = window.location.origin;
      const shareText = '¡Vota por tus candidatos favoritos en La Casa Vota! 🏠✨';

      // Detectar si es móvil
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      if (isMobile && navigator.share) {
        try {
          await navigator.share({
            title: 'La Casa Vota 2025',
            text: shareText,
            url: shareUrl
          });
          await giveShareBonus();
          return;
        } catch (err) {
          console.log('Share cancelado');
        }
      }

      // Fallback: copiar al portapapeles
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      alert('¡Enlace copiado al portapapeles!');
      await giveShareBonus();
    } catch (error) {
      console.error('Error compartiendo:', error);
    }
  };

  const giveShareBonus = async () => {
    try {
      const response = await fetch('/api/vote?action=share-bonus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      if (response.ok) {
        const data = await response.json();
        alert(`🎉 ${data.message}`);
        // Recargar puntos
        const pointsResponse = await fetch('/api/vote?action=points');
        if (pointsResponse.ok) {
          const pointsData = await pointsResponse.json();
          setUserPoints(pointsData.availablePoints);
        }
        setCanReceiveShareBonus(false);
      }
    } catch (error) {
      console.error('Error dando bonus:', error);
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
      <Navbar />

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

        {/* Share Bonus Banner - Solo si puede recibir el bonus */}
        {canReceiveShareBonus && (
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
            <p className="text-sm font-semibold text-amber-600 mb-3">
              🎁 Obtén 50 puntos extra compartiendo
            </p>
            <button
              onClick={handleShareApp}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-5 py-2 rounded-lg text-sm font-medium hover:scale-105 transition-all duration-200 shadow-md"
            >
              📤 Compartir y ganar 50 pts
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">Distribuye tus puntos</h2>
          <p className="text-muted-foreground text-sm">
            Esta votación NO es oficial, para votos reales ve al sitio oficial de VIX
          </p>
        </div>

        {/* Candidates (filtrados por seguridad en cliente) */}
        <div className="space-y-4">
          {votingData?.nominees
            .filter((nominee) => !votingData?.savedCandidate?.id || nominee.id !== votingData.savedCandidate.id)
            .map((nominee) => (
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
                <button
                  onClick={() => addQuickPoints(nominee.id, 50)}
                  disabled={remainingPoints < 50}
                  className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +50
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