import mongoose from 'mongoose';

const SeasonLikeSchema = new mongoose.Schema({
  fingerprint: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  ip: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índice para búsquedas rápidas
SeasonLikeSchema.index({ createdAt: -1 });

const SeasonLike = mongoose.models.SeasonLike || mongoose.model('SeasonLike', SeasonLikeSchema);

export default SeasonLike;
