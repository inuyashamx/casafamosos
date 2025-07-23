import mongoose from 'mongoose';

const CandidateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  photo: {
    type: String,
    required: true,
  },
  bio: {
    type: String,
  },
  age: {
    type: Number,
  },
  profession: {
    type: String,
  },
  socialMedia: {
    instagram: String,
    twitter: String,
    tiktok: String,
    youtube: String,
  },
  seasonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Season',
    required: true,
  },
  isNominated: {
    type: Boolean,
    default: false,
  },
  isEliminated: {
    type: Boolean,
    default: false,
  },
  eliminationDate: {
    type: Date,
  },
  totalVotes: {
    type: Number,
    default: 0,
  },
  weeklyVotes: {
    type: Number,
    default: 0,
  },
  position: {
    type: Number, // Para ordenar candidatos
  },
}, {
  timestamps: true,
});

// Método para resetear votos semanales
CandidateSchema.methods.resetWeeklyVotes = function() {
  this.weeklyVotes = 0;
  return this.save();
};

export default mongoose.models.Candidate || mongoose.model('Candidate', CandidateSchema); 