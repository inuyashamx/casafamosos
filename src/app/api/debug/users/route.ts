import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import Vote from '@/lib/models/Vote';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar si es admin
    const user = await User.findById((session.user as any).id);
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'points-status') {
      // Obtener estado de puntos de todos los usuarios
      const users = await User.find({}).select('email name dailyPoints usedPointsToday lastPointsReset lastVoteDate');
      
      const usersWithStatus = [];
      
      for (const user of users) {
        // Obtener último voto del usuario
        const lastVote = await Vote.findOne({
          userId: user._id,
          isValid: true
        }).sort({ voteDate: -1 });
        
        // Calcular puntos disponibles con nueva lógica
        const availablePoints = await user.checkAndResetDailyPoints();
        
        usersWithStatus.push({
          id: user._id,
          email: user.email,
          name: user.name,
          dailyPoints: user.dailyPoints,
          usedPointsToday: user.usedPointsToday,
          availablePoints: availablePoints,
          lastPointsReset: user.lastPointsReset,
          lastVoteDate: user.lastVoteDate,
          lastVote: lastVote ? {
            date: lastVote.voteDate,
            points: lastVote.points,
            candidateId: lastVote.candidateId
          } : null
        });
      }

      return NextResponse.json({
        users: usersWithStatus,
        summary: {
          totalUsers: usersWithStatus.length,
          today: new Date().toDateString()
        }
      });
    }

    if (action === 'test-user') {
      const userId = searchParams.get('userId');
      if (!userId) {
        return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
      }
      
      const testUser = await User.findById(userId);
      if (!testUser) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
      }
      
      // Obtener último voto
      const lastVote = await Vote.findOne({
        userId: testUser._id,
        isValid: true
      }).sort({ voteDate: -1 });
      
      // Probar nueva lógica
      const availablePoints = await testUser.checkAndResetDailyPoints();
      
      return NextResponse.json({
        user: {
          id: testUser._id,
          email: testUser.email,
          name: testUser.name,
          dailyPoints: testUser.dailyPoints,
          usedPointsToday: testUser.usedPointsToday,
          availablePoints: availablePoints
        },
        lastVote: lastVote ? {
          date: lastVote.voteDate,
          points: lastVote.points,
          candidateId: lastVote.candidateId
        } : null,
        today: new Date().toDateString()
      });
    }

    if (action === 'test-points') {
      // Probar el sistema de puntos
      const users = await User.find({}).limit(5);
      const results = [];
      
      for (const user of users) {
        const availablePoints = await user.checkAndResetDailyPoints();
        results.push({
          email: user.email,
          availablePoints,
          dailyPoints: user.dailyPoints,
          usedPointsToday: user.usedPointsToday,
          lastPointsReset: user.lastPointsReset
        });
      }
      
      return NextResponse.json({
        message: 'Test de puntos completado',
        results
      });
    }

    if (action === 'debug-points') {
      // Debug detallado del sistema de puntos
      const Vote = mongoose.model('Vote');
      const Season = mongoose.model('Season');
      
      // Obtener temporada activa
      const activeSeason = await Season.findOne({ isActive: true });
      if (!activeSeason) {
        return NextResponse.json({ error: 'No hay temporada activa' });
      }
      
      const user = await User.findById((session.user as any).id);
      if (!user) {
        return NextResponse.json({ error: 'Usuario no encontrado' });
      }
      
      // 1. Buscar último voto del usuario en temporada activa
      const lastVote = await Vote.findOne({ 
        userId: user._id,
        seasonId: activeSeason._id,
        isValid: true 
      }).sort({ voteDate: -1 });
      
      // 2. Obtener fecha de hoy
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      // 3. Buscar votos de hoy
      const todayVotes = await Vote.find({
        userId: user._id,
        seasonId: activeSeason._id,
        voteDate: {
          $gte: startOfDay,
          $lt: endOfDay
        },
        isValid: true
      });
      
      // 4. Calcular puntos usados hoy
      const usedPointsToday = todayVotes.reduce((sum, vote) => sum + vote.points, 0);
      
      // 5. Comparar fechas
      let lastVoteDateNormalized = null;
      let todayNormalized = null;
      let isDifferentDay = false;
      
      if (lastVote) {
        const lastVoteDate = new Date(lastVote.voteDate);
        lastVoteDateNormalized = new Date(lastVoteDate.getFullYear(), lastVoteDate.getMonth(), lastVoteDate.getDate());
        todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        isDifferentDay = lastVoteDateNormalized.getTime() !== todayNormalized.getTime();
      }
      
      return NextResponse.json({
        debug: {
          user: {
            email: user.email,
            dailyPoints: user.dailyPoints,
            usedPointsToday: user.usedPointsToday
          },
          season: {
            id: activeSeason._id,
            name: activeSeason.name
          },
          lastVote: lastVote ? {
            id: lastVote._id,
            date: lastVote.voteDate,
            points: lastVote.points,
            candidate: lastVote.candidateId
          } : null,
          todayVotes: todayVotes.map(vote => ({
            id: vote._id,
            date: vote.voteDate,
            points: vote.points,
            candidate: vote.candidateId
          })),
          dateComparison: {
            lastVoteDateNormalized: lastVoteDateNormalized?.toISOString(),
            todayNormalized: todayNormalized?.toISOString(),
            isDifferentDay,
            startOfDay: startOfDay.toISOString(),
            endOfDay: endOfDay.toISOString()
          },
          calculation: {
            usedPointsToday,
            availablePoints: Math.max(0, user.dailyPoints - usedPointsToday),
            shouldReset: !lastVote || isDifferentDay
          }
        }
      });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });

  } catch (error: any) {
    console.error('Error en debug users:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 