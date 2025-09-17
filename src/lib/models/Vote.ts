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
  weekId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Week',
    required: true,
  },
  weekNumber: {
    type: Number,
    required: true,
  },
  points: {
    type: Number,
    required: true,
    min: 1,
  },
  voteDate: {
    type: Date,
    default: Date.now,
  },
  // Removido metadata con IP y userAgent por privacidad
  isValid: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Índices compuestos para consultas eficientes
VoteSchema.index({ userId: 1, weekId: 1 });
VoteSchema.index({ candidateId: 1, weekId: 1 });
VoteSchema.index({ seasonId: 1, weekId: 1 });
VoteSchema.index({ weekId: 1, voteDate: -1 });
VoteSchema.index({ userId: 1, seasonId: 1, weekNumber: 1 });
VoteSchema.index({ voteDate: -1 });
VoteSchema.index({ isValid: 1 });

// Métodos estáticos
VoteSchema.statics.getUserVotesForWeek = function(userId: string, weekId: string) {
  return this.find({ userId, weekId, isValid: true });
};

VoteSchema.statics.getCandidateVotesForWeek = function(candidateId: string, weekId: string) {
  return this.find({ candidateId, weekId, isValid: true });
};

VoteSchema.statics.getWeekResults = function(weekId: string) {
  return this.aggregate([
    { $match: { weekId: new mongoose.Types.ObjectId(weekId), isValid: true } },
    {
      $group: {
        _id: '$candidateId',
        totalVotes: { $sum: '$points' },
        voteCount: { $sum: 1 },
      }
    },
    {
      $lookup: {
        from: 'candidates',
        localField: '_id',
        foreignField: '_id',
        as: 'candidate'
      }
    },
    { $unwind: '$candidate' },
    { $sort: { totalVotes: -1 } }
  ]);
};

VoteSchema.statics.getUserTotalPointsUsed = function(userId: string, weekId: string) {
  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), weekId: new mongoose.Types.ObjectId(weekId), isValid: true } },
    { $group: { _id: null, totalPoints: { $sum: '$points' } } }
  ]);
};

VoteSchema.statics.getSeasonStats = function(seasonId: string) {
  return this.aggregate([
    { $match: { seasonId: new mongoose.Types.ObjectId(seasonId), isValid: true } },
    {
      $group: {
        _id: null,
        totalVotes: { $sum: 1 },
        totalPoints: { $sum: '$points' },
        uniqueVoters: { $addToSet: '$userId' },
        uniqueCandidates: { $addToSet: '$candidateId' },
      }
    },
    {
      $project: {
        totalVotes: 1,
        totalPoints: 1,
        uniqueVoters: { $size: '$uniqueVoters' },
        uniqueCandidates: { $size: '$uniqueCandidates' },
      }
    }
  ]);
};

VoteSchema.statics.resetWeekVotes = function(weekId: string) {
  return this.updateMany(
    { weekId: new mongoose.Types.ObjectId(weekId) },
    { $set: { isValid: false } }
  );
};

export default mongoose.models.Vote || mongoose.model('Vote', VoteSchema); 