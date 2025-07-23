import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  seasonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Season',
    required: true,
  },
  chatType: {
    type: String,
    enum: ['general', 'candidate', 'nominated'],
    default: 'general',
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    // Solo requerido si chatType es 'candidate'
  },
  content: {
    type: String,
    required: true,
    maxlength: 500,
  },
  reactions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    emoji: {
      type: String,
      enum: ['👍', '❤️', '😂', '😱', '😢', '😡'],
    },
  }],
  isDeleted: {
    type: Boolean,
    default: false,
  },
  reportedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
}, {
  timestamps: true,
});

// Índices para optimizar consultas del chat
MessageSchema.index({ seasonId: 1, chatType: 1, createdAt: -1 });
MessageSchema.index({ candidateId: 1, createdAt: -1 });

export default mongoose.models.Message || mongoose.model('Message', MessageSchema); 