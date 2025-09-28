import mongoose from 'mongoose';

const DedicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true,
    index: true,
  },
  content: {
    type: String,
    required: true,
    minlength: 20,
    maxlength: 2000,
    trim: true,
  },
  likes: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    likedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  isReported: {
    type: Boolean,
    default: false,
    index: true,
  },
  reports: [{
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: {
      type: String,
      enum: ['offensive', 'spam', 'inappropriate', 'other'],
      required: true,
    },
    customReason: {
      type: String,
      maxlength: 200,
    },
    reportedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  isApproved: {
    type: Boolean,
    default: true,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  moderatedAt: {
    type: Date,
  },
  moderationNote: {
    type: String,
    maxlength: 500,
  },
}, {
  timestamps: true,
});

// Índices compuestos para consultas eficientes
DedicationSchema.index({ candidateId: 1, createdAt: -1 });
DedicationSchema.index({ candidateId: 1, 'likes.userId': 1 });
DedicationSchema.index({ userId: 1, createdAt: -1 });
DedicationSchema.index({ isReported: 1, isActive: 1 });
DedicationSchema.index({ candidateId: 1, isActive: 1, isApproved: 1 });

// Virtual para el conteo de likes
DedicationSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

// Virtual para el conteo de reportes
DedicationSchema.virtual('reportsCount').get(function() {
  return this.reports.length;
});

// Métodos para likes
DedicationSchema.methods.addLike = function(userId: string) {
  const existingLike = this.likes.find((like: any) =>
    like.userId.toString() === userId
  );

  if (!existingLike) {
    this.likes.push({ userId });
    return this.save();
  }
  return this;
};

DedicationSchema.methods.removeLike = function(userId: string) {
  this.likes = this.likes.filter((like: any) =>
    like.userId.toString() !== userId
  );
  return this.save();
};

// Métodos para reportes
DedicationSchema.methods.addReport = function(
  userId: string,
  reason: string,
  customReason?: string
) {
  // Verificar si el usuario ya reportó esta dedicatoria
  const existingReport = this.reports.find((report: any) =>
    report.reportedBy.toString() === userId
  );

  if (!existingReport) {
    this.reports.push({
      reportedBy: userId,
      reason,
      customReason,
    });

    // Marcar como reportado si tiene al menos un reporte
    if (this.reports.length > 0) {
      this.isReported = true;
    }

    return this.save();
  }
  return this;
};

// Método para moderar
DedicationSchema.methods.moderate = function(
  moderatorId: string,
  action: 'approve' | 'remove' | 'ignore',
  note?: string
) {
  this.moderatedBy = moderatorId;
  this.moderatedAt = new Date();
  this.moderationNote = note;

  switch (action) {
    case 'approve':
      this.isApproved = true;
      this.isReported = false;
      this.reports = [];
      break;
    case 'remove':
      this.isActive = false;
      this.isApproved = false;
      break;
    case 'ignore':
      this.isReported = false;
      this.reports = [];
      console.log('Limpiando reportes - antes del save:', {
        dedicationId: this._id,
        isReported: this.isReported,
        reportsLength: this.reports.length
      });
      break;
  }

  return this.save();
};

// Métodos estáticos para consultas comunes
DedicationSchema.statics.getByCandidate = function(
  candidateId: string,
  sortBy: 'recent' | 'popular' = 'recent',
  page: number = 1,
  limit: number = 10
) {
  const query = {
    candidateId,
    isActive: true,
    isApproved: true,
  };

  const sort = sortBy === 'recent'
    ? { createdAt: -1 }
    : { likesCount: -1, createdAt: -1 };

  return this.find(query)
    .populate('userId', 'name image team')
    .sort(sort)
    .limit(limit)
    .skip((page - 1) * limit);
};

DedicationSchema.statics.getReported = function() {
  return this.find({
    isReported: true,
    isActive: true,
  })
  .populate('userId', 'name image')
  .populate('candidateId', 'name photo')
  .populate('reports.reportedBy', 'name email')
  .sort({ createdAt: -1 });
};

// Configurar virtuals para JSON
DedicationSchema.set('toJSON', { virtuals: true });
DedicationSchema.set('toObject', { virtuals: true });

export default mongoose.models.Dedication || mongoose.model('Dedication', DedicationSchema);