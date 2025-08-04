// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Vote from '@/lib/models/Vote';
import Candidate from '@/lib/models/Candidate';
import Week from '@/lib/models/Week';
import Season from '@/lib/models/Season';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await dbConnect();

    // Obtener parámetros de paginación
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '5'); // 5 semanas por página
    const skip = (page - 1) * limit;

    // Obtener el usuario
    const User = (await import('@/lib/models/User')).default;
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Obtener todas las temporadas activas o completadas
    const seasons = await Season.find({ 
      $or: [{ isActive: true }, { status: 'completed' }] 
    }).sort({ createdAt: -1 });

    const allVoteHistory: any[] = [];

    // Para cada temporada, obtener los votos del usuario
    for (const season of seasons) {
      const votes = await Vote.find({
        userId: user._id,
        seasonId: season._id,
        isValid: true
      })
      .populate('candidateId', 'name photo')
      .populate('weekId', 'weekNumber name startDate endDate')
      .sort({ voteDate: -1 });

      if (votes.length > 0) {
        // Agrupar votos por semana
        const votesByWeek: { [key: string]: any } = {};
        
        votes.forEach(vote => {
          const weekKey = vote.weekId ? vote.weekId._id.toString() : `week-${vote.weekNumber}`;
          
          if (!votesByWeek[weekKey]) {
            votesByWeek[weekKey] = {
              weekNumber: vote.weekNumber,
              weekName: vote.weekId?.name || `Semana ${vote.weekNumber}`,
              weekDate: vote.weekId?.startDate || vote.voteDate,
              totalPoints: 0,
              votes: []
            };
          }
          
          votesByWeek[weekKey].totalPoints += vote.points;
          votesByWeek[weekKey].votes.push({
            candidateId: vote.candidateId._id,
            candidateName: vote.candidateId.name,
            candidatePhoto: vote.candidateId.photo,
            points: vote.points,
            voteDate: vote.voteDate
          });
        });

        allVoteHistory.push({
          seasonId: season._id,
          seasonName: season.name,
          seasonYear: season.year,
          weeks: Object.values(votesByWeek).sort((a: any, b: any) => b.weekNumber - a.weekNumber)
        });
      }
    }

    // Aplanar todas las semanas de todas las temporadas
    const allWeeks: any[] = [];
    allVoteHistory.forEach(season => {
      season.weeks.forEach(week => {
        allWeeks.push({
          ...week,
          seasonId: season.seasonId,
          seasonName: season.seasonName,
          seasonYear: season.seasonYear
        });
      });
    });

    // Aplicar paginación
    const totalWeeks = allWeeks.length;
    const totalPages = Math.ceil(totalWeeks / limit);
    const paginatedWeeks = allWeeks.slice(skip, skip + limit);

    // Agrupar las semanas paginadas por temporada
    const voteHistory: any[] = [];
    const seasonMap: { [key: string]: any } = {};

    paginatedWeeks.forEach(week => {
      if (!seasonMap[week.seasonId]) {
        seasonMap[week.seasonId] = {
          seasonId: week.seasonId,
          seasonName: week.seasonName,
          seasonYear: week.seasonYear,
          weeks: []
        };
      }
      seasonMap[week.seasonId].weeks.push({
        weekNumber: week.weekNumber,
        weekName: week.weekName,
        weekDate: week.weekDate,
        totalPoints: week.totalPoints,
        votes: week.votes
      });
    });

    Object.values(seasonMap).forEach(season => {
      voteHistory.push(season);
    });

    return NextResponse.json({
      success: true,
      voteHistory,
      pagination: {
        currentPage: page,
        totalPages,
        totalWeeks,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      }
    });

  } catch (error) {
    console.error('Error obteniendo historial de votos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 