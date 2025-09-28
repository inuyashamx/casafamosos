import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Dedication from '@/lib/models/Dedication';

// GET - Obtener todas las dedicatorias reportadas
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
        { error: 'Solo administradores pueden acceder a esta función' },
        { status: 403 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const query: any = {};

    if (status === 'pending') {
      query.isReported = true;
      query.isActive = true;
    } else if (status === 'resolved') {
      query.moderatedAt = { $exists: true };
    }

    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      Dedication.find(query)
        .populate('userId', 'name email image team')
        .populate('candidateId', 'name photo')
        .populate('reports.reportedBy', 'name email')
        .populate('moderatedBy', 'name')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      Dedication.countDocuments(query),
    ]);

    const formattedReports = reports.map((dedication: any) => ({
      _id: dedication._id,
      content: dedication.content,
      user: dedication.userId,
      candidate: dedication.candidateId,
      reports: dedication.reports,
      reportsCount: dedication.reports.length,
      createdAt: dedication.createdAt,
      moderatedBy: dedication.moderatedBy,
      moderatedAt: dedication.moderatedAt,
      moderationNote: dedication.moderationNote,
      isActive: dedication.isActive,
      isApproved: dedication.isApproved,
    }));

    return NextResponse.json({
      reports: formattedReports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: page < Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Error al obtener reportes' },
      { status: 500 }
    );
  }
}

// POST - Moderar una dedicatoria reportada
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
        { error: 'Solo administradores pueden moderar reportes' },
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

    const validActions = ['approve', 'remove', 'ignore'];
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

    const actionMessages = {
      approve: 'Dedicatoria aprobada y reportes eliminados',
      remove: 'Dedicatoria eliminada permanentemente',
      ignore: 'Reportes ignorados, dedicatoria mantenida',
    };

    return NextResponse.json({
      message: actionMessages[action as keyof typeof actionMessages],
      dedication: {
        _id: dedication._id,
        isActive: dedication.isActive,
        isApproved: dedication.isApproved,
        isReported: dedication.isReported,
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