import { NextRequest, NextResponse } from 'next/server';
import { WeekService } from '@/lib/services/weekService';
import { SeasonService } from '@/lib/services/seasonService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('seasonId');

    // Obtener temporada activa si no se especifica
    const activeSeason = seasonId ? 
      await SeasonService.getSeasonById(seasonId) : 
      await SeasonService.getActiveSeason();

    if (!activeSeason) {
      return NextResponse.json({ 
        nominees: [], 
        week: null,
        season: null,
        message: 'No hay temporada activa' 
      });
    }

    // Obtener la semana actual basándose en las fechas, sin importar el estado
    const now = new Date();
    let activeWeek = await WeekService.getCurrentWeekByDate(activeSeason._id.toString(), now);
    
    // Si no hay semana actual, buscar cualquier semana con nominados
    if (!activeWeek) {
      activeWeek = await WeekService.getNextScheduledWeekWithNominees(activeSeason._id.toString());
    }
    
    if (!activeWeek) {
      return NextResponse.json({ 
        nominees: [], 
        week: null,
        season: {
          id: activeSeason._id,
          name: activeSeason.name,
          year: activeSeason.year,
        },
        message: 'No hay votación activa' 
      });
    }

    // Obtener resultados actualizados
    const weekWithResults = await WeekService.getWeekResults(activeWeek._id.toString());
    
    // Debug: Log para ver qué datos tenemos
    console.log('Week nominees count:', weekWithResults.nominees?.length);
    console.log('Week voting stats count:', weekWithResults.results?.votingStats?.length);
    console.log('Total votes in week results:', weekWithResults.results?.totalVotes);
    
    // Mostrar todos los candidatos que estén en week.nominees, incluso con 0 votos
    const nominees = weekWithResults.nominees
      .filter((nominee: any) => nominee.candidateId) // Filtrar nominados válidos
      .map((nominee: any) => {
        const candidate = nominee.candidateId;
        const stats = weekWithResults.results?.votingStats?.find(
          (stat: any) => stat.candidateId.toString() === candidate._id.toString()
        );

        console.log(`Candidate ${candidate.name}: votes = ${stats?.votes || 0}`);

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
        status: weekWithResults.status,
      },
      season: {
        id: activeSeason._id,
        name: activeSeason.name,
        year: activeSeason.year,
      },
      totalVotes: weekWithResults.results?.totalVotes || 0
    });

  } catch (error) {
    console.error('Error en endpoint público de votación:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      nominees: [],
      week: null,
      season: null
    }, { status: 500 });
  }
} 