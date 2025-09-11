import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import GlobalRanking from '@/lib/models/GlobalRanking';
import Candidate from '@/lib/models/Candidate';
import Season from '@/lib/models/Season';
import User from '@/lib/models/User';

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

    // Obtener candidatos activos
    const candidates = await Candidate.find({
      seasonId: activeSeason._id,
      status: 'active',
      isActive: true,
    }).select('_id name photo bio profession city');

    // Obtener ranking del usuario si está autenticado
    const session = await getServerSession(authOptions);
    let userRanking = null;
    
    if (session?.user?.email) {
      const user = await User.findOne({ email: session.user.email });
      if (user) {
        userRanking = await GlobalRanking.findOne({
          userId: user._id,
          seasonId: activeSeason._id,
        }).populate({
          path: 'rankings.candidateId',
          select: '_id name photo status',
          match: { status: 'active' }
        });
        
        console.log('Usuario encontrado:', user._id);
        console.log('Ranking encontrado:', userRanking ? 'Sí' : 'No');
        if (userRanking) {
          // Filtrar solo los candidatos activos (no null después del populate con match)
          userRanking.rankings = userRanking.rankings.filter((r: any) => r.candidateId !== null);
          console.log('Rankings length:', userRanking.rankings.length);
          console.log('Rankings data:', userRanking.rankings.slice(0, 3));
        }
      }
    }

    // Obtener estadísticas globales
    const globalStats = await GlobalRanking.getGlobalStats(activeSeason._id);

    return NextResponse.json({
      season: {
        id: activeSeason._id,
        name: activeSeason.name,
        year: activeSeason.year,
      },
      candidates,
      userRanking: userRanking ? {
        rankings: userRanking.rankings
          .filter((r: any) => r.candidateId !== null) // Doble verificación para asegurar que no hay nulls
          .map((r: any) => ({
            candidateId: r.candidateId._id || r.candidateId,
            position: r.position
          })),
        updateCount: userRanking.updateCount,
        lastUpdated: userRanking.lastUpdated,
      } : null,
      globalStats,
    });
  } catch (error) {
    console.error('Error fetching global ranking:', error);
    return NextResponse.json(
      { error: 'Error al obtener ranking global' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para guardar tu ranking' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Obtener usuario
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Obtener temporada activa
    const activeSeason = await Season.findOne({ isActive: true });
    if (!activeSeason) {
      return NextResponse.json(
        { error: 'No hay temporada activa' },
        { status: 404 }
      );
    }

    // Obtener datos del request
    const { rankings } = await request.json();
    
    if (!rankings || !Array.isArray(rankings)) {
      return NextResponse.json(
        { error: 'Rankings inválidos' },
        { status: 400 }
      );
    }

    // Validar que todos los candidatos existen y están activos
    const candidateIds = rankings.map((r: any) => r.candidateId);
    const validCandidates = await Candidate.find({
      _id: { $in: candidateIds },
      seasonId: activeSeason._id,
      status: 'active',
      isActive: true,
    });

    if (validCandidates.length !== rankings.length) {
      return NextResponse.json(
        { error: 'Algunos candidatos no son válidos' },
        { status: 400 }
      );
    }

    // Buscar ranking existente o crear uno nuevo
    let globalRanking = await GlobalRanking.findOne({
      userId: user._id,
      seasonId: activeSeason._id,
    });

    if (globalRanking) {
      // Actualizar ranking existente
      globalRanking.rankings = rankings.map((r: any, index: number) => ({
        candidateId: r.candidateId,
        position: index + 1,
      }));
      globalRanking.updateCount += 1;
      globalRanking.lastUpdated = new Date();
      await globalRanking.save();
    } else {
      // Crear nuevo ranking
      globalRanking = await GlobalRanking.create({
        userId: user._id,
        seasonId: activeSeason._id,
        rankings: rankings.map((r: any, index: number) => ({
          candidateId: r.candidateId,
          position: index + 1,
        })),
        updateCount: 1,
        lastUpdated: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Ranking guardado exitosamente',
      updateCount: globalRanking.updateCount,
      lastUpdated: globalRanking.lastUpdated,
    });
  } catch (error) {
    console.error('Error saving global ranking:', error);
    return NextResponse.json(
      { error: 'Error al guardar ranking' },
      { status: 500 }
    );
  }
}