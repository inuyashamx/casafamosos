import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PostService } from '@/lib/services/postService';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que sea admin o el dueño del post
    const isAdmin = await checkAdminStatus(session.user.email);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Solo administradores pueden eliminar posts permanentemente' }, { status: 403 });
    }

    await PostService.permanentlyDeletePost(params.id, (session.user as any).id);
    
    return NextResponse.json({ success: true, message: 'Post eliminado permanentemente' });
  } catch (error: any) {
    console.error('Error en DELETE /api/posts/[id]/permanent-delete:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function checkAdminStatus(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/admin?action=checkAdmin`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.isAdmin || false;
    }
  } catch (error) {
    console.error('Error checking admin status:', error);
  }
  
  return false;
} 