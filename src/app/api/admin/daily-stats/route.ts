import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Vote from '@/lib/models/Vote';
import User from '@/lib/models/User';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await dbConnect();

    // Verificar que el usuario sea admin
    const user = await User.findOne({ email: session.user.email });
    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Obtener parámetros de query
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'votes' o 'users'
    const month = searchParams.get('month'); // formato: YYYY-MM

    // Calcular rango de fechas
    let startDate: Date;
    let endDate: Date;

    if (month) {
      // Mes específico
      const [year, monthNum] = month.split('-').map(Number);
      startDate = new Date(year, monthNum - 1, 1);
      endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);
    } else {
      // Por defecto: último mes
      endDate = new Date();
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      startDate.setHours(0, 0, 0, 0);
    }

    // Estadísticas combinadas de votos y usuarios por día
    const dailyVotes = await Vote.aggregate([
      {
        $match: {
          voteDate: {
            $gte: startDate,
            $lte: endDate
          },
          isValid: true
        }
      },
      {
        $project: {
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$voteDate',
              timezone: 'America/Mexico_City'
            }
          },
          userId: 1,
          points: 1
        }
      },
      {
        $group: {
          _id: '$date',
          totalVotos: { $sum: 1 },
          totalPuntos: { $sum: '$points' },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          _id: 1,
          totalVotos: 1,
          totalPuntos: 1,
          usuariosActivos: { $size: '$uniqueUsers' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Estadísticas de usuarios registrados diarios
    const dailyUsers = await User.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $project: {
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
              timezone: 'America/Mexico_City'
            }
          }
        }
      },
      {
        $group: {
          _id: '$date',
          totalUsers: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Crear un mapa de usuarios registrados por fecha
    const usersMap = new Map(
      dailyUsers.map(item => [item._id, item.totalUsers])
    );

    // Combinar todos los datos
    const allDates = new Set([
      ...dailyVotes.map(v => v._id),
      ...dailyUsers.map(u => u._id)
    ]);

    const combinedData = Array.from(allDates).map(date => ({
      fecha: date,
      totalVotos: dailyVotes.find(v => v._id === date)?.totalVotos || 0,
      totalPuntos: dailyVotes.find(v => v._id === date)?.totalPuntos || 0,
      usuariosActivos: dailyVotes.find(v => v._id === date)?.usuariosActivos || 0,
      usuariosRegistrados: usersMap.get(date) || 0
    })).sort((a, b) => a.fecha.localeCompare(b.fecha));

    return NextResponse.json({
      data: combinedData,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas diarias:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}