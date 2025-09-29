"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import DedicationCard from './DedicationCard';

interface Dedication {
  _id: string;
  userId: {
    _id: string;
    name: string;
    image?: string;
    team?: 'DIA' | 'NOCHE' | 'ECLIPSE' | null;
  };
  candidateId: {
    _id: string;
    name: string;
    photo?: string;
  };
  content: string;
  likes: Array<{ userId: string; likedAt: string }>;
  likesCount: number;
  userHasLiked: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DedicationsFeedProps {
  candidateId: string;
  refreshKey?: number;
}

export default function DedicationsFeed({
  candidateId,
  refreshKey = 0,
}: DedicationsFeedProps) {
  const { data: session } = useSession();
  const [dedications, setDedications] = useState<Dedication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  // Siempre ordenamos por más recientes ahora
  const sortBy = 'recent';
  const [showAlert, setShowAlert] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const fetchDedications = useCallback(async (
    pageNum: number = 1,
    reset: boolean = true
  ) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = new URLSearchParams({
        candidateId,
        page: pageNum.toString(),
        limit: '10',
        sortBy,
      });

      const response = await fetch(`/api/dedications?${params}`);

      if (!response.ok) {
        throw new Error('Error al cargar dedicatorias');
      }

      const data = await response.json();

      if (reset) {
        setDedications(data.dedications);
      } else {
        setDedications(prev => {
          const existingIds = new Set(prev.map(d => d._id));
          const newDedications = data.dedications.filter(
            (d: Dedication) => !existingIds.has(d._id)
          );
          return [...prev, ...newDedications];
        });
      }

      setHasMore(data.pagination.hasMore);
      setPage(pageNum);
      setTotalCount(data.pagination.total || 0);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching dedications:', err);
      setError(err.message || 'Error al cargar dedicatorias');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [candidateId, sortBy]);

  useEffect(() => {
    fetchDedications(1, true);
  }, [fetchDedications, refreshKey]);

  const loadMoreDedications = useCallback(() => {
    if (hasMore && !loadingMore) {
      fetchDedications(page + 1, false);
    }
  }, [hasMore, loadingMore, page, fetchDedications]);

  // Intersection Observer para scroll infinito
  useEffect(() => {
    const currentRef = loadMoreRef.current;

    if (!currentRef || !hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting) {
          loadMoreDedications();
        }
      },
      {
        root: null,
        rootMargin: '200px',
        threshold: 0.1,
      }
    );

    observer.observe(currentRef);

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, loadingMore, loadMoreDedications, dedications.length]);


  const handleDedicationUpdate = (dedicationId: string, updates: any) => {
    setDedications(prev =>
      prev.map(d => d._id === dedicationId ? { ...d, ...updates } : d)
    );
  };

  if (loading && page === 1) {
    return (
      <div className="space-y-4">
        {/* Loading skeletons */}
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="bg-card rounded-xl p-6 border border-border/20 animate-pulse"
          >
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-muted rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error && dedications.length === 0) {
    return (
      <div className="bg-card rounded-xl p-8 border border-border/20 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Error al cargar dedicatorias
        </h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <button
          onClick={() => fetchDedications(1, true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg
                   hover:bg-primary/90 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alerta de normas de uso */}
      {showAlert && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 relative">
          <button
            onClick={() => setShowAlert(false)}
            className="absolute top-2 right-2 text-yellow-600 hover:text-yellow-700"
            aria-label="Cerrar alerta"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-yellow-600 mb-1">
                IMPORTANTE: Normas de la sección de dedicatorias
              </h3>
              <p className="text-sm text-yellow-600/90">
                <strong>Solo se permiten mensajes positivos y de apoyo.</strong> Las dedicatorias
                deben expresar cariño, admiración y respeto hacia los habitantes.
              </p>
              <p className="text-sm text-yellow-600/80 mt-2">
                Cualquier mensaje con sarcasmo, burla, ofensas, ataques a otros habitantes o equipos será
                <strong> eliminado inmediatamente</strong> y podría resultar en la
                <strong> restricción permanente</strong> del uso de la plataforma.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header con contador */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {totalCount > 0 ? (
            `${totalCount} dedicatoria${totalCount !== 1 ? 's' : ''} en total`
          ) : (
            'No hay dedicatorias aún'
          )}
        </p>
      </div>

      {dedications.length === 0 ? (
        <div className="bg-card rounded-xl p-8 border border-border/20 text-center">
          <div className="text-4xl mb-4">💌</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No hay dedicatorias aún
          </h3>
          <p className="text-muted-foreground">
            Sé el primero en escribirle algo bonito a este habitante
          </p>
        </div>
      ) : (
        <>
          {dedications.map((dedication) => (
            <DedicationCard
              key={dedication._id}
              dedication={dedication}
              onUpdate={handleDedicationUpdate}
            />
          ))}

          {/* Infinite scroll trigger + Manual button backup */}
          {hasMore && dedications.length > 0 && (
            <div className="text-center space-y-4">
              <div
                ref={loadMoreRef}
                className="h-1 w-full"
                style={{ backgroundColor: 'transparent' }}
              />

              {loadingMore ? (
                <div className="flex items-center justify-center space-x-2 py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="text-muted-foreground">
                    Cargando más dedicatorias...
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => fetchDedications(page + 1, false)}
                  disabled={loadingMore}
                  className="bg-muted text-foreground px-6 py-3 rounded-lg
                           hover:bg-muted/80 transition-colors disabled:opacity-50
                           disabled:cursor-not-allowed"
                >
                  Cargar más dedicatorias
                </button>
              )}
            </div>
          )}

          {!hasMore && dedications.length > 0 && (
            <div className="text-center py-4">
              <p className="text-muted-foreground text-sm">
                No hay más dedicatorias que mostrar
              </p>
            </div>
          )}
        </>
      )}

      {error && dedications.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-center">
          <p className="text-destructive text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-destructive hover:text-destructive/80 text-xs mt-2"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}