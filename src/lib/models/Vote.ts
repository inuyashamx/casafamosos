import mongoose from 'mongoose';

const VoteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true,
  },
  seasonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Season',
    required: true,
  },
  points: {
    type: Number,
    required: true,
    min: 1,
  },
  week: {
    type: Number,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  voteDate: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Índices para optimizar consultas
VoteSchema.index({ userId: 1, candidateId: 1, week: 1, year: 1 });
VoteSchema.index({ candidateId: 1, week: 1, year: 1 });
VoteSchema.index({ seasonId: 1, week: 1, year: 1 });

export default mongoose.models.Vote || mongoose.model('Vote', VoteSchema); 