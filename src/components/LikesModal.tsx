"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import TeamBadge from '@/components/TeamBadge';

interface User {
  _id: string;
  name: string;
  image?: string;
  team?: 'DIA' | 'NOCHE' | 'ECLIPSE' | null;
}

interface Like {
  userId: string;
  likedAt: string;
  user: User;
}

interface Reaction {
  userId: string;
  type: string;
  reactedAt: string;
  user: User;
}

interface LikesModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  initialTab?: string;
}

export default function LikesModal({ isOpen, onClose, postId, initialTab = 'all' }: LikesModalProps) {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [reactionsByType, setReactionsByType] = useState<Record<string, Reaction[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  useEffect(() => {
    if (isOpen && postId) {
      fetchReactions();
    }
  }, [isOpen, postId]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const fetchReactions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/posts/${postId}/likes`);

      if (!response.ok) {
        throw new Error('Error al cargar las reacciones');
      }

      const data = await response.json();
      setReactions(data.reactions || []);
      setReactionsByType(data.reactionsByType || {});
    } catch (err: any) {
      console.error('Error fetching reactions:', err);
      setError(err.message || 'Error al cargar las reacciones');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'ahora';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}min`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  // Obtener datos para mostrar según tab activo
  const getCurrentTabData = () => {
    if (activeTab === 'all') {
      return reactions;
    }
    return reactionsByType[activeTab] || [];
  };

  const getReactionEmoji = (type: string) => {
    const emojis: Record<string, string> = {
      like: '❤️',
      laugh: '😂',
      angry: '😠',
      wow: '😮',
      sad: '😢',
      poop: '💩'
    };
    return emojis[type] || '❤️';
  };

  const getReactionLabel = (type: string) => {
    const labels: Record<string, string> = {
      like: 'Me gusta',
      laugh: 'Me divierte',
      angry: 'Me enoja',
      wow: 'Me asombra',
      sad: 'Me entristece',
      poop: 'Caca'
    };
    return labels[type] || 'Reacción';
  };

  if (!isOpen) return null;

  const totalReactions = reactions.length;
  const currentTabData = getCurrentTabData();

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-card border border-border/40 rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/20">
            <h3 className="text-lg font-semibold text-foreground">
              Reacciones ({totalReactions})
            </h3>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted/50 rounded-lg"
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          {totalReactions > 0 && (
            <div className="flex items-center space-x-1 p-2 border-b border-border/20 overflow-x-auto">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                }`}
              >
                <span>Todas {totalReactions}</span>
              </button>

              {Object.entries(reactionsByType).map(([type, typeReactions]) => (
                <button
                  key={type}
                  onClick={() => setActiveTab(type)}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap ${
                    activeTab === type
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                  }`}
                >
                  <span>{getReactionEmoji(type)}</span>
                  <span>{typeReactions.length}</span>
                </button>
              ))}

            </div>
          )}

          {/* Content */}
          <div className="overflow-y-auto max-h-[60vh]">
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando...</p>
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <div className="text-4xl mb-4">⚠️</div>
                <p className="text-destructive mb-4">{error}</p>
                <button
                  onClick={fetchReactions}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Reintentar
                </button>
              </div>
            ) : totalReactions === 0 ? (
              <div className="p-6 text-center">
                <div className="text-4xl mb-4">😊</div>
                <p className="text-muted-foreground">Aún no hay reacciones</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {currentTabData.map((reaction: Reaction) => (
                  <div key={`${reaction.userId}-${reaction.type}`} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                      {reaction.user.image ? (
                        <Image
                          src={reaction.user.image}
                          alt={reaction.user.name}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm font-medium">
                          {reaction.user.name[0]}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate flex items-center gap-1">
                        {reaction.user.name} <TeamBadge team={reaction.user.team} />
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(reaction.reactedAt)}
                      </p>
                    </div>

                    <div className="text-lg">
                      {getReactionEmoji(reaction.type)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 