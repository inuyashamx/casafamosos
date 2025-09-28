import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Dedication from '@/lib/models/Dedication';
import Candidate from '@/lib/models/Candidate';
import User from '@/lib/models/User';
import { checkRateLimit, getClientIP, validateContent, sanitizeContent } from '@/lib/security';

// GET - Obtener dedicatorias
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get('candidateId');
    const sortBy = searchParams.get('sortBy') || 'recent';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const userId = searchParams.get('userId');

    if (!candidateId && !userId) {
      return NextResponse.json(
        { error: 'Se requiere candidateId o userId' },
        { status: 400 }
      );
    }

    const query: any = {
      isActive: true,
      isApproved: true,
    };

    if (candidateId) {
      query.candidateId = candidateId;
    }

    if (userId) {
      query.userId = userId;
    }

    const sort = sortBy === 'popular'
      ? { createdAt: 'desc' } // Temporal fix - ordenar por fecha para popular también
      : { createdAt: 'desc' };

    const skip = (page - 1) * limit;

    const [dedications, total] = await Promise.all([
      Dedication.find(query)
        .populate('userId', 'name image team')
        .populate('candidateId', 'name photo')
        .sort(sort as any)
        .limit(limit)
        .skip(skip)
        .lean(),
      Dedication.countDocuments(query),
    ]);

    // Agregar información de likes para el usuario actual
    const session = await getServerSession(authOptions);
    const currentUserId = (session?.user as any)?.id;

    const dedicationsWithUserInfo = dedications.map(dedication => ({
      ...dedication,
      likesCount: dedication.likes.length,
      userHasLiked: currentUserId
        ? dedication.likes.some((like: any) =>
            like.userId.toString() === currentUserId
          )
        : false,
    }));

    return NextResponse.json({
      dedications: dedicationsWithUserInfo,
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

// POST - Crear nueva dedicatoria
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Rate limiting: 5 dedicatorias por hora por usuario
    const userId = (session.user as any).id;
    const ip = getClientIP(req.headers);
    const rateLimitKey = `create_dedication:${userId}:${ip}`;

    if (!checkRateLimit(rateLimitKey, 5, 60 * 60 * 1000)) { // 5 per hour
      return NextResponse.json(
        { error: 'Has excedido el límite de dedicatorias por hora (5 máximo)' },
        { status: 429 }
      );
    }

    await dbConnect();

    const { candidateId, content } = await req.json();

    if (!candidateId || !content) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Validar y sanitizar contenido
    if (!validateContent(content)) {
      return NextResponse.json(
        { error: 'El contenido contiene caracteres no válidos o no cumple con los requisitos mínimos' },
        { status: 400 }
      );
    }

    const sanitizedContent = sanitizeContent(content);

    // Verificar que el candidato existe y está activo
    const candidate = await Candidate.findById(candidateId);
    if (!candidate || !candidate.isActive) {
      return NextResponse.json(
        { error: 'Candidato no encontrado o inactivo' },
        { status: 404 }
      );
    }

    // Crear la dedicatoria
    const dedication = new Dedication({
      userId: (session.user as any).id,
      candidateId,
      content: sanitizedContent,
      likes: [],
      reports: [],
    });

    await dedication.save();

    // Poblar los datos del usuario y candidato
    await dedication.populate('userId', 'name image team');
    await dedication.populate('candidateId', 'name photo');

    return NextResponse.json({
      message: 'Dedicatoria creada exitosamente',
      dedication: {
        ...dedication.toObject(),
        likesCount: 0,
        userHasLiked: false,
      },
    });
  } catch (error) {
    console.error('Error creating dedication:', error);
    return NextResponse.json(
      { error: 'Error al crear dedicatoria' },
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

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const dedicationId = searchParams.get('id');

    if (!dedicationId) {
      return NextResponse.json(
        { error: 'ID de dedicatoria requerido' },
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

    const userId = (session.user as any).id;
    const isAdmin = (session.user as any).isAdmin;

    // Solo el autor o un admin pueden eliminar
    if (dedication.userId.toString() !== userId && !isAdmin) {
      return NextResponse.json(
        { error: 'No autorizado para eliminar esta dedicatoria' },
        { status: 403 }
      );
    }

    // Hard delete - eliminar permanentemente de la base de datos
    await Dedication.findByIdAndDelete(dedicationId);

    return NextResponse.json({
      message: 'Dedicatoria eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error deleting dedication:', error);
    return NextResponse.json(
      { error: 'Error al eliminar dedicatoria' },
      { status: 500 }
    );
  }
}

