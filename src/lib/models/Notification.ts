import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['POST_LIKE', 'COMMENT', 'COMMENT_LIKE', 'POST_REACTION', 'COMMENT_REACTION', 'DEDICATION_REPORT', 'DEDICATION_DELETED', 'DEDICATION_LIKE'],
    required: true,
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: false,
  },
  dedicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dedication',
    required: false,
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: false,
  },
  commentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
  },
  message: {
    type: String,
    required: true,
    maxlength: 200,
  },
  read: {
    type: Boolean,
    default: false,
    index: true,
  },
  lastPushSent: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Índices compuestos para consultas eficientes
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1 });
NotificationSchema.index({ fromUserId: 1 });

// Método virtual para obtener el enlace de navegación
NotificationSchema.virtual('navigationLink').get(function() {
  // Notificaciones de reportes de dedicatorias van al admin dashboard
  if (this.type === 'DEDICATION_REPORT') {
    return '/admin';
  }
  // Notificaciones de eliminación de dedicatorias van a palabras-corazon
  if (this.type === 'DEDICATION_DELETED') {
    return '/palabras-corazon';
  }
  // Notificaciones de likes de dedicatorias van a la página del candidato
  if (this.type === 'DEDICATION_LIKE') {
    return this.candidateId ? `/palabras-corazon/${this.candidateId}` : '/palabras-corazon';
  }
  // Otras notificaciones van a la página individual del post
  return `/post/${this.postId}${this.commentId ? `#comment-${this.commentId}` : ''}`;
});

// Método para marcar como leída
NotificationSchema.methods.markAsRead = function() {
  this.read = true;
  return this.save();
};

// Configurar virtuals para JSON
NotificationSchema.set('toJSON', { virtuals: true });
NotificationSchema.set('toObject', { virtuals: true });

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);