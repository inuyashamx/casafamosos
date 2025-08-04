import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PostService } from '@/lib/services/postService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const userId = searchParams.get('userId');

    if (userId) {
      // Obtener posts de un usuario específico
      const posts = await PostService.getUserPosts(userId, page, limit);
      const totalPosts = await PostService.getUserPostsCount(userId);
      
      return NextResponse.json({
        posts,
        pagination: {
          page,
          limit,
          total: totalPosts,
          pages: Math.ceil(totalPosts / limit),
        }
      });
    } else {
      // Obtener todos los posts (feed general)
      const posts = await PostService.getPosts(page, limit);
      const totalPosts = await PostService.getPostsCount();
      
      return NextResponse.json({
        posts,
        pagination: {
          page,
          limit,
          total: totalPosts,
          pages: Math.ceil(totalPosts / limit),
        }
      });
    }
  } catch (error: any) {
    console.error('Error en GET /api/posts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const { content, media, links } = data;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'El contenido es requerido' }, { status: 400 });
    }

    if (content.length > 2000) {
      return NextResponse.json({ error: 'El contenido no puede exceder 2000 caracteres' }, { status: 400 });
    }

    const post = await PostService.createPost({
      userId: (session.user as any).id,
      content: content.trim(),
      media: media || [],
      links: links || [],
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error: any) {
    console.error('Error en POST /api/posts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}