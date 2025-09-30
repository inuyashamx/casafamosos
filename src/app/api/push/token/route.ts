import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PushNotificationService } from '@/lib/services/pushNotificationService';

// POST - Guardar token FCM del usuario
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 400 });
    }

    const result = await PushNotificationService.saveUserToken((session.user as any).id, token);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, settings: result.settings });
  } catch (error: any) {
    console.error('Error saving FCM token:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Eliminar token y deshabilitar push
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const result = await PushNotificationService.disableUserPush((session.user as any).id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error disabling push:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}