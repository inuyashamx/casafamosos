import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000,
    trim: true,
  },
  media: [{
    type: {
      type: String,
      enum: ['image', 'video'],
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String, // Para videos, miniatura generada
    },
  }],
  links: [{
    url: {
      type: String,
      required: true,
    },
    title: {
      type: String,
    },
    description: {
      type: String,
    },
    image: {
      type: String,
    },
  }],
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
  comments: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 500,
      trim: true,
    },
    media: {
      type: {
        type: String,
        enum: ['image', 'video'],
      },
      url: String,
      publicId: String,
      thumbnail: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
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
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Índices
PostSchema.index({ userId: 1 });
PostSchema.index({ createdAt: -1 });
PostSchema.index({ isActive: 1 });
PostSchema.index({ 'likes.userId': 1 });

// Métodos virtuales
PostSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

PostSchema.virtual('commentsCount').get(function() {
  return this.comments.length;
});

// Métodos
PostSchema.methods.addLike = function(userId: string) {
  const existingLike = this.likes.find((like: any) => like.userId.toString() === userId);
  if (!existingLike) {
    this.likes.push({ userId });
    return this.save();
  }
  return this;
};

PostSchema.methods.removeLike = function(userId: string) {
  this.likes = this.likes.filter((like: any) => like.userId.toString() !== userId);
  return this.save();
};

PostSchema.methods.addComment = function(userId: string, content: string, media?: {
  type: 'image' | 'video';
  url: string;
  publicId: string;
  thumbnail?: string;
}) {
  this.comments.push({ userId, content, media, likes: [] });
  return this.save();
};

PostSchema.methods.removeComment = function(commentId: string) {
  this.comments = this.comments.filter((comment: any) => comment._id.toString() !== commentId);
  return this.save();
};

PostSchema.methods.addCommentLike = function(commentId: string, userId: string) {
  const comment = this.comments.find((c: any) => c._id.toString() === commentId);
  if (!comment) {
    throw new Error('Comentario no encontrado');
  }
  
  const existingLike = comment.likes.find((like: any) => like.userId.toString() === userId);
  if (!existingLike) {
    comment.likes.push({ userId });
    return this.save();
  }
  return this;
};

PostSchema.methods.removeCommentLike = function(commentId: string, userId: string) {
  const comment = this.comments.find((c: any) => c._id.toString() === commentId);
  if (!comment) {
    throw new Error('Comentario no encontrado');
  }
  
  comment.likes = comment.likes.filter((like: any) => like.userId.toString() !== userId);
  return this.save();
};

// Configurar virtuals para JSON
PostSchema.set('toJSON', { virtuals: true });
PostSchema.set('toObject', { virtuals: true });

export default mongoose.models.Post || mongoose.model('Post', PostSchema);