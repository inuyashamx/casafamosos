import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NotificationService } from '@/lib/services/notificationService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const resolvedParams = await params;
    const notification = await NotificationService.markAsRead(
      resolvedParams.id,
      (session.user as any).id
    );

    return NextResponse.json({ success: true, notification });
  } catch (error: any) {
    console.error('Error en POST /api/notifications/[id]/read:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}