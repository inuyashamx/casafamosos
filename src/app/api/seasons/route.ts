import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SeasonService } from '@/lib/services/seasonService';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('id');
    const action = searchParams.get('action');

    if (seasonId && action === 'stats') {
      const stats = await SeasonService.getSeasonStats(seasonId);
      return NextResponse.json(stats);
    }

    if (seasonId) {
      const season = await SeasonService.getSeasonById(seasonId);
      if (!season) {
        return NextResponse.json({ error: 'Temporada no encontrada' }, { status: 404 });
      }
      return NextResponse.json(season);
    }

    const seasons = await SeasonService.getAllSeasons();
    return NextResponse.json(seasons);

  } catch (error: any) {
    console.error('Error en GET /api/seasons:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const { action, ...seasonData } = data;

    if (action === 'activate') {
      const season = await SeasonService.activateSeason(seasonData.seasonId);
      return NextResponse.json(season);
    }

    if (action === 'complete') {
      const season = await SeasonService.completeSeason(seasonData.seasonId);
      return NextResponse.json(season);
    }

    if (action === 'updateSettings') {
      const season = await SeasonService.updateSeasonSettings(seasonData.seasonId, seasonData.settings);
      return NextResponse.json(season);
    }

    // Crear nueva temporada
    const season = await SeasonService.createSeason({
      name: seasonData.name,
      year: seasonData.year,
      description: seasonData.description,
      startDate: new Date(seasonData.startDate),
      endDate: new Date(seasonData.endDate),
      defaultDailyPoints: seasonData.defaultDailyPoints,
      settings: seasonData.settings,
    });

    return NextResponse.json(season, { status: 201 });

  } catch (error: any) {
    console.error('Error en POST /api/seasons:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const { seasonId, ...updateData } = data;

    const season = await SeasonService.updateSeason(seasonId, updateData);
    if (!season) {
      return NextResponse.json({ error: 'Temporada no encontrada' }, { status: 404 });
    }

    return NextResponse.json(season);

  } catch (error: any) {
    console.error('Error en PUT /api/seasons:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('id');

    if (!seasonId) {
      return NextResponse.json({ error: 'ID de temporada requerido' }, { status: 400 });
    }

    const result = await SeasonService.deleteSeasonWithData(seasonId);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error en DELETE /api/seasons:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 