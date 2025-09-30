import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PushNotificationService } from '@/lib/services/pushNotificationService';

// GET - Obtener preferencias de push del usuario
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const settings = await PushNotificationService.getUserSettings((session.user as any).id);

    return NextResponse.json({ settings });
  } catch (error: any) {
    console.error('Error getting push settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Actualizar preferencias de push
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { likes, comments } = await req.json();

    const result = await PushNotificationService.updateUserPreferences((session.user as any).id, {
      ...(typeof likes === 'boolean' && { likes }),
      ...(typeof comments === 'boolean' && { comments }),
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, settings: result.settings });
  } catch (error: any) {
    console.error('Error updating preferences:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}