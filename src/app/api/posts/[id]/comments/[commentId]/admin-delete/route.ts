import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PostService } from '@/lib/services/postService';
import User from '@/lib/models/User';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que sea admin directamente desde la DB
    const user = await User.findById((session.user as { id: string }).id);
    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Solo administradores pueden eliminar comentarios de otros usuarios' }, { status: 403 });
    }

    const resolvedParams = await params;
    const result = await PostService.removeComment(
      resolvedParams.id,
      resolvedParams.commentId,
      (session.user as any).id,
      true // isAdminDelete flag
    );

    return NextResponse.json({
      success: true,
      message: 'Comentario eliminado por administrador',
      post: result
    });
  } catch (error: any) {
    console.error('Error en DELETE /api/posts/[id]/comments/[commentId]/admin-delete:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}