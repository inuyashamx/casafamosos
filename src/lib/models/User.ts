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
}, {
  timestamps: true,
});

// Método para resetear puntos diarios
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

export default mongoose.models.User || mongoose.model('User', UserSchema); 