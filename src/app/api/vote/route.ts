import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { WeekService } from '@/lib/services/weekService';
import { SeasonService } from '@/lib/services/seasonService';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import Vote from '@/lib/models/Vote';
import VoteLog from '@/lib/models/VoteLog';
import { generateFingerprintHash, detectSuspiciousActivity, checkMultipleAccounts, detectCoordinatedVoting } from '@/lib/utils/fingerprint';
import Candidate from '@/lib/models/Candidate';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const seasonId = searchParams.get('seasonId');

    // Obtener temporada activa si no se especifica
    const activeSeason = seasonId ? 
      await SeasonService.getSeasonById(seasonId) : 
      await SeasonService.getActiveSeason();

    if (!activeSeason) {
      return NextResponse.json({ error: 'No hay temporada activa' }, { status: 404 });
    }

    if (action === 'nominees') {
      // Obtener nominados de la semana activa
      const activeWeek = await WeekService.getActiveWeek(activeSeason._id.toString());
      if (!activeWeek) {
        return NextResponse.json({ nominees: [], message: 'No hay votación activa' });
      }

      // Obtener resultados actualizados
      const weekWithResults = await WeekService.getWeekResults(activeWeek._id.toString());

      const savedRef: any = weekWithResults.results?.saved?.candidateId;
      const savedId = savedRef ? (savedRef._id ? savedRef._id.toString() : savedRef.toString()) : null;
      const nominees = weekWithResults.nominees
        .filter((nominee: any) => nominee.candidateId)
        .filter((nominee: any) => !savedId || nominee.candidateId._id.toString() !== savedId)
        .map((nominee: any) => {
          const candidate = nominee.candidateId;
          const stats = weekWithResults.results?.votingStats?.find(
            (stat: any) => stat.candidateId.toString() === candidate._id.toString()
          );

          return {
            id: candidate._id,
            name: candidate.name,
            photo: candidate.photo,
            votes: stats?.votes || 0,
            percentage: stats?.percentage || 0,
          };
        });

      return NextResponse.json({
        nominees,
        week: {
          id: weekWithResults._id,
          weekNumber: weekWithResults.weekNumber,
          name: weekWithResults.name,
          votingEndDate: weekWithResults.votingEndDate,
          isActive: weekWithResults.isVotingActive,
        },
        season: {
          id: activeSeason._id,
          name: activeSeason.name,
          year: activeSeason.year,
        }
      });
    }

    if (action === 'points') {
      // Obtener puntos disponibles del usuario
      await dbConnect();
      const user = await User.findById((session.user as any).id);
      if (!user) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
      }

      // Calcular puntos disponibles del día (base temporada + bono compartir hoy - votos de hoy)
      const availablePoints = await user.checkAndResetDailyPoints();
      
      // Obtener información adicional para debugging
      const activeWeek = await WeekService.getActiveWeek(activeSeason._id.toString());
      let usedPoints = 0;
      let lastVoteInfo = null;
      
      if (activeWeek) {
        // CALCULAR PUNTOS USADOS HOY (no toda la semana)
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        
        const userVotesToday = await Vote.find({
          userId: user._id,
          seasonId: activeSeason._id,
          voteDate: {
            $gte: startOfDay,
            $lt: endOfDay
          },
          isValid: true
        });
        usedPoints = userVotesToday.reduce((sum, vote) => sum + vote.points, 0);
        
        // Obtener información del último voto para debugging
        const lastVote = await Vote.findOne({
          userId: user._id,
          isValid: true
        }).sort({ voteDate: -1 });
        
        if (lastVote) {
          lastVoteInfo = {
            date: lastVote.voteDate,
            points: lastVote.points,
            candidate: lastVote.candidateId
          };
        }
      }

      // totalPoints del día: base + (bono si hoy)
      const today = new Date();
      const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const lastShare = user.lastShareBonus ? new Date(user.lastShareBonus) : null;
      const lastShareNormalized = lastShare ? new Date(lastShare.getFullYear(), lastShare.getMonth(), lastShare.getDate()) : null;
      const hasShareBonusToday = !!lastShareNormalized && lastShareNormalized.getTime() === todayNormalized.getTime();

      const baseDailyPoints = typeof (activeSeason as any).defaultDailyPoints === 'number' ? (activeSeason as any).defaultDailyPoints : 60;
      const dayTotalPoints = baseDailyPoints + (hasShareBonusToday ? 50 : 0);

      return NextResponse.json({
        totalPoints: dayTotalPoints,
        availablePoints: availablePoints,
        usedPoints,
        lastVoteInfo,
        lastReset: user.lastPointsReset,
        debug: {
          today: new Date().toISOString(),
          startOfDay: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).toISOString(),
          endOfDay: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1).toISOString(),
          votesTodayCount: usedPoints / 60, // Asumiendo que cada voto es de 60 puntos
          seasonId: activeSeason._id.toString()
        }
      });
    }

    if (action === 'history') {
      // Obtener historial de votos del usuario
      await dbConnect();
      const votes = await Vote.find({
        userId: (session.user as any).id,
        seasonId: activeSeason._id,
        isValid: true
      })
      .populate('candidateId', 'name photo')
      .populate('weekId', 'weekNumber name')
      .sort({ voteDate: -1 })
      .limit(50);

      return NextResponse.json(votes);
    }

    if (action === 'check-share-bonus') {
      // Solo verificar si puede recibir bonus (sin actualizar)
      await dbConnect();
      const user = await User.findById((session.user as any).id);
      if (!user) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
      }

      const today = new Date();
      const lastShareBonus = user.lastShareBonus || new Date(0);
      const lastShareBonusDate = new Date(lastShareBonus);

      const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const lastShareBonusNormalized = new Date(lastShareBonusDate.getFullYear(), lastShareBonusDate.getMonth(), lastShareBonusDate.getDate());

      const canReceiveBonus = todayNormalized.getTime() !== lastShareBonusNormalized.getTime();

      return NextResponse.json({
        canReceiveBonus,
        lastShareBonus: user.lastShareBonus,
        nextBonusAvailable: canReceiveBonus ? 'now' : new Date(todayNormalized.getTime() + 24 * 60 * 60 * 1000).toISOString()
      });
    }

    if (action === 'share-bonus') {
      // ESTE ENDPOINT AHORA SERA SOLO PARA POST - dar puntos extra por compartir
      return NextResponse.json({
        error: 'Este endpoint debe ser llamado con método POST',
        hint: 'Usa POST para otorgar el bonus, GET con action=check-share-bonus para verificar'
      }, { status: 405 });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });

  } catch (error: any) {
    console.error('Error en GET /api/vote:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await dbConnect();

    // Verificar si es una solicitud de compartir bonus
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'share-bonus') {
      // Dar puntos extra por compartir la app (solo vía POST)
      const user = await User.findById((session.user as any).id);
      if (!user) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
      }

      // Obtener temporada activa para defaultDailyPoints
      const activeSeason = await SeasonService.getActiveSeason();
      if (!activeSeason) {
        return NextResponse.json({ error: 'No hay temporada activa' }, { status: 404 });
      }

      // Verificar si ya recibió el bono hoy
      const today = new Date();
      const lastShareBonus = user.lastShareBonus || new Date(0);
      const lastShareBonusDate = new Date(lastShareBonus);

      // Normalizar fechas para comparación
      const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const lastShareBonusNormalized = new Date(lastShareBonusDate.getFullYear(), lastShareBonusDate.getMonth(), lastShareBonusDate.getDate());

      console.log('Debug share bonus POST:', {
        usuario: user.email,
        today: today.toISOString(),
        lastShareBonus: user.lastShareBonus,
        todayNormalized: todayNormalized.toISOString(),
        lastShareBonusNormalized: lastShareBonusNormalized.toISOString(),
        isSameDay: todayNormalized.getTime() === lastShareBonusNormalized.getTime()
      });

      if (todayNormalized.getTime() === lastShareBonusNormalized.getTime()) {
        return NextResponse.json({
          error: 'Ya recibiste el bono por compartir hoy. ¡Vuelve mañana!',
          alreadyReceived: true,
          nextBonusAvailable: new Date(todayNormalized.getTime() + 24 * 60 * 60 * 1000).toISOString()
        }, { status: 400 });
      }

      // AHORA SÍ: Registrar bono de compartir
      const bonusPoints = 50;
      user.lastShareBonus = today;
      await user.save();

      const baseDailyPoints = typeof activeSeason.defaultDailyPoints === 'number' ? activeSeason.defaultDailyPoints : 60;
      const newDayTotal = baseDailyPoints + bonusPoints;

      console.log('Bonus otorgado a:', user.email, 'fecha guardada:', today.toISOString());

      return NextResponse.json({
        success: true,
        message: `¡Recibiste ${bonusPoints} puntos extra por compartir la app!`,
        bonusPoints,
        newTotalPoints: newDayTotal
      });
    }

    // RESTO DE LA LÓGICA DE VOTACIÓN NORMAL
    const data = await request.json();
    const { votes, fingerprint, timeOnPage, captchaToken } = data; // Array de { candidateId, points } + fingerprint data + captcha

    if (!votes || !Array.isArray(votes) || votes.length === 0) {
      return NextResponse.json({ error: 'Votos requeridos' }, { status: 400 });
    }

    // Obtener temporada activa
    const activeSeason = await SeasonService.getActiveSeason();
    if (!activeSeason) {
      return NextResponse.json({ error: 'No hay temporada activa' }, { status: 404 });
    }

    // Obtener semana activa
    const activeWeek = await WeekService.getActiveWeek(activeSeason._id.toString());
    if (!activeWeek) {
      return NextResponse.json({ error: 'No hay votación activa' }, { status: 404 });
    }

    // Verificar que la votación esté activa
    if (!activeWeek.isVotingActive) {
      return NextResponse.json({ error: 'La votación no está activa' }, { status: 400 });
    }

    // Obtener usuario
    const user = await User.findById((session.user as any).id);
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Generar fingerprint hash
    const deviceHash = fingerprint ? generateFingerprintHash(fingerprint) : null;

    // Obtener votos previos del usuario para análisis de patrones
    const previousVotes = await VoteLog.find({
      userId: user._id,
      votedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Últimas 24 horas
    }).sort({ votedAt: -1 }).limit(10);

    // Detectar actividad sospechosa
    const suspicious = detectSuspiciousActivity(
      timeOnPage || 0,
      new Date(),
      user.createdAt,
      request.headers.get('user-agent') || undefined,
      previousVotes
    );

    // Obtener votos recientes en una ventana de tiempo para detectar coordinación
    const recentVotes = deviceHash ? await VoteLog.find({
      'deviceFingerprint.hash': deviceHash,
      votedAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Últimos 5 minutos
    }) : [];

    // Detectar voto coordinado
    const coordinatedPatterns = deviceHash ? detectCoordinatedVoting(deviceHash, recentVotes, 5) : {
      multipleAccountsCoordinated: false,
      suspiciousVoteDistribution: false,
      identicalVotingPatterns: false
    };

    // Verificar múltiples cuentas en el mismo dispositivo
    let multipleAccounts = false;
    if (deviceHash) {
      multipleAccounts = await checkMultipleAccounts(deviceHash, user._id.toString(), VoteLog);
    }

    // Si la cuenta es muy nueva, rechazar el voto - DESHABILITADO
    // if (suspicious.newAccount) {
    //   return NextResponse.json({
    //     error: 'Tu cuenta es muy nueva. Por seguridad, debes esperar 7 días desde la creación de tu cuenta para poder votar.',
    //     accountAge: Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)) + ' días'
    //   }, { status: 403 });
    // }

    // Determinar si necesita CAPTCHA basado en la actividad sospechosa
    const suspiciousActivityCount = Object.values(suspicious).filter(Boolean).length +
                                   Object.values(coordinatedPatterns).filter(Boolean).length +
                                   (multipleAccounts ? 1 : 0);

    // CAPTCHA TEMPORALMENTE DESHABILITADO - Cuando tengas plan pago de hCaptcha, descomenta esto:
    /*
    const requiresCaptcha = suspiciousActivityCount >= 2; // Si tiene 2 o más indicadores sospechosos

    // Si requiere CAPTCHA y no se proporcionó, devolver error con indicación
    if (requiresCaptcha && !captchaToken) {
      return NextResponse.json({
        error: 'Verificación CAPTCHA requerida',
        requiresCaptcha: true,
        suspiciousActivity: {
          count: suspiciousActivityCount,
          factors: {
            ...suspicious,
            ...coordinatedPatterns,
            multipleAccountsSameDevice: multipleAccounts
          }
        }
      }, { status: 428 }); // 428 Precondition Required
    }

    // Si se proporcionó CAPTCHA, verificarlo
    if (captchaToken) {
      try {
        const captchaResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/verify-captcha`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: captchaToken }),
        });

        const captchaResult = await captchaResponse.json();

        if (!captchaResponse.ok || !captchaResult.success) {
          return NextResponse.json({
            error: 'CAPTCHA inválido. Por favor, intenta nuevamente.',
            captchaError: true
          }, { status: 400 });
        }
      } catch (captchaError) {
        console.error('Error verificando CAPTCHA:', captchaError);
        return NextResponse.json({
          error: 'Error verificando CAPTCHA. Por favor, intenta nuevamente.',
          captchaError: true
        }, { status: 500 });
      }
    }
    */

    // Por ahora solo loggeamos la actividad sospechosa sin bloquear
    if (suspiciousActivityCount >= 2) {
      console.warn(`🚨 Actividad altamente sospechosa detectada - Usuario: ${user.email}, Factores: ${suspiciousActivityCount}`, {
        factors: {
          ...suspicious,
          ...coordinatedPatterns,
          multipleAccountsSameDevice: multipleAccounts
        }
      });
    }

    // Si detectamos múltiples cuentas, advertir pero permitir si pasó CAPTCHA
    if (multipleAccounts) {
      console.warn(`⚠️ Múltiples cuentas detectadas en dispositivo: ${deviceHash} para usuario: ${user.email}`);
    }

    // NUEVA LÓGICA: Verificar puntos disponibles basado en el último voto
    const availablePoints = await user.checkAndResetDailyPoints();
    const totalPointsToUse = votes.reduce((sum, vote) => sum + vote.points, 0);

    if (totalPointsToUse > availablePoints) {
      return NextResponse.json({ 
        error: 'No tienes suficientes puntos disponibles',
        available: availablePoints,
        requested: totalPointsToUse
      }, { status: 400 });
    }

    // Verificar que todos los candidatos estén nominados
    const nomineeIds = activeWeek.nominees.map((n: any) => n.candidateId._id.toString());
    console.log('Debug - nomineeIds:', nomineeIds);
    console.log('Debug - votes:', votes);
    console.log('Debug - activeWeek.nominees:', activeWeek.nominees);
    
    // Impedir votos hacia el candidato salvado
    const savedRef: any = activeWeek.results?.saved?.candidateId;
    const savedId = savedRef ? (savedRef._id ? savedRef._id.toString() : savedRef.toString()) : null;
    for (const vote of votes) {
      console.log('Debug - checking vote:', vote.candidateId, 'in nominees:', nomineeIds.includes(vote.candidateId));
      if (!nomineeIds.includes(vote.candidateId)) {
        return NextResponse.json({ 
          error: 'Uno o más candidatos no están nominados esta semana',
          debug: {
            nomineeIds,
            voteCandidateId: vote.candidateId,
            nominees: activeWeek.nominees
          }
        }, { status: 400 });
      }

      if (savedId && vote.candidateId === savedId) {
        return NextResponse.json({ 
          error: 'El candidato salvado no recibe votos esta semana',
          savedCandidateId: savedId
        }, { status: 400 });
      }
    }

    // Crear votos y logs
    const votePromises = votes.map(async (vote: any) => {
      // Obtener información del candidato
      const candidate = await Candidate.findById(vote.candidateId);

      // Crear el voto
      const newVote = new Vote({
        userId: user._id,
        candidateId: vote.candidateId,
        seasonId: activeSeason._id,
        weekId: activeWeek._id,
        weekNumber: activeWeek.weekNumber,
        points: vote.points,
        metadata: {
          userAgent: request.headers.get('user-agent'),
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        }
      });

      // Crear log detallado
      const voteLog = new VoteLog({
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        candidateId: vote.candidateId,
        candidateName: candidate?.name || 'Unknown',
        weekId: activeWeek._id,
        points: vote.points,

        deviceFingerprint: {
          userAgent: request.headers.get('user-agent') || '',
          ...fingerprint,
          hash: deviceHash
        },

        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',

        suspiciousFactors: {
          newAccount: suspicious.newAccount,
          multipleAccountsSameDevice: multipleAccounts,
          rapidVoting: suspicious.rapidVoting,
          unusualTime: suspicious.unusualTime,
          suspiciousUserAgent: suspicious.suspiciousUserAgent,
          consistentVotingPattern: suspicious.consistentVotingPattern,
          perfectTiming: suspicious.perfectTiming,
          sequentialVoting: suspicious.sequentialVoting,
          multipleAccountsCoordinated: coordinatedPatterns.multipleAccountsCoordinated,
          suspiciousVoteDistribution: coordinatedPatterns.suspiciousVoteDistribution,
          identicalVotingPatterns: coordinatedPatterns.identicalVotingPatterns
        },

        timeOnPage: timeOnPage || 0,
        voteAccepted: true
      });

      await voteLog.save();
      return await newVote.save();
    });

    const savedVotes = await Promise.all(votePromises);

    // ACTUALIZAR PUNTOS DEL USUARIO
    // Los puntos se calculan dinámicamente basado en el último voto, 
    // pero podemos actualizar lastPointsReset para tracking
    user.lastPointsReset = new Date();
    user.lastVoteDate = new Date(); // Actualizar fecha del último voto
    user.totalVotes += totalPointsToUse; // Incrementar totalVotes con los puntos usados
    await user.save();

    // Actualizar estadísticas de la semana
    await WeekService.updateWeekResults(activeWeek._id.toString());

    return NextResponse.json({
      success: true,
      votes: savedVotes,
      pointsUsed: totalPointsToUse,
      remainingPoints: availablePoints - totalPointsToUse,
    });

  } catch (error: any) {
    console.error('Error en POST /api/vote:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 