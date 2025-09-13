import mongoose, { Schema, Document } from 'mongoose';

export interface IVoteLog extends Document {
  userId: mongoose.Types.ObjectId;
  userName: string;
  userEmail: string;
  candidateId: mongoose.Types.ObjectId;
  candidateName: string;
  weekId: mongoose.Types.ObjectId;
  points: number;

  // Device fingerprint
  deviceFingerprint: {
    userAgent: string;
    screenResolution?: string;
    timezone?: string;
    language?: string;
    platform?: string;
    cookieEnabled?: boolean;
    hash?: string; // Hash único del dispositivo
  };

  // Network info
  ip: string;
  country?: string;
  city?: string;

  // Suspicious indicators
  suspiciousFactors: {
    newAccount?: boolean; // Cuenta de Google < 7 días
    multipleAccountsSameDevice?: boolean;
    vpnDetected?: boolean;
    rapidVoting?: boolean; // Votó muy rápido después de entrar
    unusualTime?: boolean; // Votó en horario sospechoso (3-6 AM)
    suspiciousUserAgent?: boolean; // User-Agent sospechoso (bots, automatización)
    consistentVotingPattern?: boolean; // Patrón consistente de voto (mismo tiempo, mismos puntos)
    perfectTiming?: boolean; // Timing demasiado perfecto para ser humano
    sequentialVoting?: boolean; // Votos secuenciales muy cercanos en tiempo
    multipleAccountsCoordinated?: boolean; // Múltiples cuentas coordinadas
    suspiciousVoteDistribution?: boolean; // Distribución sospechosa de votos
    identicalVotingPatterns?: boolean; // Patrones de voto idénticos
  };

  // Timing
  timeOnPage: number; // Segundos en la página antes de votar
  votedAt: Date;

  // Result
  voteAccepted: boolean;
  rejectionReason?: string;
}

const VoteLogSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
  candidateName: { type: String, required: true },
  weekId: { type: Schema.Types.ObjectId, ref: 'Week', required: true },
  points: { type: Number, required: true },

  deviceFingerprint: {
    userAgent: String,
    screenResolution: String,
    timezone: String,
    language: String,
    platform: String,
    cookieEnabled: Boolean,
    hash: String,
  },

  ip: { type: String, required: true },
  country: String,
  city: String,

  suspiciousFactors: {
    newAccount: Boolean,
    multipleAccountsSameDevice: Boolean,
    vpnDetected: Boolean,
    rapidVoting: Boolean,
    unusualTime: Boolean,
    suspiciousUserAgent: Boolean,
    consistentVotingPattern: Boolean,
    perfectTiming: Boolean,
    sequentialVoting: Boolean,
    multipleAccountsCoordinated: Boolean,
    suspiciousVoteDistribution: Boolean,
    identicalVotingPatterns: Boolean,
  },

  timeOnPage: { type: Number, default: 0 },
  votedAt: { type: Date, default: Date.now },

  voteAccepted: { type: Boolean, default: true },
  rejectionReason: String,
}, {
  timestamps: true,
});

// Índices para búsquedas rápidas
VoteLogSchema.index({ userId: 1, votedAt: -1 });
VoteLogSchema.index({ 'deviceFingerprint.hash': 1 });
VoteLogSchema.index({ ip: 1 });
VoteLogSchema.index({ weekId: 1, votedAt: -1 });
VoteLogSchema.index({ 'suspiciousFactors.multipleAccountsSameDevice': 1 });

export default mongoose.models.VoteLog || mongoose.model<IVoteLog>('VoteLog', VoteLogSchema);