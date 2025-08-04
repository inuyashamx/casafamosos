import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CloudinaryService } from '@/lib/cloudinary';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { publicId: string } }
) {
  try {
    // Verificar autenticación y permisos de admin
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = session.user as { isAdmin?: boolean };
    if (!user.isAdmin) {
      return NextResponse.json({ error: 'Acceso denegado. Se requieren permisos de administrador.' }, { status: 403 });
    }

    const { publicId } = params;
    if (!publicId) {
      return NextResponse.json({ error: 'ID público requerido' }, { status: 400 });
    }

    // Decodificar el publicId (ya que viene codificado en la URL)
    const decodedPublicId = decodeURIComponent(publicId);

    // Eliminar la imagen de Cloudinary
    await CloudinaryService.deleteMedia(decodedPublicId);

    return NextResponse.json({ 
      success: true, 
      message: 'Imagen eliminada correctamente' 
    });

  } catch (error) {
    console.error('Error eliminando imagen de Cloudinary:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al eliminar la imagen' },
      { status: 500 }
    );
  }
} 