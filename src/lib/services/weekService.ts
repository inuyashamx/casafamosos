import dbConnect from '@/lib/mongodb';
import Week from '@/lib/models/Week';
import Season from '@/lib/models/Season';
import Candidate from '@/lib/models/Candidate';
import Vote from '@/lib/models/Vote';
import mongoose from 'mongoose';

export class WeekService {
  static async getWeeksBySeason(seasonId: string) {
    await dbConnect();
    return await Week.find({ seasonId }).sort({ weekNumber: 1 }).populate('nominees.candidateId');
  }

  static async getActiveWeek(seasonId: string) {
    await dbConnect();
    const now = new Date();
    
    // Primero intentar activar automáticamente semanas que deberían estar activas
    await this.activateScheduledWeeks(seasonId);
    
    return await Week.findOne({
      seasonId,
      isVotingActive: true,
      status: 'voting'
    }).populate('nominees.candidateId');
  }

  static async activateScheduledWeeks(seasonId: string) {
    const now = new Date();
    
    // Buscar semanas programadas que deberían estar activas
    const weeksToActivate = await Week.find({
      seasonId,
      status: 'scheduled',
      votingStartDate: { $lte: now },
      votingEndDate: { $gte: now }
    });

    // Activar cada semana que cumpla las condiciones
    for (const week of weeksToActivate) {
      // Desactivar otras semanas de votación en la misma temporada
      await Week.updateMany(
        { seasonId, isVotingActive: true },
        { isVotingActive: false, status: 'completed' }
      );
      
      // Activar esta semana
      week.isVotingActive = true;
      week.status = 'voting';
      await week.save();
    }
  }

  static async getNextScheduledWeekWithNominees(seasonId: string) {
    await dbConnect();
    return await Week.findOne({
      seasonId,
      status: 'scheduled',
      'nominees.0': { $exists: true } // Verificar que tenga al menos un nominado
    }).populate('nominees.candidateId').sort({ weekNumber: 1 });
  }

