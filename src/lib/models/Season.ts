import mongoose from 'mongoose';

const SeasonSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  year: {
    type: Number,
    required: true,
  },
  description: {
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
  status: {
    type: String,
    enum: ['scheduled', 'active', 'completed', 'cancelled'],
    default: 'scheduled',
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  defaultDailyPoints: {
    type: Number,
    default: 60,
  },
  settings: {
    maxNomineesPerWeek: {
      type: Number,
      default: 4,
    },
    votingEndTime: {
      type: String, // Format: "20:00" (8:00 PM)
      default: "20:00",
    },
    votingDays: {
      type: [Number], // 0=Sunday, 1=Monday, etc.
      default: [0], // Default to Sunday
    },
  },
  stats: {
    totalWeeks: {
      type: Number,
      default: 0,
    },
    totalCandidates: {
      type: Number,
      default: 0,
    },
    totalVotes: {
      type: Number,
      default: 0,
    },
  },
}, {
  timestamps: true,
});

// Índices
SeasonSchema.index({ year: 1 });
SeasonSchema.index({ status: 1 });
SeasonSchema.index({ isActive: 1 });

// Métodos
SeasonSchema.methods.activate = function() {
  this.isActive = true;
  this.status = 'active';
  return this.save();
};

SeasonSchema.methods.complete = function() {
  this.isActive = false;
  this.status = 'completed';
  return this.save();
};

SeasonSchema.statics.getActiveSeason = function() {
  return this.findOne({ isActive: true });
};

export default mongoose.models.Season || mongoose.model('Season', SeasonSchema); 