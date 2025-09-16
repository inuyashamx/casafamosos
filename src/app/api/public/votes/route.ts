import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Vote from '@/lib/models/Vote';
import { SeasonService } from '@/lib/services/seasonService';
import { WeekService } from '@/lib/services/weekService';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0');
    const limit = parseInt(searchParams.get('limit') || '50');
    const candidateId = searchParams.get('candidateId');
    const weekId = searchParams.get('weekId');
    const skip = page * limit;

    // Si no se especifica weekId, obtener la semana actual
    let currentWeekId = weekId;
    if (!currentWeekId) {
      const activeSeason = await SeasonService.getActiveSeason();
      if (activeSeason) {
        const activeWeek = await WeekService.getActiveWeek(activeSeason._id.toString());
        if (activeWeek) {
          currentWeekId = activeWeek._id.toString();
        }
      }
    }

    // Construir filtro
    const filter: any = { isValid: true };
    if (candidateId) {
      filter.candidateId = candidateId;
    }
    // Filtrar por semana actual si existe
    if (currentWeekId) {
      filter.weekId = currentWeekId;
    }

    // Contar total de votos válidos
    const total = await Vote.countDocuments(filter);

    // Obtener votos con paginación
    const votes = await Vote.find(filter)
      .populate('userId', 'name')
      .populate('candidateId', 'name')
      .sort({ voteDate: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    // Verificar si hay más páginas
    const hasMore = skip + votes.length < total;

    return NextResponse.json({
      votes,
      hasMore,
      total,
      page,
      limit
    });

  } catch (error) {
    console.error('Error fetching votes:', error);
    return NextResponse.json(
      { error: 'Error al obtener los votos' },
      { status: 500 }
    );
  }
}