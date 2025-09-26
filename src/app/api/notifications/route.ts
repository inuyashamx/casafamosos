import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NotificationService } from '@/lib/services/notificationService';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await NotificationService.getUserNotifications(
      (session.user as any).id,
      page,
      limit
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error en GET /api/notifications:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const deletedCount = await NotificationService.deleteAllNotifications((session.user as any).id);

    return NextResponse.json({
      success: true,
      deletedCount,
      message: 'Todas las notificaciones fueron eliminadas'
    });
  } catch (error: any) {
    console.error('Error en DELETE /api/notifications:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}