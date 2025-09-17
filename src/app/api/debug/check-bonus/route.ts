import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import Season from '@/lib/models/Season';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findById((session.user as any).id);
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const activeSeason = await Season.findOne({ isActive: true });
    if (!activeSeason) {
      return NextResponse.json({ error: 'No hay temporada activa' }, { status: 404 });
    }

    // Calcular fechas normalizadas
    const today = new Date();
    const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const lastShare = user.lastShareBonus ? new Date(user.lastShareBonus) : null;
    const lastShareNormalized = lastShare
      ? new Date(lastShare.getFullYear(), lastShare.getMonth(), lastShare.getDate())
      : null;

    // Verificar si tiene bonus hoy
    const hasShareBonusToday = lastShareNormalized !== null &&
      lastShareNormalized.getTime() === todayNormalized.getTime();

    const baseDailyPoints = typeof activeSeason.defaultDailyPoints === 'number'
      ? activeSeason.defaultDailyPoints
      : 60;

    return NextResponse.json({
      debug: {
        usuario: user.email,
        lastShareBonus: user.lastShareBonus,
        lastShareBonusFormatted: lastShare?.toISOString(),
        today: today.toISOString(),
        todayNormalized: todayNormalized.toISOString(),
        lastShareNormalized: lastShareNormalized?.toISOString(),
        comparison: {
          lastShareTime: lastShareNormalized?.getTime(),
          todayTime: todayNormalized.getTime(),
          areEqual: lastShareNormalized?.getTime() === todayNormalized.getTime()
        },
        hasShareBonusToday,
        baseDailyPoints,
        bonusPoints: hasShareBonusToday ? 50 : 0,
        totalPoints: baseDailyPoints + (hasShareBonusToday ? 50 : 0),
        seasonDefaultDailyPoints: activeSeason.defaultDailyPoints,
        userDailyPoints: user.dailyPoints
      }
    });

  } catch (error: any) {
    console.error('Error en debug bonus:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}