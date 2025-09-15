import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Vote from '@/lib/models/Vote';
import { WeekService } from '@/lib/services/weekService';
import { SeasonService } from '@/lib/services/seasonService';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Obtener temporada activa
    const activeSeason = await SeasonService.getActiveSeason();
    if (!activeSeason) {
      return NextResponse.json({ error: 'No hay temporada activa' }, { status: 404 });
    }

    // Buscar la semana activa de manera más eficiente
    // Primero intentar obtener la semana activa directamente
    let activeWeek = await WeekService.getActiveWeek(activeSeason._id.toString());

    // Si no hay semana activa, buscar la más reciente con una sola consulta optimizada
    if (!activeWeek) {
      const weeks = await WeekService.getWeeksBySeason(activeSeason._id.toString());

      // Buscar primero una semana en curso (por fecha)
      const now = new Date();
      activeWeek = weeks.find((w: any) =>
        w.nominees.length > 0 &&
        new Date(w.votingStartDate) <= now &&
        new Date(w.votingEndDate) >= now
      );

      // Si no hay semana en curso, buscar la completada más reciente
      if (!activeWeek) {
        const completedWeeks = weeks.filter((w: any) =>
          w.status === 'completed' && w.nominees.length > 0
        );
        if (completedWeeks.length > 0) {
          activeWeek = completedWeeks[0]; // Ya vienen ordenadas por fecha
        }
      }

      // Si aún no hay semana, buscar la próxima programada
      if (!activeWeek) {
        activeWeek = weeks.find((w: any) =>
          w.status === 'scheduled' && w.nominees.length > 0
        );
      }
    }

    if (!activeWeek) {
      return NextResponse.json({ error: 'No hay votación disponible' }, { status: 404 });
    }

    // Obtener información completa de la semana con resultados
    const weekWithResults = await WeekService.getWeekResultsCached(activeWeek._id.toString());

    // Obtener candidato salvado para excluirlo
    const savedRef: any = weekWithResults.results?.saved?.candidateId;
    const savedId = savedRef ? (savedRef._id ? savedRef._id.toString() : savedRef.toString()) : null;

    // Obtener solo candidatos nominados activos (excluyendo salvado)
    const activeNominees = weekWithResults.nominees
      .filter((nominee: any) => nominee.candidateId)
      .filter((nominee: any) => {
        if (!savedId) return true;
        return nominee.candidateId._id.toString() !== savedId;
      });

    // Extraer IDs de candidatos activos
    const activeCandidateIds = activeNominees.map((nominee: any) => nominee.candidateId._id);

    // Obtener estadísticas de fandoms solo para candidatos nominados activos
    const fandomStats = await Vote.aggregate([
      {
        $match: {
          weekId: activeWeek._id,
          isValid: true,
          candidateId: { $in: activeCandidateIds } // Solo candidatos nominados activos
        }
      },
      {
        $group: {
          _id: '$candidateId',
          totalVotes: { $sum: 1 },
          totalPoints: { $sum: '$points' },
          uniqueVoters: { $addToSet: '$userId' }, // Votantes únicos
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
      {
        $project: {
          candidateId: '$_id',
          candidate: { $arrayElemAt: ['$candidate', 0] },
          totalVotes: 1,
          totalPoints: 1,
          fandomSize: { $size: '$uniqueVoters' }, // Tamaño del fandom
          uniqueVoters: { $size: '$uniqueVoters' }
        }
      },
      { $sort: { fandomSize: -1 } } // Ordenar por tamaño de fandom
    ]);

    // Calcular total de fandoms únicos
    const totalFandoms = fandomStats.reduce((sum, stat) => sum + stat.fandomSize, 0);

    // Calcular porcentajes
    const fandomsWithPercentage = fandomStats.map((stat, index) => ({
      id: stat.candidateId,
      name: stat.candidate?.name || 'Candidato Desconocido',
      photo: stat.candidate?.photo,
      fandomSize: stat.fandomSize,
      totalVotes: stat.totalVotes,
      totalPoints: stat.totalPoints,
      percentage: totalFandoms > 0 ? Math.round((stat.fandomSize / totalFandoms) * 100) : 0,
      position: index + 1
    }));

    // Información del candidato salvado
    const savedCandidate = savedId ? weekWithResults.results?.saved : null;

    return NextResponse.json({
      week: {
        id: activeWeek._id,
        weekNumber: activeWeek.weekNumber,
        name: activeWeek.name,
        isActive: activeWeek.isVotingActive,
        status: activeWeek.status
      },
      season: {
        id: activeSeason._id,
        name: activeSeason.name,
        year: activeSeason.year
      },
      fandoms: fandomsWithPercentage,
      totalFandoms,
      totalCandidates: fandomsWithPercentage.length,
      savedCandidate: savedCandidate ? {
        id: savedCandidate.candidateId._id || savedCandidate.candidateId,
        name: savedCandidate.candidateId.name || 'Candidato Salvado',
        savedAt: savedCandidate.savedAt
      } : null
    });

  } catch (error) {
    console.error('Error en /api/public/fandoms:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}