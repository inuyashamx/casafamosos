import dbConnect from '@/lib/mongodb';
import Candidate from '@/lib/models/Candidate';
import Season from '@/lib/models/Season';

export class CandidateService {
  static async getCandidatesBySeason(seasonId: string) {
    await dbConnect();
    return await Candidate.find({ seasonId }).sort({ createdAt: 1 });
  }

  static async getCandidateById(candidateId: string) {
    await dbConnect();
    return await Candidate.findById(candidateId);
  }

  static async createCandidate(data: {
    seasonId: string;
    name: string;
    photo?: string;
    bio?: string;
    age?: number;
    profession?: string;
    city?: string;
    socialMedia?: {
      instagram?: string;
      twitter?: string;
      tiktok?: string;
      youtube?: string;
    };
  }) {
    await dbConnect();

    // Verificar que la temporada existe
    const season = await Season.findById(data.seasonId);
    if (!season) {
      throw new Error('Temporada no encontrada');
    }

    // Verificar que no exista otro candidato con el mismo nombre en la temporada
    const existingCandidate = await Candidate.findOne({
      seasonId: data.seasonId,
      name: data.name
    });

    if (existingCandidate) {
      throw new Error(`Ya existe un candidato con el nombre "${data.name}" en esta temporada`);
    }

    const candidate = new Candidate(data);
    return await candidate.save();
  }

  static async updateCandidate(candidateId: string, data: any) {
    await dbConnect();
    
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      throw new Error('Candidato no encontrado');
    }

    // Si se está actualizando el nombre, verificar que no exista otro con el mismo nombre
    if (data.name && data.name !== candidate.name) {
      const existingCandidate = await Candidate.findOne({
        seasonId: candidate.seasonId,
        name: data.name,
        _id: { $ne: candidateId }
      });

      if (existingCandidate) {
        throw new Error(`Ya existe un candidato con el nombre "${data.name}" en esta temporada`);
      }
    }

    return await Candidate.findByIdAndUpdate(candidateId, data, { new: true });
  }

  static async deleteCandidate(candidateId: string) {
    await dbConnect();
    
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      throw new Error('Candidato no encontrado');
    }

    // Verificar que no esté en una semana activa
    if (candidate.status === 'active') {
      throw new Error('No puedes eliminar un candidato activo. Primero debes eliminarlo de la competencia.');
    }

    await Candidate.findByIdAndDelete(candidateId);
    return { success: true, message: 'Candidato eliminado correctamente' };
  }

  static async eliminateCandidate(candidateId: string, weekNumber: number, reason?: string) {
    await dbConnect();
    
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      throw new Error('Candidato no encontrado');
    }

    if (candidate.status === 'eliminated') {
      throw new Error('El candidato ya está eliminado');
    }

    return await candidate.eliminate(weekNumber, reason);
  }

  static async reactivateCandidate(candidateId: string) {
    await dbConnect();
    
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      throw new Error('Candidato no encontrado');
    }

    if (candidate.status !== 'eliminated') {
      throw new Error('El candidato no está eliminado');
    }

    return await candidate.reactivate();
  }

  static async getActiveCandidates(seasonId: string) {
    await dbConnect();
    return await Candidate.find({ 
      seasonId, 
      isActive: true,
      status: 'active'
    }).sort({ 'stats.totalVotes': -1 });
  }

  static async getEliminatedCandidates(seasonId: string) {
    await dbConnect();
    return await Candidate.find({ 
      seasonId, 
      'eliminationInfo.isEliminated': true 
    }).sort({ 'eliminationInfo.eliminatedWeek': 1 });
  }

  static async updateCandidateStats(candidateId: string) {
    await dbConnect();
    return await (Candidate as any).updateRealStats(candidateId);
  }

  static async getCandidatesWithRealStats(seasonId: string) {
    await dbConnect();
    const candidates = await Candidate.find({ seasonId }).sort({ createdAt: 1 });
    
    // Actualizar estadísticas reales para cada candidato
    const updatedCandidates = await Promise.all(
      candidates.map(async (candidate) => {
        try {
          return await (Candidate as any).updateRealStats(candidate._id);
        } catch (error) {
          console.error(`Error actualizando stats para candidato ${candidate._id}:`, error);
          return candidate; // Retornar candidato original si hay error
        }
      })
    );
    
    return updatedCandidates;
  }
} 