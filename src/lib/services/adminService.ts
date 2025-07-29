import dbConnect from '../mongodb';
import User from '../models/User';
import Candidate from '../models/Candidate';
import Season from '../models/Season';
import Vote from '../models/Vote';
import Week from '../models/Week';

export class AdminService {
  static async createSeason(seasonData: {
    name: string;
    year: number;
    description?: string;
    startDate: Date;
    endDate: Date;
    dailyPointsDefault?: number;
  }) {
    await dbConnect();
    
    // Desactivar temporada anterior
    await Season.updateMany({}, { isActive: false });
    
    const season = await Season.create({
      ...seasonData,
      isActive: true,
    });
    
    return season;
  }

  static async updateSeasonSettings(seasonId: string, settings: {
    dailyPointsDefault?: number;
    votingEndTime?: string;
    votingDays?: string[];
  }) {
    await dbConnect();
    
    const season = await Season.findByIdAndUpdate(
      seasonId,
      settings,
      { new: true }
    );
    
    // Si se cambió dailyPointsDefault, actualizar usuarios
    if (settings.dailyPointsDefault) {
      await User.updateMany(
        {},
        { dailyPoints: settings.dailyPointsDefault }
      );
    }
    
    return season;
  }

  static async createCandidate(candidateData: {
    name: string;
    photo: string;
    bio?: string;
    age?: number;
    profession?: string;
    socialMedia?: {
      instagram?: string;
      twitter?: string;
      tiktok?: string;
      youtube?: string;
    };
    seasonId: string;
  }) {
    await dbConnect();
    
    const candidate = await Candidate.create(candidateData);
    return candidate;
  }

  static async updateCandidate(candidateId: string, updateData: any) {
    await dbConnect();
    
    return await Candidate.findByIdAndUpdate(
      candidateId,
      updateData,
      { new: true }
    );
  }

  static async setNominated(candidateIds: string[], seasonId: string) {
    await dbConnect();
    
    // Desmarcar todos los nominados actuales
    await Candidate.updateMany(
      { seasonId },
      { isNominated: false }
    );
    
    // Marcar nuevos nominados
    await Candidate.updateMany(
      { _id: { $in: candidateIds } },
      { isNominated: true }
    );
    
    return await Candidate.find({ 
      seasonId, 
      isNominated: true 
    });
  }

  static async eliminateCandidate(candidateId: string) {
    await dbConnect();
    
    return await Candidate.findByIdAndUpdate(
      candidateId,
      { 
        isEliminated: true, 
        isNominated: false,
        eliminationDate: new Date() 
      },
      { new: true }
    );
  }

  static async resetWeeklyVotes(seasonId: string) {
    await dbConnect();
    
    await Candidate.updateMany(
      { seasonId },
      { weeklyVotes: 0 }
    );
    
    return { success: true, message: 'Votos semanales reseteados' };
  }

  static async getDashboardStats(seasonId: string) {
    await dbConnect();
    
    // Si no hay seasonId, obtener estadísticas globales
    const seasonFilter = seasonId ? { seasonId } : {};
    
    const [
      totalUsers,
      activeUsers,
      totalSeasons,
      activeSeason,
      totalCandidates,
      eliminatedCandidates,
      currentWeek,
      activeWeek,
      totalVotes,
      weeklyVotes
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ 
        isActive: true,
        lastVoteDate: { 
          $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) 
        }
      }),
      Season.countDocuments({}),
      Season.findOne({ isActive: true }).select('name'),
      Candidate.countDocuments({ ...seasonFilter, isActive: true }),
      Candidate.countDocuments({ ...seasonFilter, 'eliminationInfo.isEliminated': true }),
      Week.findOne({ ...seasonFilter, isVotingActive: true }).select('weekNumber'),
      Week.countDocuments({ ...seasonFilter, isVotingActive: true }),
      Vote.aggregate([
        { $match: seasonFilter },
        { $group: { _id: null, total: { $sum: '$points' } } }
      ]),
      Vote.aggregate([
        { 
          $match: { 
            ...seasonFilter,
            voteDate: { 
              $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
            }
          }
        },
        { $group: { _id: null, total: { $sum: '$points' } } }
      ])
    ]);

    return {
      totalUsers,
      activeUsers,
      totalSeasons,
      activeSeason: activeSeason?.name || '',
      totalCandidates,
      eliminatedCandidates,
      currentWeek: currentWeek?.weekNumber || 0,
      activeWeek: activeWeek > 0,
      totalVotes: totalVotes[0]?.total || 0,
      weeklyVotes: weeklyVotes[0]?.total || 0,
    };
  }

  static async getUsersManagement(page = 1, limit = 20, search = '', sortBy = 'createdAt', sortOrder = 'desc') {
    await dbConnect();
    
    // Construir filtro de búsqueda
    const searchFilter = search ? {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    } : {};
    
    // Construir ordenamiento
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const users = await User.find(searchFilter)
      .select('name email totalVotes isActive isBlocked blockReason blockedAt lastVoteDate createdAt')
      .sort(sortOptions)
      .limit(limit)
      .skip((page - 1) * limit);
    
    const total = await User.countDocuments(searchFilter);
    
    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    };
  }

  static async toggleUserStatus(userId: string) {
    await dbConnect();
    
    const user = await User.findById(userId);
    if (!user) throw new Error('Usuario no encontrado');
    
    user.isActive = !user.isActive;
    await user.save();
    
    return user;
  }

  static async blockUser(userId: string, reason: string, blockedBy: string) {
    await dbConnect();
    
    const user = await User.findById(userId);
    if (!user) throw new Error('Usuario no encontrado');
    
    user.isBlocked = true;
    user.blockReason = reason;
    user.blockedAt = new Date();
    user.blockedBy = blockedBy;
    user.isActive = false; // Usuario bloqueado no puede estar activo
    
    await user.save();
    
    return user;
  }

  static async unblockUser(userId: string) {
    await dbConnect();
    
    const user = await User.findById(userId);
    if (!user) throw new Error('Usuario no encontrado');
    
    user.isBlocked = false;
    user.blockReason = null;
    user.blockedAt = null;
    user.blockedBy = null;
    user.isActive = true; // Usuario desbloqueado puede estar activo
    
    await user.save();
    
    return user;
  }

  static async toggleAdminStatus(userId: string) {
    await dbConnect();
    
    const user = await User.findById(userId);
    if (!user) throw new Error('Usuario no encontrado');
    
    user.isAdmin = !user.isAdmin;
    await user.save();
    
    return user;
  }

  static async deleteUser(userId: string) {
    await dbConnect();
    
    const user = await User.findById(userId);
    if (!user) throw new Error('Usuario no encontrado');
    
    // Verificar que no sea el último admin
    if (user.isAdmin) {
      const adminCount = await User.countDocuments({ isAdmin: true });
      if (adminCount <= 1) {
        throw new Error('No se puede eliminar el último administrador');
      }
    }
    
    await User.findByIdAndDelete(userId);
    
    return { success: true, message: 'Usuario eliminado correctamente' };
  }
} 