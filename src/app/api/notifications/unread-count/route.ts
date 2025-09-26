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

    const unreadCount = await NotificationService.getUnreadCount((session.user as any).id);

    return NextResponse.json({ unreadCount });
  } catch (error: any) {
    console.error('Error en GET /api/notifications/unread-count:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}