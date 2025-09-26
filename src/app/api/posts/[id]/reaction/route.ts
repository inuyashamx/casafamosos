import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PostService } from '@/lib/services/postService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { reactionType } = await request.json();

    if (!reactionType || !['like', 'laugh', 'angry', 'wow', 'sad', 'poop'].includes(reactionType)) {
      return NextResponse.json({ error: 'Tipo de reacción inválido' }, { status: 400 });
    }

    const resolvedParams = await params;
    const post = await PostService.addReaction(resolvedParams.id, (session.user as any).id, reactionType);

    return NextResponse.json({ success: true, reactions: post.reactions });
  } catch (error: any) {
    console.error('Error en POST /api/posts/[id]/reaction:', error);
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
    const post = await PostService.removeReaction(resolvedParams.id, (session.user as any).id);

    return NextResponse.json({ success: true, reactions: post.reactions });
  } catch (error: any) {
    console.error('Error en DELETE /api/posts/[id]/reaction:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}