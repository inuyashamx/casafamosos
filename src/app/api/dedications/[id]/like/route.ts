import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Dedication from '@/lib/models/Dedication';
import Notification from '@/lib/models/Notification';
import { checkRateLimit, getClientIP } from '@/lib/security';

// POST - Dar like a una dedicatoria
export async function POST(
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

    // Rate limiting: 100 likes por hora por usuario
    const userId = (session.user as any).id;
    const ip = getClientIP(req.headers);
    const rateLimitKey = `like_dedication:${userId}:${ip}`;

    if (!checkRateLimit(rateLimitKey, 100, 60 * 60 * 1000)) { // 100 per hour
      return NextResponse.json(
        { error: 'Has excedido el límite de likes por hora (100 máximo)' },
        { status: 429 }
      );
    }

    await dbConnect();

    const { id: dedicationId } = await params;
    // userId ya está definido arriba para rate limiting

    const dedication = await Dedication.findById(dedicationId)
      .populate('candidateId', 'name')
      .populate('userId', 'name');

    if (!dedication || !dedication.isActive || !dedication.isApproved) {
      return NextResponse.json(
        { error: 'Dedicatoria no encontrada' },
        { status: 404 }
      );
    }

    // Verificar si ya tiene like
    const hasLiked = dedication.likes.some(
      (like: any) => like.userId.toString() === userId
    );

    if (hasLiked) {
      // Quitar like
      await dedication.removeLike(userId);

      return NextResponse.json({
        message: 'Like eliminado',
        liked: false,
        likesCount: dedication.likes.length,
      });
    } else {
      // Agregar like
      await dedication.addLike(userId);

      // Solo enviar notificación si no es el autor dándose like a sí mismo
      if (dedication.userId._id.toString() !== userId) {
        try {
          await Notification.create({
            userId: dedication.userId._id,
            fromUserId: userId,
            type: 'DEDICATION_LIKE',
            dedicationId: dedicationId,
            message: `Le gustó tu dedicatoria para ${dedication.candidateId.name}`,
          });
        } catch (error) {
          console.error('Error creating like notification:', error);
          // No fallar el like si la notificación falla
        }
      }

      return NextResponse.json({
        message: 'Like agregado',
        liked: true,
        likesCount: dedication.likes.length,
      });
    }
  } catch (error) {
    console.error('Error handling like:', error);
    return NextResponse.json(
      { error: 'Error al procesar el like' },
      { status: 500 }
    );
  }
}

// GET - Obtener usuarios que dieron like
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id: dedicationId } = await params;

    const dedication = await Dedication.findById(dedicationId)
      .populate('likes.userId', 'name image team')
      .lean();

    if (!dedication || !(dedication as any).isActive) {
      return NextResponse.json(
        { error: 'Dedicatoria no encontrada' },
        { status: 404 }
      );
    }

    const likes = (dedication as any).likes.map((like: any) => ({
      user: like.userId,
      likedAt: like.likedAt,
    }));

    return NextResponse.json({
      likes,
      total: likes.length,
    });
  } catch (error) {
    console.error('Error fetching likes:', error);
    return NextResponse.json(
      { error: 'Error al obtener los likes' },
      { status: 500 }
    );
  }
}