"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import UserVoteHistoryModal from '@/components/UserVoteHistoryModal';

interface Vote {
  _id: string;
  userId: {
    _id: string;
    name: string;
  };
  candidateId: {
    _id: string;
    name: string;
  };
  points: number;
  voteDate: string;
}

interface VotesResponse {
  votes: Vote[];
  hasMore: boolean;
  total: number;
}

interface VotesHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  filteredCandidateId?: string;
  filteredCandidateName?: string;
}

export default function VotesHistoryModal({
  isOpen,
  onClose,
  filteredCandidateId,
  filteredCandidateName
}: VotesHistoryModalProps) {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<string>('');
  const [candidates, setCandidates] = useState<{ _id: string; name: string }[]>([]);

  // Modal states para historial de usuario
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  // Ref para controlar llamadas concurrentes
  const loadingRef = useRef(false);

  // Función para formatear tiempo relativo
  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);

    if (seconds < 60) return `hace ${seconds} segundo${seconds !== 1 ? 's' : ''}`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `hace ${minutes} minuto${minutes !== 1 ? 's' : ''}`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `hace ${hours} hora${hours !== 1 ? 's' : ''}`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `hace ${days} día${days !== 1 ? 's' : ''}`;

    const weeks = Math.floor(days / 7);
    return `hace ${weeks} semana${weeks !== 1 ? 's' : ''}`;
  };

  // Función para cargar votos
  const loadVotes = useCallback(async (pageNumber: number, candidateId?: string) => {
    // Prevenir llamadas múltiples usando ref
    if (loadingRef.current) return;

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      let url = `/api/public/votes?page=${pageNumber}&limit=50`;
      if (candidateId) {
        url += `&candidateId=${candidateId}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Error al cargar los votos');
      }

      const data: VotesResponse = await response.json();

      if (pageNumber === 0) {
        setVotes(data.votes);
      } else {
        setVotes(prev => [...prev, ...data.votes]);
      }

      setHasMore(data.hasMore);
      setPage(pageNumber);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  // Cargar lista de candidatos
  useEffect(() => {
    if (!isOpen) return;

    const fetchCandidates = async () => {
      try {
        const response = await fetch('/api/public/vote');
        if (response.ok) {
          const data = await response.json();
          if (data.nominees) {
            setCandidates(data.nominees.map((n: any) => ({ _id: n.id, name: n.name })));
          }
        }
      } catch (err) {
        console.error('Error loading candidates:', err);
      }
    };
    fetchCandidates();
  }, [isOpen]);

  // Establecer filtro inicial si viene un candidato específico
  useEffect(() => {
    if (isOpen && filteredCandidateId) {
      setSelectedCandidate(filteredCandidateId);
    } else if (isOpen && !filteredCandidateId) {
      setSelectedCandidate('');
    }
  }, [isOpen, filteredCandidateId]);

  // Cargar votos cuando cambia el filtro o se abre el modal
  useEffect(() => {
    if (!isOpen) {
      // Reset ref cuando se cierra el modal
      loadingRef.current = false;
      return;
    }

    setPage(0);
    setVotes([]);

    // Usar timeout para evitar llamadas múltiples rápidas
    const timeoutId = setTimeout(() => {
      loadVotes(0, selectedCandidate);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [isOpen, selectedCandidate]);

  // Manejar click en usuario
  const handleUserClick = (userId: string, userName: string) => {
    setSelectedUser({ id: userId, name: userName });
    setShowUserModal(true);
  };

  // Manejar carga de más votos
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadVotes(page + 1, selectedCandidate);
    }
  };

  // Manejar cambio de filtro
  const handleCandidateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCandidate(e.target.value);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-background border border-border rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">
                {filteredCandidateName ? `Votos para ${filteredCandidateName}` : 'Historial de Votos'}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                {filteredCandidateName
                  ? `Todos los votos recibidos por ${filteredCandidateName}`
                  : 'Lista completa de todos los votos emitidos en tiempo real'
                }
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors text-xl leading-none"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Filtro de candidatos - Solo mostrar si no hay filtro específico */}
            {!filteredCandidateId && (
              <div className="mb-6">
                <select
                  value={selectedCandidate}
                  onChange={handleCandidateChange}
                  className="w-full md:w-auto px-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Todos los candidatos</option>
                  {candidates.map((candidate) => (
                    <option key={candidate._id} value={candidate._id}>
                      {candidate.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
                {error}
              </div>
            )}

            {/* Lista de votos */}
            <div className="space-y-3">
              {votes.map((vote) => (
                <div
                  key={vote._id}
                  className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col space-y-1">
                    <button
                      onClick={() => handleUserClick(vote.userId._id, vote.userId.name)}
                      className="text-left hover:text-primary transition-colors font-medium truncate cursor-pointer"
                      style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}
                    >
                      {vote.userId.name}
                    </button>
                    <div className="text-sm text-muted-foreground">
                      votó <span className="font-semibold text-foreground">{vote.points} punto{vote.points !== 1 ? 's' : ''}</span> por{' '}
                      <span className="font-semibold text-foreground">{vote.candidateId.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span>{formatTimeAgo(vote.voteDate)}</span>
                      <span>•</span>
                      <button
                        onClick={() => handleUserClick(vote.userId._id, vote.userId.name)}
                        className="text-primary hover:underline"
                      >
                        Ver todos sus votos
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Loading inicial */}
            {loading && votes.length === 0 && (
              <div className="flex justify-center py-12">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="mt-2 text-muted-foreground">Cargando votos...</p>
                </div>
              </div>
            )}

            {/* No hay votos */}
            {!loading && votes.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No hay votos registrados aún</p>
              </div>
            )}

            {/* Botón cargar más */}
            {hasMore && votes.length > 0 && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      Cargando...
                    </span>
                  ) : (
                    'Cargar más'
                  )}
                </button>
              </div>
            )}

            {/* No hay más votos */}
            {!hasMore && votes.length > 0 && (
              <div className="mt-8 text-center text-muted-foreground">
                No hay más votos para mostrar
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de historial de usuario */}
      {showUserModal && selectedUser && (
        <UserVoteHistoryModal
          userId={selectedUser.id}
          userName={selectedUser.name}
          isOpen={showUserModal}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </>
  );
}