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
    enum: ['POST_LIKE', 'COMMENT', 'COMMENT_LIKE'],
    required: true,
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
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
  // Todas las notificaciones van a la página individual del post
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