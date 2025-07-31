import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Candidate from '@/lib/models/Candidate';
import Vote from '@/lib/models/Vote';
import Week from '@/lib/models/Week';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get('candidateId');
    
    if (!candidateId) {
      return NextResponse.json({ error: 'candidateId es requerido' }, { status: 400 });
    }

    // Obtener candidato
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return NextResponse.json({ error: 'Candidato no encontrado' }, { status: 404 });
    }

    // Calcular estadísticas reales (como en rankings)
    const [totalVotes, totalPoints, nominations] = await Promise.all([
      // Total de votos recibidos (documentos de votos)
      Vote.countDocuments({ 
        candidateId: candidateId, 
        isValid: true 
      }),
      
      // Total de puntos recibidos (suma de puntos de todos los votos)
      Vote.aggregate([
        { $match: { candidateId: new mongoose.Types.ObjectId(candidateId), isValid: true } },
        { $group: { _id: null, totalPoints: { $sum: '$points' } } }
      ]),
      
      // Total de nominaciones
      Week.countDocuments({
        'nominees.candidateId._id': candidateId
      })
    ]);

    const totalPointsValue = totalPoints.length > 0 ? totalPoints[0].totalPoints : 0;

    // Estadísticas actuales del modelo
    const currentStats = {
      totalVotes: candidate.stats.totalVotes || 0,
      timesNominated: candidate.stats.timesNominated || 0,
      averageVotes: candidate.stats.averageVotes || 0
    };

    // Estadísticas reales calculadas (como en rankings)
    const realStats = {
      totalVotes: totalVotes,
      totalPoints: totalPointsValue,
      timesNominated: nominations
    };

    return NextResponse.json({
      candidate: {
        id: candidate._id,
        name: candidate.name
      },
      currentStats,
      realStats,
      comparison: {
        totalVotesMatch: currentStats.totalVotes === realStats.totalPoints,
        timesNominatedMatch: currentStats.timesNominated === realStats.timesNominated,
        explanation: "Los rankings muestran 'totalPoints' (puntos), no 'totalVotes' (documentos)"
      }
    });

  } catch (error) {
    console.error('Error en debug candidate stats:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 