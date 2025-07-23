import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { VoteService } from '@/lib/services/voteService';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'nominees':
        const season = await VoteService.getCurrentSeason();
        if (!season) {
          return NextResponse.json({ error: 'No hay temporada activa' }, { status: 404 });
        }
        
        const nominees = await VoteService.getNominatedCandidates(season._id.toString());
        return NextResponse.json({ nominees });

      case 'stats':
        const currentSeason = await VoteService.getCurrentSeason();
        if (!currentSeason) {
          return NextResponse.json({ error: 'No hay temporada activa' }, { status: 404 });
        }
        
        const stats = await VoteService.getVotingStats(currentSeason._id.toString());
        return NextResponse.json({ stats });

      case 'points':
        const availablePoints = await VoteService.getUserAvailablePoints((session.user as any).id);
        return NextResponse.json({ availablePoints });

      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error en GET /api/vote:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { votes } = body;

    if (!votes || !Array.isArray(votes)) {
      return NextResponse.json({ error: 'Datos de votación inválidos' }, { status: 400 });
    }

    // Validar formato de votos
    for (const vote of votes) {
      if (!vote.candidateId || typeof vote.points !== 'number' || vote.points <= 0) {
        return NextResponse.json({ error: 'Formato de voto inválido' }, { status: 400 });
      }
    }

    const result = await VoteService.submitVotes((session.user as any).id, votes);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error en POST /api/vote:', error);
    return NextResponse.json({ 
      error: error.message || 'Error interno del servidor' 
    }, { status: 500 });
  }
} 