import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { WeekService } from '@/lib/services/weekService';
import { SeasonService } from '@/lib/services/seasonService';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import Vote from '@/lib/models/Vote';
// import Candidate from '@/lib/models/Candidate';

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

      // NUEVA LÓGICA: Verificar puntos basado en el último voto
      const availablePoints = await user.checkAndResetDailyPoints();
      
      // Obtener información adicional para debugging
      const activeWeek = await WeekService.getActiveWeek(activeSeason._id.toString());
      let usedPoints = 0;
      let lastVoteInfo = null;
      
      if (activeWeek) {
        // CALCULAR PUNTOS USADOS HOY (no toda la semana)
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        
        const userVotesToday = await Vote.find({
          userId: user._id,
          seasonId: activeSeason._id,
          voteDate: {
            $gte: startOfDay,
            $lt: endOfDay
          },
          isValid: true
        });
        usedPoints = userVotesToday.reduce((sum, vote) => sum + vote.points, 0);
        
        // Obtener información del último voto para debugging
        const lastVote = await Vote.findOne({
          userId: user._id,
          isValid: true
        }).sort({ voteDate: -1 });
        
        if (lastVote) {
          lastVoteInfo = {
            date: lastVote.voteDate,
            points: lastVote.points,
            candidate: lastVote.candidateId
          };
        }
      }

      return NextResponse.json({
        totalPoints: user.dailyPoints,
        availablePoints: availablePoints,
        usedPoints,
        lastVoteInfo,
        lastReset: user.lastPointsReset,
        debug: {
          today: new Date().toISOString(),
          startOfDay: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).toISOString(),
          endOfDay: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1).toISOString(),
          votesTodayCount: usedPoints / 60, // Asumiendo que cada voto es de 60 puntos
          seasonId: activeSeason._id.toString()
        }
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

    if (action === 'share-bonus') {
      // Dar puntos extra por compartir la app
      await dbConnect();
      const user = await User.findById((session.user as any).id);
      if (!user) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
      }

      // Verificar si ya recibió el bono hoy
      const today = new Date();
      const lastShareBonus = user.lastShareBonus || new Date(0);
      const lastShareBonusDate = new Date(lastShareBonus);
      
      // Normalizar fechas para comparación (sin horas/minutos/segundos)
      const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const lastShareBonusNormalized = new Date(lastShareBonusDate.getFullYear(), lastShareBonusDate.getMonth(), lastShareBonusDate.getDate());
      
      console.log('Debug share bonus:', {
        today: today.toISOString(),
        lastShareBonus: lastShareBonusDate.toISOString(),
        todayNormalized: todayNormalized.toISOString(),
        lastShareBonusNormalized: lastShareBonusNormalized.toISOString(),
        isSameDay: todayNormalized.getTime() === lastShareBonusNormalized.getTime()
      });
      
      if (todayNormalized.getTime() === lastShareBonusNormalized.getTime()) {
        return NextResponse.json({ 
          error: 'Ya recibiste el bono por compartir hoy. ¡Vuelve mañana!',
          alreadyReceived: true
        }, { status: 400 });
      }

      // Dar 60 puntos extra
      const bonusPoints = 60;
      user.dailyPoints += bonusPoints;
      user.lastShareBonus = today;
      await user.save();

      return NextResponse.json({
        success: true,
        message: `¡Recibiste ${bonusPoints} puntos extra por compartir la app!`,
        bonusPoints,
        newTotalPoints: user.dailyPoints
      });
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

    // NUEVA LÓGICA: Verificar puntos disponibles basado en el último voto
    const availablePoints = await user.checkAndResetDailyPoints();
    const totalPointsToUse = votes.reduce((sum, vote) => sum + vote.points, 0);

    if (totalPointsToUse > availablePoints) {
      return NextResponse.json({ 
        error: 'No tienes suficientes puntos disponibles',
        available: availablePoints,
        requested: totalPointsToUse
      }, { status: 400 });
    }

    // Verificar que todos los candidatos estén nominados
    const nomineeIds = activeWeek.nominees.map((n: any) => n.candidateId._id.toString());
    console.log('Debug - nomineeIds:', nomineeIds);
    console.log('Debug - votes:', votes);
    console.log('Debug - activeWeek.nominees:', activeWeek.nominees);
    
    for (const vote of votes) {
      console.log('Debug - checking vote:', vote.candidateId, 'in nominees:', nomineeIds.includes(vote.candidateId));
      if (!nomineeIds.includes(vote.candidateId)) {
        return NextResponse.json({ 
          error: 'Uno o más candidatos no están nominados esta semana',
          debug: {
            nomineeIds,
            voteCandidateId: vote.candidateId,
            nominees: activeWeek.nominees
          }
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

    // ACTUALIZAR PUNTOS DEL USUARIO
    // Los puntos se calculan dinámicamente basado en el último voto, 
    // pero podemos actualizar lastPointsReset para tracking
    user.lastPointsReset = new Date();
    user.lastVoteDate = new Date(); // Actualizar fecha del último voto
    user.totalVotes += totalPointsToUse; // Incrementar totalVotes con los puntos usados
    await user.save();

    // Actualizar estadísticas de la semana
    await WeekService.updateWeekResults(activeWeek._id.toString());

    return NextResponse.json({
      success: true,
      votes: savedVotes,
      pointsUsed: totalPointsToUse,
      remainingPoints: availablePoints - totalPointsToUse,
    });

  } catch (error: any) {
    console.error('Error en POST /api/vote:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 