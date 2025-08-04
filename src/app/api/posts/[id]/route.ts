import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PostService } from '@/lib/services/postService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const post = await PostService.getPostById(resolvedParams.id);
    
    if (!post) {
      return NextResponse.json({ error: 'Post no encontrado' }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error: any) {
    console.error('Error en GET /api/posts/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const { content } = data;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'El contenido es requerido' }, { status: 400 });
    }

    if (content.length > 2000) {
      return NextResponse.json({ error: 'El contenido no puede exceder 2000 caracteres' }, { status: 400 });
    }

    const resolvedParams = await params;
    const post = await PostService.updatePost(resolvedParams.id, (session.user as any).id, {
      content: content.trim(),
    });

    return NextResponse.json(post);
  } catch (error: any) {
    console.error('Error en PUT /api/posts/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const resolvedParams = await params;
    await PostService.deletePost(resolvedParams.id, (session.user as any).id);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error en DELETE /api/posts/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}