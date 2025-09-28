"use client";
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import TeamBadge from './TeamBadge';
import ReportModal from './ReportModal';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { sanitizeContent } from '@/lib/security';

interface DedicationUser {
  _id: string;
  name: string;
  image?: string;
  team?: 'DIA' | 'NOCHE' | 'ECLIPSE' | null;
}

interface DedicationData {
  _id: string;
  userId: DedicationUser;
  content: string;
  likesCount: number;
  userHasLiked: boolean;
  createdAt: string;
}

interface DedicationCardProps {
  dedication: DedicationData;
  onUpdate: (dedicationId: string, updates: any) => void;
}

export default function DedicationCard({
  dedication,
  onUpdate,
}: DedicationCardProps) {
  const { data: session } = useSession();
  const [isLiking, setIsLiking] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(dedication.content);
  const [isSaving, setIsSaving] = useState(false);

  const isOwner = session?.user && (session.user as any).id === dedication.userId._id;
  const isAdmin = (session?.user as any)?.isAdmin || false;
  const canDelete = isOwner; // Solo el propietario puede borrar en la vista pública

  const handleLike = async () => {
    if (!session || isLiking) return;

    setIsLiking(true);
    try {
      const response = await fetch(`/api/dedications/${dedication._id}/like`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Error al dar like');

      const data = await response.json();

      onUpdate(dedication._id, {
        userHasLiked: data.liked,
        likesCount: data.likesCount,
      });
    } catch (error) {
      console.error('Error handling like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta dedicatoria?')) {
      return;
    }

    try {
      const response = await fetch(`/api/dedications?id=${dedication._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar');

      // Hide the dedication from the feed
      onUpdate(dedication._id, { isActive: false });
    } catch (error) {
      console.error('Error deleting dedication:', error);
      alert('Error al eliminar la dedicatoria');
    } finally {
      setShowMenu(false);
    }
  };

  const handleReportSubmit = async (reason: string, customReason?: string) => {
    try {
      const response = await fetch(`/api/dedications/${dedication._id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, customReason }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al reportar');
      }

      alert('Reporte enviado exitosamente. El equipo de moderación lo revisará.');
      setShowReportModal(false);
    } catch (error: any) {
      alert(error.message || 'Error al enviar el reporte');
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(dedication.content);
    setShowMenu(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(dedication.content);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      alert('El contenido no puede estar vacío');
      return;
    }

    if (editContent.trim().length < 20) {
      alert('La dedicatoria debe tener al menos 20 caracteres');
      return;
    }

    if (editContent.trim() === dedication.content) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/dedications/${dedication._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al editar');
      }

      onUpdate(dedication._id, { content: editContent.trim() });
      setIsEditing(false);
    } catch (error: any) {
      alert(error.message || 'Error al guardar los cambios');
    } finally {
      setIsSaving(false);
    }
  };

  if ('isActive' in dedication && !dedication.isActive) {
    return null;
  }

  return (
    <div className="bg-card rounded-xl border border-border/20 p-4 sm:p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2 sm:space-x-3 flex-1">
          {/* Avatar */}
          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-border/50">
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
                  {dedication.userId.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2">
              <span className="font-medium text-sm sm:text-base text-foreground">
                {dedication.userId.name}
              </span>
              {dedication.userId.team && (
                <TeamBadge team={dedication.userId.team} size={1} />
              )}
              <span className="text-xs sm:text-sm text-muted-foreground">
                · {formatDistanceToNow(new Date(dedication.createdAt), {
                  addSuffix: true,
                  locale: es,
                })}
              </span>
            </div>

            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 bg-background rounded-lg border border-border/50
                           focus:outline-none focus:border-primary resize-none
                           text-foreground placeholder:text-muted-foreground text-sm sm:text-base"
                  rows={4}
                  maxLength={2000}
                  placeholder="Edita tu dedicatoria..."
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    {editContent.length}/2000 caracteres
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="text-xs bg-muted text-foreground px-3 py-1 rounded
                               hover:bg-muted/80 transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={isSaving || !editContent.trim() || editContent.trim().length < 20 || editContent.length > 2000}
                      className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded
                               hover:bg-primary/90 transition-colors disabled:opacity-50
                               disabled:cursor-not-allowed"
                    >
                      {isSaving ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm sm:text-base text-foreground whitespace-pre-wrap break-words">
                {sanitizeContent(dedication.content)}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 sm:gap-4 mt-3 sm:mt-4">
              {/* Like button */}
              <button
                onClick={handleLike}
                disabled={!session || isLiking}
                className={`flex items-center space-x-1 sm:space-x-2 transition-colors
                         ${dedication.userHasLiked
                           ? 'text-red-500'
                           : 'text-muted-foreground hover:text-red-500'
                         } disabled:cursor-not-allowed`}
              >
                <span className="text-xl">
                  {dedication.userHasLiked ? '❤️' : '🤍'}
                </span>
                <span className="text-xs sm:text-sm font-medium">
                  {dedication.likesCount > 0 ? dedication.likesCount : ''}
                </span>
                <span className="text-xs sm:text-sm font-medium">
                  Like
                </span>
              </button>

              {/* Report button */}
              {session && !isOwner && (
                <button
                  onClick={() => setShowReportModal(true)}
                  className="flex items-center space-x-1 text-muted-foreground hover:text-yellow-500 transition-colors"
                  title="Reportar contenido inapropiado"
                >
                  <span className="text-lg">⚠️</span>
                  <span className="text-xs sm:text-sm font-medium">
                    Reportar
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Menu for owner/admin */}
        {canDelete && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-card rounded-lg shadow-lg
                              border border-border/20 py-1 z-20">
                  {isOwner && (
                    <button
                      onClick={handleEdit}
                      className="w-full text-left px-4 py-2 text-sm text-foreground
                               hover:bg-muted/10 transition-colors"
                    >
                      ✏️ Editar dedicatoria
                    </button>
                  )}
                  <button
                    onClick={handleDelete}
                    className="w-full text-left px-4 py-2 text-sm text-destructive
                             hover:bg-destructive/10 transition-colors"
                  >
                    🗑️ Eliminar dedicatoria
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          onClose={() => setShowReportModal(false)}
          onSubmit={handleReportSubmit}
        />
      )}
    </div>
  );
}