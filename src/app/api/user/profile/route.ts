import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserService } from '@/lib/services/userService';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userProfile = await UserService.getUserProfile((session.user as any).id);
    return NextResponse.json(userProfile);
  } catch (error: any) {
    console.error('Error en GET /api/user/profile:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const { name, nickname, image } = data;

    // Validaciones básicas
    if (name && typeof name !== 'string') {
      return NextResponse.json({ error: 'El nombre debe ser una cadena de texto' }, { status: 400 });
    }

    if (nickname && typeof nickname !== 'string') {
      return NextResponse.json({ error: 'El nickname debe ser una cadena de texto' }, { status: 400 });
    }

    if (image && typeof image !== 'string') {
      return NextResponse.json({ error: 'La URL de la imagen debe ser una cadena de texto' }, { status: 400 });
    }

    const updatedProfile = await UserService.updateUserProfile((session.user as any).id, {
      name: name?.trim(),
      nickname: nickname?.trim(),
      image,
    });

    return NextResponse.json(updatedProfile);
  } catch (error: any) {
    console.error('Error en PUT /api/user/profile:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 