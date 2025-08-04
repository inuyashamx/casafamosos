import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PostService } from '@/lib/services/postService';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const post = await PostService.removeComment(
      params.id,
      params.commentId,
      (session.user as any).id
    );
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error en DELETE /api/posts/[id]/comments/[commentId]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const { content } = data;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'El comentario no puede estar vacío' }, { status: 400 });
    }

    if (content.length > 500) {
      return NextResponse.json({ error: 'El comentario no puede exceder 500 caracteres' }, { status: 400 });
    }

    const post = await PostService.updateComment(
      params.id,
      params.commentId,
      (session.user as any).id,
      content.trim()
    );
    
    return NextResponse.json(post);
  } catch (error: any) {
    console.error('Error en PUT /api/posts/[id]/comments/[commentId]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}