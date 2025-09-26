"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Post from '@/components/Post';

interface PostData {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
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
  likes: Array<{
    userId: string;
    likedAt: string;
  }>;
  comments: Array<{
    _id: string;
    userId: {
      _id: string;
      name: string;
      email: string;
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
    createdAt: string;
    likes: Array<{
      userId: string;
      likedAt: string;
    }>;
  }>;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const postId = params.id as string;

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    fetchPost();
  }, [postId, session, status]);

  // Scroll automático a comentario si hay hash
  useEffect(() => {
    if (post && window.location.hash) {
      const commentId = window.location.hash.replace('#comment-', '');
      if (commentId) {
        // Esperar un poco para que el DOM se renderice
        setTimeout(() => {
          const element = document.getElementById(`comment-${commentId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Resaltar el comentario brevemente
            element.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
            setTimeout(() => {
              element.style.backgroundColor = '';
            }, 2000);
          }
        }, 100);
      }
    }
  }, [post]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/posts/${postId}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError('Post no encontrado');
        } else {
          setError('Error al cargar el post');
        }
        return;
      }

      const data = await response.json();
      setPost(data);
    } catch (err) {
      setError('Error de conexión');
      console.error('Error fetching post:', err);
    } finally {
      setLoading(false);
    }
  };


  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{error}</h1>
          <button
            onClick={() => router.push('/muro')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Volver al muro
          </button>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🤔</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Post no encontrado</h1>
          <button
            onClick={() => router.push('/muro')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Volver al muro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header con botón de volver */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </button>
        </div>

        {/* Post individual */}
        <div className="bg-card rounded-lg border border-border">
          <Post
            key={post._id}
            post={post}
            onPostUpdate={(updatedPost) => setPost(updatedPost)}
            showBorder={false}
          />
        </div>
      </div>
    </div>
  );
}