import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import GlobalRanking from '@/lib/models/GlobalRanking';
import Season from '@/lib/models/Season';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Obtener temporada activa
    const activeSeason = await Season.findOne({ isActive: true });
    if (!activeSeason) {
      return NextResponse.json(
        { error: 'No hay temporada activa' },
        { status: 404 }
      );
    }

    // Obtener estadísticas globales detalladas
    const globalStats = await GlobalRanking.getGlobalStats(activeSeason._id);

    // Obtener total de rankings para contexto
    const totalRankings = await GlobalRanking.countDocuments({
      seasonId: activeSeason._id,
    });

    // Obtener algunos rankings recientes para mostrar actividad
    const recentUpdates = await GlobalRanking.find({
      seasonId: activeSeason._id,
    })
      .populate('userId', 'name team')
      .sort({ lastUpdated: -1 })
      .limit(10)
      .select('userId lastUpdated updateCount');

    return NextResponse.json({
      season: {
        id: activeSeason._id,
        name: activeSeason.name,
        year: activeSeason.year,
      },
      globalStats: globalStats.stats,
      totalParticipants: globalStats.totalParticipants,
      totalRankings,
      recentActivity: recentUpdates.map(update => ({
        user: (update.userId as any)?.name || 'Usuario',
        team: (update.userId as any)?.team,
        lastUpdated: update.lastUpdated,
        updateCount: update.updateCount,
      })),
    });
  } catch (error) {
    console.error('Error fetching global results:', error);
    return NextResponse.json(
      { error: 'Error al obtener resultados globales' },
      { status: 500 }
    );
  }
}