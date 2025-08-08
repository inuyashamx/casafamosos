import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Week from '@/lib/models/Week';
import { SeasonService } from '@/lib/services/seasonService';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(20, Math.max(5, parseInt(searchParams.get('limit') || '10', 10)));
    const seasonId = searchParams.get('seasonId');

    // Obtener temporada activa si no se especifica
    const activeSeason = seasonId
      ? await SeasonService.getSeasonById(seasonId)
      : await SeasonService.getActiveSeason();
    if (!activeSeason) {
      return NextResponse.json({ error: 'No hay temporada activa' }, { status: 404 });
    }

    const skip = (page - 1) * limit;

    const [weeks, totalCount] = await Promise.all([
      Week.find({ seasonId: activeSeason._id })
        .sort({ weekNumber: -1 })
        .skip(skip)
        .limit(limit)
        .populate('results.votingStats.candidateId', 'name photo')
        .lean(),
      Week.countDocuments({ seasonId: activeSeason._id }),
    ]);

    const items = weeks.map((week: any) => {
      const stats = Array.isArray(week.results?.votingStats) ? [...week.results.votingStats] : [];
      stats.sort((a, b) => (b.votes || 0) - (a.votes || 0));
      return {
        id: week._id.toString(),
        weekNumber: week.weekNumber,
        name: week.name,
        votingStartDate: week.votingStartDate,
        votingEndDate: week.votingEndDate,
        results: {
          totalVotes: week.results?.totalVotes || 0,
          votingStats: stats.map((s: any) => ({
            candidateId: s.candidateId?._id?.toString?.() || s.candidateId?.toString?.() || null,
            candidateName: s.candidateId?.name || 'Desconocido',
            candidatePhoto: s.candidateId?.photo || null,
            votes: s.votes || 0,
            percentage: s.percentage || 0,
          })),
          winner: week.results?.winner || null,
        },
      };
    });

    const hasMore = skip + weeks.length < totalCount;

    return NextResponse.json({
      page,
      limit,
      hasMore,
      items,
      season: { id: activeSeason._id, name: activeSeason.name, year: activeSeason.year },
    });
  } catch (error: any) {
    console.error('Error en GET /api/ranking:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}


