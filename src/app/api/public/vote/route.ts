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
    
    // Si no hay semana actual, buscar semana activa de votación
    if (!activeWeek) {
      activeWeek = await WeekService.getActiveWeek(activeSeason._id.toString());
    }
    
    // Si no hay semana activa, buscar la semana completada más reciente
    if (!activeWeek) {
      const weeks = await WeekService.getWeeksBySeason(activeSeason._id.toString());
      const completedWeeks = weeks.filter((w: any) => w.status === 'completed' && w.nominees.length > 0);
      if (completedWeeks.length > 0) {
        // Obtener la semana completada más reciente
        activeWeek = completedWeeks.sort((a: any, b: any) => new Date(b.votingEndDate).getTime() - new Date(a.votingEndDate).getTime())[0];
      }
    }
    
    // Si aún no hay semana, buscar cualquier semana con nominados
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
    console.log('Week status:', weekWithResults.status);
    console.log('Eliminated candidate info:', weekWithResults.results?.eliminated);
    
    // Mostrar todos los candidatos que estén en week.nominees, excepto el salvado (no puede votarse)
    const savedRef: any = weekWithResults.results?.saved?.candidateId;
    const savedId = savedRef ? (savedRef._id ? savedRef._id.toString() : savedRef.toString()) : null;
    const nominees = weekWithResults.nominees
      .filter((nominee: any) => nominee.candidateId) // Filtrar nominados válidos
      .filter((nominee: any) => {
        // Excluir al candidato salvado de la votación
        if (!savedId) return true;
        return nominee.candidateId._id.toString() !== savedId;
      })
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

    // Obtener información del candidato eliminado si existe
    let eliminatedCandidate = null;
    if (weekWithResults.results?.eliminated?.candidateId) {
      // Primero intentar encontrar en los nominados
      const eliminatedNominee = weekWithResults.nominees.find(
        (nominee: any) => nominee.candidateId._id.toString() === weekWithResults.results.eliminated.candidateId.toString()
      );
      
      if (eliminatedNominee) {
        eliminatedCandidate = {
          id: eliminatedNominee.candidateId._id,
          name: eliminatedNominee.candidateId.name,
          photo: eliminatedNominee.candidateId.photo,
          eliminatedAt: weekWithResults.results.eliminated.eliminatedAt,
        };
      } else if (weekWithResults.results.eliminated.candidateId.name) {
        // Si el candidateId está poblado directamente
        eliminatedCandidate = {
          id: weekWithResults.results.eliminated.candidateId._id || weekWithResults.results.eliminated.candidateId,
          name: weekWithResults.results.eliminated.candidateId.name,
          photo: weekWithResults.results.eliminated.candidateId.photo,
          eliminatedAt: weekWithResults.results.eliminated.eliminatedAt,
        };
      }
    }

    // Obtener información del candidato salvado si existe
    let savedCandidate = null;
    if (weekWithResults.results?.saved?.candidateId) {
      // Primero intentar encontrar en los nominados
      const savedNominee = weekWithResults.nominees.find(
        (nominee: any) => nominee.candidateId._id.toString() === weekWithResults.results.saved.candidateId.toString()
      );
      
      if (savedNominee) {
        savedCandidate = {
          id: savedNominee.candidateId._id,
          name: savedNominee.candidateId.name,
          photo: savedNominee.candidateId.photo,
          savedAt: weekWithResults.results.saved.savedAt,
        };
      } else if (weekWithResults.results.saved.candidateId.name) {
        // Si el candidateId está poblado directamente
        savedCandidate = {
          id: weekWithResults.results.saved.candidateId._id || weekWithResults.results.saved.candidateId,
          name: weekWithResults.results.saved.candidateId.name,
          photo: weekWithResults.results.saved.candidateId.photo,
          savedAt: weekWithResults.results.saved.savedAt,
        };
      }
    }

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
      totalVotes: weekWithResults.results?.totalVotes || 0,
      eliminatedCandidate,
      savedCandidate
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