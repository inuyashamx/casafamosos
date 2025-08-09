import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Vote from '@/lib/models/Vote';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(10, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    // Data pipeline: agrupar por usuario y sumar puntos totales en todos los tiempos (votos válidos)
    const dataPipeline: any[] = [
      { $match: { isValid: true } },
      {
        $group: {
          _id: '$userId',
          totalPoints: { $sum: '$points' },
          voteCount: { $sum: 1 },
          lastVoteAt: { $max: '$voteDate' },
        },
      },
      { $sort: { totalPoints: -1, lastVoteAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          user: {
            id: { $ifNull: ['$user._id', '$_id'] },
            name: { $ifNull: ['$user.name', 'Usuario'] },
            image: '$user.image',
            email: '$user.email',
            team: '$user.team',
          },
          totalPoints: 1,
          voteCount: 1,
          lastVoteAt: 1,
        },
      },
    ];

    const countPipeline: any[] = [
      { $match: { isValid: true } },
      { $group: { _id: '$userId' } },
      { $count: 'total' },
    ];

    const [rows, countResult] = await Promise.all([
      (Vote as any).aggregate(dataPipeline),
      (Vote as any).aggregate(countPipeline),
    ]);

    const total = countResult?.[0]?.total || 0;
    const hasMore = skip + rows.length < total;

    return NextResponse.json({
      page,
      limit,
      total,
      hasMore,
      items: rows.map((r: any, index: number) => ({
        rank: skip + index + 1,
        user: {
          id: r.user.id?.toString?.() || r.user.id,
          name: r.user.name,
          image: r.user.image || null,
          email: r.user.email || null,
          team: r.user.team || null,
        },
        totalPoints: r.totalPoints,
        voteCount: r.voteCount,
        lastVoteAt: r.lastVoteAt,
      })),
    });
  } catch (error: any) {
    console.error('Error en GET /api/ranking/users:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}


