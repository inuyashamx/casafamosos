import mongoose from 'mongoose';

const CandidateSchema = new mongoose.Schema({
  seasonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Season',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  photo: {
    type: String,
    default: '',
  },
  bio: {
    type: String,
    trim: true,
  },
  age: {
    type: Number,
    min: 18,
    max: 100,
  },
  profession: {
    type: String,
    trim: true,
  },
  city: {
    type: String,
    trim: true,
  },
  socialMedia: {
    instagram: {
      type: String,
      trim: true,
    },
    twitter: {
      type: String,
      trim: true,
    },
    tiktok: {
      type: String,
      trim: true,
    },
    youtube: {
      type: String,
      trim: true,
    },
  },
  status: {
    type: String,
    enum: ['active', 'eliminated', 'winner', 'suspended'],
    default: 'active',
  },
  eliminationInfo: {
    isEliminated: {
      type: Boolean,
      default: false,
    },
    eliminatedWeek: {
      type: Number,
      default: null,
    },
    eliminatedDate: {
      type: Date,
      default: null,
    },
    eliminationReason: {
      type: String,
      trim: true,
    },
  },
  stats: {
    totalVotes: {
      type: Number,
      default: 0,
    },
    weeklyVotes: {
      type: Number,
      default: 0,
    },
    timesNominated: {
      type: Number,
      default: 0,
    },
    weeksInHouse: {
      type: Number,
      default: 0,
    },
    averageVotes: {
      type: Number,
      default: 0,
    },
    position: {
      type: Number,
      default: 0,
    },
  },
  nominations: [{
    weekId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Week',
    },
    weekNumber: {
      type: Number,
    },
    votes: {
      type: Number,
      default: 0,
    },
    position: {
      type: Number,
      default: 0,
    },
    nominatedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Índices
CandidateSchema.index({ seasonId: 1 });
CandidateSchema.index({ status: 1 });
CandidateSchema.index({ isActive: 1 });
CandidateSchema.index({ 'stats.totalVotes': -1 });
CandidateSchema.index({ 'eliminationInfo.isEliminated': 1 });

// Métodos
CandidateSchema.methods.eliminate = function(weekNumber: number, reason?: string) {
  this.status = 'eliminated';
  this.isActive = false;
  this.eliminationInfo.isEliminated = true;
  this.eliminationInfo.eliminatedWeek = weekNumber;
  this.eliminationInfo.eliminatedDate = new Date();
  if (reason) {
    this.eliminationInfo.eliminationReason = reason;
  }
  return this.save();
};

CandidateSchema.methods.reactivate = function() {
  this.status = 'active';
  this.isActive = true;
  this.eliminationInfo.isEliminated = false;
  this.eliminationInfo.eliminatedWeek = null;
  this.eliminationInfo.eliminatedDate = null;
  this.eliminationInfo.eliminationReason = '';
  return this.save();
};

CandidateSchema.methods.addNomination = function(weekId: string, weekNumber: number) {
  this.nominations.push({
    weekId,
    weekNumber,
    nominatedAt: new Date(),
  });
  this.stats.timesNominated += 1;
  return this.save();
};

CandidateSchema.methods.updateWeeklyVotes = function(votes: number) {
  this.stats.weeklyVotes = votes;
  this.stats.totalVotes += votes;
  this.calculateAverageVotes();
  return this.save();
};

CandidateSchema.methods.resetWeeklyVotes = function() {
  this.stats.weeklyVotes = 0;
  return this.save();
};

CandidateSchema.methods.calculateAverageVotes = function() {
  if (this.stats.timesNominated > 0) {
    this.stats.averageVotes = Math.round(this.stats.totalVotes / this.stats.timesNominated);
  }
};

CandidateSchema.statics.getActiveBySeason = function(seasonId: string) {
  return this.find({ 
    seasonId, 
    isActive: true,
    status: 'active'
  }).sort({ 'stats.totalVotes': -1 });
};

CandidateSchema.statics.getEliminatedBySeason = function(seasonId: string) {
  return this.find({ 
    seasonId, 
    'eliminationInfo.isEliminated': true 
  }).sort({ 'eliminationInfo.eliminatedWeek': 1 });
};

export default mongoose.models.Candidate || mongoose.model('Candidate', CandidateSchema); 