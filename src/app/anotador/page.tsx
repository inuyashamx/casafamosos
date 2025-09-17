"use client";
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import './anotador.css';

interface Candidate {
  id: string;
  name: string;
  photo?: string;
}

interface CandidatePoints {
  [candidateId: string]: number;
}


export default function AnotadorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [points, setPoints] = useState<CandidatePoints>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [animatingCards, setAnimatingCards] = useState<Set<string>>(new Set());
  const [displayOrder, setDisplayOrder] = useState<string[]>([]);
  const previousOrderRef = useRef<string[]>([]);
  const reorderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Verificar autenticación
  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/');
      return;
    }
  }, [session, status, router]);

  // Cargar candidatos activos
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const response = await fetch('/api/public/vote');
        if (response.ok) {
          const data = await response.json();
          if (data.nominees && data.nominees.length > 0) {
            const activeCandidates = data.nominees.map((nominee: any) => ({
              id: nominee.id,
              name: nominee.name,
              photo: nominee.photo
            }));
            setCandidates(activeCandidates);

            // Inicializar orden de display
            setDisplayOrder(activeCandidates.map((candidate: Candidate) => candidate.id));

            // Inicializar puntos desde localStorage o en 0
            const savedPoints = localStorage.getItem('nominationPoints');
            if (savedPoints) {
              const parsedPoints = JSON.parse(savedPoints);
              // Solo mantener puntos de candidatos que aún están activos
              const filteredPoints: CandidatePoints = {};
              activeCandidates.forEach((candidate: Candidate) => {
                filteredPoints[candidate.id] = parsedPoints[candidate.id] || 0;
              });
              setPoints(filteredPoints);

              // Si hay puntos guardados, reordenar inmediatamente
              const hasPoints = Object.values(filteredPoints).some(points => points !== 0);
              if (hasPoints) {
                const sortedIds = activeCandidates.sort((a, b) => {
                  const pointsA = filteredPoints[a.id] || 0;
                  const pointsB = filteredPoints[b.id] || 0;
                  if (pointsA !== pointsB) {
                    return pointsB - pointsA;
                  }
                  return a.name.localeCompare(b.name);
                }).map(c => c.id);
                setDisplayOrder(sortedIds);
              }
            } else {
              // Inicializar todos en 0
              const initialPoints: CandidatePoints = {};
              activeCandidates.forEach((candidate: Candidate) => {
                initialPoints[candidate.id] = 0;
              });
              setPoints(initialPoints);
            }
          } else {
            setError('No hay candidatos activos en este momento');
          }
        } else {
          setError('Error al cargar candidatos');
        }
      } catch (err) {
        console.error('Error fetching candidates:', err);
        setError('Error de conexión');
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchCandidates();
    }
  }, [session]);

  // Guardar puntos en localStorage cuando cambien
  useEffect(() => {
    if (Object.keys(points).length > 0) {
      localStorage.setItem('nominationPoints', JSON.stringify(points));
    }
  }, [points]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (reorderTimeoutRef.current) {
        clearTimeout(reorderTimeoutRef.current);
      }
    };
  }, []);

  const updatePoints = (candidateId: string, change: number) => {
    setPoints(prev => {
      const newPoints = (prev[candidateId] || 0) + change;

      // Agregar animación a la card que cambió
      setAnimatingCards(current => new Set([...current, candidateId]));

      // Limpiar timeout anterior si existe
      if (reorderTimeoutRef.current) {
        clearTimeout(reorderTimeoutRef.current);
      }

      // Debounce de 3 segundos para el reordenamiento
      reorderTimeoutRef.current = setTimeout(() => {
        // Usar setters con callback para obtener los valores más actuales
        setPoints(currentPoints => {
          setCandidates(currentCandidates => {
            const sortedIds = [...currentCandidates].sort((a, b) => {
              const pointsA = currentPoints[a.id] || 0;
              const pointsB = currentPoints[b.id] || 0;
              if (pointsA !== pointsB) {
                return pointsB - pointsA; // Mayor a menor por puntos
              }
              return a.name.localeCompare(b.name);
            }).map(c => c.id);

            setDisplayOrder(sortedIds);
            return currentCandidates;
          });
          return currentPoints;
        });

        setAnimatingCards(current => {
          const newSet = new Set(current);
          newSet.delete(candidateId);
          return newSet;
        });
        reorderTimeoutRef.current = null;
      }, 2000);

      return {
        ...prev,
        [candidateId]: newPoints
      };
    });
  };

  const resetCandidate = (candidateId: string) => {
    setPoints(prev => ({
      ...prev,
      [candidateId]: 0
    }));
  };

  const resetAll = () => {
    const resetPoints: CandidatePoints = {};
    candidates.forEach(candidate => {
      resetPoints[candidate.id] = 0;
    });
    setPoints(resetPoints);
  };


  const getDisplayCandidates = () => {
    // Usar displayOrder para mantener el orden actual hasta el debounce
    return displayOrder.map(id => candidates.find(c => c.id === id)).filter(Boolean) as Candidate[];
  };

  const getNominees = () => {
    // Calcular nominados basado en puntos actuales (no en displayOrder)
    const sorted = [...candidates].sort((a, b) => {
      const pointsA = points[a.id] || 0;
      const pointsB = points[b.id] || 0;
      if (pointsA !== pointsB) {
        return pointsB - pointsA; // Mayor a menor por puntos
      }
      return a.name.localeCompare(b.name);
    });

    if (sorted.length === 0) return new Set();

    const nominees = new Set<string>();

    // Agregar los primeros 5
    for (let i = 0; i < Math.min(5, sorted.length); i++) {
      nominees.add(sorted[i].id);
    }

    // Si hay empate en el 5to lugar, incluir todos los empatados
    if (sorted.length > 5) {
      const fifthPlacePoints = points[sorted[4].id] || 0;

      // Buscar todos los que empatan con el 5to lugar
      for (let i = 5; i < sorted.length; i++) {
        const candidatePoints = points[sorted[i].id] || 0;
        if (candidatePoints === fifthPlacePoints) {
          nominees.add(sorted[i].id);
        } else {
          break; // Ya no hay más empates
        }
      }
    }

    return nominees;
  };

  const totalPoints = Object.values(points).reduce((sum, pts) => sum + pts, 0);

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

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Error</h3>
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

  return (
    <main className="min-h-screen bg-background pb-32">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header Compacto */}
        <div className="text-center mb-14">
          <h1 className="text-2xl font-bold text-primary">
            📝 Anotador de Nominaciones de lacasavota.com
          </h1>
        </div>


        {/* Candidates Grid - Diseño Compacto */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 candidates-grid mb-8">
          {getDisplayCandidates().map((candidate, index) => {
            const nominees = getNominees();
            const isNominee = nominees.has(candidate.id);

            return (
            <div
              key={candidate.id}
              className={`relative text-center candidate-card mb-8 ${
                animatingCards.has(candidate.id) ? 'card-moved' : ''
              }`}
            >
              {/* Photo with Points Badge */}
              <div className="relative">
                <div className="w-24 h-24 mx-auto rounded-full overflow-hidden bg-muted border-2 border-border/20">
                  {candidate.photo ? (
                    <Image
                      src={candidate.photo}
                      alt={candidate.name}
                      width={96}
                      height={96}
                      className="candidate-photo"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xl">
                      👤
                    </div>
                  )}
                </div>

                {/* Nominee Badge - Badge de nominado */}
                {isNominee && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white px-2 py-1 rounded-md text-xs font-bold shadow-lg border border-yellow-600">
                    Nominado
                  </div>
                )}

                {/* Points Badge - Círculo arriba de la foto - SIEMPRE visible */}
                <div className={`absolute -top-2 -right-2 w-10 h-10 ${
                  points[candidate.id] > 0 ? 'bg-primary' : points[candidate.id] < 0 ? 'bg-red-500' : 'bg-gray-500'
                } text-white rounded-full flex items-center justify-center text-base font-bold shadow-lg border-2 border-background points-badge ${
                  animatingCards.has(candidate.id) ? 'animate-pulse' : ''
                }`}>
                  {points[candidate.id] || 0}
                </div>
              </div>


              {/* Controls - Solo + y - */}
              <div className="flex justify-center items-center gap-2 mt-2">
                <button
                  onClick={() => updatePoints(candidate.id, -1)}
                  className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors text-sm font-bold point-button shadow-md"
                >
                  -
                </button>
                <button
                  onClick={() => updatePoints(candidate.id, 1)}
                  className="w-7 h-7 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors text-sm font-bold point-button shadow-md"
                >
                  +
                </button>
              </div>
            </div>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="text-center mb-6">
          <button
            onClick={resetAll}
            className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors"
          >
            🗑️ Reset Todo
          </button>
        </div>
      </div>
    </main>
  );
}