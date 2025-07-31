import dbConnect from '@/lib/mongodb';
import Season from '@/lib/models/Season';
import Candidate from '@/lib/models/Candidate';
import Week from '@/lib/models/Week';
import Vote from '@/lib/models/Vote';

export class SeasonService {
  static async getAllSeasons() {
    await dbConnect();
    return await Season.find({}).sort({ year: -1 });
  }

  static async getActiveSeason() {
    await dbConnect();
    return await Season.findOne({ isActive: true });
  }

  static async getSeasonById(seasonId: string) {
    await dbConnect();
    return await Season.findById(seasonId);
  }

  static async createSeason(data: {
    name: string;
    year: number;
    description?: string;
    startDate: Date;
    endDate: Date;
    defaultDailyPoints?: number;
    settings?: {
      maxNomineesPerWeek?: number;
      votingEndTime?: string;
      votingDays?: number[];
    };
  }) {
    await dbConnect();
    
    // Verificar que no exista otra temporada activa si esta será activa
    if (data.startDate <= new Date()) {
      const activeSeason = await Season.findOne({ isActive: true });
      if (activeSeason) {
        throw new Error('Ya existe una temporada activa. Debes cerrar la temporada actual antes de crear una nueva.');
      }
    }

    const season = new Season({
      ...data,
      status: data.startDate <= new Date() ? 'active' : 'scheduled',
      isActive: data.startDate <= new Date(),
    });

    return await season.save();
  }

  static async updateSeason(seasonId: string, data: any) {
    await dbConnect();
    return await Season.findByIdAndUpdate(seasonId, data, { new: true });
  }

  static async activateSeason(seasonId: string) {
    await dbConnect();
    
    // Desactivar temporada actual
    await Season.updateMany({ isActive: true }, { isActive: false, status: 'completed' });
    
    // Activar nueva temporada
    const season = await Season.findById(seasonId);
    if (!season) {
      throw new Error('Temporada no encontrada');
    }

    return await season.activate();
  }

  static async completeSeason(seasonId: string) {
    await dbConnect();
    const season = await Season.findById(seasonId);
    if (!season) {
      throw new Error('Temporada no encontrada');
    }

    return await season.complete();
  }

  static async getSeasonStats(seasonId: string) {
    await dbConnect();
    
    const [season, candidates, weeks, voteStats] = await Promise.all([
      Season.findById(seasonId),
      Candidate.find({ seasonId }),
      Week.find({ seasonId }),
      (Vote as any).getSeasonStats(seasonId),
    ]);

    if (!season) {
      throw new Error('Temporada no encontrada');
    }

    const activeCandidates = candidates.filter((c: any) => c.status === 'active').length;
    const eliminatedCandidates = candidates.filter((c: any) => c.status === 'eliminated').length;
    const activeWeeks = weeks.filter((w: any) => w.status === 'active' || w.status === 'voting').length;
    const completedWeeks = weeks.filter((w: any) => w.status === 'completed').length;

    // Extraer estadísticas de votos del resultado de la agregación
    const votesData = voteStats.length > 0 ? voteStats[0] : {
      totalVotes: 0,
      totalPoints: 0,
      uniqueVoters: 0,
      uniqueCandidates: 0,
    };

    return {
      season: {
        id: season._id,
        name: season.name,
        year: season.year,
        status: season.status,
        isActive: season.isActive,
        startDate: season.startDate,
        endDate: season.endDate,
      },
      candidates: {
        total: candidates.length,
        active: activeCandidates,
        eliminated: eliminatedCandidates,
        winner: candidates.filter((c: any) => c.status === 'winner').length,
      },
      weeks: {
        total: weeks.length,
        active: activeWeeks,
        completed: completedWeeks,
        scheduled: weeks.filter((w: any) => w.status === 'scheduled').length,
      },
      votes: {
        totalVotes: votesData.totalVotes || 0,
        totalPoints: votesData.totalPoints || 0,
        uniqueVoters: votesData.uniqueVoters || 0,
        uniqueCandidates: votesData.uniqueCandidates || 0,
      },
    };
  }

  static async deleteSeasonWithData(seasonId: string) {
    await dbConnect();
    
    // Verificar que no sea la temporada activa
    const season = await Season.findById(seasonId);
    if (!season) {
      throw new Error('Temporada no encontrada');
    }

    if (season.isActive) {
      throw new Error('No puedes eliminar la temporada activa');
    }

    // Eliminar en cascada: votos, semanas, candidatos, temporada
    await Vote.deleteMany({ seasonId });
    await Week.deleteMany({ seasonId });
    await Candidate.deleteMany({ seasonId });
    await Season.findByIdAndDelete(seasonId);

    return { success: true, message: 'Temporada y todos sus datos eliminados correctamente' };
  }

  static async updateSeasonSettings(seasonId: string, settings: {
    defaultDailyPoints?: number;
    maxNomineesPerWeek?: number;
    votingEndTime?: string;
    votingDays?: number[];
  }) {
    await dbConnect();
    
    const updateData: any = {};
    if (settings.defaultDailyPoints !== undefined) {
      updateData.defaultDailyPoints = settings.defaultDailyPoints;
    }
    if (settings.maxNomineesPerWeek !== undefined) {
      updateData['settings.maxNomineesPerWeek'] = settings.maxNomineesPerWeek;
    }
    if (settings.votingEndTime !== undefined) {
      updateData['settings.votingEndTime'] = settings.votingEndTime;
    }
    if (settings.votingDays !== undefined) {
      updateData['settings.votingDays'] = settings.votingDays;
    }

    return await Season.findByIdAndUpdate(seasonId, updateData, { new: true });
  }
} 