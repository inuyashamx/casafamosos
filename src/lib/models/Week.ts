import mongoose from 'mongoose';

const WeekSchema = new mongoose.Schema({
  seasonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Season',
    required: true,
  },
  weekNumber: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    trim: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  votingStartDate: {
    type: Date,
    required: true,
  },
  votingEndDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['scheduled', 'active', 'voting', 'completed', 'cancelled'],
    default: 'scheduled',
  },
  isVotingActive: {
    type: Boolean,
    default: false,
  },
  nominees: [{
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
    },
    nominatedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  results: {
    totalVotes: {
      type: Number,
      default: 0,
    },
    votingStats: [{
      candidateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Candidate',
      },
      votes: {
        type: Number,
        default: 0,
      },
      percentage: {
        type: Number,
        default: 0,
      },
    }],
    winner: {
      candidateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Candidate',
      },
      votes: {
        type: Number,
        default: 0,
      },
    },
    eliminated: {
      candidateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Candidate',
      },
      eliminatedAt: {
        type: Date,
      },
    },
  },
  settings: {
    maxVotesPerUser: {
      type: Number,
      default: 60, // Daily points
    },
    allowMultipleVotes: {
      type: Boolean,
      default: true,
    },
  },
}, {
  timestamps: true,
});

// Índices
WeekSchema.index({ seasonId: 1, weekNumber: 1 }, { unique: true });
WeekSchema.index({ status: 1 });
WeekSchema.index({ isVotingActive: 1 });
WeekSchema.index({ votingStartDate: 1, votingEndDate: 1 });

// Métodos
WeekSchema.methods.startVoting = function() {
  this.isVotingActive = true;
  this.status = 'voting';
  return this.save();
};

WeekSchema.methods.endVoting = function() {
  this.isVotingActive = false;
  this.status = 'completed';
  return this.save();
};

WeekSchema.methods.addNominee = function(candidateId: string) {
  if (!this.nominees.some((n: any) => n.candidateId.toString() === candidateId)) {
    this.nominees.push({ candidateId });
    return this.save();
  }
  return this;
};

WeekSchema.methods.removeNominee = function(candidateId: string) {
  this.nominees = this.nominees.filter((n: any) => n.candidateId.toString() !== candidateId);
  return this.save();
};

WeekSchema.methods.updateResults = function() {
  // Este método se llamará desde el servicio para actualizar estadísticas
  return this.save();
};

WeekSchema.statics.getActiveWeek = function(seasonId: string) {
  return this.findOne({ 
    seasonId, 
    isVotingActive: true,
    status: 'voting'
  }).populate('nominees.candidateId');
};

WeekSchema.statics.getCurrentWeek = function(seasonId: string) {
  const now = new Date();
  return this.findOne({
    seasonId,
    startDate: { $lte: now },
    endDate: { $gte: now }
  }).populate('nominees.candidateId');
};

export default mongoose.models.Week || mongoose.model('Week', WeekSchema); 