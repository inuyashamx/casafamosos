import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PostService } from '@/lib/services/postService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const resolvedParams = await params;
    const post = await PostService.likeComment(
      resolvedParams.id,
      resolvedParams.commentId,
      (session.user as any).id
    );
    
    return NextResponse.json(post);
  } catch (error: any) {
    console.error('Error en POST /api/posts/[id]/comments/[commentId]/like:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const resolvedParams = await params;
    const post = await PostService.unlikeComment(
      resolvedParams.id,
      resolvedParams.commentId,
      (session.user as any).id
    );
    
    return NextResponse.json(post);
  } catch (error: any) {
    console.error('Error en DELETE /api/posts/[id]/comments/[commentId]/like:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 