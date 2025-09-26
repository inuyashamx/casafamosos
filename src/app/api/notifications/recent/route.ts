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
    const limit = parseInt(searchParams.get('limit') || '5');

    const notifications = await NotificationService.getRecentNotifications(
      (session.user as any).id,
      limit
    );

    return NextResponse.json({ notifications });
  } catch (error: any) {
    console.error('Error en GET /api/notifications/recent:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}