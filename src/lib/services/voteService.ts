import dbConnect from '../mongodb';
import User from '../models/User';
import Candidate from '../models/Candidate';
import Vote from '../models/Vote';
import Season from '../models/Season';

export class VoteService {
  static async getCurrentSeason() {
    await dbConnect();
    return await Season.findOne({ isActive: true });
  }

  static async getNominatedCandidates(seasonId: string) {
    await dbConnect();
    return await Candidate.find({ 
      seasonId, 
      isNominated: true, 
      isEliminated: false 
    }).sort({ weeklyVotes: -1 });
  }

  static async getAllCandidates(seasonId: string) {
    await dbConnect();
    return await Candidate.find({ 
      seasonId, 
      isEliminated: false 
    }).sort({ totalVotes: -1 });
  }

  static async getUserAvailablePoints(userId: string) {
    await dbConnect();
    const user = await User.findById(userId);
    if (!user) throw new Error('Usuario no encontrado');
    
    // Resetear puntos si es un nuevo día
    await user.resetDailyPoints();
    
    return user.getAvailablePoints();
  }

  static async submitVotes(userId: string, votes: { candidateId: string, points: number }[]) {
    await dbConnect();
    
    const session = await User.startSession();
    session.startTransaction();

    try {
      const user = await User.findById(userId).session(session);
      if (!user) throw new Error('Usuario no encontrado');

      const season = await Season.findOne({ isActive: true }).session(session);
      if (!season) throw new Error('No hay temporada activa');

      // Verificar puntos disponibles
      await user.resetDailyPoints();
      const totalPointsToUse = votes.reduce((sum, vote) => sum + vote.points, 0);
      const availablePoints = user.getAvailablePoints();

      if (totalPointsToUse > availablePoints) {
        throw new Error('No tienes suficientes puntos disponibles');
      }

      // Obtener semana actual (simplificado)
      const currentWeek = Math.ceil((Date.now() - season.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
      const currentYear = new Date().getFullYear();

      // Procesar cada voto
      for (const vote of votes) {
        // Verificar que el candidato esté nominado
        const candidate = await Candidate.findById(vote.candidateId).session(session);
        if (!candidate || !candidate.isNominated) {
          throw new Error(`Candidato ${vote.candidateId} no está nominado`);
        }

        // Crear registro de voto
        await Vote.create([{
          userId,
          candidateId: vote.candidateId,
          seasonId: season._id,
          points: vote.points,
          week: currentWeek,
          year: currentYear,
        }], { session });

        // Actualizar votos del candidato
        candidate.weeklyVotes += vote.points;
        candidate.totalVotes += vote.points;
        await candidate.save({ session });
      }

      // Actualizar puntos del usuario
      user.usedPointsToday += totalPointsToUse;
      user.totalVotes += totalPointsToUse;
      await user.save({ session });

      await session.commitTransaction();
      return { success: true, remainingPoints: user.getAvailablePoints() };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async getVotingStats(seasonId: string) {
    await dbConnect();
    
    const candidates = await Candidate.find({ 
      seasonId, 
      isNominated: true 
    }).sort({ weeklyVotes: -1 });

    const totalVotes = candidates.reduce((sum, candidate) => sum + candidate.weeklyVotes, 0);

    return candidates.map(candidate => ({
      _id: candidate._id,
      name: candidate.name,
      photo: candidate.photo,
      votes: candidate.weeklyVotes,
      percentage: totalVotes > 0 ? Math.round((candidate.weeklyVotes / totalVotes) * 100) : 0,
    }));
  }

  static async getUserVoteHistory(userId: string, seasonId: string) {
    await dbConnect();
    
    const currentWeek = Math.ceil((Date.now() - new Date().getTime()) / (7 * 24 * 60 * 60 * 1000));
    
    return await Vote.find({
      userId,
      seasonId,
      week: currentWeek,
      year: new Date().getFullYear(),
    }).populate('candidateId', 'name photo');
  }
} 