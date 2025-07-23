import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { WeekService } from '@/lib/services/weekService';
import { SeasonService } from '@/lib/services/seasonService';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import Vote from '@/lib/models/Vote';
import Candidate from '@/lib/models/Candidate';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const seasonId = searchParams.get('seasonId');

    // Obtener temporada activa si no se especifica
    const activeSeason = seasonId ? 
      await SeasonService.getSeasonById(seasonId) : 
      await SeasonService.getActiveSeason();

    if (!activeSeason) {
      return NextResponse.json({ error: 'No hay temporada activa' }, { status: 404 });
    }

    if (action === 'nominees') {
      // Obtener nominados de la semana activa
      const activeWeek = await WeekService.getActiveWeek(activeSeason._id.toString());
      if (!activeWeek) {
        return NextResponse.json({ nominees: [], message: 'No hay votación activa' });
      }

      // Obtener resultados actualizados
      const weekWithResults = await WeekService.getWeekResults(activeWeek._id.toString());
      
      const nominees = weekWithResults.nominees.map((nominee: any) => {
        const candidate = nominee.candidateId;
        const stats = weekWithResults.results.votingStats.find(
          (stat: any) => stat.candidateId.toString() === candidate._id.toString()
        );

        return {
          id: candidate._id,
          name: candidate.name,
          photo: candidate.photo,
          votes: stats?.votes || 0,
          percentage: stats?.percentage || 0,
        };
      });

      return NextResponse.json({
        nominees,
        week: {
          id: weekWithResults._id,
          weekNumber: weekWithResults.weekNumber,
          name: weekWithResults.name,
          votingEndDate: weekWithResults.votingEndDate,
          isActive: weekWithResults.isVotingActive,
        },
        season: {
          id: activeSeason._id,
          name: activeSeason.name,
          year: activeSeason.year,
        }
      });
    }

    if (action === 'points') {
      // Obtener puntos disponibles del usuario
      await dbConnect();
      const user = await User.findById((session.user as any).id);
      if (!user) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
      }

      const availablePoints = user.getAvailablePoints();
      const activeWeek = await WeekService.getActiveWeek(activeSeason._id.toString());
      
      let usedPoints = 0;
      if (activeWeek) {
        const userVotes = await Vote.find({
          userId: user._id,
          weekId: activeWeek._id,
          isValid: true
        });
        usedPoints = userVotes.reduce((sum, vote) => sum + vote.points, 0);
      }

      return NextResponse.json({
        totalPoints: user.dailyPoints,
        availablePoints: availablePoints - usedPoints,
        usedPoints,
        lastReset: user.lastPointsReset,
      });
    }

    if (action === 'history') {
      // Obtener historial de votos del usuario
      await dbConnect();
      const votes = await Vote.find({
        userId: (session.user as any).id,
        seasonId: activeSeason._id,
        isValid: true
      })
      .populate('candidateId', 'name photo')
      .populate('weekId', 'weekNumber name')
      .sort({ voteDate: -1 })
      .limit(50);

      return NextResponse.json(votes);
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });

  } catch (error: any) {
    console.error('Error en GET /api/vote:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await dbConnect();
    const data = await request.json();
    const { votes } = data; // Array de { candidateId, points }

    if (!votes || !Array.isArray(votes) || votes.length === 0) {
      return NextResponse.json({ error: 'Votos requeridos' }, { status: 400 });
    }

    // Obtener temporada activa
    const activeSeason = await SeasonService.getActiveSeason();
    if (!activeSeason) {
      return NextResponse.json({ error: 'No hay temporada activa' }, { status: 404 });
    }

    // Obtener semana activa
    const activeWeek = await WeekService.getActiveWeek(activeSeason._id.toString());
    if (!activeWeek) {
      return NextResponse.json({ error: 'No hay votación activa' }, { status: 404 });
    }

    // Verificar que la votación esté activa
    if (!activeWeek.isVotingActive) {
      return NextResponse.json({ error: 'La votación no está activa' }, { status: 400 });
    }

    // Obtener usuario
    const user = await User.findById((session.user as any).id);
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Verificar puntos disponibles
    const availablePoints = user.getAvailablePoints();
    const existingVotes = await Vote.find({
      userId: user._id,
      weekId: activeWeek._id,
      isValid: true
    });
    const usedPoints = existingVotes.reduce((sum, vote) => sum + vote.points, 0);
    const totalPointsToUse = votes.reduce((sum, vote) => sum + vote.points, 0);

    if (usedPoints + totalPointsToUse > availablePoints) {
      return NextResponse.json({ 
        error: 'No tienes suficientes puntos disponibles',
        available: availablePoints - usedPoints,
        requested: totalPointsToUse
      }, { status: 400 });
    }

    // Verificar que todos los candidatos estén nominados
    const nomineeIds = activeWeek.nominees.map((n: any) => n.candidateId.toString());
    for (const vote of votes) {
      if (!nomineeIds.includes(vote.candidateId)) {
        return NextResponse.json({ 
          error: 'Uno o más candidatos no están nominados esta semana' 
        }, { status: 400 });
      }
    }

    // Crear votos
    const votePromises = votes.map(async (vote: any) => {
      const newVote = new Vote({
        userId: user._id,
        candidateId: vote.candidateId,
        seasonId: activeSeason._id,
        weekId: activeWeek._id,
        weekNumber: activeWeek.weekNumber,
        points: vote.points,
        metadata: {
          userAgent: request.headers.get('user-agent'),
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        }
      });
      return await newVote.save();
    });

    const savedVotes = await Promise.all(votePromises);

    // Actualizar estadísticas de la semana
    await WeekService.updateWeekResults(activeWeek._id.toString());

    // Actualizar puntos usados del usuario
    user.usedPoints += totalPointsToUse;
    await user.save();

    return NextResponse.json({
      success: true,
      votes: savedVotes,
      pointsUsed: totalPointsToUse,
      remainingPoints: availablePoints - usedPoints - totalPointsToUse,
    });

  } catch (error: any) {
    console.error('Error en POST /api/vote:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 