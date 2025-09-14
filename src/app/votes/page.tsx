"use client";
import { useState, useEffect, useCallback } from 'react';
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

export default function VotesPage() {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<string>('');
  const [candidates, setCandidates] = useState<{ _id: string; name: string }[]>([]);

  // Modal states
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);
  const [showModal, setShowModal] = useState(false);

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
    if (loading) return;

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
    }
  }, [loading]);

  // Cargar lista de candidatos
  useEffect(() => {
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
  }, []);

  // Cargar votos cuando cambia el filtro
  useEffect(() => {
    setPage(0);
    setVotes([]);
    loadVotes(0, selectedCandidate);
  }, [selectedCandidate]);

  // Manejar click en usuario
  const handleUserClick = (userId: string, userName: string) => {
    setSelectedUser({ id: userId, name: userName });
    setShowModal(true);
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

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Top Toolbar */}
      <div className="fixed top-0 left-0 right-0 bg-black border-b border-gray-700 z-30">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <img
            src="/favicon.ico"
            alt="Logo"
            className="w-8 h-8 rounded-lg flex-shrink-0"
          />

          {/* Navigation Icons */}
          <div className="flex items-center space-x-6 flex-1 justify-center">
            <button
              onClick={() => window.location.href = '/'}
              className="text-white hover:text-primary transition-colors p-2"
              title="Inicio"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
            </button>
            <button
              onClick={() => window.location.href = '/votes'}
              className="text-primary transition-colors p-2"
              title="Ver Votos"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
            </button>
            <button
              onClick={() => window.location.href = '/muro'}
              className="text-white hover:text-primary transition-colors p-2"
              title="Muro"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </button>
            <button
              onClick={() => window.location.href = '/ranking'}
              className="text-white hover:text-primary transition-colors p-2"
              title="Ranking"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 14H5v5h2v-5zm3-7H8v12h2V7zm3 3h-2v9h2v-9zm3-6h-2v15h2V4z"/>
              </svg>
            </button>
            <button
              onClick={() => window.location.href = '/global'}
              className="text-white hover:text-primary transition-colors p-2"
              title="Global"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </button>
          </div>

          {/* Spacer for balance */}
          <div className="w-8 h-8 flex-shrink-0"></div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-20 pb-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Votaciones Públicas</h1>
          <p className="text-muted-foreground">
            Lista completa de todos los votos emitidos en tiempo real
          </p>
        </div>

        {/* Filtro de candidatos */}
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

      {/* Modal de historial de usuario */}
      {showModal && selectedUser && (
        <UserVoteHistoryModal
          userId={selectedUser.id}
          userName={selectedUser.name}
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}