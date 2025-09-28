"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import TeamBadge from '@/components/TeamBadge';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface User {
  _id: string;
  name: string;
  email: string;
  image?: string;
  team?: 'DIA' | 'NOCHE' | 'ECLIPSE' | null;
}

interface Candidate {
  _id: string;
  name: string;
  photo?: string;
}

interface Report {
  reportedBy: {
    _id: string;
    name: string;
    email: string;
  };
  reason: string;
  customReason?: string;
  reportedAt: string;
}

interface Dedication {
  _id: string;
  content: string;
  userId: User;
  candidateId: Candidate;
  likes: any[];
  reports: Report[];
  isReported: boolean;
  isActive: boolean;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function DedicationsManager() {
  const [dedications, setDedications] = useState<Dedication[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'reported'>('all');
  const [selectedCandidate, setSelectedCandidate] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedDedication, setSelectedDedication] = useState<Dedication | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState('');

  useEffect(() => {
    fetchDedications();
  }, [filter, selectedCandidate, page]);

  const fetchDedications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        filter,
        page: page.toString(),
        limit: '20',
      });

      if (selectedCandidate !== 'all') {
        params.append('candidateId', selectedCandidate);
      }

      const response = await fetch(`/api/admin/dedications?${params}`);
      if (!response.ok) throw new Error('Error al cargar dedicatorias');

      const data = await response.json();
      setDedications(data.dedications);
      setCandidates(data.candidates);
      setHasMore(data.pagination.hasMore);
    } catch (error) {
      console.error('Error fetching dedications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (dedicationId: string) => {
    if (!deleteReason.trim()) {
      alert('Por favor especifica una razón para la eliminación');
      return;
    }

    setActionLoading(dedicationId);
    try {
      const response = await fetch(`/api/admin/dedications?id=${dedicationId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: deleteReason.trim() }),
      });

      if (!response.ok) throw new Error('Error al eliminar');

      // Remover de la lista local
      setDedications(prev => prev.filter(d => d._id !== dedicationId));
      setShowDeleteModal(null);
      setDeleteReason('');
      alert('Dedicatoria eliminada y notificaciones enviadas');
    } catch (error) {
      console.error('Error deleting dedication:', error);
      alert('Error al eliminar la dedicatoria');
    } finally {
      setActionLoading(null);
    }
  };

  const handleModerate = async (dedicationId: string, action: 'approve' | 'ignore') => {
    setActionLoading(dedicationId);
    try {
      const response = await fetch('/api/admin/dedications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dedicationId,
          action,
        }),
      });

      if (!response.ok) throw new Error('Error al moderar');

      const data = await response.json();
      alert(data.message);

      // Actualizar la dedicatoria específica en la lista local
      if (action === 'ignore') {
        setDedications(prev => prev.map(d =>
          d._id === dedicationId
            ? {
                ...d,
                isReported: false,
                reports: []
              }
            : d
        ));
      }

      // También refrescar desde el servidor
      fetchDedications();
    } catch (error) {
      console.error('Error moderating:', error);
      alert('Error al moderar la dedicatoria');
    } finally {
      setActionLoading(null);
    }
  };

  const getReasonLabel = (reason: string) => {
    const labels: { [key: string]: string } = {
      offensive: 'Contenido ofensivo',
      spam: 'Spam',
      inappropriate: 'Contenido inapropiado',
      other: 'Otro',
    };
    return labels[reason] || reason;
  };

  const handleFilterChange = (newFilter: 'all' | 'reported') => {
    setFilter(newFilter);
    setPage(1);
  };

  const handleCandidateChange = (candidateId: string) => {
    setSelectedCandidate(candidateId);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Gestión de Dedicatorias
        </h3>
        <p className="text-muted-foreground">
          Administra todas las dedicatorias y reportes
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Tabs */}
        <div className="flex space-x-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Todas ({dedications.length})
          </button>
          <button
            onClick={() => handleFilterChange('reported')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'reported'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            ⚠️ Reportadas
          </button>
        </div>

        {/* Filtro por candidato */}
        <select
          value={selectedCandidate}
          onChange={(e) => handleCandidateChange(e.target.value)}
          className="bg-background border border-border rounded-lg px-4 py-2 text-foreground"
        >
          <option value="all">Todos los habitantes</option>
          {candidates.map((candidate) => (
            <option key={candidate._id} value={candidate._id}>
              {candidate.name}
            </option>
          ))}
        </select>
      </div>

      {/* Lista de dedicatorias */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : dedications.length === 0 ? (
        <div className="bg-card rounded-lg p-8 text-center">
          <div className="text-4xl mb-4">📝</div>
          <p className="text-muted-foreground">
            No hay dedicatorias {filter === 'reported' ? 'reportadas' : ''}
            {selectedCandidate !== 'all' ? ' para este habitante' : ''}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {dedications.map((dedication) => (
            <div
              key={dedication._id}
              className="bg-card rounded-lg border border-border/20 p-4"
            >
              {/* Header con info del usuario y candidato */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {/* Avatar del usuario */}
                  <div className="relative w-10 h-10 rounded-full overflow-hidden">
                    {dedication.userId.image ? (
                      <Image
                        src={dedication.userId.image}
                        alt={dedication.userId.name}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10
                                    flex items-center justify-center">
                        <span className="text-sm text-primary/70">
                          {dedication.userId.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info del usuario */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {dedication.userId.name}
                      </span>
                      {dedication.userId.team && (
                        <TeamBadge team={dedication.userId.team} size={1} />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {dedication.userId.email}
                    </p>
                  </div>
                </div>

                {/* Info del destinatario y fecha */}
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">
                    Para: {dedication.candidateId.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(dedication.createdAt), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </p>
                </div>
              </div>

              {/* Contenido */}
              <div className="bg-muted/50 rounded-lg p-3 mb-3">
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {dedication.content}
                </p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
                <span>❤️ {dedication.likes.length} likes</span>
                {dedication.isReported && (
                  <span className="text-yellow-500">
                    ⚠️ {dedication.reports.length} reportes
                  </span>
                )}
              </div>

              {/* Reportes (si los hay) */}
              {dedication.reports.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-3">
                  <p className="text-sm font-medium text-yellow-600 mb-2">
                    Reportes:
                  </p>
                  <div className="space-y-1">
                    {dedication.reports.slice(0, 2).map((report, idx) => (
                      <div key={idx} className="text-xs text-muted-foreground">
                        <span className="font-medium">{report.reportedBy.name}:</span>{' '}
                        {getReasonLabel(report.reason)}
                        {report.customReason && ` - "${report.customReason}"`}
                      </div>
                    ))}
                    {dedication.reports.length > 2 && (
                      <button
                        onClick={() => setSelectedDedication(dedication)}
                        className="text-xs text-yellow-600 hover:underline"
                      >
                        Ver todos ({dedication.reports.length})
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Acciones */}
              <div className="flex flex-wrap gap-2">
                {dedication.isReported && (
                  <button
                    onClick={() => handleModerate(dedication._id, 'ignore')}
                    disabled={actionLoading === dedication._id}
                    className="bg-gray-500 text-white px-3 py-1.5 rounded-lg text-sm
                             hover:bg-gray-600 transition-colors disabled:opacity-50"
                  >
                    🚫 Ignorar reportes
                  </button>
                )}
                <button
                  onClick={() => setShowDeleteModal(dedication._id)}
                  disabled={actionLoading === dedication._id}
                  className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm
                           hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paginación */}
      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={() => setPage(prev => prev + 1)}
            className="bg-muted text-foreground px-6 py-2 rounded-lg
                     hover:bg-muted/80 transition-colors"
          >
            Cargar más
          </button>
        </div>
      )}

      {/* Modal de reportes detallados */}
      {selectedDedication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedDedication(null)}
          />
          <div className="relative bg-card rounded-xl border border-border/20 max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Todos los reportes ({selectedDedication.reports.length})
              </h3>
              <button
                onClick={() => setSelectedDedication(null)}
                className="text-muted-foreground hover:text-foreground"
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
            </div>

            <div className="space-y-3">
              {selectedDedication.reports.map((report, idx) => (
                <div
                  key={idx}
                  className="bg-muted/50 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-foreground">
                        {report.reportedBy.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {report.reportedBy.email}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(report.reportedAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                  </div>
                  <p className="text-sm">
                    <span className="font-medium">Razón:</span>{' '}
                    {getReasonLabel(report.reason)}
                  </p>
                  {report.customReason && (
                    <p className="text-sm mt-1 text-muted-foreground">
                      &quot;{report.customReason}&quot;
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal de eliminación con razón */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(null)}
          />
          <div className="relative bg-card rounded-xl border border-border/20 max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Eliminar Dedicatoria
              </h3>
              <button
                onClick={() => setShowDeleteModal(null)}
                className="text-muted-foreground hover:text-foreground"
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
            </div>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Esta acción eliminará permanentemente la dedicatoria. Se notificará al autor
                y a quienes la reportaron. Especifica una razón:
              </p>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Razón de la eliminación *
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Ej: Contenido inapropiado, violación de normas, spam, etc."
                  className="w-full px-3 py-2 bg-background rounded-lg border border-border/50
                           focus:outline-none focus:border-primary resize-none
                           text-foreground placeholder:text-muted-foreground"
                  rows={3}
                  maxLength={200}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {deleteReason.length}/200 caracteres
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="flex-1 bg-muted text-foreground px-4 py-2 rounded-lg
                           hover:bg-muted/80 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(showDeleteModal)}
                  disabled={!deleteReason.trim() || actionLoading === showDeleteModal}
                  className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg
                           hover:bg-red-600 transition-colors disabled:opacity-50
                           disabled:cursor-not-allowed"
                >
                  {actionLoading === showDeleteModal ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}