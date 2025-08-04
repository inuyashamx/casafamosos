import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  nickname: {
    type: String,
    unique: true,
    sparse: true,
  },
  image: {
    type: String,
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  dailyPoints: {
    type: Number,
    default: 60,
  },
  usedPointsToday: {
    type: Number,
    default: 0,
  },
  lastPointsReset: {
    type: Date,
    default: Date.now,
  },
  totalVotes: {
    type: Number,
    default: 0,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  blockReason: {
    type: String,
    default: null,
  },
  blockedAt: {
    type: Date,
    default: null,
  },
  blockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  lastVoteDate: {
    type: Date,
    default: null,
  },
  lastShareBonus: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Método para resetear puntos diarios (método anterior - mantener para compatibilidad)
UserSchema.methods.resetDailyPoints = function() {
  const today = new Date();
  const lastReset = new Date(this.lastPointsReset);
  
  // Si es un nuevo día, resetear puntos
  if (today.toDateString() !== lastReset.toDateString()) {
    this.usedPointsToday = 0;
    this.lastPointsReset = today;
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Método para obtener puntos disponibles
UserSchema.methods.getAvailablePoints = function() {
  return this.dailyPoints - this.usedPointsToday;
};

// NUEVO MÉTODO: Verificar y resetear puntos diarios basado en el último voto
UserSchema.methods.checkAndResetDailyPoints = async function() {
  // Importar Vote aquí para evitar dependencias circulares
  const Vote = mongoose.model('Vote');
  const Season = mongoose.model('Season');
  
  try {
    // Obtener temporada activa
    const activeSeason = await Season.findOne({ isActive: true });
    if (!activeSeason) {
      console.log(`Usuario ${this.email}: No hay temporada activa, puntos disponibles: ${this.dailyPoints}`);
      return this.dailyPoints;
    }
    
    // 1. Buscar el último voto del usuario en la temporada activa
    const lastVote = await Vote.findOne({ 
      userId: this._id,
      seasonId: activeSeason._id,
      isValid: true 
    }).sort({ voteDate: -1 });
    
    // 2. Si no hay votos previos en esta temporada, puntos disponibles = dailyPoints
    if (!lastVote) {
      console.log(`Usuario ${this.email}: No tiene votos previos en esta temporada, puntos disponibles: ${this.dailyPoints}`);
      return this.dailyPoints;
    }
    
    // 3. Comparar fecha del último voto con hoy
    const lastVoteDate = new Date(lastVote.voteDate);
    const today = new Date();
    
    // Normalizar fechas para comparación (sin horas/minutos/segundos)
    const lastVoteDateNormalized = new Date(lastVoteDate.getFullYear(), lastVoteDate.getMonth(), lastVoteDate.getDate());
    const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // 4. Si es un día diferente (después de 00:00), resetear puntos
    if (lastVoteDateNormalized.getTime() !== todayNormalized.getTime()) {
      console.log(`Usuario ${this.email}: Último voto fue ayer (${lastVoteDateNormalized.toDateString()}), puntos reseteados: ${this.dailyPoints}`);
      return this.dailyPoints;
    } else {
      // 5. Mismo día - calcular puntos usados en la semana activa
      const usedPoints = await this.getUsedPointsInActiveWeek();
      const availablePoints = Math.max(0, this.dailyPoints - usedPoints);
      console.log(`Usuario ${this.email}: Ya votó hoy, puntos usados: ${usedPoints}, disponibles: ${availablePoints}`);
      return availablePoints;
    }
  } catch (error) {
    console.error(`Error verificando puntos para usuario ${this.email}:`, error);
    // En caso de error, retornar puntos completos
    return this.dailyPoints;
  }
};

// Método auxiliar para obtener puntos usados en la semana activa
UserSchema.methods.getUsedPointsInActiveWeek = async function() {
  const Vote = mongoose.model('Vote');
  const Season = mongoose.model('Season');
  
  try {
    // Obtener temporada activa
    const activeSeason = await Season.findOne({ isActive: true });
    if (!activeSeason) {
      return 0;
    }
    
    // Obtener fecha de hoy (inicio y fin del día)
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    // Buscar votos del usuario HOY en la temporada activa
    const userVotes = await Vote.find({
      userId: this._id,
      seasonId: activeSeason._id,
      voteDate: {
        $gte: startOfDay,
        $lt: endOfDay
      },
      isValid: true
    });
    
    // Sumar puntos usados hoy
    const usedPoints = userVotes.reduce((sum, vote) => sum + vote.points, 0);
    console.log(`Usuario ${this.email}: Votos encontrados hoy: ${userVotes.length}, puntos usados: ${usedPoints}`);
    return usedPoints;
  } catch (error) {
    console.error(`Error calculando puntos usados para usuario ${this.email}:`, error);
    return 0;
  }
};

export default mongoose.models.User || mongoose.model('User', UserSchema); 