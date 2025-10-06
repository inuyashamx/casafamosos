import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SeasonLike from '@/lib/models/SeasonLike';

// GET: Obtener el total de likes de la temporada
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Obtener el total de likes únicos
    const totalLikes = await SeasonLike.countDocuments();

    // Verificar si el usuario actual ya dio like (por IP o fingerprint)
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    const userAgent = request.headers.get('user-agent') || '';
    const fingerprint = `${clientIp}-${userAgent}`;

    const hasLiked = await SeasonLike.exists({ fingerprint });

    return NextResponse.json({
      likes: totalLikes,
      hasLiked: !!hasLiked
    });
  } catch (error) {
    console.error('Error getting season likes:', error);
    return NextResponse.json(
      { error: 'Error al obtener los likes' },
      { status: 500 }
    );
  }
}

// POST: Dar like a la temporada
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Obtener fingerprint del usuario (IP + user agent)
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    const userAgent = request.headers.get('user-agent') || '';
    const fingerprint = `${clientIp}-${userAgent}`;

    // Verificar si ya dio like
    const existingLike = await SeasonLike.findOne({ fingerprint });

    if (existingLike) {
      const totalLikes = await SeasonLike.countDocuments();
      return NextResponse.json({
        message: 'Ya has reaccionado a esta temporada',
        totalLikes,
        alreadyLiked: true
      }, { status: 200 });
    }

    // Crear nuevo like
    const newLike = new SeasonLike({
      fingerprint,
      ip: clientIp,
      userAgent
    });

    await newLike.save();

    const totalLikes = await SeasonLike.countDocuments();

    return NextResponse.json({
      message: '¡Gracias por tu reacción!',
      totalLikes,
      success: true
    });
  } catch (error) {
    console.error('Error adding season like:', error);
    return NextResponse.json(
      { error: 'Error al procesar tu reacción' },
      { status: 500 }
    );
  }
}
