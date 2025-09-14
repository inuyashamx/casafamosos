import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Vote from '@/lib/models/Vote';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await dbConnect();

    const { userId } = await params;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: 'ID de usuario inválido' },
        { status: 400 }
      );
    }

    // Agregación para obtener votos agrupados por semana
    const userHistory = await Vote.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          isValid: true
        }
      },
      {
        $lookup: {
          from: 'candidates',
          localField: 'candidateId',
          foreignField: '_id',
          as: 'candidate'
        }
      },
      {
        $unwind: '$candidate'
      },
      {
        $lookup: {
          from: 'weeks',
          localField: 'weekId',
          foreignField: '_id',
          as: 'week'
        }
      },
      {
        $unwind: '$week'
      },
      {
        $group: {
          _id: {
            weekId: '$weekId',
            weekNumber: '$weekNumber',
            weekName: '$week.name'
          },
          votes: {
            $push: {
              candidateId: '$candidateId',
              candidateName: '$candidate.name',
              points: '$points',
              voteDate: '$voteDate'
            }
          },
          totalPoints: { $sum: '$points' },
          voteCount: { $sum: 1 },
          firstVoteDate: { $min: '$voteDate' },
          lastVoteDate: { $max: '$voteDate' }
        }
      },
      {
        $sort: { '_id.weekNumber': -1 }
      }
    ]);

    // Calcular totales generales
    const totalStats = await Vote.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          isValid: true
        }
      },
      {
        $group: {
          _id: null,
          totalVotes: { $sum: 1 },
          totalPoints: { $sum: '$points' },
          firstVote: { $min: '$voteDate' },
          lastVote: { $max: '$voteDate' }
        }
      }
    ]);

    return NextResponse.json({
      weeks: userHistory,
      totalStats: totalStats[0] || {
        totalVotes: 0,
        totalPoints: 0,
        firstVote: null,
        lastVote: null
      }
    });

  } catch (error) {
    console.error('Error fetching user vote history:', error);
    return NextResponse.json(
      { error: 'Error al obtener el historial de votos' },
      { status: 500 }
    );
  }
}