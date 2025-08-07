"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import ImageCarousel from './ImageCarousel';
import ConfirmDialog from './ConfirmDialog';
import LikesModal from './LikesModal';

interface User {
  _id: string;
  name: string;
  email: string;
  image?: string;
}

interface MediaItem {
  type: 'image' | 'video';
  url: string;
  publicId: string;
  thumbnail?: string;
}

interface Link {
  url: string;
  title?: string;
  description?: string;
  image?: string;
}

interface Comment {
  _id: string;
  userId: User | null;
  content: string;
  media?: {
    type: 'image' | 'video';
    url: string;
    publicId: string;
    thumbnail?: string;
  };
  likes: Array<{ userId: string; likedAt: string }>;
  createdAt: string;
}

interface PostData {
  _id: string;
  userId: User;
  content: string;
  media: MediaItem[];
  links: Link[];
  likes: Array<{ userId: string; likedAt: string }>;
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

interface PostProps {
  post: PostData;
  onPostUpdate?: () => void;
}

export default function Post({ post, onPostUpdate }: PostProps) {
  const { data: session } = useSession();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [showCarousel, setShowCarousel] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [commentImage, setCommentImage] = useState<File | null>(null);
  const [commentImagePreview, setCommentImagePreview] = useState<string | null>(null);
  const [isUploadingCommentImage, setIsUploadingCommentImage] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [showCommentDeleteConfirm, setShowCommentDeleteConfirm] = useState<string | null>(null);
  const [commentMenuOpen, setCommentMenuOpen] = useState<string | null>(null);
  const [showLikesModal, setShowLikesModal] = useState(false);

  // Validar que post.userId existe antes de acceder a sus propiedades
  if (!post.userId) {
    return (
      <article className="bg-card rounded-xl p-6 border border-border/20 space-y-4">
        <div className="text-center text-muted-foreground">
          <p>Post no disponible - Usuario eliminado</p>
        </div>
      </article>
    );
  }

  const isOwner = session?.user && (session.user as any).id === post.userId._id;
  const isLiked = session?.user ? post.likes.some(like => like.userId === (session.user as any).id) : false;

  // Cerrar menús cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.comment-menu')) {
        setCommentMenuOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleLike = async () => {
    if (!session?.user || isLiking) return;

    setIsLiking(true);
    try {
      const method = isLiked ? 'DELETE' : 'POST';
      const response = await fetch(`/api/posts/${post._id}/like`, {
        method,
      });

      if (response.ok && onPostUpdate) {
        onPostUpdate();
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !session?.user || isSubmittingComment) return;

    setIsSubmittingComment(true);
    setIsUploadingCommentImage(true);
    
    try {
      let media = null;

      // Subir imagen si existe
      if (commentImage) {
        const formData = new FormData();
        formData.append('file', commentImage);
        formData.append('type', 'image');

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Error al subir imagen del comentario');
        }

        const uploadResult = await uploadResponse.json();
        media = {
          type: 'image' as const,
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
        };
      }

      const response = await fetch(`/api/posts/${post._id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment.trim(),
          media,
        }),
      });

      if (response.ok) {
        setNewComment('');
        setCommentImage(null);
        setCommentImagePreview(null);
        if (onPostUpdate) {
          onPostUpdate();
        }
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmittingComment(false);
      setIsUploadingCommentImage(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!session?.user) return;

    try {
      const response = await fetch(`/api/posts/${post._id}/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok && onPostUpdate) {
        onPostUpdate();
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!session?.user || !editCommentContent.trim()) return;

    try {
      const response = await fetch(`/api/posts/${post._id}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editCommentContent.trim(),
        }),
      });

      if (response.ok) {
        setEditingCommentId(null);
        setEditCommentContent('');
        setCommentMenuOpen(null);
        if (onPostUpdate) {
          onPostUpdate();
        }
      }
    } catch (error) {
      console.error('Error editing comment:', error);
    }
  };

  const startEditComment = (comment: Comment) => {
    setEditingCommentId(comment._id);
    setEditCommentContent(comment.content);
    setCommentMenuOpen(null);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditCommentContent('');
  };

  const handleCommentLike = async (commentId: string) => {
    if (!session?.user) return;

    try {
      const comment = post.comments.find(c => c._id === commentId);
      if (!comment) return;

      // Asegurar que comment.likes existe
      const likes = comment.likes || [];
      const isLiked = likes.some(like => like.userId === (session.user as any).id);
      const method = isLiked ? 'DELETE' : 'POST';

      const response = await fetch(`/api/posts/${post._id}/comments/${commentId}/like`, {
        method,
      });

      if (response.ok && onPostUpdate) {
        onPostUpdate();
      }
    } catch (error) {
      console.error('Error toggling comment like:', error);
    }
  };

  const handleCommentImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      alert('Solo se permiten imágenes');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no puede exceder 5MB');
      return;
    }

    setCommentImage(file);
    setCommentImagePreview(URL.createObjectURL(file));
  };

  const removeCommentImage = () => {
    if (commentImagePreview) {
      URL.revokeObjectURL(commentImagePreview);
    }
    setCommentImage(null);
    setCommentImagePreview(null);
  };

  const handleEditPost = async () => {
    if (!session?.user || !editContent.trim()) return;

    try {
      const response = await fetch(`/api/posts/${post._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editContent.trim(),
        }),
      });

      if (response.ok) {
        setIsEditing(false);
        setShowMenu(false);
        if (onPostUpdate) {
          onPostUpdate();
        }
      }
    } catch (error) {
      console.error('Error editing post:', error);
    }
  };

