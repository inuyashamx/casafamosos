import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Vote from '@/lib/models/Vote';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0');
    const limit = parseInt(searchParams.get('limit') || '50');
    const candidateId = searchParams.get('candidateId');
    const skip = page * limit;

    // Construir filtro
    const filter: any = { isValid: true };
    if (candidateId) {
      filter.candidateId = candidateId;
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