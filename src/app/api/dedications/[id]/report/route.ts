import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Dedication from '@/lib/models/Dedication';
import Notification from '@/lib/models/Notification';
import User from '@/lib/models/User';
import { checkRateLimit, getClientIP } from '@/lib/security';

// POST - Reportar una dedicatoria
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Rate limiting: 10 reportes por hora por usuario
    const userId = (session.user as any).id;
    const ip = getClientIP(req.headers);
    const rateLimitKey = `report_dedication:${userId}:${ip}`;

    if (!checkRateLimit(rateLimitKey, 10, 60 * 60 * 1000)) { // 10 per hour
      return NextResponse.json(
        { error: 'Has excedido el límite de reportes por hora (10 máximo)' },
        { status: 429 }
      );
    }

    await dbConnect();

    const dedicationId = params.id;
    // userId ya está definido arriba para rate limiting
    const { reason, customReason } = await req.json();

    if (!reason) {
      return NextResponse.json(
        { error: 'Razón del reporte requerida' },
        { status: 400 }
      );
    }

    const validReasons = ['offensive', 'spam', 'inappropriate', 'other'];
    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { error: 'Razón de reporte inválida' },
        { status: 400 }
      );
    }

    if (reason === 'other' && !customReason) {
      return NextResponse.json(
        { error: 'Se requiere especificar la razón personalizada' },
        { status: 400 }
      );
    }

    const dedication = await Dedication.findById(dedicationId)
      .populate('candidateId', 'name');

    if (!dedication || !dedication.isActive) {
      return NextResponse.json(
        { error: 'Dedicatoria no encontrada' },
        { status: 404 }
      );
    }

    // Verificar si el usuario ya reportó esta dedicatoria
    const existingReport = dedication.reports.find(
      (report: any) => report.reportedBy.toString() === userId
    );

    if (existingReport) {
      return NextResponse.json(
        { error: 'Ya has reportado esta dedicatoria' },
        { status: 400 }
      );
    }

    // Agregar el reporte
    await dedication.addReport(userId, reason, customReason);

    // Crear notificación para todos los admins
    const admins = await User.find({ isAdmin: true, isActive: true });

    const notifications = admins.map((admin: any) => ({
      userId: admin._id,
      fromUserId: userId,
      type: 'DEDICATION_REPORT',
      dedicationId: dedicationId,
      message: `Nueva dedicatoria reportada para ${dedication.candidateId.name}`,
    }));

    // Guardar notificaciones
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    return NextResponse.json({
      message: 'Reporte enviado exitosamente',
      reported: true,
    });
  } catch (error) {
    console.error('Error reporting dedication:', error);
    return NextResponse.json(
      { error: 'Error al reportar la dedicatoria' },
      { status: 500 }
    );
  }
}

// GET - Obtener información de reportes (solo admin)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const isAdmin = (session.user as any).isAdmin;

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Solo administradores pueden ver reportes' },
        { status: 403 }
      );
    }

    await dbConnect();

    const dedicationId = params.id;

    const dedication = await Dedication.findById(dedicationId)
      .populate('reports.reportedBy', 'name email image')
      .lean();

    if (!dedication) {
      return NextResponse.json(
        { error: 'Dedicatoria no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      reports: dedication.reports,
      total: dedication.reports.length,
      isReported: dedication.isReported,
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Error al obtener reportes' },
      { status: 500 }
    );
  }
}