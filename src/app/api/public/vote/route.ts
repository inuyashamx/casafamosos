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

    // Obtener nominados de la semana activa
    const activeWeek = await WeekService.getActiveWeek(activeSeason._id.toString());
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
    
    // Solo mostrar candidatos que estén realmente en week.nominees
    const nominees = weekWithResults.nominees
      .filter((nominee: any) => nominee.candidateId) // Filtrar nominados válidos
      .map((nominee: any) => {
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