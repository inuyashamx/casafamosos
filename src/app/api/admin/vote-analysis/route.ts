import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import Vote from '@/lib/models/Vote';
import VoteLog from '@/lib/models/VoteLog';
import { WeekService } from '@/lib/services/weekService';
import { SeasonService } from '@/lib/services/seasonService';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await dbConnect();

    // Verificar si es admin
    const user = await User.findById((session.user as any).id);
    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'summary') {
      // Obtener resumen general de votos
      const activeSeason = await SeasonService.getActiveSeason();
      if (!activeSeason) {
        return NextResponse.json({ error: 'No hay temporada activa' }, { status: 404 });
      }

      const activeWeek = await WeekService.getActiveWeek(activeSeason._id.toString());
      if (!activeWeek) {
        return NextResponse.json({ error: 'No hay semana activa' }, { status: 404 });
      }

      const weekStart = new Date(activeWeek.votingStartDate);
      const weekEnd = new Date(activeWeek.votingEndDate);

      // Estadísticas generales
      const [
        totalVotes,
        totalVoters,
        totalPoints,
        candidateStats,
        hourlyDistribution,
        deviceStats
      ] = await Promise.all([
        Vote.countDocuments({
          weekId: activeWeek._id,
          isValid: true
        }),
        Vote.distinct('userId', {
          weekId: activeWeek._id,
          isValid: true
        }),
        Vote.aggregate([
          { $match: { weekId: activeWeek._id, isValid: true } },
          { $group: { _id: null, total: { $sum: '$points' } } }
        ]),
        Vote.aggregate([
          { $match: { weekId: activeWeek._id, isValid: true } },
          {
            $group: {
              _id: '$candidateId',
              votes: { $sum: 1 },
              points: { $sum: '$points' },
              voters: { $addToSet: '$userId' }
            }
          },
          {
            $lookup: {
              from: 'candidates',
              localField: '_id',
              foreignField: '_id',
              as: 'candidate'
            }
          },
          { $sort: { points: -1 } }
        ]),
        Vote.aggregate([
          { $match: { weekId: activeWeek._id, isValid: true } },
          {
            $group: {
              _id: { $hour: '$voteDate' },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id': 1 } }
        ]),
        VoteLog.aggregate([
          { $match: { weekId: activeWeek._id } },
          {
            $group: {
              _id: '$deviceFingerprint.hash',
              users: { $addToSet: '$userId' },
              votes: { $sum: 1 }
            }
          },
          { $match: { 'users.1': { $exists: true } } } // Dispositivos con múltiples usuarios
        ])
      ]);

      return NextResponse.json({
        week: {
          id: activeWeek._id,
          name: activeWeek.name,
          weekNumber: activeWeek.weekNumber,
          votingStartDate: activeWeek.votingStartDate,
          votingEndDate: activeWeek.votingEndDate
        },
        summary: {
          totalVotes,
          totalVoters: totalVoters.length,
          totalPoints: totalPoints[0]?.total || 0,
          averagePointsPerVote: totalVotes > 0 ? Math.round((totalPoints[0]?.total || 0) / totalVotes) : 0,
          multiDeviceUsers: deviceStats.length
        },
        candidateStats: candidateStats.map(stat => ({
          ...stat,
          candidate: stat.candidate[0] || { name: 'Unknown', _id: stat._id },
          uniqueVoters: stat.voters.length
        })),
        hourlyDistribution,
        deviceStats
      });
    }

    // Obtener votos detallados con filtros
    const weekId = searchParams.get('weekId');
    const candidateId = searchParams.get('candidateId');
    const userId = searchParams.get('userId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const suspicious = searchParams.get('suspicious');
    const limit = parseInt(searchParams.get('limit') || '100');
    const page = parseInt(searchParams.get('page') || '1');

    // Construir query
    const query: any = {};

    if (weekId) {
      query.weekId = weekId;
    } else {
      // Por defecto, semana activa
      const activeSeason = await SeasonService.getActiveSeason();
      if (activeSeason) {
        const activeWeek = await WeekService.getActiveWeek(activeSeason._id.toString());
        if (activeWeek) {
          query.weekId = activeWeek._id;
        }
      }
    }

    if (candidateId) {
      query.candidateId = candidateId;
    }

    if (userId) {
      query.userId = userId;
    }

    if (dateFrom || dateTo) {
      query.voteDate = {};
      if (dateFrom) query.voteDate.$gte = new Date(dateFrom);
      if (dateTo) query.voteDate.$lte = new Date(dateTo);
    }

    // Si se pide solo votos sospechosos, usar VoteLog en lugar de Vote
    if (suspicious === 'true') {
      const suspiciousQuery = { ...query };
      if (suspiciousQuery.weekId) {
        suspiciousQuery.weekId = suspiciousQuery.weekId;
      }

      // Cambiar campos para VoteLog
      if (suspiciousQuery.voteDate) {
        suspiciousQuery.votedAt = suspiciousQuery.voteDate;
        delete suspiciousQuery.voteDate;
      }

      // Agregar condiciones de sospecha
      suspiciousQuery.$or = [
        { 'suspiciousFactors.multipleAccountsSameDevice': true },
        { 'suspiciousFactors.rapidVoting': true },
        { 'suspiciousFactors.unusualTime': true }
      ];

      const suspiciousLogs = await VoteLog.find(suspiciousQuery)
        .sort({ votedAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit);

      const total = await VoteLog.countDocuments(suspiciousQuery);

      return NextResponse.json({
        votes: suspiciousLogs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        suspicious: true
      });
    }

    // Obtener votos normales
    const votes = await Vote.find(query)
      .populate('userId', 'name email')
      .populate('candidateId', 'name photo')
      .sort({ voteDate: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Vote.countDocuments(query);

    // Enriquecer con datos de logs si están disponibles
    const enrichedVotes = await Promise.all(votes.map(async (vote) => {
      const log = await VoteLog.findOne({
        userId: vote.userId._id,
        candidateId: vote.candidateId._id,
        weekId: vote.weekId,
        votedAt: {
          $gte: new Date(vote.voteDate.getTime() - 5000), // 5 segundos antes
          $lte: new Date(vote.voteDate.getTime() + 5000)  // 5 segundos después
        }
      });

      return {
        ...vote.toObject(),
        log: log ? {
          timeOnPage: log.timeOnPage,
          ip: log.ip,
          deviceFingerprint: log.deviceFingerprint,
          suspiciousFactors: log.suspiciousFactors
        } : null
      };
    }));

    return NextResponse.json({
      votes: enrichedVotes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      suspicious: false
    });

  } catch (error) {
    console.error('Error en /api/admin/vote-analysis:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}