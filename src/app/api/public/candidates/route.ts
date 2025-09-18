import { NextRequest, NextResponse } from 'next/server';
import { CandidateService } from '@/lib/services/candidateService';
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
        candidates: [],
        season: null,
        message: 'No hay temporada activa'
      });
    }

    // Obtener candidatos activos (no eliminados)
    const candidates = await CandidateService.getActiveCandidates(activeSeason._id.toString());

    return NextResponse.json({
      candidates,
      season: activeSeason
    });

  } catch (error: any) {
    console.error('Error en GET /api/public/candidates:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}