  static async getCurrentWeek(seasonId: string) {
    await dbConnect();
    const now = new Date();
    return await Week.findOne({
      seasonId,
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).populate('nominees.candidateId');
  }

  static async getCurrentWeekByDate(seasonId: string, date: Date) {
    await dbConnect();
    return await Week.findOne({
      seasonId,
      votingStartDate: { $lte: date },
      votingEndDate: { $gte: date }
    }).populate('nominees.candidateId');
  }

  static async getWeekById(weekId: string) {
    await dbConnect();
    return await Week.findById(weekId).populate('nominees.candidateId');
  }

  static async createWeek(data: {
    seasonId: string;
    weekNumber: number;
    name?: string;
    startDate: Date;
    endDate: Date;
    votingStartDate: Date;
    votingEndDate: Date;
    settings?: {
      maxVotesPerUser?: number;
      allowMultipleVotes?: boolean;
    };
  }) {
    await dbConnect();

    // Verificar que no exista otra semana con el mismo número en la temporada
    const existingWeek = await Week.findOne({
      seasonId: data.seasonId,
      weekNumber: data.weekNumber
    });

    if (existingWeek) {
      throw new Error(`Ya existe la semana ${data.weekNumber} en esta temporada`);
    }

    // Verificar que la temporada existe
    const season = await Season.findById(data.seasonId);
    if (!season) {
      throw new Error('Temporada no encontrada');
    }

    const week = new Week({
      ...data,
      name: data.name || `Semana ${data.weekNumber}`,
      status: data.votingStartDate <= new Date() ? 'voting' : 'scheduled',
      isVotingActive: data.votingStartDate <= new Date() && data.votingEndDate >= new Date(),
    });

    return await week.save();
  }

  static async updateWeek(weekId: string, data: any) {
    await dbConnect();
    return await Week.findByIdAndUpdate(weekId, data, { new: true }).populate('nominees.candidateId');
  }

  static async startVoting(weekId: string) {
    await dbConnect();
    const week = await Week.findById(weekId);
    if (!week) {
      throw new Error('Semana no encontrada');
    }

    // Desactivar otras semanas de votación en la misma temporada
    await Week.updateMany(
      { seasonId: week.seasonId, isVotingActive: true },
      { isVotingActive: false, status: 'completed' }
    );

    return await week.startVoting();
  }

  static async endVoting(weekId: string) {
    await dbConnect();
    const week = await Week.findById(weekId);
    if (!week) {
      throw new Error('Semana no encontrada');
    }

    // Actualizar resultados antes de cerrar
    await this.updateWeekResults(weekId);
    
    return await week.endVoting();
  }

  static async addNominee(weekId: string, candidateId: string) {
    await dbConnect();
    const week = await Week.findById(weekId);
    const candidate = await Candidate.findById(candidateId);

    if (!week) {
      throw new Error('Semana no encontrada');
    }
    if (!candidate) {
      throw new Error('Candidato no encontrado');
    }

    // Verificar que el candidato pertenece a la misma temporada
    if (candidate.seasonId.toString() !== week.seasonId.toString()) {
      throw new Error('El candidato no pertenece a esta temporada');
    }

    // Verificar que el candidato esté activo
    if (candidate.status !== 'active') {
      throw new Error('El candidato no está activo');
    }

    await week.addNominee(candidateId);
    await candidate.addNomination(weekId, week.weekNumber);

    return await Week.findById(weekId).populate('nominees.candidateId');
  }

  static async removeNominee(weekId: string, candidateId: string) {
    await dbConnect();
    const week = await Week.findById(weekId);
    if (!week) {
      throw new Error('Semana no encontrada');
    }

    await week.removeNominee(candidateId);
    return await Week.findById(weekId).populate('nominees.candidateId');
  }

  static async updateWeekResults(weekId: string) {
    await dbConnect();
    
    // Obtener resultados de votación usando agregación
    const results = await Vote.aggregate([
      { $match: { weekId: new mongoose.Types.ObjectId(weekId), isValid: true } },
      {
        $group: {
          _id: '$candidateId',
          totalVotes: { $sum: '$points' },
          voteCount: { $sum: 1 }
        }
      },
      { $sort: { totalVotes: -1 } }
    ]);

    const totalVotes = results.reduce((sum, r) => sum + r.totalVotes, 0);

    // Preparar datos de actualización
    const updateData: any = {
      'results.totalVotes': totalVotes,
      'results.votingStats': results.map((r: any) => ({
        candidateId: r._id,
        votes: r.totalVotes,
        percentage: totalVotes > 0 ? Math.round((r.totalVotes / totalVotes) * 100) : 0
      }))
    };

    if (results.length > 0) {
      updateData['results.winner'] = {
        candidateId: results[0]._id,
        votes: results[0].totalVotes
      };
    } else {
      updateData['results.winner'] = {
        candidateId: null,
        votes: 0
      };
    }

    // Actualizar estadísticas de candidatos
    for (const result of results) {
      await Candidate.findByIdAndUpdate(result._id, {
        'stats.weeklyVotes': result.totalVotes,
        $inc: { 'stats.totalVotes': result.totalVotes }
      });
    }

    // Actualizar la semana usando findOneAndUpdate para evitar problemas de concurrencia
    const updatedWeek = await Week.findOneAndUpdate(
      { _id: weekId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedWeek) {
      throw new Error('Semana no encontrada');
    }

    return updatedWeek;
  }

  static async resetWeekVotes(weekId: string) {
    await dbConnect();
    
    const week = await Week.findById(weekId);
    if (!week) {
      throw new Error('Semana no encontrada');
    }

    // Marcar todos los votos como inválidos (soft delete)
    await Vote.updateMany(
      { weekId },
      { $set: { isValid: false } }
    );

    // Resetear estadísticas de candidatos
    const nominees = week.nominees;
    for (const nominee of nominees) {
      await Candidate.findByIdAndUpdate(nominee.candidateId, {
        'stats.weeklyVotes': 0
      });
    }

    // Resetear resultados de la semana
    week.results.totalVotes = 0;
    week.results.votingStats = [];
    week.results.winner = {
      candidateId: null,
      votes: 0
    };

    return await week.save();
  }

  static async getWeekResults(weekId: string) {
    await dbConnect();
    
    // Actualizar resultados en tiempo real y obtener la semana actualizada
    const updatedWeek = await this.updateWeekResults(weekId);
    
    // Retornar la semana con los nominados poblados
    return await Week.findById(weekId).populate('nominees.candidateId');
  }

  static async deleteWeek(weekId: string) {
    await dbConnect();
    
    const week = await Week.findById(weekId);
    if (!week) {
      throw new Error('Semana no encontrada');
    }

    if (week.isVotingActive) {
      throw new Error('No puedes eliminar una semana con votación activa');
    }

    // Eliminar votos asociados
    await Vote.deleteMany({ weekId });
    
    // Eliminar la semana
    await Week.findByIdAndDelete(weekId);

    return { success: true, message: 'Semana eliminada correctamente' };
  }
} 