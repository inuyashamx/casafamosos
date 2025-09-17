import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PostService } from '@/lib/services/postService';
import User from '@/lib/models/User';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que sea admin directamente desde la DB
    const user = await User.findById((session.user as { id: string }).id);
    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Solo administradores pueden eliminar posts permanentemente' }, { status: 403 });
    }

    const resolvedParams = await params;
    await PostService.permanentlyDeletePost(resolvedParams.id, (session.user as any).id);

    return NextResponse.json({ success: true, message: 'Post eliminado permanentemente' });
  } catch (error: any) {
    console.error('Error en DELETE /api/posts/[id]/permanent-delete:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 