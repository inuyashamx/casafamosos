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
  imagePublicId: {
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

// NUEVO MÉTODO: Calcular puntos disponibles del día (base de temporada + bono de compartir hoy - votos de hoy)
UserSchema.methods.checkAndResetDailyPoints = async function() {
  const Season = mongoose.model('Season');

  try {
    const activeSeason = await Season.findOne({ isActive: true });
    if (!activeSeason) {
      // Fallback al valor actual del usuario si no hay temporada activa
      return Math.max(0, this.dailyPoints - (await this.getUsedPointsInActiveWeek()));
    }

    // Base diaria configurada en la temporada (configurable desde Admin)
    const baseDailyPoints = typeof activeSeason.defaultDailyPoints === 'number'
      ? activeSeason.defaultDailyPoints
      : 60;

    // Determinar si el usuario tiene bono por compartir hoy
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastShare = this.lastShareBonus ? new Date(this.lastShareBonus) : null;
    const lastShareNormalized = lastShare
      ? new Date(lastShare.getFullYear(), lastShare.getMonth(), lastShare.getDate())
      : null;
    const hasShareBonusToday = !!lastShareNormalized && lastShareNormalized.getTime() === today.getTime();
    const shareBonusPoints = hasShareBonusToday ? 60 : 0;

    // Puntos usados HOY
    const usedPointsToday = await this.getUsedPointsInActiveWeek();

    const availablePoints = Math.max(0, baseDailyPoints + shareBonusPoints - usedPointsToday);
    return availablePoints;
  } catch (error) {
    console.error(`Error verificando puntos para usuario ${this.email}:`, error);
    // Fallback conservador: usar dailyPoints del usuario menos lo usado hoy
    const usedPointsToday = await this.getUsedPointsInActiveWeek().catch(() => 0);
    return Math.max(0, this.dailyPoints - usedPointsToday);
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