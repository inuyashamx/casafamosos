"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import TeamBadge from '@/components/TeamBadge';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

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

interface DedicationReport {
  _id: string;
  content: string;
  user: {
    _id: string;
    name: string;
    email: string;
    image?: string;
    team?: 'DIA' | 'NOCHE' | 'ECLIPSE' | null;
  };
  candidate: {
    _id: string;
    name: string;
    photo?: string;
  };
  reports: Report[];
  reportsCount: number;
  createdAt: string;
  moderatedBy?: {
    name: string;
  };
  moderatedAt?: string;
  moderationNote?: string;
  isActive: boolean;
  isApproved: boolean;
}

export default function DedicationReports() {
  const [reports, setReports] = useState<DedicationReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'pending' | 'resolved'>('pending');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedReport, setSelectedReport] = useState<DedicationReport | null>(null);
  const [moderating, setModerating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchReports();
  }, [status, page, refreshKey]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status,
        page: page.toString(),
        limit: '10',
      });

      const response = await fetch(`/api/admin/reports?${params}`);
      if (!response.ok) throw new Error('Error al cargar reportes');

      const data = await response.json();
      setReports(data.reports);
      setHasMore(data.pagination.hasMore);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (
    dedicationId: string,
    action: 'approve' | 'remove' | 'ignore',
    note?: string
  ) => {
    setModerating(true);
    try {
      const response = await fetch('/api/admin/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dedicationId,
          action,
          note,
        }),
      });

      if (!response.ok) throw new Error('Error al moderar');

      const data = await response.json();
      alert(data.message);

      // Refresh the list
      setRefreshKey(prev => prev + 1);
      setSelectedReport(null);
    } catch (error) {
      console.error('Error moderating:', error);
      alert('Error al moderar la dedicatoria');
    } finally {
      setModerating(false);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Reportes de Dedicatorias
        </h3>
        <p className="text-muted-foreground">
          Revisa y modera las dedicatorias reportadas por la comunidad
        </p>
      </div>

      {/* Status Tabs */}
      <div className="flex space-x-1 bg-muted rounded-lg p-1 w-fit">
        <button
          onClick={() => {
            setStatus('pending');
            setPage(1);
          }}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            status === 'pending'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Pendientes
        </button>
        <button
          onClick={() => {
            setStatus('resolved');
            setPage(1);
          }}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            status === 'resolved'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Resueltos
        </button>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-card rounded-lg p-8 text-center">
          <div className="text-4xl mb-4">✅</div>
          <p className="text-muted-foreground">
            No hay reportes {status === 'pending' ? 'pendientes' : 'resueltos'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report._id}
              className="bg-card rounded-lg border border-border/20 p-6"
            >
              {/* Report Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden">
                    {report.user.image ? (
                      <Image
                        src={report.user.image}
                        alt={report.user.name}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10
                                    flex items-center justify-center">
                        <span className="text-sm text-primary/70">
                          {report.user.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {report.user.name}
                      </span>
                      {report.user.team && (
                        <TeamBadge team={report.user.team} size={1} />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {report.user.email}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    Para: <span className="font-medium">{report.candidate.name}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(report.createdAt), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="bg-muted/50 rounded-lg p-4 mb-4">
                <p className="text-foreground whitespace-pre-wrap">
                  {report.content}
                </p>
              </div>

              {/* Reports Summary */}
              <div className="mb-4">
                <p className="text-sm font-medium text-foreground mb-2">
                  Reportes ({report.reportsCount}):
                </p>
                <div className="space-y-2">
                  {report.reports.slice(0, 3).map((r, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between text-sm"
                    >
                      <div>
                        <span className="text-muted-foreground">
                          {r.reportedBy.name}:
                        </span>{' '}
                        <span className="text-foreground">
                          {getReasonLabel(r.reason)}
                        </span>
                        {r.customReason && (
                          <p className="text-xs text-muted-foreground mt-1">
                            &quot;{r.customReason}&quot;
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(r.reportedAt), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                    </div>
                  ))}
                  {report.reports.length > 3 && (
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="text-sm text-primary hover:underline"
                    >
                      Ver todos los reportes ({report.reports.length})
                    </button>
                  )}
                </div>
              </div>

              {/* Moderation Info (if resolved) */}
              {report.moderatedAt && (
                <div className="bg-muted/30 rounded-lg p-3 mb-4">
                  <p className="text-sm text-muted-foreground">
                    Moderado por{' '}
                    <span className="font-medium">
                      {report.moderatedBy?.name}
                    </span>{' '}
                    {formatDistanceToNow(new Date(report.moderatedAt), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </p>
                  {report.moderationNote && (
                    <p className="text-sm text-foreground mt-1">
                      Nota: {report.moderationNote}
                    </p>
                  )}
                  <p className="text-sm mt-2">
                    Estado:{' '}
                    <span
                      className={`font-medium ${
                        report.isActive ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {report.isActive ? 'Activa' : 'Eliminada'}
                    </span>
                  </p>
                </div>
              )}

              {/* Actions (if pending) */}
              {status === 'pending' && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      handleModerate(report._id, 'approve', 'Contenido apropiado')
                    }
                    disabled={moderating}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm
                             hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    ✅ Aprobar
                  </button>
                  <button
                    onClick={() =>
                      handleModerate(report._id, 'remove', 'Contenido inapropiado')
                    }
                    disabled={moderating}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm
                             hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    🗑️ Eliminar
                  </button>
                  <button
                    onClick={() =>
                      handleModerate(report._id, 'ignore', 'Reportes infundados')
                    }
                    disabled={moderating}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg text-sm
                             hover:bg-gray-600 transition-colors disabled:opacity-50"
                  >
                    🚫 Ignorar reportes
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
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

      {/* Modal for viewing all reports */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedReport(null)}
          />
          <div className="relative bg-card rounded-xl border border-border/20 max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Todos los reportes ({selectedReport.reports.length})
              </h3>
              <button
                onClick={() => setSelectedReport(null)}
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
              {selectedReport.reports.map((r, idx) => (
                <div
                  key={idx}
                  className="bg-muted/50 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-foreground">
                        {r.reportedBy.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {r.reportedBy.email}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(r.reportedAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                  </div>
                  <p className="text-sm">
                    <span className="font-medium">Razón:</span>{' '}
                    {getReasonLabel(r.reason)}
                  </p>
                  {r.customReason && (
                    <p className="text-sm mt-1 text-muted-foreground">
                      &quot;{r.customReason}&quot;
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}