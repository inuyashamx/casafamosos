import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Dedication from '@/lib/models/Dedication';
import { validateContent, sanitizeContent } from '@/lib/security';

// PUT - Editar dedicatoria específica
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { id: dedicationId } = await params;
    const { content } = await req.json();

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Contenido requerido' },
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

    const dedication = await Dedication.findById(dedicationId);

    if (!dedication) {
      return NextResponse.json(
        { error: 'Dedicatoria no encontrada' },
        { status: 404 }
      );
    }

    const userId = (session.user as any).id;

    // Solo el autor puede editar
    if (dedication.userId.toString() !== userId) {
      return NextResponse.json(
        { error: 'Solo puedes editar tus propias dedicatorias' },
        { status: 403 }
      );
    }

    // Actualizar contenido
    dedication.content = sanitizedContent;
    await dedication.save();

    return NextResponse.json({
      message: 'Dedicatoria editada exitosamente',
      dedication: {
        _id: dedication._id,
        content: dedication.content,
      },
    });
  } catch (error) {
    console.error('Error editing dedication:', error);
    return NextResponse.json(
      { error: 'Error al editar dedicatoria' },
      { status: 500 }
    );
  }
}