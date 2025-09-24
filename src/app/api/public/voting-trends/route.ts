import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Vote from '@/lib/models/Vote';
import Candidate from '@/lib/models/Candidate';
import { SeasonService } from '@/lib/services/seasonService';
import { WeekService } from '@/lib/services/weekService';
import mongoose from 'mongoose';

interface CombinationVotes {
  combination: string;
  candidateIds: string[];
  candidateNames: string[];
  totalVotes: number;
  percentage: number;
  description: string;
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Usar la misma lógica que /api/public/vote para obtener la semana activa
    const activeSeason = await SeasonService.getActiveSeason();
    if (!activeSeason) {
      return NextResponse.json({ error: 'No hay temporada activa' }, { status: 404 });
    }

    console.log('Active Season:', activeSeason._id.toString());

    // Buscar la semana activa de manera más eficiente (igual que en /api/public/vote)
    let activeWeek = await WeekService.getActiveWeek(activeSeason._id.toString());

    // Si no hay semana activa, buscar la más reciente con una sola consulta optimizada
    if (!activeWeek) {
      const weeks = await WeekService.getWeeksBySeason(activeSeason._id.toString());

      // Buscar primero una semana en curso (por fecha)
      const now = new Date();
      activeWeek = weeks.find((w: any) =>
        w.nominees.length > 0 &&
        new Date(w.votingStartDate) <= now &&
        new Date(w.votingEndDate) >= now
      );

      // Si no hay semana en curso, buscar la completada más reciente
      if (!activeWeek) {
        const completedWeeks = weeks.filter((w: any) =>
          w.status === 'completed' && w.nominees.length > 0
        );
        if (completedWeeks.length > 0) {
          activeWeek = completedWeeks[0]; // Ya vienen ordenadas por fecha
        }
      }

      // Si aún no hay semana, buscar la próxima programada
      if (!activeWeek) {
        activeWeek = weeks.find((w: any) =>
          w.status === 'scheduled' && w.nominees.length > 0
        );
      }
    }

    if (!activeWeek) {
      return NextResponse.json({ error: 'No hay semana activa' }, { status: 404 });
    }

    console.log('Active Week:', activeWeek._id.toString());

    // Obtener todos los candidatos de la semana actual
    console.log('Searching for candidates with seasonId:', activeSeason._id.toString());

    // Primero ver todos los candidatos sin filtro
    const allCandidates = await Candidate.find({
      seasonId: activeSeason._id
    }).select('_id name isEliminated').lean();

    console.log('All candidates in season:', allCandidates.length);
    console.log('Candidates details:', allCandidates.map((c: any) => ({
      id: c._id.toString(),
      name: c.name,
      isEliminated: c.isEliminated
    })));

    const candidates = await Candidate.find({
      seasonId: activeSeason._id,
      isEliminated: false
    }).select('_id name').lean();

    console.log('Found non-eliminated candidates:', candidates.length);

    // Si no hay candidatos no eliminados, usar todos los candidatos
    const finalCandidates = candidates.length > 0 ? candidates : allCandidates;

    if (finalCandidates.length === 0) {
      return NextResponse.json({
        combinations: [],
        totalVotes: 0,
        totalCombinations: 0,
        message: 'No hay candidatos disponibles'
      });
    }

    // Obtener todos los votos válidos de la semana actual agrupados por usuario
    console.log('Searching for votes with weekId:', activeWeek._id.toString());

    const userVotes = await Vote.aggregate([
      {
        $match: {
          weekId: new mongoose.Types.ObjectId(activeWeek._id),
          isValid: true
        }
      },
      {
        $group: {
          _id: '$userId',
          votes: {
            $push: {
              candidateId: '$candidateId',
              points: '$points'
            }
          },
          totalPoints: { $sum: '$points' }
        }
      }
    ]);

    console.log('Found userVotes:', userVotes.length);

