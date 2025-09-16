"use client";
import { useState, useEffect } from 'react';

interface VoteDetail {
  candidateId: string;
  candidateName: string;
  points: number;
  voteDate: string;
}

interface WeekHistory {
  _id: {
    weekId: string;
    weekNumber: number;
    weekName: string;
  };
  votes: VoteDetail[];
  totalPoints: number;
  voteCount: number;
  firstVoteDate: string;
  lastVoteDate: string;
}

interface UserHistory {
  weeks: WeekHistory[];
  totalStats: {
    totalVotes: number;
    totalPoints: number;
    firstVote: string | null;
    lastVote: string | null;
  };
}

interface UserVoteHistoryModalProps {
  userId: string;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
  weekId?: string;
}

export default function UserVoteHistoryModal({
  userId,
  userName,
  isOpen,
  onClose,
  weekId
}: UserVoteHistoryModalProps) {
  const [history, setHistory] = useState<UserHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserHistory();
    }
  }, [isOpen, userId, weekId]);

  const fetchUserHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      let url = `/api/public/votes/user/${userId}`;
      if (weekId) {
        url += `?weekId=${weekId}`;
      }
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Error al cargar el historial');
      }

      const data: UserHistory = await response.json();
      setHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
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
        <div className="bg-background border border-border rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-border flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-bold break-words pr-4">{userName}</h2>
              {history && (
                <p className="text-sm text-muted-foreground mt-1">
                  Total histórico: <span className="font-semibold text-foreground">{history.totalStats.totalPoints} puntos</span> en {history.totalStats.totalVotes} votos
                </p>
              )}
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
            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-2 text-muted-foreground">Cargando historial...</p>
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-destructive mb-4">{error}</p>
                <button
                  onClick={fetchUserHistory}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  Reintentar
                </button>
              </div>
            )}

            {!loading && !error && history && (
              <div className="space-y-6">
                {history.weeks.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No hay votos registrados para este usuario
                  </p>
                ) : (
                  history.weeks.map((week) => (
                    <div key={week._id.weekId} className="border border-border rounded-lg p-4">
                      <div className="mb-3">
                        <h3 className="font-semibold">
                          {week._id.weekName || `Semana ${week._id.weekNumber}`}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Total: {week.totalPoints} puntos en {week.voteCount} voto{week.voteCount !== 1 ? 's' : ''}
                        </p>
                      </div>

                      <div className="space-y-2">
                        {/* Agrupar votos por fecha cercana (misma transacción) */}
                        {(() => {
                          const groupedVotes: { [key: string]: VoteDetail[] } = {};

                          week.votes.forEach(vote => {
                            const voteTime = new Date(vote.voteDate).getTime();
                            let grouped = false;

                            // Buscar si hay un grupo existente dentro de 10 segundos
                            for (const key in groupedVotes) {
                              const keyTime = parseInt(key);
                              if (Math.abs(voteTime - keyTime) <= 10000) {
                                groupedVotes[key].push(vote);
                                grouped = true;
                                break;
                              }
                            }

                            // Si no se agrupó, crear nuevo grupo
                            if (!grouped) {
                              groupedVotes[voteTime.toString()] = [vote];
                            }
                          });

                          // Ordenar grupos por fecha
                          const sortedGroups = Object.entries(groupedVotes).sort(
                            ([a], [b]) => parseInt(b) - parseInt(a)
                          );

                          return sortedGroups.map(([timestamp, votes]) => (
                            <div key={timestamp} className="pl-4 border-l-2 border-muted">
                              {votes.map((vote, idx) => (
                                <div key={`${vote.candidateId}-${idx}`} className="text-sm">
                                  • {vote.candidateName}: <span className="font-semibold">{vote.points} pts</span>
                                </div>
                              ))}
                              <div className="text-xs text-muted-foreground mt-1">
                                {formatDate(votes[0].voteDate)}
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}