import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Dedication from '@/lib/models/Dedication';
import Candidate from '@/lib/models/Candidate';

// GET - Obtener todas las dedicatorias o las reportadas
export async function GET(req: NextRequest) {
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
        { error: 'Solo administradores pueden acceder' },
        { status: 403 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'all'; // all | reported
    const candidateId = searchParams.get('candidateId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const query: any = {};

    // Filtro por estado
    if (filter === 'reported') {
      query.isReported = true;
    }

    // Filtro por candidato
    if (candidateId && candidateId !== 'all') {
      query.candidateId = candidateId;
    }

    const skip = (page - 1) * limit;

    const [dedications, total, candidates] = await Promise.all([
      Dedication.find(query)
        .populate('userId', 'name email image team')
        .populate('candidateId', 'name photo')
        .populate('reports.reportedBy', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      Dedication.countDocuments(query),
      Candidate.find({}).select('_id name photo').sort({ name: 1 }).lean()
    ]);

    return NextResponse.json({
      dedications,
      candidates, // Para el dropdown de filtros
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: page < Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching dedications:', error);
    return NextResponse.json(
      { error: 'Error al obtener dedicatorias' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar dedicatoria
export async function DELETE(req: NextRequest) {
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
        { error: 'Solo administradores pueden eliminar' },
        { status: 403 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const dedicationId = searchParams.get('id');

    if (!dedicationId) {
      return NextResponse.json(
        { error: 'ID de dedicatoria requerido' },
        { status: 400 }
      );
    }

    const { reason } = await req.json();

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: 'Razón de eliminación requerida' },
        { status: 400 }
      );
    }

    // Buscar la dedicatoria con toda la información necesaria
    const dedication = await Dedication.findById(dedicationId)
      .populate('candidateId', 'name')
      .populate('userId', 'name')
      .populate('reports.reportedBy', 'name');

    if (!dedication) {
      return NextResponse.json(
        { error: 'Dedicatoria no encontrada' },
        { status: 404 }
      );
    }

    // Crear notificaciones
    const { default: Notification } = await import('@/lib/models/Notification');
    const { default: User } = await import('@/lib/models/User');

    // Notificación al autor
    await Notification.create({
      userId: dedication.userId._id,
      fromUserId: (session.user as any).id,
      type: 'DEDICATION_DELETED',
      dedicationId: dedicationId,
      candidateId: dedication.candidateId._id,
      message: `Tu dedicatoria para ${dedication.candidateId.name} fue eliminada por un administrador. Razón: ${reason}`,
    });

    // Notificaciones a quienes reportaron (si hay reportes)
    if (dedication.reports && dedication.reports.length > 0) {
      const reporterNotifications = dedication.reports
        .filter((report: any) => report.reportedBy._id.toString() !== dedication.userId._id.toString()) // No notificar al autor si se reportó a sí mismo
        .map((report: any) => ({
          userId: report.reportedBy._id,
          fromUserId: (session.user as any).id,
          type: 'DEDICATION_DELETED',
          dedicationId: dedicationId,
          candidateId: dedication.candidateId._id,
          message: `La dedicatoria que reportaste para ${dedication.candidateId.name} fue eliminada por un administrador. Razón: ${reason}`,
        }));

      if (reporterNotifications.length > 0) {
        await Notification.insertMany(reporterNotifications);
      }
    }

    // Eliminar permanentemente
    await Dedication.findByIdAndDelete(dedicationId);

    return NextResponse.json({
      message: 'Dedicatoria eliminada permanentemente y notificaciones enviadas',
    });
  } catch (error) {
    console.error('Error deleting dedication:', error);
    return NextResponse.json(
      { error: 'Error al eliminar dedicatoria' },
      { status: 500 }
    );
  }
}

// POST - Moderar dedicatoria
export async function POST(req: NextRequest) {
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
        { error: 'Solo administradores pueden moderar' },
        { status: 403 }
      );
    }

    await dbConnect();

    const { dedicationId, action, note } = await req.json();

    if (!dedicationId || !action) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const validActions = ['approve', 'ignore'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Acción inválida' },
        { status: 400 }
      );
    }

    const dedication = await Dedication.findById(dedicationId);

    if (!dedication) {
      return NextResponse.json(
        { error: 'Dedicatoria no encontrada' },
        { status: 404 }
      );
    }

    // Aplicar la moderación
    await dedication.moderate(
      (session.user as any).id,
      action,
      note
    );

    console.log('Después de moderar:', {
      dedicationId: dedication._id,
      action,
      isReported: dedication.isReported,
      reportsCount: dedication.reports.length
    });

    return NextResponse.json({
      message: action === 'ignore'
        ? 'Reportes ignorados exitosamente'
        : 'Moderación aplicada',
      dedication: {
        _id: dedication._id,
        isActive: dedication.isActive,
        isApproved: dedication.isApproved,
        isReported: dedication.isReported,
        reportsCount: dedication.reports.length,
      },
    });
  } catch (error) {
    console.error('Error moderating dedication:', error);
    return NextResponse.json(
      { error: 'Error al moderar dedicatoria' },
      { status: 500 }
    );
  }
}