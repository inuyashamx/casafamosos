import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PostService } from '@/lib/services/postService';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const { content, media } = data;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'El comentario no puede estar vacío' }, { status: 400 });
    }

    if (content.length > 500) {
      return NextResponse.json({ error: 'El comentario no puede exceder 500 caracteres' }, { status: 400 });
    }

    const post = await PostService.addComment(params.id, (session.user as any).id, content.trim(), media);
    
    return NextResponse.json(post);
  } catch (error: any) {
    console.error('Error en POST /api/posts/[id]/comments:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}