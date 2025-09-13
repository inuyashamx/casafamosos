import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import VoteLog from '@/lib/models/VoteLog';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await dbConnect();

    // Verificar si es admin
    const user = await User.findById((session.user as any).id);
    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'summary') {
      // Obtener resumen de actividad sospechosa
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [
        totalLogs,
        suspiciousLogs,
        multipleAccountsCount,
        newAccountsCount,
        rapidVotingCount,
        deviceStats
      ] = await Promise.all([
        VoteLog.countDocuments({ votedAt: { $gte: oneDayAgo } }),
        VoteLog.countDocuments({
          votedAt: { $gte: oneDayAgo },
          $or: [
            { 'suspiciousFactors.multipleAccountsSameDevice': true },
            { 'suspiciousFactors.newAccount': true },
            { 'suspiciousFactors.rapidVoting': true },
            { 'suspiciousFactors.unusualTime': true }
          ]
        }),
        VoteLog.countDocuments({
          votedAt: { $gte: oneDayAgo },
          'suspiciousFactors.multipleAccountsSameDevice': true
        }),
        VoteLog.countDocuments({
          votedAt: { $gte: oneDayAgo },
          'suspiciousFactors.newAccount': true
        }),
        VoteLog.countDocuments({
          votedAt: { $gte: oneDayAgo },
          'suspiciousFactors.rapidVoting': true
        }),
        VoteLog.aggregate([
          { $match: { votedAt: { $gte: oneWeekAgo } } },
          { $group: {
            _id: '$deviceFingerprint.hash',
            users: { $addToSet: '$userId' },
            count: { $sum: 1 }
          }},
          { $match: { 'users.1': { $exists: true } } }, // Dispositivos con múltiples usuarios
          { $count: 'total' }
        ])
      ]);

      return NextResponse.json({
        summary: {
          totalLogs,
          suspiciousLogs,
          suspiciousPercentage: totalLogs > 0 ? Math.round((suspiciousLogs / totalLogs) * 100) : 0,
          multipleAccountsCount,
          newAccountsCount,
          rapidVotingCount,
          devicesWithMultipleUsers: deviceStats[0]?.total || 0
        }
      });
    }

    // Obtener logs sospechosos detallados
    const limit = parseInt(searchParams.get('limit') || '50');
    const filter = searchParams.get('filter');

    let query: any = {
      $or: [
        { 'suspiciousFactors.multipleAccountsSameDevice': true },
        { 'suspiciousFactors.newAccount': true },
        { 'suspiciousFactors.rapidVoting': true },
        { 'suspiciousFactors.unusualTime': true }
      ]
    };

    if (filter === 'multipleAccounts') {
      query = { 'suspiciousFactors.multipleAccountsSameDevice': true };
    } else if (filter === 'newAccounts') {
      query = { 'suspiciousFactors.newAccount': true };
    } else if (filter === 'rapidVoting') {
      query = { 'suspiciousFactors.rapidVoting': true };
    }

    const logs = await VoteLog.find(query)
      .sort({ votedAt: -1 })
      .limit(limit)
      .populate('userId', 'name email team')
      .populate('candidateId', 'name');

    // Agrupar por dispositivo para detectar patrones
    const deviceGroups = await VoteLog.aggregate([
      { $match: { 'deviceFingerprint.hash': { $exists: true } } },
      { $group: {
        _id: '$deviceFingerprint.hash',
        users: { $addToSet: { userId: '$userId', userName: '$userName', userEmail: '$userEmail' } },
        votes: { $sum: 1 },
        lastVote: { $max: '$votedAt' },
        fingerprint: { $first: '$deviceFingerprint' }
      }},
      { $match: { 'users.1': { $exists: true } } }, // Solo dispositivos con múltiples usuarios
      { $sort: { votes: -1 } },
      { $limit: 20 }
    ]);

    return NextResponse.json({
      logs,
      deviceGroups,
      total: logs.length
    });

  } catch (error) {
    console.error('Error en /api/admin/suspicious:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}