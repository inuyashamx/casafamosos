"use client";
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Post from './Post';
import CreatePost from './CreatePost';

interface PostData {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    image?: string;
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
  comments: Array<{
    _id: string;
    userId: {
      _id: string;
      name: string;
      email: string;
      image?: string;
    };
    content: string;
    media?: {
      type: 'image' | 'video';
      url: string;
      publicId: string;
      thumbnail?: string;
    };
    likes: Array<{ userId: string; likedAt: string }>;
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
  }, [userId]);

  useEffect(() => {
    fetchPosts(1, true);
  }, [fetchPosts]);

  const handlePostCreated = () => {
    fetchPosts(1, true);
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

  const loadMore = () => {
    if (hasMore && !loadingMore) {
      fetchPosts(page + 1, false);
    }
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
          {posts.map((post) => (
            <Post key={post._id} post={post} onPostUpdate={handlePostUpdate} />
          ))}
          
          {/* Load more button */}
          {hasMore && (
            <div className="text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="bg-muted text-foreground px-6 py-3 rounded-lg hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? 'Cargando...' : 'Cargar más posts'}
              </button>
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