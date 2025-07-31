import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import Vote from '@/lib/models/Vote';
import Candidate from '@/lib/models/Candidate';
import Season from '@/lib/models/Season';
import Week from '@/lib/models/Week';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar si es admin
    await dbConnect();
    const user = await User.findById((session.user as any).id);
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Obtener temporada activa
    const activeSeason = await Season.findOne({ isActive: true });
    if (!activeSeason) {
      return NextResponse.json({
        totalUsers: 0,
        totalVotes: 0,
        totalCandidates: 0,
        totalNominees: 0,
        activeSeason: null
      });
    }

    // Obtener semana activa
    const activeWeek = await Week.findOne({ 
      seasonId: activeSeason._id,
      isVotingActive: true 
    });

    // Estadísticas generales
    const totalUsers = await User.countDocuments();
    const totalVotes = await Vote.countDocuments({ isValid: true });
    const totalNominados = await Vote.distinct('candidateId', { isValid: true }).then(candidates => candidates.length);
    
    // Total de candidatos
    const totalCandidates = await Candidate.countDocuments();

    // Estadísticas de la temporada activa
    const seasonStats = {
      seasonVotes: await Vote.countDocuments({ 
        seasonId: activeSeason._id,
        isValid: true 
      }),
      seasonUsers: await User.countDocuments(), // Todos los usuarios registrados
      seasonCandidates: await Vote.distinct('candidateId', { 
        seasonId: activeSeason._id,
        isValid: true 
      }).then(candidates => candidates.length)
    };

    // Estadísticas de la semana activa
    let weekStats = null;
    if (activeWeek) {
      weekStats = {
        weekVotes: await Vote.countDocuments({ 
          weekId: activeWeek._id,
          isValid: true 
        }),
        weekUsers: await Vote.distinct('userId', { 
          weekId: activeWeek._id,
          isValid: true 
        }).then(users => users.length), // Usuarios que han votado esta semana
        weekNominees: activeWeek.nominees?.length || 0
      };
    }

    return NextResponse.json({
      totalUsers,
      totalVotes,
      totalCandidates,
      totalNominados,
      activeSeason: {
        id: activeSeason._id,
        name: activeSeason.name,
        year: activeSeason.year
      },
      seasonStats,
      weekStats,
      activeWeek: activeWeek ? {
        id: activeWeek._id,
        weekNumber: activeWeek.weekNumber,
        name: activeWeek.name,
        isVotingActive: activeWeek.isVotingActive
      } : null
    });

  } catch (error: any) {
    console.error('Error obteniendo estadísticas:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 