    // Si no hay votos, retornar vacío
    if (userVotes.length === 0) {
      return NextResponse.json({
        combinations: [],
        totalVotes: 0,
        totalCombinations: 0,
        week: {
          id: activeWeek._id,
          name: activeWeek.name,
          weekNumber: activeWeek.weekNumber
        },
        season: {
          id: activeSeason._id,
          name: activeSeason.name,
          year: activeSeason.year
        },
        message: 'No hay votos disponibles'
      });
    }

    // Crear un mapa de candidateId a nombre para referencia rápida
    const candidateMap = new Map();
    finalCandidates.forEach((candidate: any) => {
      candidateMap.set(candidate._id.toString(), candidate.name);
    });

    // Calcular combinaciones de votos
    const combinationsMap = new Map<string, {
      candidateIds: string[],
      candidateNames: string[],
      totalVotes: number
    }>();

    let grandTotalVotes = 0;

    userVotes.forEach(userVote => {
      // Obtener los candidatos únicos que votó este usuario
      const candidateIds: string[] = userVote.votes.map((v: any) => v.candidateId.toString());
      const uniqueCandidateIds: string[] = Array.from(new Set(candidateIds));

      // Crear la clave de combinación (ordenada para consistencia)
      const sortedCandidateIds = uniqueCandidateIds.sort();
      const combinationKey = sortedCandidateIds.join(',');

      // Obtener nombres de candidatos
      const candidateNames: string[] = [];
      sortedCandidateIds.forEach(id => {
        const name = candidateMap.get(id);
        if (name) {
          candidateNames.push(name);
        }
      });

      // Sumar todos los puntos de este usuario (representa el total de votos de esta combinación)
      const userTotalPoints = userVote.totalPoints;
      grandTotalVotes += userTotalPoints;

      if (combinationsMap.has(combinationKey)) {
        const existing = combinationsMap.get(combinationKey)!;
        existing.totalVotes += userTotalPoints;
      } else {
        combinationsMap.set(combinationKey, {
          candidateIds: sortedCandidateIds,
          candidateNames,
          totalVotes: userTotalPoints
        });
      }
    });

    // Convertir el mapa a array y calcular porcentajes
    const combinations: CombinationVotes[] = Array.from(combinationsMap.entries())
      .map(([key, data]) => {
        // Generar descripción legible
        let description = '';
        if (data.candidateNames.length === 1) {
          description = `Solo ${data.candidateNames[0]}`;
        } else if (data.candidateNames.length === 2) {
          description = `${data.candidateNames[0]} y ${data.candidateNames[1]}`;
        } else if (data.candidateNames.length === 3) {
          description = `${data.candidateNames[0]}, ${data.candidateNames[1]} y ${data.candidateNames[2]}`;
        } else {
          description = `${data.candidateNames.slice(0, -1).join(', ')} y ${data.candidateNames[data.candidateNames.length - 1]}`;
        }

        return {
          combination: key,
          candidateIds: data.candidateIds,
          candidateNames: data.candidateNames,
          totalVotes: data.totalVotes,
          percentage: grandTotalVotes > 0 ? parseFloat(((data.totalVotes / grandTotalVotes) * 100).toFixed(2)) : 0,
          description
        };
      })
      .sort((a, b) => b.totalVotes - a.totalVotes); // Ordenar por total de votos descendente

    return NextResponse.json({
      combinations,
      totalVotes: grandTotalVotes,
      totalCombinations: combinations.length,
      week: {
        id: activeWeek._id,
        name: activeWeek.name,
        weekNumber: activeWeek.weekNumber
      },
      season: {
        id: activeSeason._id,
        name: activeSeason.name,
        year: activeSeason.year
      }
    });

  } catch (error) {
    console.error('Error fetching voting trends:', error);
    return NextResponse.json(
      { error: 'Error al obtener las tendencias de votación' },
      { status: 500 }
    );
  }
}