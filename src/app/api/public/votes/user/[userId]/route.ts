import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Vote from '@/lib/models/Vote';
import mongoose from 'mongoose';
import { SeasonService } from '@/lib/services/seasonService';
import { WeekService } from '@/lib/services/weekService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await dbConnect();

    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const weekId = searchParams.get('weekId');

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: 'ID de usuario inválido' },
        { status: 400 }
      );
    }

    // Si no se especifica weekId, obtener la semana actual
    let currentWeekId = weekId;
    if (!currentWeekId) {
      const activeSeason = await SeasonService.getActiveSeason();
      if (activeSeason) {
        const activeWeek = await WeekService.getActiveWeek(activeSeason._id.toString());
        if (activeWeek) {
          currentWeekId = activeWeek._id.toString();
        }
      }
    }

    // Construir filtro base
    const matchFilter: any = {
      userId: new mongoose.Types.ObjectId(userId),
      isValid: true
    };

    // Si hay weekId, filtrar solo por esa semana
    if (currentWeekId) {
      matchFilter.weekId = new mongoose.Types.ObjectId(currentWeekId);
    }

    // Agregación para obtener votos agrupados por semana
    const userHistory = await Vote.aggregate([
      {
        $match: matchFilter
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

    // Calcular totales generales (también filtrados por weekId si existe)
    const totalStats = await Vote.aggregate([
      {
        $match: matchFilter
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