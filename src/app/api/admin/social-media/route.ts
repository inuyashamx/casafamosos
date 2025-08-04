import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SocialMediaService } from '@/lib/services/socialMediaService';

export async function GET() {
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

    const socialMedia = await SocialMediaService.getSocialMedia();
    
    return NextResponse.json(socialMedia);
  } catch (error) {
    console.error('Error fetching social media:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    
    const socialMedia = await SocialMediaService.updateSocialMedia(body);
    
    return NextResponse.json(socialMedia);
  } catch (error) {
    console.error('Error updating social media:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 