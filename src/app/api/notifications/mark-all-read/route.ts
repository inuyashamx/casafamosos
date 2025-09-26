import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NotificationService } from '@/lib/services/notificationService';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const modifiedCount = await NotificationService.markAllAsRead((session.user as any).id);

    return NextResponse.json({
      success: true,
      modifiedCount,
      message: `${modifiedCount} notificaciones marcadas como leídas`
    });
  } catch (error: any) {
    console.error('Error en POST /api/notifications/mark-all-read:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}