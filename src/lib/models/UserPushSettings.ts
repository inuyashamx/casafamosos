import mongoose from 'mongoose';

const UserPushSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  isEnabled: {
    type: Boolean,
    default: true,
  },
  fcmToken: {
    type: String,
    default: null,
  },
  lastPushSent: {
    type: Date,
    default: null,
  },
  pushCount: {
    type: Number,
    default: 0,
  },
  lastResetDate: {
    type: Date,
    default: Date.now,
  },
  preferences: {
    likes: {
      type: Boolean,
      default: true,
    },
    comments: {
      type: Boolean,
      default: true,
    },
  },
}, {
  timestamps: true,
});

// Método para resetear contador diario
UserPushSettingsSchema.methods.resetDailyCount = function() {
  const today = new Date();
  const lastReset = new Date(this.lastResetDate);

  // Si es un nuevo día, resetear contador
  if (today.toDateString() !== lastReset.toDateString()) {
    this.pushCount = 0;
    this.lastResetDate = today;
    return this.save();
  }

  return Promise.resolve(this);
};

// Método para incrementar contador de push
UserPushSettingsSchema.methods.incrementPushCount = function() {
  this.pushCount += 1;
  this.lastPushSent = new Date();
  return this.save();
};

// Método para verificar si puede recibir push
UserPushSettingsSchema.methods.canReceivePush = function() {
  const PUSH_RULES = {
    MIN_INTERVAL: 30 * 60 * 1000, // 30 minutos
    MAX_DAILY_PUSH: 5,
  };

  // 1. ¿Usuario tiene push habilitado?
  if (!this.isEnabled || !this.fcmToken) return false;

  // 2. ¿Ha pasado el tiempo mínimo?
  if (this.lastPushSent) {
    const timeSinceLastPush = Date.now() - this.lastPushSent.getTime();
    if (timeSinceLastPush < PUSH_RULES.MIN_INTERVAL) return false;
  }

  // 3. ¿Ha excedido límite diario?
  if (this.pushCount >= PUSH_RULES.MAX_DAILY_PUSH) return false;

  return true;
};

export default mongoose.models.UserPushSettings || mongoose.model('UserPushSettings', UserPushSettingsSchema);