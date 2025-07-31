import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import Vote from '@/lib/models/Vote';

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

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });

  } catch (error: any) {
    console.error('Error en debug users:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 