  const handleDeletePost = async () => {
    if (!session?.user) return;

    try {
      const response = await fetch(`/api/posts/${post._id}`, {
        method: 'DELETE',
      });

      if (response.ok && onPostUpdate) {
        onPostUpdate();
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const renderContent = (content: string) => {
    // Detectar URLs y convertirlas en links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return content.split(urlRegex).map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <article className="bg-card rounded-xl p-6 border border-border/20 space-y-4">
      {/* Header */}
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
          {post.userId.image ? (
            <Image
              src={post.userId.image}
              alt={post.userId.name}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm font-medium">
              {post.userId.name[0]}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-foreground truncate">
                {post.userId.name}
              </h3>
              <span className="text-muted-foreground text-sm">
                {formatDate(post.createdAt)}
              </span>
            </div>
            
            {/* Menu de 3 puntos para el owner */}
            {isOwner && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <span className="text-lg">⋯</span>
                </button>
                
                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 mt-1 w-32 bg-card border border-border/40 rounded-lg shadow-lg z-20">
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setShowMenu(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted/30 transition-colors rounded-t-lg"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(true);
                          setShowMenu(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors rounded-b-lg"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full p-3 bg-background border border-border/40 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
            rows={3}
            maxLength={2000}
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setIsEditing(false);
                setEditContent(post.content);
              }}
              className="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleEditPost}
              disabled={!editContent.trim()}
              className="px-4 py-1 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              Guardar
            </button>
          </div>
        </div>
      ) : (
        <div className="text-foreground leading-relaxed whitespace-pre-wrap">
          {renderContent(post.content)}
        </div>
      )}

      {/* Media */}
      {post.media.length > 0 && (
        <div className="space-y-2 post-media-container">
          {post.media.length === 1 ? (
            // Una sola imagen/video
            <div className="rounded-lg overflow-hidden bg-muted cursor-pointer max-w-full" onClick={() => setShowCarousel(true)}>
              {post.media[0].type === 'image' ? (
                <img
                  src={post.media[0].url}
                  alt="Media"
                  className="w-full h-auto object-cover max-h-96 max-w-full hover:opacity-95 transition-opacity"
                  style={{ maxWidth: '100%' }}
                />
              ) : (
                <video
                  src={post.media[0].url}
                  controls
                  poster={post.media[0].thumbnail}
                  className="w-full h-auto object-cover max-h-96 max-w-full"
                  style={{ maxWidth: '100%' }}
                >
                  Tu navegador no soporta video.
                </video>
              )}
            </div>
          ) : post.media.length === 2 ? (
            // Dos imágenes/videos
            <div className="grid grid-cols-2 gap-2 max-w-full">
              {post.media.map((item, index) => (
                <div key={index} className="rounded-lg overflow-hidden bg-muted cursor-pointer max-w-full" onClick={() => setShowCarousel(true)}>
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt="Media"
                      className="w-full h-32 sm:h-48 object-cover hover:opacity-95 transition-opacity max-w-full"
                      style={{ maxWidth: '100%' }}
                    />
                  ) : (
                    <div className="relative">
                      <video
                        src={item.url}
                        className="w-full h-32 sm:h-48 object-cover max-w-full"
                        style={{ maxWidth: '100%' }}
                        muted
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <span className="text-white text-lg">▶️</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : post.media.length === 3 ? (
            // Tres imágenes/videos
            <div className="grid grid-cols-2 gap-2 max-w-full">
              <div className="row-span-2 rounded-lg overflow-hidden bg-muted cursor-pointer max-w-full" onClick={() => setShowCarousel(true)}>
                {post.media[0].type === 'image' ? (
                  <img
                    src={post.media[0].url}
                    alt="Media"
                    className="w-full h-full object-cover hover:opacity-95 transition-opacity max-w-full"
                    style={{ maxWidth: '100%' }}
                  />
                ) : (
                  <div className="relative h-full">
                    <video
                      src={post.media[0].url}
                      className="w-full h-full object-cover max-w-full"
                      style={{ maxWidth: '100%' }}
                      muted
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <span className="text-white text-lg">▶️</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {post.media.slice(1).map((item, index) => (
                  <div key={index + 1} className="rounded-lg overflow-hidden bg-muted cursor-pointer max-w-full" onClick={() => setShowCarousel(true)}>
                    {item.type === 'image' ? (
                      <img
                        src={item.url}
                        alt="Media"
                        className="w-full h-24 sm:h-32 object-cover hover:opacity-95 transition-opacity max-w-full"
                        style={{ maxWidth: '100%' }}
                      />
                    ) : (
                      <div className="relative">
                        <video
                          src={item.url}
                          className="w-full h-24 sm:h-32 object-cover max-w-full"
                          style={{ maxWidth: '100%' }}
                          muted
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <span className="text-white text-lg">▶️</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Cuatro o más imágenes/videos
            <div className="grid grid-cols-2 gap-2 max-w-full">
              {post.media.slice(0, 4).map((item, index) => (
                <div key={index} className="rounded-lg overflow-hidden bg-muted cursor-pointer relative max-w-full" onClick={() => setShowCarousel(true)}>
                  {item.type === 'image' ? (
                    <>
                      <img
                        src={item.url}
                        alt="Media"
                        className={`w-full object-cover hover:opacity-95 transition-opacity max-w-full ${
                          index === 3 && post.media.length > 4 ? 'h-24 sm:h-32' : 'h-24 sm:h-32'
                        }`}
                        style={{ maxWidth: '100%' }}
                      />
                      {index === 3 && post.media.length > 4 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-white font-semibold text-lg">+{post.media.length - 4}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="relative">
                      <video
                        src={item.url}
                        className={`w-full object-cover max-w-full ${
                          index === 3 && post.media.length > 4 ? 'h-24 sm:h-32' : 'h-24 sm:h-32'
                        }`}
                        style={{ maxWidth: '100%' }}
                        muted
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <span className="text-white text-lg">▶️</span>
                      </div>
                      {index === 3 && post.media.length > 4 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-white font-semibold text-lg">+{post.media.length - 4}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center space-x-4 pt-2 border-t border-border/20">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleLike}
            disabled={!session?.user || isLiking}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              isLiked
                ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <span>{isLiked ? '❤️' : '🤍'}</span>
            <span className="text-sm">{post.likes.length}</span>
          </button>
          
          {post.likes.length > 0 && (
            <button
              onClick={() => setShowLikesModal(true)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
              title="Ver quién dio like"
            >
              Ver likes
            </button>
          )}
        </div>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
        >
          <span>💬</span>
          <span className="text-sm">{post.comments.length}</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="space-y-4 pt-4 border-t border-border/20">
          {/* Add comment */}
          {session?.user && (
            <form onSubmit={handleAddComment} className="space-y-3">
              <div className="flex space-x-2 sm:space-x-3">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
                  {session.user.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || 'Usuario'}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                      {session.user.name?.[0] || 'U'}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Escribe un comentario..."
                      className="flex-1 px-3 py-2 bg-background border border-border/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-w-0"
                      maxLength={500}
                    />
                    <div className="flex gap-2 flex-shrink-0">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCommentImageSelect}
                        className="hidden"
                        id="comment-image-input"
                      />
                      <label
                        htmlFor="comment-image-input"
                        className="px-3 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors cursor-pointer flex items-center"
                      >
                        📷
                      </label>
                      <button
                        type="submit"
                        disabled={!newComment.trim() || isSubmittingComment || isUploadingCommentImage}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmittingComment || isUploadingCommentImage ? '...' : 'Enviar'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Image preview */}
              {commentImagePreview && (
                <div className="flex space-x-2 sm:space-x-3">
                  <div className="w-8 flex-shrink-0"></div>
                  <div className="flex-1 relative">
                    <img
                      src={commentImagePreview}
                      alt="Preview"
                      className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg max-w-full"
                      style={{ maxWidth: '100%' }}
                    />
                    <button
                      type="button"
                      onClick={removeCommentImage}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}

          {/* Comments list */}
          <div className="space-y-3">
            {post.comments.map((comment) => {
              // Validar que comment.userId existe antes de renderizar
              if (!comment.userId) {
                return (
                  <div key={comment._id} className="flex space-x-2 sm:space-x-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        ?
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="bg-muted/30 rounded-lg p-2 sm:p-3">
                        <p className="text-muted-foreground text-sm italic">Comentario de usuario eliminado</p>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={comment._id} className="flex space-x-2 sm:space-x-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
                    {comment.userId.image ? (
                      <Image
                        src={comment.userId.image}
                        alt={comment.userId.name}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        {comment.userId.name[0]}
                      </div>
                    )}
                  </div>
                
                  <div className="flex-1 min-w-0">
                    <div className="bg-muted/30 rounded-lg p-2 sm:p-3">
                      <div className="flex items-start justify-between mb-1 gap-2">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 min-w-0 flex-1">
                          <span className="font-medium text-foreground text-sm truncate">
                            {comment.userId.name}
                          </span>
                          <span className="text-muted-foreground text-xs flex-shrink-0">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        
                        {/* Menu para el owner del comentario */}
                        {session?.user && comment.userId && (session.user as any).id === comment.userId._id && (
                          <div className="relative flex-shrink-0 comment-menu">
                            <button
                              onClick={() => setCommentMenuOpen(commentMenuOpen === comment._id ? null : comment._id)}
                              className="text-muted-foreground hover:text-foreground text-xs opacity-70 hover:opacity-100 transition-opacity p-1"
                              title="Opciones del comentario"
                            >
                              ⋯
                            </button>
                            
                            {/* Menú desplegable */}
                            {commentMenuOpen === comment._id && (
                              <div className="absolute right-0 top-6 bg-card border border-border rounded-lg shadow-lg z-10 min-w-[120px]">
                                <button
                                  onClick={() => startEditComment(comment)}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors flex items-center gap-2"
                                >
                                  ✏️ Editar
                                </button>
                                <button
                                  onClick={() => setShowCommentDeleteConfirm(comment._id)}
                                  className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2"
                                >
                                  🗑️ Eliminar
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Contenido del comentario - modo edición o visualización */}
                      {editingCommentId === comment._id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editCommentContent}
                            onChange={(e) => setEditCommentContent(e.target.value)}
                            className="w-full p-2 text-sm border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                            rows={2}
                            maxLength={500}
                            placeholder="Editar comentario..."
                          />
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">
                              {editCommentContent.length}/500
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={cancelEditComment}
                                className="px-3 py-1 text-xs bg-muted hover:bg-muted/80 rounded-md transition-colors"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => handleEditComment(comment._id)}
                                disabled={!editCommentContent.trim()}
                                className="px-3 py-1 text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Guardar
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-foreground text-sm break-words">{comment.content}</p>
                      )}
                      
                      {comment.media && (
                        <div className="mt-2">
                          <img
                            src={comment.media.url}
                            alt="Comentario"
                            className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity max-w-full"
                            style={{ maxWidth: '100%' }}
                            onClick={() => {
                              // Abrir en carrusel si es necesario
                              if (comment.media) {
                                setShowCarousel(true);
                              }
                            }}
                          />
                        </div>
                      )}
                      
                      {/* Likes del comentario */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/20">
                        <button
                          onClick={() => handleCommentLike(comment._id)}
                          disabled={!session?.user}
                          className={`flex items-center space-x-1 text-xs transition-colors ${
                            (comment.likes || []).some(like => like.userId === (session?.user as any)?.id)
                              ? 'text-red-500 hover:text-red-600'
                              : 'text-muted-foreground hover:text-foreground'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <span className="text-sm">
                            {(comment.likes || []).some(like => like.userId === (session?.user as any)?.id) ? '❤️' : '🤍'}
                          </span>
                          <span>{comment.likes?.length || 0}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Carrusel de imágenes */}
      {showCarousel && (
        <ImageCarousel
          images={post.media}
          onClose={() => setShowCarousel(false)}
        />
      )}

      {/* Diálogo de confirmación de eliminación de publicación */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Eliminar publicación"
        message="¿Estás seguro de que quieres eliminar esta publicación? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={() => {
          handleDeletePost();
          setShowDeleteConfirm(false);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
        type="danger"
      />

      {/* Diálogo de confirmación de eliminación de comentario */}
      <ConfirmDialog
        isOpen={!!showCommentDeleteConfirm}
        title="Eliminar comentario"
        message="¿Estás seguro de que quieres eliminar este comentario? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={() => {
          if (showCommentDeleteConfirm) {
            handleDeleteComment(showCommentDeleteConfirm);
            setShowCommentDeleteConfirm(null);
          }
        }}
        onCancel={() => setShowCommentDeleteConfirm(null)}
        type="danger"
      />

      {/* Modal de likes */}
      <LikesModal
        isOpen={showLikesModal}
        onClose={() => setShowLikesModal(false)}
        postId={post._id}
      />
    </article>
  );
}