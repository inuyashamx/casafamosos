import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Vote from '@/lib/models/Vote';
import mongoose from 'mongoose';

export async function GET(request: NextRequest, context: any) {
  try {
    await dbConnect();
    const { userId } = context?.params || {};
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'userId inválido' }, { status: 400 });
    }

    const objectUserId = new mongoose.Types.ObjectId(userId);

    const agg = await (Vote as any).aggregate([
      { $match: { userId: objectUserId, isValid: true } },
      {
        $group: {
          _id: '$candidateId',
          totalPoints: { $sum: '$points' },
          voteCount: { $sum: 1 },
          lastVoteAt: { $max: '$voteDate' },
        },
      },
      { $sort: { totalPoints: -1, lastVoteAt: -1 } },
      {
        $lookup: {
          from: 'candidates',
          localField: '_id',
          foreignField: '_id',
          as: 'candidate',
        },
      },
      { $unwind: { path: '$candidate', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          candidate: {
            id: { $ifNull: ['$candidate._id', '$_id'] },
            name: { $ifNull: ['$candidate.name', 'Candidato'] },
            photo: '$candidate.photo',
          },
          totalPoints: 1,
          voteCount: 1,
          lastVoteAt: 1,
        },
      },
    ]);

    return NextResponse.json({
      items: agg.map((r: any) => ({
        candidate: {
          id: r.candidate.id?.toString?.() || r.candidate.id,
          name: r.candidate.name,
          photo: r.candidate.photo || null,
        },
        totalPoints: r.totalPoints,
        voteCount: r.voteCount,
        lastVoteAt: r.lastVoteAt,
      })),
    });
  } catch (error: any) {
    console.error('Error en GET /api/ranking/users/[userId]:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}


