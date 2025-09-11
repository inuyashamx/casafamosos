import mongoose, { Document, Model } from 'mongoose';

interface IGlobalRanking extends Document {
  userId: mongoose.Types.ObjectId;
  seasonId: mongoose.Types.ObjectId;
  rankings: Array<{
    candidateId: mongoose.Types.ObjectId;
    position: number;
  }>;
  updateCount: number;
  lastUpdated: Date;
  updateRanking(newRankings: any[]): Promise<IGlobalRanking>;
}

interface IGlobalRankingModel extends Model<IGlobalRanking> {
  getGlobalStats(seasonId: string): Promise<{
    stats: any[];
    totalParticipants: number;
  }>;
}

const GlobalRankingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // Un ranking por usuario
  },
  seasonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Season',
    required: true,
  },
  rankings: [{
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
    },
    position: {
      type: Number,
      required: true,
    }
  }],
  updateCount: {
    type: Number,
    default: 1,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
});

// Índices para consultas eficientes
GlobalRankingSchema.index({ userId: 1, seasonId: 1 }, { unique: true });
GlobalRankingSchema.index({ seasonId: 1 });
GlobalRankingSchema.index({ lastUpdated: -1 });

// Método para actualizar ranking
GlobalRankingSchema.methods.updateRanking = function(newRankings: any[]) {
  this.rankings = newRankings;
  this.updateCount += 1;
  this.lastUpdated = new Date();
  return this.save();
};

// Método estático para obtener estadísticas globales
GlobalRankingSchema.statics.getGlobalStats = async function(seasonId: string) {
  const rankings = await this.find({ seasonId }).populate('rankings.candidateId');
  
  // Calcular estadísticas por candidato
  const stats: any = {};
  let totalRankings = 0;
  
  rankings.forEach((ranking: any) => {
    totalRankings++;
    ranking.rankings.forEach((item: any, index: number) => {
      // Verificar que el candidato existe (no fue eliminado de la DB)
      if (!item.candidateId || !item.candidateId._id) {
        console.warn('Candidato no encontrado en ranking, saltando...');
        return;
      }
      
      // Filtrar candidatos eliminados o no activos
      if (item.candidateId.status !== 'active') {
        return;
      }
      
      const candidateId = item.candidateId._id.toString();
      if (!stats[candidateId]) {
        stats[candidateId] = {
          candidate: item.candidateId,
          totalPoints: 0,
          top5Count: 0,
          positions: [],
          averagePosition: 0,
        };
      }
      
      const position = index + 1;
      stats[candidateId].positions.push(position);
      stats[candidateId].totalPoints += (20 - position); // Puntos inversos a la posición
      
      if (position <= 5) {
        stats[candidateId].top5Count++;
      }
    });
  });
  
  // Calcular promedios y porcentajes
  Object.keys(stats).forEach(candidateId => {
    const stat = stats[candidateId];
    stat.averagePosition = stat.positions.reduce((a: number, b: number) => a + b, 0) / stat.positions.length;
    stat.top5Percentage = totalRankings > 0 ? (stat.top5Count / totalRankings) * 100 : 0;
  });
  
  // Convertir a array y ordenar por puntos totales
  const sortedStats = Object.values(stats).sort((a: any, b: any) => b.totalPoints - a.totalPoints);
  
  return {
    stats: sortedStats,
    totalParticipants: totalRankings,
  };
};

export default (mongoose.models.GlobalRanking as IGlobalRankingModel) || mongoose.model<IGlobalRanking, IGlobalRankingModel>('GlobalRanking', GlobalRankingSchema);