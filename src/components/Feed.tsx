"use client";
import { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import Post from './Post';
import CreatePost from './CreatePost';
import { InFeedAd } from './AdSense';

interface PostData {
  _id: string;
  userId: {
    _id: string;
    name: string;
    image?: string;
    team?: 'DIA' | 'NOCHE' | 'ECLIPSE' | null;
  };
  content: string;
  media?: Array<{
    type: 'image' | 'video';
    url: string;
    publicId: string;
    thumbnail?: string;
  }>;
  links?: Array<{
    url: string;
    title?: string;
    description?: string;
    image?: string;
  }>;
  likes: Array<{ userId: string; likedAt: string }>;
  reactions: Array<{ userId: string; type: string; reactedAt: string }>;
  comments: Array<{
    _id: string;
    userId: {
      _id: string;
      name: string;
      image?: string;
      team?: 'DIA' | 'NOCHE' | 'ECLIPSE' | null;
    };
    content: string;
    media?: {
      type: 'image' | 'video';
      url: string;
      publicId: string;
      thumbnail?: string;
    };
    likes: Array<{ userId: string; likedAt: string }>;
    reactions: Array<{ userId: string; type: string; reactedAt: string }>;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

interface FeedProps {
  userId?: string; // Si se proporciona, mostrar solo posts de ese usuario
}

export default function Feed({ userId }: FeedProps) {
  const router = useRouter();
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'activity'>('activity');
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const fetchPosts = useCallback(async (pageNum: number = 1, reset: boolean = true) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '10',
      });

      if (userId) {
        params.append('userId', userId);
      } else {
        // Solo agregar sortBy para el feed general, no para posts de usuario específico
        params.append('sortBy', sortBy);
      }

      const response = await fetch(`/api/posts?${params}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar posts');
      }

      const data = await response.json();
      
      if (reset) {
        setPosts(data.posts);
      } else {
        // Evitar duplicados al cargar más posts
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p._id));
          const newPosts = data.posts.filter((p: PostData) => !existingIds.has(p._id));
          return [...prev, ...newPosts];
        });
      }

      setHasMore(data.pagination.page < data.pagination.pages);
      setPage(pageNum);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching posts:', err);
      setError(err.message || 'Error al cargar posts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [userId, sortBy]);

  useEffect(() => {
    fetchPosts(1, true);
  }, [fetchPosts]);

  // Función para cargar más posts sin dependencias problemáticas
  const loadMorePosts = useCallback(() => {
    if (hasMore && !loadingMore) {
      fetchPosts(page + 1, false);
    }
  }, [hasMore, loadingMore, page, fetchPosts]);

  // Intersection Observer para scroll infinito
  useEffect(() => {
    const currentRef = loadMoreRef.current;

    if (!currentRef || !hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting) {
          loadMorePosts();
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
  }, [hasMore, loadingMore, loadMorePosts, posts.length]);

  const handlePostCreated = () => {
    fetchPosts(1, true);
  };

  const handleSortChange = (newSortBy: 'recent' | 'activity') => {
    setSortBy(newSortBy);
    setPage(1);
    setHasMore(true);
  };

  const handlePostUpdate = (updatedPost: PostData) => {
    if (!updatedPost || !updatedPost._id) {
      console.warn('handlePostUpdate received invalid post data:', updatedPost);
      return;
    }

    setPosts(prevPosts =>
      prevPosts.map(p => p._id === updatedPost._id ? updatedPost : p)
    );
  };


  if (loading && page === 1) {
    return (
      <div className="space-y-6">
        {!userId && <CreatePost onPostCreated={handlePostCreated} />}
        
        {/* Loading skeletons */}
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="bg-card rounded-xl p-6 border border-border/20 animate-pulse">
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

  if (error && posts.length === 0) {
    return (
      <div className="space-y-6">
        {!userId && <CreatePost onPostCreated={handlePostCreated} />}
        
        <div className="bg-card rounded-xl p-8 border border-border/20 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Error al cargar posts</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => fetchPosts(1, true)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!userId && (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-foreground mb-2">
              Muro
            </h2>
          </div>
          <CreatePost onPostCreated={handlePostCreated} />

          {/* Selector de ordenamiento */}
          <div className="flex justify-center">
            <div className="bg-muted rounded-lg p-1 inline-flex">
              <button
                onClick={() => handleSortChange('activity')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  sortBy === 'activity'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Última actividad
              </button>
              <button
                onClick={() => handleSortChange('recent')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  sortBy === 'recent'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Más recientes
              </button>
            </div>
          </div>
        </div>
      )}
      
      {posts.length === 0 ? (
        <div className="bg-card rounded-xl p-8 border border-border/20 text-center">
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No hay posts</h3>
          <p className="text-muted-foreground">
            {userId ? 'Este usuario no ha publicado nada aún.' : 'Sé el primero en publicar algo.'}
          </p>
        </div>
      ) : (
        <>
          {posts.map((post, index) => {
            const showAd = (index + 1) % 3 === 0;
            return (
              <Fragment key={post._id}>
                <Post post={post} onPostUpdate={handlePostUpdate} />
                {/* Insertar InFeedAd cada 3 posts */}
                {showAd && <InFeedAd />}
              </Fragment>
            );
          })}

          {/* Infinite scroll trigger + Manual button backup */}
          {hasMore && posts.length > 0 && (
            <div className="text-center space-y-4">
              {/* Elemento invisible para scroll infinito */}
              <div
                ref={loadMoreRef}
                className="h-1 w-full"
                style={{ backgroundColor: 'transparent' }}
              />

              {/* Loading state */}
              {loadingMore ? (
                <div className="flex items-center justify-center space-x-2 py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="text-muted-foreground">Cargando más posts...</span>
                </div>
              ) : (
                /* Manual button backup */
                <button
                  onClick={() => fetchPosts(page + 1, false)}
                  disabled={loadingMore}
                  className="bg-muted text-foreground px-6 py-3 rounded-lg hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cargar más posts
                </button>
              )}
            </div>
          )}
          
          {!hasMore && posts.length > 0 && (
            <div className="text-center py-4">
              <p className="text-muted-foreground text-sm">No hay más posts que mostrar</p>
            </div>
          )}
        </>
      )}
      
      {error && posts.length > 0 && (
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