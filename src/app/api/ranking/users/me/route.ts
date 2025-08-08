import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Vote from '@/lib/models/Vote';
import mongoose from 'mongoose';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await dbConnect();

    const userId = (session.user as any).id;
    const objectUserId = new mongoose.Types.ObjectId(userId);

    // Total del usuario (todos los tiempos, solo votos válidos)
    const userAgg = await (Vote as any).aggregate([
      { $match: { userId: objectUserId, isValid: true } },
      {
        $group: {
          _id: null,
          totalPoints: { $sum: '$points' },
          voteCount: { $sum: 1 },
          lastVoteAt: { $max: '$voteDate' },
        },
      },
    ]);

    const userTotalPoints = userAgg?.[0]?.totalPoints || 0;
    const userVoteCount = userAgg?.[0]?.voteCount || 0;
    const userLastVoteAt = userAgg?.[0]?.lastVoteAt || null;

    // Número de usuarios con más puntos totales
    const higherAgg = await (Vote as any).aggregate([
      { $match: { isValid: true } },
      { $group: { _id: '$userId', totalPoints: { $sum: '$points' } } },
      { $match: { totalPoints: { $gt: userTotalPoints } } },
      { $count: 'num' },
    ]);
    const numHigher = higherAgg?.[0]?.num || 0;

    // Total de usuarios que han votado al menos una vez
    const totalUsersAgg = await (Vote as any).aggregate([
      { $match: { isValid: true } },
      { $group: { _id: '$userId' } },
      { $count: 'total' },
    ]);
    const totalUsers = totalUsersAgg?.[0]?.total || 0;

    const rank = numHigher + 1; // Rank 1 es el que más tiene

    return NextResponse.json({
      rank,
      totalUsers,
      totalPoints: userTotalPoints,
      voteCount: userVoteCount,
      lastVoteAt: userLastVoteAt,
    });
  } catch (error: any) {
    console.error('Error en GET /api/ranking/users/me:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}


